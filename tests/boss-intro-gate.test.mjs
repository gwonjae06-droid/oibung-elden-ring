import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossIntroGate} from '../src/boss-intro-gate.mjs';
function rig(){
 let loaded=false,created=0,focused=0;
 const running=[];
 const gate=createBossIntroGate(null,null,'dice',{ready:()=>loaded,focus:()=>{focused++;},
  play:()=>{created++;let resolve;const finished=new Promise(r=>resolve=r);
   const h={finished,skip(){resolve(false);},finish(){resolve(true);}};running.push(h);return h;}});
 return {gate,running,load:()=>{loaded=true;gate.whenReady();},get created(){return created;},get focused(){return focused;}};
}
test('journey cinematic waits for UI readiness and explicit start',async()=>{
 const r=rig();assert.equal(r.gate.blocked,true);r.load();assert.equal(r.created,0);
 r.gate.begin();assert.equal(r.created,1);assert.equal(r.gate.blocked,true);
 r.running[0].finish();await Promise.resolve();
 assert.equal(r.gate.blocked,false);assert.equal(r.focused,1);
});
test('early intro requests begin after the stylesheet becomes ready',async()=>{
 const r=rig();r.gate.begin();assert.equal(r.created,0);r.load();
 assert.equal(r.created,1);r.running[0].finish();await Promise.resolve();assert.equal(r.gate.blocked,false);
});
test('retries and disposal invalidate stale callbacks',async()=>{
 const r=rig();r.load();r.gate.begin();const first=r.running[0];
 r.gate.arm();await Promise.resolve();assert.equal(r.gate.blocked,true);
 r.gate.begin();const second=r.running[1];r.gate.cancel();
 second.finish();first.finish();await Promise.resolve();
 assert.equal(r.gate.blocked,false);assert.equal(r.focused,0);
});
test('standalone encounters run their introduction after UI readiness',async()=>{
 const r=rig();r.gate.whenReady(true);assert.equal(r.created,0);
 r.load();assert.equal(r.created,1);
 r.running[0].finish();await Promise.resolve();assert.equal(r.focused,1);
});
