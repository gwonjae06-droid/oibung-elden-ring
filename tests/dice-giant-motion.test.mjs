import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {giantHandGesture,giantHeadImpactPulse} from '../src/dice-giant-motion.mjs';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantImpact} from '../src/dice-giant-hit.mjs';
import {giantPattern,giantHeadPose,skipGiant,GIANT} from '../src/dice-giant.mjs';
function enteredPhaseTwo(){
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 return g;
}
test('wrist and elbow articulate along the authoritative attack timeline',()=>{
 const g=enteredPhaseTwo(),s=g.dice.giant,p=giantPattern(7,{x:0,z:-40});
 Object.assign(s,{state:'attack',slot:7,hazards:p.hazards,duration:p.duration});
 const first=p.hazards[0];s.t=first.start+first.warn-.28;
 const wind=giantHandGesture(s,0);s.t=first.start+first.warn+.06;
 const slam=giantHandGesture(s,0);
 assert.ok(wind.anticipation>.3);assert.ok(slam.impact>0);
 assert.ok(Math.abs(wind.wristPitch-slam.wristPitch)>.15);
 assert.ok(slam.followThrough>0);
 assert.deepEqual(giantHandGesture({...s,destroyed:[true,false]},0).impact,0);
 assert.deepEqual(giantHandGesture({...s,revive:[.2,0]},0).elbowLift,0);
 assert.ok([wind,slam].every(m=>Object.values(m).every(Number.isFinite)));
});
test('head slam dust never starts before the actual impact moment',()=>{
 const h={headSlam:true,warn:1.2,active:1.5,age:1.19};
 assert.equal(giantHeadImpactPulse(h),0);
 h.age=1.21;assert.ok(giantHeadImpactPulse(h)>.8);
 h.age=1.75;assert.equal(giantHeadImpactPulse(h),0);
 assert.equal(giantHeadImpactPulse({...h,headSlam:false}),0);
});
test('three-dimensional joints, feral particles and impact rings update and clean up',()=>{
 const scene=new THREE.Scene(),view=buildDiceGiant(scene),g=enteredPhaseTwo(),s=g.dice.giant;
 const camera=new THREE.PerspectiveCamera(70,1,.1,400);camera.position.set(0,40,40);
 try{
  const pattern=giantPattern(7,{x:0,z:-40});
  Object.assign(s,{state:'attack',slot:7,t:.3,hazards:pattern.hazards,duration:pattern.duration});
  view.update(g,1/60);
  const hand=view.root.getObjectByName('sungwon-hand-0-palm');assert.ok(hand);
  const before=hand.rotation.x;
  s.t=1.06;view.update(g,1/60);assert.notEqual(hand.rotation.x,before);
  const heldLeft=s.destroyed[0];s.destroyed[0]=true;view.update(g,1/60);
  assert.equal(hand.visible,true,'crumbling hand briefly remains visible');
  s.destroyed[0]=heldLeft;
  damageDice(g,1000);assert.equal(g.boss.phase,3);
  assert.equal(s.temperament,'feral');
  const feral=giantPattern(7,{x:0,z:-42},'feral',.28),head=feral.hazards[0];
  Object.assign(s,{state:'attack',slot:7,t:head.start+head.warn+.04,hazards:feral.hazards,duration:feral.duration});
  g.dice.pose=giantHeadPose(g);view.update(g,1/60);view.occlude(camera,g.player);
  assert.equal(view.root.getObjectByName('sungwon-head-impact-0').visible,true);
  assert.equal(view.root.getObjectByName('sungwon-impact-dust-0').visible,true);
  s.t=head.start+head.warn-.01;view.update(g,1/60);
  assert.equal(view.root.getObjectByName('sungwon-impact-dust-0').visible,false);
  s.state='recovery';s.t=0;s.rageBeat=GIANT.rageBeat;view.update(g,1/60);
  assert.equal(view.root.getObjectByName('sungwon-feral-reveal-0').visible,true);
 }finally{const disposed=view.dispose();assert.equal(disposed.errors.length,0);}
 assert.equal(scene.children.includes(view.root),false);
});
test('a regrowing palm cannot be hit before animation and recovery finish',()=>{
 const g=enteredPhaseTwo(),s=g.dice.giant;
 s.revive[0]=.3;
 assert.equal(giantImpact(g,{x:-22,y:2,z:-51},{x:-22,y:2,z:-60}),null);
 s.revive[0]=0;
 assert.equal(giantImpact(g,{x:-22,y:2,z:-51},{x:-22,y:2,z:-60})?.index,0);
});
