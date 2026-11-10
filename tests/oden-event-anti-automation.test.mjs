import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventInputMonitor,eventActionFromInput} from '../src/oden-event-input-monitor.mjs';
import {classifyEventRisk,nextEventRisk,riskLevel} from '../supabase/functions/oden-event/risk.js';

test('only gameplay actions are classified and keyboard auto-repeat is ignored',()=>{
 assert.equal(eventActionFromInput({type:'keydown',code:'KeyJ',repeat:false}),'KeyJ');
 assert.equal(eventActionFromInput({type:'keydown',code:'KeyJ',repeat:true}),null);
 assert.equal(eventActionFromInput({type:'keydown',code:'KeyW',repeat:false}),null);
 assert.equal(eventActionFromInput({type:'pointerdown',composedPath:()=>[{dataset:{act:'roll'}}]}),'button:roll');
 assert.equal(eventActionFromInput({type:'pointerdown',composedPath:()=>[{id:'world'}]}),'world-click');
 assert.equal(eventActionFromInput({type:'pointerdown',composedPath:()=>[{id:'thumb'}]}),null);
});

test('normal trusted, irregular human input does not mark suspicious regardless of skill',async()=>{
 let now=0;const batches=[];
 const monitor=createEventInputMonitor({clock:()=>now,send:r=>{batches.push(r);}});
 for(let i=0;i<100;i++){
  now+=[138,285,97,312,178,226,353][i%7];
  monitor.record('KeyJ',{trusted:true,repeat:false});
 }
 now+=2000;await monitor.flush();
 assert.equal(batches.length,1);
 const risk=classifyEventRisk(batches[0]);
 assert.equal(risk.delta,0);assert.deepEqual(risk.flags,[]);
 assert.equal(monitor.snapshot().events,0);
});

test('synthetic actions can raise review risk over multiple sustained reports',async()=>{
 let now=0;const batches=[];
 const monitor=createEventInputMonitor({clock:()=>now,send:r=>{batches.push(r);}});
 for(let period=0;period<3;period++){
  for(let i=0;i<60;i++){now+=190;monitor.record('KeyJ',{trusted:false});}
  now+=20000;await monitor.flush();
 }
 assert.equal(batches.length,3);
 let score=0,flags=[];
 for(const batch of batches){
  assert.equal('code'in batch,false);assert.equal('keys'in batch,false);
  const next=nextEventRisk(score,batch,flags);
  score=next.score;flags=next.flags;
 }
 assert.ok(score>=85);assert.equal(riskLevel(score), 'hold');
 assert.ok(flags.includes('synthetic_action_majority'));
});

test('mechanically perfect repeated timing is only one heuristic, never proof',async()=>{
 let now=0,summary;
 const m=createEventInputMonitor({clock:()=>now,send:r=>{summary=r;}});
 for(let i=0;i<50;i++){now+=200;m.record('KeyJ',{trusted:true});}
 now+=15000;await m.flush();
 assert.ok(summary.cadence>=10);
 const evidence=classifyEventRisk(summary);
 assert.ok(evidence.flags.includes('near_perfect_action_cadence'));
 assert.ok(evidence.delta<=45);
});

test('server rejects forged/out-of-range reports before computing any score',()=>{
 for(const report of [{durationMs:10,events:30,untrusted:30,rapid:0,cadence:0},
  {durationMs:30000,events:-1,untrusted:0,rapid:0,cadence:0},
  {durationMs:30000,events:30,untrusted:200,rapid:0,cadence:0},
  {durationMs:30000,events:30,untrusted:2,rapid:0,cadence:NaN}]){
  assert.equal(classifyEventRisk(report),null);
  assert.equal(nextEventRisk(0,report),null);
 }
 assert.equal(riskLevel(34),'normal');
 assert.equal(riskLevel(35),'observe');
 assert.equal(riskLevel(60),'verify');
 assert.equal(riskLevel(85),'hold');
 assert.equal(riskLevel(5,true),'hold');
});

test('missing client reports alone cannot raise a risk score',()=>{
 assert.deepEqual(nextEventRisk(0,{durationMs:30000,events:15,untrusted:0,rapid:0,cadence:0}),{
  score:0,flags:[],hold:false,level:'normal',delta:0
 });
});
