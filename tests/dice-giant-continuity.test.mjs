import test from 'node:test';
import assert from 'node:assert/strict';
import {giantFeralHeadMotion,giantThrowTimeline,giantThrowGesture} from '../src/dice-giant-motion.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantPattern,giantHeadPose,giantPosture,skipGiant} from '../src/dice-giant.mjs';
function feral(slot=7){
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 damageDice(g,1000);
 const s=g.dice.giant,p=giantPattern(slot,{x:8,z:-42},'feral',.16);
 Object.assign(s,{state:'attack',temperament:'feral',slot,t:0,hazards:p.hazards,duration:p.duration});
 return {g,s,p};
}
test('head slam transitions are smooth across overlapping rapid attack windows',()=>{
 const {g,s,p}=feral(7);let last=null,maxStep=0,maxTorso=0;
 for(let i=0;i<650;i++){
  s.t=.3+i*.01;const head=giantHeadPose(g),body=giantPosture(g);
  assert.ok(Object.values(head).filter(Number.isFinite).every(Number.isFinite));
  if(last){maxStep=Math.max(maxStep,Math.hypot(head.x-last.head.x,head.y-last.head.y,head.z-last.head.z));
   maxTorso=Math.max(maxTorso,Math.abs(body.lean-last.body.lean));}
  last={head,body};
 }
 assert.ok(maxStep<12,'no instantaneous head teleport across repeated slams: '+maxStep);
 assert.ok(maxTorso<.2,'chest should follow without discontinuities: '+maxTorso);
 for(const h of p.hazards){s.t=h.start+h.warn;const pose=giantHeadPose(g);
  assert.ok(Math.abs(pose.x-h.x)<.1);assert.ok(pose.y<=8.5);assert.ok(Math.abs(pose.z-h.z)<.1);}
});
test('feral tremor fades while first head slam begins without a snap',()=>{
 const {g,s}=feral(7);
 s.t=.995;const a=giantHeadPose(g);
 s.t=1.005;const b=giantHeadPose(g);
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<8);
 const c=giantFeralHeadMotion(s);assert.ok(c.lean>0&&c.lean<1);
});
test('throwing torso and wrist recoil decay to neutral before the attack ends',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 const s=g.dice.giant,p=giantPattern(3,{x:0,z:-42});
 Object.assign(s,{state:'attack',temperament:'controlled',slot:3,t:0,hazards:p.hazards,duration:p.duration});
 const h=p.hazards[0],t=giantThrowTimeline(s,h);
 s.t=(t.pickupEnd+t.release)/2;const armed=giantPosture(g);
 assert.ok(Math.abs(armed.throwTwist)>0);
 s.t=t.release+.43;const recovered=giantPosture(g);
 assert.equal(recovered.throwTwist||0,0);
 s.t=t.impact-.00001;const wrist=giantThrowGesture(s,h);
 assert.ok(Math.abs(wrist.wristPitch)<.05);assert.ok(Math.abs(wrist.wristRoll)<.05);
});
