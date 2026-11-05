import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCasinoRoom} from '../src/casino-room.mjs';
import {createBossAtmosphere} from '../src/boss-atmosphere.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
test('roulette display and suspended gold stay behind both patron rings in every phase',()=>{
 for(const coarse of [false,true]){
  const scene=new THREE.Scene(),room=buildCasinoRoom(THREE,scene,{coarse});
  for(const phase of [1,2,3]){
   room.update(10,{time:10,boss:{phase,x:0,z:0},status:'playing',dice:{}},.016);scene.updateMatrixWorld(true);
   const roulette=scene.getObjectByName('casino-giant-roulette-sign'),box=new THREE.Box3().setFromObject(roulette);
   assert.ok(box.max.z< -250,'display must be behind the distant crowd');
   scene.traverse(o=>{if(o.name==='watching-casino-guest')assert.equal(box.intersectsBox(new THREE.Box3().setFromObject(o)),false);if(o.name==='casino-hanging-gold-shard')assert.ok(Math.hypot(o.position.x,o.position.z)>=280);});
   assert.ok(scene.getObjectByName('casino-failing-chandelier-ornament').position.z< -250);
  }
  disposeScene(scene);
 }
});
test('casino atmosphere has no ambient particle batch or particle updates',()=>{
 const scene=new THREE.Scene(),view=createBossAtmosphere(scene,{profile:'dice'});
 for(let i=0;i<30;i++)view.update({boss:{phase:2},player:{},status:'playing'},1/60);
 assert.equal(view.stats().particles,0);assert.equal(scene.getObjectByName('boss-atmosphere-ambient-chips'),undefined);view.dispose();disposeScene(scene);
});
