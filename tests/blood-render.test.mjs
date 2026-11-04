import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,startBloodPattern,stepBlood,damageBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
import {hazardPosition,hazardContains} from '../src/blood-data.mjs';
test('rotated lane and wing meshes point along the actual damage shape',()=>{
 for(const id of ['wing']){const scene=new THREE.Scene(),view=buildBloodView(scene),g=createBloodGame();g.player.x=12;g.player.z=7;g.boss.phase=id==='wing'?2:1;startBloodPattern(g,id);const h=g.blood.hazards[0];h.age=h.warn+.1;view.update(g,0);scene.updateMatrixWorld(true);const m=scene.children.find(o=>o.userData.hazardId===h.id),c=hazardPosition(h);const local=id==='wave'?new THREE.Vector3(0,.4,0):new THREE.Vector3(0,-.8,0),world=m.localToWorld(local);assert.ok(hazardContains(h,world));const dx=world.x-c.x,dz=world.z-c.z;assert.ok(Math.abs(dx*Math.cos(h.yaw)-dz*Math.sin(h.yaw))<1e-5);view.dispose();disposeScene(scene);}
});
test('real Three meshes cover every blood hazard and release transient geometry',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),g=createBloodGame(),camera=new THREE.PerspectiveCamera(60,2,.1,160);camera.position.set(0,20,35);g.player.hp=1e6;
 const base=scene.children.length;
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  g.boss.phase=spec.phase;startBloodPattern(g,id);for(let t=0;t<spec.duration+.1;t+=.05){stepBlood(g,.05);view.update(g,.05);view.occlude(camera,g);scene.traverse(o=>{assert.ok(Number.isFinite(o.position.x)&&Number.isFinite(o.scale.y));});}
  assert.equal(scene.children.length,base,id+' leaked a hazard mesh');
 }
 damageBlood(g,1e7);view.update(g,.1);assert.equal(g.status,'won');view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
