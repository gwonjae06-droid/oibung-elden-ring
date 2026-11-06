import test from 'node:test';
import assert from 'node:assert/strict';
import {GIANT_THROW_SLOW,GIANT_THROW_FLIGHT_SECONDS,slowThrownHazards} from '../src/dice-giant-throw-speed.mjs';
import {giantPattern} from '../src/dice-giant.mjs';
import {giantThrowTimeline,giantThrownPropPose} from '../src/dice-giant-motion.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
test('slows only physical thrown props, marks long flight once and keeps original hazards immutable',()=>{
 const input=[{warn:1,id:0},{warn:2,id:1}],once=slowThrownHazards(input,h=>h.id===0),twice=slowThrownHazards(once,()=>true);
 near(GIANT_THROW_SLOW,1.85);near(GIANT_THROW_FLIGHT_SECONDS,1.25);
 near(once[0].warn,1.85);near(once[0].flightSeconds,1.25);
 near(once[1].warn,2);near(twice[0].warn,1.85);near(twice[1].warn,3.7);near(input[0].warn,1);
});
test('controlled giant props have long anticipation; direct palm strikes keep their original warnings',()=>{
 for(const [slot,warn] of [[1,1.15],[2,1.4],[3,1.5],[4,1.4],[9,1.35]]){
  const h=giantPattern(slot,{x:0,z:-40}).hazards[0];
  near(h.warn,warn*GIANT_THROW_SLOW);assert.equal(h.throwSlowed,true);
  assert.equal(h.flightSeconds,1.25);
 }
 for(const [slot,warn] of [[0,1.1],[5,1.6],[7,1],[8,.92]]){
  const h=giantPattern(slot,{x:0,z:-40}).hazards[0];
  near(h.warn,warn);assert.equal(h.throwSlowed,undefined);
 }
});
test('roulette mixed hazards and feral chip/chess throws are slowed exactly once',()=>{
 const p=giantPattern(6,{x:0,z:-40}),slowed=p.hazards.filter(h=>h.throwSlowed);
 assert.equal(slowed.length,2,'phase-two roulette reveals a 2–6 physical coin count');
 near(slowed[0].warn,1.45*GIANT_THROW_SLOW);
 near(slowed.at(-1).warn,1.45*GIANT_THROW_SLOW);
 assert.ok(p.hazards.every(h=>h.rouletteCoin));
 const feralChip=giantPattern(1,{x:0,z:-40},'feral').hazards[0];
 const feralChess=giantPattern(4,{x:0,z:-40},'feral').hazards[0];
 assert.equal(feralChip.throwSlowed,true);assert.equal(feralChip.flightSeconds,1.25);
 assert.equal(feralChess.throwSlowed,undefined,'feral chessboard is smashed by real palms, not thrown');
 const head=giantPattern(2,{x:0,z:-40},'feral').hazards[0];assert.equal(head.throwSlowed,undefined);
});
test('every throw actually spends at least 1.2 seconds visible in the air',()=>{
 for(const slot of [1,2,3,4,9]){
  const p=giantPattern(slot,{x:8,z:-42}),s={state:'attack',t:0,hazards:p.hazards,temperament:'controlled',slot};
  for(const h of p.hazards){
   const t=giantThrowTimeline(s,h);assert.ok(t.release-t.ready>=.13);
   near(t.impact-t.release,GIANT_THROW_FLIGHT_SECONDS);
   s.t=t.release+(t.impact-t.release)*.5;
   const pose=giantThrownPropPose(s,h,'chip',{x:0,y:9,z:-64},{x:0,y:9,z:-64});
   assert.equal(pose.visible,true);assert.equal(pose.phase,'flight');
   assert.ok(pose.y>9);
  }
 }
});
