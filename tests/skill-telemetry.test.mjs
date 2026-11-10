import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillTelemetry,noteSkillHit} from '../src/skill-telemetry.mjs';
import {normalizeAttempt,storeAttempt} from '../supabase/functions/oden-event/attempts.js';
import {createOdenEventClient,EVENT_KEY} from '../src/oden-event-client.mjs';
import {createGame,act,step} from '../src/combat.mjs';
const id='11111111-1111-4111-8111-111111111111';
const game=()=>({events:[],status:'playing',weapon:'sword',time:0,player:{hp:125,maxHp:125,potions:3},boss:{hp:100,maxHp:100,phase:1,state:'idle',pattern:'slam'},stats:{damage:0,hits:0},evolutions:['blade-wave'],journeyBalance:{mode:'story'}});
const report=()=>createSkillTelemetry(game(),{boss:'kwon',attemptId:id}).snapshot();
test('cumulative stats count accepted hits, spent heals, and volley accuracy once per normal action',()=>{
 const g=game(),t=createSkillTelemetry(g,{boss:'kwon',attemptId:id});
 const action={basic:true};g.player.action=action;g.events.push({type:'swing'});
 for(let i=0;i<3;i++)noteSkillHit(g,{source:action});
 const miss={basic:true};g.player.action=miss;g.events.push({type:'shot'});
 g.player.action={basic:false};g.events.push({type:'shot'});noteSkillHit(g,g.player.action);
 g.time=1;t.sample();g.events.push({type:'player-hit',amount:20,source:'slam'});
 g.player.hp=105;g.player.potions--;g.events.push({type:'heal-start'});g.events.push({type:'healed'});
 g.stats.damage=40;g.stats.hits=3;g.boss.hp=60;g.boss.phase=2;t.sample();g.status='lost';
 const r=t.snapshot('lost');assert.equal(r.attacks,2);assert.equal(r.connected_attacks,1);
 assert.equal(r.hits_taken,1);assert.equal(r.damage_taken,20);assert.equal(r.potions_used,1);assert.equal(r.heals_completed,1);
 assert.equal(r.damage_dealt,40);assert.equal(r.best_boss_progress,40);assert.equal(r.death_pattern,'slam');assert.equal(r.max_phase,2);
 assert.ok(normalizeAttempt(r));t.dispose();assert.equal(Object.hasOwn(g.events,'push'),false);
 g.events.push({type:'hurt',amount:100});assert.equal(t.snapshot('lost').hits_taken,1);
});
test('simulation pause and cinematic time are excluded, song time and score are separate',()=>{
 const g=game(),t=createSkillTelemetry(g,{boss:'gyuwon',attemptId:id});
 g.time=1;t.sample();t.sample();g.boss.state='transition';t.sample();g.time=2;t.sample();
 g.boss.state='idle';g.gyuwon={years:{year:8,musical:{year:8}}};t.sample();g.time=3;g.events.push({type:'gyuwon-musical-hit',points:150},{type:'hurt',amount:5});
 const r=t.snapshot();assert.equal(r.combat_seconds,1);assert.equal(r.performance_seconds,1);
 assert.equal(r.max_phase,7);assert.equal(r.phases['year-7'].score,150);assert.equal(r.attacks,0);t.dispose();
});
test('actual sword hits are linked to the attack that dealt them',()=>{
 const g=createGame('sword'),t=createSkillTelemetry(g,{boss:'kwon',attemptId:id});
 g.startGrace=0;g.player.x=g.boss.x;g.player.z=g.boss.z+2;g.player.yaw=Math.PI;g.boss.state='stagger';g.boss.t=100;
 assert.equal(act(g,'light'),true);
 for(let i=0;i<80;i++)step(g,1/120,{x:0,z:0});
 const r=t.snapshot();assert.ok(r.attacks>0);assert.ok(r.connected_attacks>0);assert.ok(r.connected_attacks<=r.attacks);t.dispose();
});
test('strict server validation rejects malformed, excessive, impossible or injected fields',()=>{
 const r=report();assert.ok(normalizeAttempt(r));
 for(const patch of [{attempt_id:'bad'},{boss:'other'},{revision:-1},{connected_attacks:1},{combat_seconds:NaN},{remaining_hp:9999},{heals_completed:1},{patterns:{'bad key':{hits:1,damage:2}}},{phases:Array(1)},{damage_taken:-1}])assert.equal(normalizeAttempt({...r,...patch}),null,JSON.stringify(patch));
 assert.equal(normalizeAttempt({...r,participant_id:'other',token:'secret'}).participant_id,undefined);
});
test('server retries cannot duplicate attempts, lower revisions or replace a terminal result',async()=>{
 let rows=[];const db=async(method,params,body)=>{
  if(method==='GET')return rows;
  if(method==='POST'){if(rows.length)return [];rows=[{...body}];return rows;}
  if(method==='PATCH'){if(rows[0].outcome==='playing'&&rows[0].revision<Number(params.revision.slice(3)))rows=[{...rows[0],...body}];return rows;}
 };
 const r=report(),p={id:'server-owner'};
 await storeAttempt(db,p,'live',r);assert.equal(rows[0].participant_id,'server-owner');
 await storeAttempt(db,p,'live',r);assert.equal(rows.length,1);
 await storeAttempt(db,p,'live',{...r,revision:3,outcome:'lost'});
 await storeAttempt(db,p,'live',{...r,revision:2});assert.equal(rows[0].revision,3);
 await storeAttempt(db,p,'live',{...r,revision:4,outcome:'won'});assert.equal(rows[0].outcome,'lost');
});
test('failed uploads persist only aggregates, reload recovers them, and prize queue stays independent',async()=>{
 const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const config={enabled:true,eventId:'test',projectUrl:'https://example.test',publishableKey:'public'};
 storage.setItem(EVENT_KEY+':test',JSON.stringify({id:'owner',nickname:'nick',token:'a'.repeat(64)}));
 let fail=true,requests=[];
 const fetcher=async(url,options)=>{const body=JSON.parse(options.body);requests.push(body);if(fail&&body.action==='attempt')throw Error('offline');return {ok:true,json:async()=>({stage:body.stage})};};
 const c=createOdenEventClient({storage,fetcher,config}),r=report();
 await c.recordAttempt(r);await c.recordAttempt({...r,revision:2,outcome:'lost'});
 assert.equal(c.pendingAttempts,1);await c.stage(0);assert.equal(c.session.stage,0);
 const saved=map.get(EVENT_KEY+':test:attempts:owner');assert.equal(JSON.parse(saved)[0].revision,2);assert.ok(!saved.includes('token'));
 fail=false;const reload=createOdenEventClient({storage,fetcher,config});await reload.flushAttempts();assert.equal(reload.pendingAttempts,0);
 assert.equal(requests.at(-1).report.outcome,'lost');
});

