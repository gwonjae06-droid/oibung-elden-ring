import {storeAttempt} from './attempts.js';
import {classifyEventRisk,nextEventRisk,riskLevel} from './risk.js';
// Public endpoint with application-level bearer-token authentication.
// Deploy with verify_jwt=false; database tables deny ALL browser roles.
// This logs orderly client reports. It does NOT prove unmodified gameplay.
const EVENT_ID='oden-ending-2026-live-1110';
const ALLOWED_ORIGINS=new Set(['https://gwonjae06-droid.github.io','http://127.0.0.1:8000','http://localhost:8000']);
const TABLE='oden_event_participants';
const utf8=new TextEncoder();
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
async function hash(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8.encode(value))));}
const code=()=> 'ODEN-'+hex(crypto.getRandomValues(new Uint8Array(6))).toUpperCase();
const secret=()=>{
 if(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 try{return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default;}catch{return null;}
};
function cors(origin){return {'Access-Control-Allow-Origin':origin&&ALLOWED_ORIGINS.has(origin)?origin:'https://gwonjae06-droid.github.io',
 'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, apikey, X-Oden-Token',
 'Cache-Control':'no-store','Vary':'Origin'};}
function response(data,status,origin){return new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8'}});}
const fail=(message,status,origin)=>response({error:message},status,origin);
async function db(method,params={},body=null,table=TABLE,prefer='return=representation'){
 const key=secret();const base=Deno.env.get('SUPABASE_URL');
 if(!key||!base)throw Error('Event backend is not configured');
 const url=new URL(base.replace(/\/$/,'')+'/rest/v1/'+table);
 for(const [k,v]of Object.entries(params))url.searchParams.set(k,v);
 const headers={apikey:key,Accept:'application/json',Prefer:prefer};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 if(body!==null)headers['Content-Type']='application/json';
 const r=await fetch(url,{method,headers,...(body!==null?{body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error('Database rejected request: '+r.status);
 return await r.json();
}
async function participant(id,tokenHash){
 const rows=await db('GET',{select:'id,event_id,nickname,stage,last_progress_at,final_started_at,completed_at,claim_code,review_status,paid_at,risk_score,risk_flags,risk_reports,last_telemetry_at,claim_hold,appeal_at',
  id:'eq.'+id,event_id:'eq.'+EVENT_ID,token_hash:'eq.'+tokenHash,limit:'1'});
 return rows[0]||null;
}
function safe(p){return {id:p.id,nickname:p.nickname,stage:p.stage,completed_at:p.completed_at,
 code:p.claim_code||null,status:p.review_status,paid_at:p.paid_at,
 riskLevel:riskLevel(p.risk_score,p.claim_hold),claimHold:!!p.claim_hold,appealSent:!!p.appeal_at};}
Deno.serve(async request=>{
 const origin=request.headers.get('Origin');
 if(origin&&!ALLOWED_ORIGINS.has(origin))return fail('허용되지 않은 사이트입니다.',403,origin);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(request.method!=='POST')return fail('POST만 허용합니다.',405,origin);
 try{
  if(Number(request.headers.get('content-length')||'0')>16384)return fail('요청이 너무 깁니다.',413,origin);
  const raw=await request.text();if(utf8.encode(raw).length>16384)return fail('요청이 너무 깁니다.',413,origin);
  const input=JSON.parse(raw);
  if(input?.eventId!==EVENT_ID)return fail('다른 이벤트입니다.',400,origin);
  if(input.action==='register'){
   const nickname=String(input.nickname||'').normalize('NFC').trim();
   if(nickname.length<2||nickname.length>18||/[<>\u0000-\u001f]/u.test(nickname))return fail('닉네임은 2~18자로 입력하세요.',400,origin);
   const credential=token();
   try{
    const rows=await db('POST',{select:'id,nickname,stage'},{
      event_id:EVENT_ID,nickname,token_hash:await hash(credential)
    });
    if(!rows[0]?.id)throw Error('No participant generated');
    return response({...rows[0],token:credential},201,origin);
   }catch(e){return fail('닉네임이 이미 사용 중이거나 참가 등록이 불가능합니다.',409,origin);}
  }
  const credential=request.headers.get('X-Oden-Token')||'';
  if(!/^[a-f0-9]{64}$/u.test(credential))return fail('참가자 인증이 필요합니다.',401,origin);
  const hashed=await hash(credential);
  const rows=await db('GET',{select:'id,event_id,nickname,stage,last_progress_at,final_started_at,completed_at,claim_code,review_status,paid_at,risk_score,risk_flags,risk_reports,last_telemetry_at,claim_hold,appeal_at',
    event_id:'eq.'+EVENT_ID,token_hash:'eq.'+hashed,limit:'1'});
  const p=rows[0];
  if(!p)return fail('등록된 참가자 정보가 없습니다.',401,origin);
  if(input.action==='status')return response(safe(p),200,origin);
  if(input.action==='attempt'){
   const result=await storeAttempt(db,p,EVENT_ID,input.report);
   return result.error?fail(result.error,result.status,origin):response(result,200,origin);
  }
  if(input.action==='telemetry'){
   if(p.completed_at)return response(safe(p),200,origin);
   const report=input.report;
   if(!classifyEventRisk(report))return fail('입력 요약이 올바르지 않습니다.',400,origin);
   const now=Date.now();
   if(p.last_telemetry_at&&now-Date.parse(p.last_telemetry_at)<15000)
    return fail('보안 요약 전송 간격이 너무 짧습니다.',429,origin);
   const next=nextEventRisk(p.risk_score,report,p.risk_flags);
   // An attacker can forge or omit this report. Only hold prize review;
   // never permanently ban, change health/damage or infer player identity.
   const time=new Date(now).toISOString();
   const guard=p.last_telemetry_at?'eq.'+p.last_telemetry_at:'is.null';
   const changed=await db('PATCH',{
    id:'eq.'+p.id,last_telemetry_at:guard,completed_at:'is.null',
    select:'id,nickname,stage,completed_at,claim_code,review_status,paid_at,risk_score,claim_hold,appeal_at'
   },{
    risk_score:next.score,risk_flags:next.flags,risk_reports:Math.min(100000,(Number(p.risk_reports)||0)+1),
    last_telemetry_at:time,claim_hold:!!p.claim_hold||next.hold,updated_at:time
   });
   if(!changed.length)return fail('요약 처리 상태를 다시 확인하세요.',409,origin);
   return response(safe(changed[0]),200,origin);
  }
  if(input.action==='appeal'){
   if(!p.claim_hold)return fail('추가 확인 중인 기록만 소명을 제출할 수 있습니다.',409,origin);
   if(p.appeal_at)return fail('이미 소명이 접수됐습니다.',409,origin);
   const note=String(input.note||'').normalize('NFC').trim();
   if(note.length<20||note.length>400||/[\u0000-\u001f]/u.test(note))
    return fail('설명은 20~400자로 입력하세요.',400,origin);
   const time=new Date().toISOString();
   const changed=await db('PATCH',{id:'eq.'+p.id,claim_hold:'eq.true',appeal_at:'is.null',
    select:'id,nickname,stage,completed_at,claim_code,review_status,paid_at,risk_score,claim_hold,appeal_at'
   },{appeal_note:note,appeal_at:time,updated_at:time});
   if(!changed.length)return fail('소명 접수 상태를 다시 확인하세요.',409,origin);
   return response(safe(changed[0]),200,origin);
  }
  if(input.action==='progress'){
   const stage=Number(input.stage);
   if(!Number.isInteger(stage)||stage<0||stage>4)return fail('보스 단계가 올바르지 않습니다.',400,origin);
   if(p.completed_at)return response(safe(p),200,origin);
   if(stage<=p.stage)return response(safe(p),200,origin);
   if(stage!==p.stage+1)return fail('이전 보스 클리어 기록이 없습니다.',409,origin);
   const time=new Date().toISOString(),update={stage,last_progress_at:time,updated_at:time};
   if(stage===4)update.final_started_at=time;
   const changed=await db('PATCH',{id:'eq.'+p.id,stage:'eq.'+p.stage,completed_at:'is.null',select:'id,stage'},update);
   if(!changed.length)return fail('동시 갱신이 감지됐습니다. 기록을 다시 불러오세요.',409,origin);
   return response({stage},200,origin);
  }
  if(input.action==='finish'){
   if(p.completed_at)return response(safe(p),200,origin);
   if(p.stage!==4||!p.final_started_at)return fail('마지막 보스 클리어 기록이 없습니다.',409,origin);
   // The final 3D post-800HP epilogue alone takes 164s. Server-side
   // elapsed time rules out trivial instant claims, not client tampering.
   if(Date.now()-Date.parse(p.final_started_at)<155000)return fail('마지막 엔딩이 아직 완료되지 않았습니다.',409,origin);
   const now=new Date().toISOString(),claim=code();
   const changed=await db('PATCH',{
     id:'eq.'+p.id,stage:'eq.4',completed_at:'is.null',select:'id,nickname,stage,claim_code,completed_at,review_status,paid_at,risk_score,claim_hold,appeal_at'
   },{claim_code:claim,completed_at:now,updated_at:now});
   if(!changed.length)return fail('이미 처리 중입니다. 기록을 다시 확인하세요.',409,origin);
   return response(safe(changed[0]),200,origin);
  }
  return fail('지원하지 않는 요청입니다.',400,origin);
 }catch(e){
  console.error('Oden event function error',e);
  return fail('인증 서버에 오류가 발생했습니다. 관리자에게 문의하세요.',500,origin);
 }
});
