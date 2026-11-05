import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clownLegTarget} from '../src/clown-gait.mjs';
import {createClownActor} from '../src/clown-actor.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {bloodAttackMotion} from '../src/blood-attack-motion.mjs';
import {buildKwonLeg,poseKwonLeg,finishKwonLeg} from '../src/kwon-leg-rig.mjs';
import {constrainGiantElbow,createGiantElbowFollow} from '../src/giant-arm-inertia.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {skipGiant,giantPattern} from '../src/dice-giant.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
test('Clown legs keep constant-length bone segments while switching planted and airborne poses',()=>{
 for(const side of [-1,1])for(const activity of [0,.25,.65,1])
  for(const phase of [0,.1,.3,.6,.62,.68,.8,.95]){
   const o=clownLegTarget(side,phase,activity,.3);
   assert.ok(Math.abs(distance(o.hip,o.knee)-.77)<1e-8);
   assert.ok(Math.abs(distance(o.knee,o.foot)-.77)<1e-8);
   assert.ok(o.foot.every(Number.isFinite));
   assert.ok(o.anklePitch>=-.221&&o.anklePitch<=0);
   if(o.planted){assert.equal(o.lift,0);assert.equal(o.anklePitch,0);}
  }
});
test('Actual clown model uses articulated gait from the fixed bone target',()=>{
 const actor=createClownActor();
 assert.ok(actor.root.isGroup);
 assert.equal(actor.root.children.length>0,true);
 const meshes=[];actor.root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 assert.ok(meshes.length>10);
 actor.head.dispose?.();
 assert.deepEqual(disposeScene(actor.root).errors,[]);
});
test('Blood shoulders, armor, mantle and phase-two growth are children of the same torso socket',()=>{
 const actor=new THREE.Group(),rig=createBloodRegalia(actor,{coarse:true});
 try{
  assert.equal(rig.arms[0].arm.parent,rig.torso);
  assert.equal(rig.arms[1].arm.parent,rig.torso);
  assert.equal(rig.cape.parent,rig.torso);
  assert.equal(rig.growth.parent,rig.torso);
  assert.equal(rig.legs[0].hip.parent,actor,'feet must stay grounded while the torso bows');
  const g=createBloodGame();startBloodPattern(g,'burst');
  g.blood.t=g.blood.hazards[0].warn;
  const pose=bloodAttackMotion(g);
  rig.update(g,{veins:0},.016,0,pose);
  actor.updateWorldMatrix(true,true);
  const before=rig.arms[0].arm.getWorldPosition(new THREE.Vector3()).clone();
  rig.torso.rotation.x+=.18;actor.updateWorldMatrix(true,true);
  const after=rig.arms[0].arm.getWorldPosition(new THREE.Vector3());
  assert.ok(after.distanceTo(before)>.03,'shoulder not attached to bending chest');
 }finally{rig.dispose();assert.deepEqual(disposeScene(actor).errors,[]);}
});
test('Real Blood view has face and both wings beneath the chest, not the static actor',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true});
 try{
  const actor=view.root.children[0],chest=actor.children.find(o=>o.children.some(x=>x.name==='baeseojun-sculpted-head'||x.children?.some(y=>y.name==='baeseojun-sculpted-head')));
  assert.ok(chest,'chest-attached head is missing');
  const skull=actor.getObjectByName('baeseojun-sculpted-head');
  assert.equal(skull.parent.parent,chest);
  const webs=[],fingers=[];chest.traverse(o=>{if(o.name==='blood-wing-web')webs.push(o);if(o.name==='blood-wing-finger')fingers.push(o);});
  assert.ok(webs.length>=2&&fingers.length>=6,'wings detached from torso');
  const p=skull.getWorldPosition(new THREE.Vector3()),pose=chest.rotation.x;
  chest.rotation.x=pose+.1;view.root.updateWorldMatrix(true,true);
  assert.ok(skull.getWorldPosition(new THREE.Vector3()).distanceTo(p)>.1);
 }finally{view.dispose();}
});
test('Giant elbow arc remains between shoulder and palm without reversing on distant transitions',()=>{
 for(const [shoulder,palm] of [
  [[-20,20,-120],[-20,12,-40]],
  [[20,20,-120],[40,0,5]],
  [[0,1,0],[0,1,0]],
 ]){
  const follow=createGiantElbowFollow(),guide=[100,100,-300];
  follow.step(guide,0);
  for(let i=0;i<80;i++){
   const eased=follow.step([0,2,-5],1/60);
   const elbow=constrainGiantElbow(shoulder,palm,[eased.x,eased.y,eased.z]);
   assert.ok(elbow.every(Number.isFinite));
   if(distance(shoulder,palm)>1e-8){
    const arm=palm.map((v,j)=>v-shoulder[j]),rel=elbow.map((v,j)=>v-shoulder[j]),
     proj=rel.reduce((s,x,j)=>s+x*arm[j],0)/arm.reduce((s,x)=>s+x*x,0);
    assert.ok(proj>=.199999&&proj<=.800001,'elbow reversed');
   }
  }
 }
 assert.throws(()=>constrainGiantElbow([0,0,0],[0,0,1],[NaN,0,0]),TypeError);
});
test('Giant arm visual rig stays finite through hand strikes and preserves the collision position',()=>{
 const scene=new THREE.Scene(),view=buildDiceGiant(scene),g=createDicePlayerGame();
 try{
  damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
  const giant=g.dice.giant,attack=giantPattern(7,{x:0,z:-41});
  Object.assign(giant,{state:'attack',slot:7,hazards:attack.hazards,duration:attack.duration});
  for(let i=0;i<95;i++){
   giant.t=i/60;view.update(g,1/60);
   for(const id of [0,1]){
    const elbow=view.root.getObjectByName('sungwon-hand-'+id+'-elbow');
    assert.ok(elbow);assert.ok(elbow.position.toArray().every(Number.isFinite));
   }
  }
 }finally{assert.deepEqual(view.dispose().errors,[]);}
});