test('real edge handler authenticates ownership and keeps telemetry separate from prize state without network access',async()=>{
 const savedFetch=globalThis.fetch,savedDeno=globalThis.Deno;let handler,stored=[];
 const credential='a'.repeat(64),hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(credential))).toString('hex');
 const participant={id:'owner-uuid',stage:-1,nickname:'test',event_id:'oden-ending-2026-live-1110'};
 globalThis.Deno={env:{get:k=>k==='SUPABASE_SERVICE_ROLE_KEY'?'fake-service':k==='SUPABASE_URL'?'https://local-test.invalid':null},serve:fn=>{handler=fn;}};
 globalThis.fetch=async(url,opts)=>{
  const u=new URL(url);
  assert.equal(u.hostname,'local-test.invalid');
  let data=[];
  if(u.pathname.endsWith('/oden_event_participants'))data=u.searchParams.get('token_hash')==='eq.'+hash?[participant]:[];
  else if(opts.method==='GET')data=stored;
  else if(opts.method==='POST'){stored=[JSON.parse(opts.body)];data=stored;}
  return new Response(JSON.stringify(data),{status:200});
 };
 try{
  await import('../supabase/functions/oden-event/index.js?skill-handler-test');
  const send=(payload,token=credential)=>handler(new Request('https://local-handler.invalid',{method:'POST',headers:{'Content-Type':'application/json',...(token?{'X-Oden-Token':token}:{})},body:JSON.stringify(payload)}));
  const body={action:'attempt',eventId:'oden-ending-2026-live-1110',report:{...report(),participant_id:'victim'}};
  assert.equal((await send(body,null)).status,401);
  assert.equal((await send(body,'b'.repeat(64))).status,401);
  assert.equal((await send(body)).status,200);assert.equal(stored[0].participant_id,'owner-uuid');assert.equal(participant.stage,-1);
  assert.equal((await send({...body,report:{...body.report,attacks:-1}})).status,400);
  assert.equal((await send({...body,extra:'x'.repeat(17000)})).status,413);
 }finally{globalThis.fetch=savedFetch;if(savedDeno===undefined)delete globalThis.Deno;else globalThis.Deno=savedDeno;}
});
