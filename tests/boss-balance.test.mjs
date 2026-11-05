import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createKwonTorsoMotion} from '../src/kwon-torso-rig.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test("Kwon's pelvis/shoulder roll is small and leaves authoritative lean intact",()=>{
 const rig=createKwonTorsoMotion(),boss={state:'active',pattern:'slam',phase:1,t:0,wait:0,x:0,z:0,yaw:0,stun:0};
 rig.update(boss,{lean:0,sway:0},0);
 let pose;
 for(let i=1;i<=80;i++){boss.t=i/60;pose=rig.update(boss,{lean:.24,sway:.15},1/60);}
 assert.ok(Math.abs(pose.waistPitch+pose.chestPitch-.24)<1e-9);
 assert.ok(Math.abs(pose.waistRoll)<.025&&Math.abs(pose.chestRoll)<.025);
 assert.ok(Object.values(pose).every(Number.isFinite));
 boss.state='dead';assert.ok(Object.values(rig.update(boss,{lean:1,sway:1},.016)).every(x=>x===0));
});
test('Blood torso and chest share restrained counterweight without growing mesh count',()=>{
 const root=new THREE.Group(),visual=createBloodRegalia(root,{coarse:true,reduced:true}),g=createBloodGame();
 const count=()=>{let n=0;root.traverse(o=>{if(o.isMesh)n++});return n;};
 const initial=count(),snapshot=JSON.stringify(g);
 for(let i=0;i<100;i++){
  g.time=i/60;
  visual.update(g,{veins:0},1/60,.3,{
   body:{roll:.1,twist:.2,lean:.12,chest:.2},
   walk:{moving:true,feet:[.35,-.25]},
   anticipation:.2
  });
 }
 assert.ok(Math.abs(visual.arms[0].arm.rotation.y)>0);
 assert.ok(count()===initial);
 assert.ok(Math.abs(visual.arms[1].arm.rotation.z)<2);
 assert.equal(JSON.stringify(g),snapshot.replace('"time":0',`"time":${g.time}`));
 visual.resetPose();visual.dispose();assert.deepEqual(disposeScene(root).errors,[]);
});
