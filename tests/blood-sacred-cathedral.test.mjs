import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSacredCathedral} from '../src/blood-sacred-cathedral.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,stepBlood,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,BLOOD_RULES} from '../src/blood-data.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const countMeshes=o=>{let count=0;o.traverse(child=>{if(child.isMesh)count++;});return count;};
test('a full-size white Gothic nave has a ribbed vault, colored lancets, apse and altar outside combat floor',()=>{
 const scene=new THREE.Scene(),cathedral=createSacredCathedral(scene);
 assert.equal(cathedral.root.name,'sacred-white-cathedral');
 assert.equal(cathedral.stats().windows,12);
 assert.equal(cathedral.stats().beams,7);
 assert.equal(cathedral.stats().occluders,2);
 const stained=[],named=[];cathedral.root.traverse(o=>{
  if(o.name==='cathedral-stained-glass')stained.push(o);
  if(o.name==='ribbed-gothic-vault')named.push(o);
  for(const value of o.position.toArray())assert.ok(Number.isFinite(value));
 });
 assert.equal(stained.length,12);
 assert.equal(named.length,1);
 assert.ok(countMeshes(cathedral.root)>200,'the Gothic architecture must be spatial geometry, not flat scenery');
 assert.ok(cathedral.floorMaterial.isMeshStandardMaterial);
 assert.ok(cathedral.trimMaterial.isMeshStandardMaterial);
 const camera=new THREE.PerspectiveCamera(62,1,.1,160);
 camera.position.set(0,18,38);cathedral.occlude(camera);
 const left=cathedral.root.getObjectByName('left-aisle'),right=cathedral.root.getObjectByName('right-aisle');
 assert.ok(left.visible&&right.visible);
 camera.position.set(-40,18,0);cathedral.occlude(camera);
 assert.equal(left.visible,false);assert.equal(right.visible,true);
 camera.position.set(0,34,38);cathedral.occlude(camera);
 assert.equal(named[0].visible,false,'vault must not block elevated third-person views');
 cathedral.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('phase two changes glass and shafts without repainting ivory architecture',()=>{
 const scene=new THREE.Scene(),cathedral=createSacredCathedral(scene,{coarse:true,reduced:true});
 const g=createBloodGame(),c={darkness:0,active:false},env={light:1};
 const window=cathedral.root.getObjectByName('cathedral-stained-glass');
 assert.ok(window);
 cathedral.update(g,c,env);
 const initial=window.material.color.getHex();
 g.boss.phase=2;cathedral.update(g,c,env);
 assert.notEqual(initial,window.material.color.getHex());
 assert.equal(cathedral.stats().windows,8,'mobile lowers pane count but not the floor or altar');
 assert.equal(cathedral.stats().beams,6);
 assert.ok(countMeshes(cathedral.root)<360,'mobile must retain the full architectural silhouette with a reduced draw-call budget');
 cathedral.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('white cathedral is static throughout the fourteen attacks, transformation and restart',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=createBloodGame();
 const cathedral=scene.getObjectByName('sacred-white-cathedral');
 assert.ok(cathedral);
 const initial=countMeshes(cathedral),children=scene.children.length;
 g.player.hp=1e8;
 for(const [id,spec] of Object.entries(BLOOD_PATTERNS)){
  g.boss.phase=spec.phase;startBloodPattern(g,id);
  for(let i=0;i<8;i++){
   stepBlood(g,.05);
   view.update(g,.05);
   assert.equal(countMeshes(cathedral),initial,'geometry was allocated during '+id);
   assert.equal(scene.children.length,children,'scene root grew during '+id);
  }
 }
 g.boss.phase=2;g.boss.state='transition';g.blood.t=2.3;view.update(g,.05);
 g.blood.t=4.4;view.update(g,.05);
 view.clear();view.update(createBloodGame(),.05);
 assert.equal(countMeshes(cathedral),initial);
 assert.equal(BLOOD_RULES.radius,28,'combat radius must stay unchanged');
 view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
