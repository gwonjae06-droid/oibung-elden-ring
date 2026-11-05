import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {giantThrowTimeline,giantThrownPropPose,giantThrowGesture,giantSpringStep} from '../src/dice-giant-motion.mjs';
import {giantPattern,skipGiant,giantHazards} from '../src/dice-giant.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';

function secondPhase(){
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);g.events.length=0;return g;
}
test('a single hand picks up a new prop only after releasing the previous throw',()=>{
 const p=giantPattern(1,{x:4,z:-38});
 const s={state:'attack',t:0,hazards:p.hazards,temperament:'controlled'};
 const a=p.hazards[0],b=p.hazards[2],c=p.hazards[4];
 assert.equal(a.handIndex,0);assert.equal(b.handIndex,0);assert.equal(c.handIndex,0);
 const first=giantThrowTimeline(s,a),second=giantThrowTimeline(s,b),third=giantThrowTimeline(s,c);
 assert.ok(first.ready<=first.pickupEnd&&first.pickupEnd<first.release&&first.release<first.impact);
 assert.ok(second.ready>=first.release,'second item must wait for first release');
 assert.ok(third.ready>=second.release,'third item must wait for second release');
 assert.ok(third.release<third.impact,'each projectile still reaches the original impact time');
});
test('pickup, grasp, release and ballistic flight meet without visible position jumps',()=>{
 const p=giantPattern(2,{x:16,z:-37}),h=p.hazards[0];
 const s={state:'attack',t:0,hazards:p.hazards,temperament:'controlled'};
 const t=giantThrowTimeline(s,h),grip={x:-21,y:16,z:-49},start={...grip};
 s.t=t.ready;const table=giantThrownPropPose(s,h,'dice',grip);
 assert.ok(table.visible);assert.equal(table.phase,'pickup');assert.equal(table.y,1.9);
 s.t=t.pickupEnd;const held=giantThrownPropPose(s,h,'dice',grip);
 assert.equal(held.phase,'grip');assert.equal(held.x,grip.x);
 s.t=t.release-1e-8;const before=giantThrownPropPose(s,h,'dice',grip);
 s.t=t.release;const after=giantThrownPropPose(s,h,'dice',grip,start);
 assert.ok(Math.hypot(before.x-after.x,before.y-after.y,before.z-after.z)<1e-5);
 s.t=t.release+(t.impact-t.release)*.5;const airborne=giantThrownPropPose(s,h,'dice',grip,start);
 assert.equal(airborne.phase,'flight');assert.ok(airborne.y>grip.y*.7);
 s.t=t.impact-1e-7;const landing=giantThrownPropPose(s,h,'dice',grip,start);
 assert.ok(Math.hypot(landing.x-h.x,landing.z-h.z)<.001);
 s.t=t.impact;assert.equal(giantThrownPropPose(s,h,'dice',grip,start).visible,false);
 assert.equal(giantHazards({dice:{giant:{...s,state:'attack'}}}).some(x=>x.live&&x.id===h.id),true);
});
test('critically damped joint motion is finite and deterministic between frame rates',()=>{
 let large={position:2,velocity:0},small={position:2,velocity:0};
 large=giantSpringStep(large.position,large.velocity,18,.1,18);
 for(let i=0;i<10;i++)small=giantSpringStep(small.position,small.velocity,18,.01,18);
 assert.ok(Math.abs(large.position-small.position)<1e-8);
 assert.ok(Math.abs(large.velocity-small.velocity)<1e-8);
 assert.ok(large.position>2&&large.position<18);
 const invalid=giantSpringStep(2,NaN,5,-1);assert.ok(Object.values(invalid).every(Number.isFinite));
});
test('the hand opens only on release, not while still holding a projectile',()=>{
 const p=giantPattern(2,{x:0,z:-42}),s={state:'attack',temperament:'controlled',t:0,hazards:p.hazards};
 const h=p.hazards[0],t=giantThrowTimeline(s,h);
 s.t=t.release-.035;const held=giantThrowGesture(s,h);
 s.t=t.release+.11;const open=giantThrowGesture(s,h);
 assert.ok(held.curl>open.curl);assert.ok(open.release>.9);
});
test('actual Three.js prop follows the palm and flies from its release point',()=>{
 const scene=new THREE.Scene(),view=buildDiceGiant(scene),g=secondPhase(),s=g.dice.giant,p=giantPattern(2,{x:14,z:-42});
 Object.assign(s,{slot:2,state:'attack',t:0,hazards:p.hazards,duration:p.duration});
 const h=p.hazards[0],t=giantThrowTimeline(s,h);
 try{
  const mesh=view.root.getObjectByName('sungwon-thrown-prop-0');
  s.t=t.ready;view.update(g,1/60);assert.equal(mesh.visible,true);assert.ok(Math.abs(mesh.position.y-1.9)<1e-6);
  s.t=t.pickupEnd+.03;view.update(g,1/60);const palm=view.root.getObjectByName('sungwon-hand-0-palm');
  palm.updateWorldMatrix(true,false);const grip=palm.localToWorld(new THREE.Vector3(0,1.8,11));
  assert.ok(mesh.position.distanceTo(grip)<1e-6,'prop must be in the gripping palm');
  s.t=t.release;view.update(g,1/60);const launch=mesh.position.clone(),rotation=mesh.quaternion.clone();
  s.t=t.release+.001;view.update(g,1/60);
  assert.ok(mesh.position.distanceTo(launch)<.2,'object must not teleport at release');
  assert.ok(mesh.quaternion.angleTo(rotation)<.1,'rotation must stay continuous');
  s.t=t.impact-.0001;view.update(g,1/60);
  assert.ok(Math.hypot(mesh.position.x-h.x,mesh.position.z-h.z)<.05,'projectile finishes at live hazard centre');
  s.t=t.impact;view.update(g,1/60);assert.equal(mesh.visible,false);
 }finally{assert.deepEqual(view.dispose().errors,[]);}
});
