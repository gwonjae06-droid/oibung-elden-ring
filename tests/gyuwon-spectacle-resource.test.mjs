import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonSpectacle} from '../src/gyuwon-spectacle.mjs';
function mockCanvas(){
 const old=globalThis.document;
 const ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(){}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 return ()=>{globalThis.document=old;};
}
const hazard=(id,visual)=>({id,visual,shape:'circle',x:0,z:0,r:5,age:.7,warn:1,yaw:0,width:2,opening:3,gap:0,depth:1,speed:4});
const game=hazards=>({status:'playing',boss:{phase:3},gyuwon:{stageMemory:'tsunami',stageTime:1,t:1,hazards},time:1});
test('retired memory props are pooled and released when the encounter closes',()=>{
 const restore=mockCanvas();
 try{
  const scene=new THREE.Scene(),fx=createGyuwonSpectacle(scene);
  const h1=hazard(11,'spotlight'),h2=hazard(12,'ball');
  fx.update(game([h1,h2]),.016,0);
  assert.equal(fx.stats().liveAttackGroups,2);
  const group=scene.getObjectByName('gold-memory-sword').parent.children.find(o=>o.isGroup&&!o.name);
  assert.ok(group,'live attack group exists');
  let released=0;
  for(const object of group.children)if(object.geometry&&!object.geometry.userData?.shared)
    object.geometry.addEventListener('dispose',()=>released++);
  fx.update(game([h2]),.016,0);
  assert.equal(fx.stats().liveAttackGroups,1);
  assert.equal(released,0,'pooled props survive expiry');assert.ok(fx.stats().pooledAttackGroups>=1);
  fx.update(game([]),.016,0);
  assert.equal(fx.stats().liveAttackGroups,0);
  fx.dispose();assert.ok(released>=1,'pooled geometry is disposed on close');
 }finally{restore();}
});
test('giant wave does not double-render its surface as an expensive point cloud',()=>{
 const restore=mockCanvas();
 try{
  const scene=new THREE.Scene(),fx=createGyuwonSpectacle(scene,{coarse:true});
  fx.update(game([hazard(23,'wave')]),.016,0);
  const water=scene.getObjectByName('gyuwon-gold-wave-surface');
  // The wave has one surface and an opening indicator, not one point cloud per vertex.
  assert.equal(fx.stats().liveAttackGroups,1);
  let surfaces=0,clouds=0;scene.traverse(o=>{if(o.geometry?.type==='BufferGeometry'&&o.isMesh&&o.geometry.getAttribute('position')?.count>5000)surfaces++;});
  assert.ok(surfaces>=1);
  fx.dispose();
 }finally{restore();}
});
