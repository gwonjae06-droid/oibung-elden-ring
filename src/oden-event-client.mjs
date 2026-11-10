import {ODEN_EVENT} from './oden-event-config.mjs';
export const EVENT_KEY='oibung.oden-event.claim.v1';
export const EVENT_MODE_KEY='oibung.oden-event.active.v1';
const personalKeys=new Set(['oibung.journey.v1','oibung.gyuwon.ending-watched','oibung.gyuwon.ensemble-photo']);
export function eventScopedStorage(storage,eventId,participantId){
 const prefix='oibung.event.'+eventId+'.'+participantId+'.';
 const key=k=>personalKeys.has(k)?prefix+k:k;
 return {getItem:k=>storage.getItem(key(k)),setItem:(k,v)=>storage.setItem(key(k),v),
  removeItem:k=>storage.removeItem(key(k))};
}
export function eventStageAllowed(current,next){
 return Number.isInteger(current)&&Number.isInteger(next)&&current>=-1&&current<5&&next===current+1&&next<=4;
}
const cleanName=s=>String(s||'').normalize('NFC').trim();
export function createOdenEventClient({storage=globalThis.localStorage,fetcher=globalThis.fetch,config=ODEN_EVENT}={}){
 let session=null,queue=Promise.resolve(),lastError='';
 const key=EVENT_KEY+':'+config.eventId;
 try{const parsed=JSON.parse(storage?.getItem(key)||'null');if(parsed&&parsed.id&&parsed.token&&parsed.nickname)session=parsed;}catch{}
 const save=()=>{try{if(session)storage?.setItem(key,JSON.stringify(session));else storage?.removeItem(key);}catch{}};
 async function call(action,body={},token=session?.token){
  if(!config.enabled)throw Error('이벤트 인증 서버가 아직 열리지 않았습니다.');
  const response=await fetcher(config.projectUrl.replace(/\/$/,'')+'/functions/v1/oden-event',{
   method:'POST',headers:{'Content-Type':'application/json','apikey':config.publishableKey,...(token?{'X-Oden-Token':token}:{})},
   body:JSON.stringify({action,eventId:config.eventId,...body})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error)throw Error(typeof data.error==='string'?data.error:'서버 연결에 실패했습니다 ('+response.status+')');
  return data;
 }
 const enqueue=task=>{const run=queue.catch(()=>{}).then(task);queue=run;return run;};
 async function join(name){
  const nickname=cleanName(name);
  if(nickname.length<2||nickname.length>18||/[<>\u0000-\u001f]/u.test(nickname))throw Error('닉네임은 2~18자로 입력하세요.');
  if(session)return session;
  const data=await call('register',{nickname},null);
  if(!data.id||!data.token)throw Error('참가 정보를 발급하지 못했습니다.');
  session={id:data.id,token:data.token,nickname:data.nickname||nickname,stage:-1,code:null,status:'playing'};
  save();return session;
 }
 async function refresh(){if(!session)return null;const data=await call('status');session={...session,...data,token:session.token};save();return session;}
 async function stage(stage){
  if(!session)return null;
  return enqueue(async()=>{
   const current=Number.isInteger(session.stage)?session.stage:-1;
   if(stage<=current)return session;
   if(!eventStageAllowed(current,stage))throw Error('이벤트는 첫 보스부터 순서대로 진행해야 합니다.');
   const data=await call('progress',{stage});
   session={...session,stage:data.stage};save();return session;
  });
 }
 async function report(summary){
  if(!session)return null;
  return enqueue(async()=>{
   const data=await call('telemetry',{report:summary});
   session={...session,...data,token:session.token};save();return session;
  });
 }
 async function appeal(note){
  if(!session)return null;
  return enqueue(async()=>{
   const data=await call('appeal',{note});
   session={...session,...data,token:session.token};save();return session;
  });
 }
 async function finish(){
  if(!session)return null;
  return enqueue(async()=>{
   const data=await call('finish');
   session={...session,...data,token:session.token};
   save();return session;
  });
 }
 return {
  get enabled(){return !!config.enabled;},
  get session(){return session?{...session,token:undefined}:null;},
  get registered(){return !!session;},
  get error(){return lastError;},
  get active(){try{return !!session&&storage?.getItem(EVENT_MODE_KEY)===config.eventId;}catch{return false;}},
  setActive(active){try{if(active&&session)storage?.setItem(EVENT_MODE_KEY,config.eventId);else storage?.removeItem(EVENT_MODE_KEY);}catch{}},
  join,refresh,stage,finish,report,appeal
 };
}
