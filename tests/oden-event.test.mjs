import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_KEY,EVENT_MODE_KEY,eventScopedStorage,eventStageAllowed,createOdenEventClient} from '../src/oden-event-client.mjs';
const fakeStorage=()=>{const map=new Map();return {
 getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),snapshot:()=>map};};
test('event campaign keeps main journey and ending photo separated',()=>{
 const store=fakeStorage();
 store.setItem('oibung.journey.v1','original');
 store.setItem('oibung.gyuwon.ensemble-photo','old-photo');
 const event=eventScopedStorage(store,'test','friend');
 assert.equal(event.getItem('oibung.journey.v1'),null);
 assert.equal(event.getItem('oibung.gyuwon.ensemble-photo'),null);
 event.setItem('oibung.journey.v1','fresh');
 event.setItem('oibung.gyuwon.ending-watched','1');
 event.setItem('oibung.gyuwon.ensemble-photo','new-photo');
 assert.equal(event.getItem('oibung.journey.v1'),'fresh');
 assert.equal(store.getItem('oibung.journey.v1'),'original');
 assert.equal(store.getItem('oibung.gyuwon.ensemble-photo'),'old-photo');
 assert.equal(event.getItem('oibung.gyuwon.ensemble-photo'),'new-photo');
});
test('event boss reports must be consecutive',()=>{
 for(let i=-1;i<4;i++)assert.equal(eventStageAllowed(i,i+1),true);
 for(const [p,n]of [[-1,1],[1,1],[3,5],[4,4],[4,5],[0,-1]])assert.equal(eventStageAllowed(p,n),false);
});
test('server-issued participant token and claim survive page reload without exposing token in UI',async()=>{
 const store=fakeStorage(),actions=[],key='oden-test';
 let serverStage=-1,serverCode=null;
 const fetcher=async(_url,opts)=>{
  const body=JSON.parse(opts.body);actions.push({action:body.action,stage:body.stage,token:opts.headers['X-Oden-Token']});
  let payload={},status=200;
  if(body.action==='register'){status=201;payload={id:'p-1',nickname:body.nickname,token:'a'.repeat(64),stage:-1};}
  else if(body.action==='progress'){if(body.stage!==serverStage+1){status=409;payload={error:'out of order'};}else{serverStage=body.stage;payload={stage:serverStage};}}
  else if(body.action==='finish'){if(serverStage!==4){status=409;payload={error:'incomplete'};}else {serverCode='ODEN-TEST123456';payload={id:'p-1',nickname:'참가자',stage:4,code:serverCode,status:'pending'};}}
  else if(body.action==='status')payload={id:'p-1',nickname:'참가자',stage:serverStage,code:serverCode,status:'pending'};
  return {ok:status<400,status,json:async()=>payload};
 };
 const config={enabled:true,eventId:key,projectUrl:'https://example.test',publishableKey:'public'};
 const client=createOdenEventClient({storage:store,fetcher,config});
 await assert.rejects(client.join('A'),/2~18자/);
 await client.join('참가자');
 assert.equal(client.session.token,undefined);
 assert.ok(store.getItem(EVENT_KEY+':'+key)?.includes('a'.repeat(64)));
 client.setActive(true);
 assert.equal(store.getItem(EVENT_MODE_KEY),key);
 assert.equal(client.active,true);
 await client.stage(0);
 await assert.rejects(client.stage(2),/첫 보스부터/);
 for(let stage=1;stage<=4;stage++)await client.stage(stage);
 await client.finish();
 assert.equal(client.session.code,'ODEN-TEST123456');
 assert.equal(client.session.stage,4);
 assert.equal(actions.filter(a=>a.action==='progress').length,5);
 const restored=createOdenEventClient({storage:store,fetcher,config});
 assert.equal(restored.active,true);
 assert.equal((await restored.refresh()).code,'ODEN-TEST123456');
 restored.setActive(false);
 assert.equal(restored.active,false);
});
test('event stays unreachable until admin enables it',async()=>{
 const client=createOdenEventClient({storage:fakeStorage(),fetcher:()=>{throw Error('Should never call server');},config:{enabled:false,eventId:'off',projectUrl:'https://example.test'}});
 assert.equal(client.enabled,false);
 await assert.rejects(client.join('친구A'),/아직 열리지/);
});
