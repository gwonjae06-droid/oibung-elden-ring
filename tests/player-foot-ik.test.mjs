import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {solvePlayerFoot,playerFootTarget,PLAYER_LEG_BONES} from '../src/player-foot-ik.mjs';
import {buildPlayer} from '../src/models.mjs';
import {samplePlayerMotion} from '../src/player-motion-data.mjs';
import {applyPlayerMotion} from '../src/player-motion.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const game=()=>({weapon:'sword',status:'playing',time:0,player:{x:3,z:5,yaw:.7,action:null},boss:{state:'idle'}});
test('two-bone leg IK keeps ankle at the requested local stride point',()=>{
 const {thigh,shin}=PLAYER_LEG_BONES;
 for(const y of [-.89,-.86,-.78,-.7])for(const z of [-.20,-.12,0,.12,.20]){
  const q=solvePlayerFoot(y,z);
  const yy=-thigh*Math.cos(q.hip)-shin*Math.cos(q.hip+q.knee);
  const zz=-thigh*Math.sin(q.hip)-shin*Math.sin(q.hip+q.knee);
  assert.ok(Number.isFinite(q.hip)&&Number.isFinite(q.knee));
  assert.ok(Math.abs(Math.hypot(yy,zz)-q.reach)<1e-6);
  if(!q.clamped){assert.ok(Math.abs(yy-y)<1e-6);assert.ok(Math.abs(zz-z)<1e-6);}
  assert.ok(Math.abs(q.hip+q.knee+q.ankle)<1e-9);
 }
});
test('leg IK handles unreachable, zero and invalid targets safely',()=>{
 for(const args of [[0,0],[-100,4],[Infinity,0],[NaN,3]]){
  const q=solvePlayerFoot(...args);
  assert.ok([q.hip,q.knee,q.ankle,q.reach].every(Number.isFinite));
 }
});
test('player leg IK is only enabled for locomotion, not attacks or rolls',()=>{
 const g=game(),idle=samplePlayerMotion(g,0,4.7);
 assert.equal(idle.locomotion,true);
 assert.ok(playerFootTarget(idle,'L',4.7).weight>.8);
 for(const kind of ['attack','roll','hurt','heal']){
  g.player.action={kind,t:.15,total:.7,wind:.22,active:.1};
  assert.equal(samplePlayerMotion(g,1,4.7).locomotion,false);
 }
});
test('leg endpoints remain articulated, grounded and gameplay transforms untouched',()=>{
 const scene=new THREE.Scene(),p=buildPlayer(['sword','hammer','bow','cards']),g=game();scene.add(p.rig);
 p.rig.position.set(3,0,5);p.rig.rotation.y=.7;
 for(let i=0;i<72;i++){
  g.time=i/60;
  const pose=samplePlayerMotion(g,i/72*Math.PI*2,4.7,{moveZ:1});
  const before=JSON.stringify(g);
  applyPlayerMotion(p.presentationParts,pose,'sword',g.time,4.7);
  let bottom=Infinity;
  for(const ankle of p.presentationParts.ankles)for(const z of [-.1,.26]){
   const point=new THREE.Vector3(0,-.1,z);ankle.localToWorld(point);
   bottom=Math.min(bottom,point.y);
  }
  assert.ok(Math.abs(bottom-.012)<1e-6,'ground must stay at y=.012');
  assert.deepEqual(p.rig.position.toArray(),[3,0,5]);
  assert.equal(JSON.stringify(g),before);
 }
 disposeScene(scene);
});
