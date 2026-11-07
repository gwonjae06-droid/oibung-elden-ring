import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {gyuwonHorizonShot,poseGyuwonHorizonCamera} from '../src/gyuwon-horizon-camera.mjs';
import {createGyuwonGame,startGyuwonPattern} from '../src/gyuwon-combat.mjs';
import {createGyuwonRecallMaps,RECALL_MAP_NAMES} from '../src/gyuwon-recall-maps.mjs';
const waveGame=()=>{const g=createGyuwonGame();g.boss.phase=3;startGyuwonPattern(g,'tsunami');return g;};
test('horizon shot points towards incoming sea and releases well before contact, without mutating combat',()=>{
 const g=waveGame(),h=g.gyuwon.hazards[0];h.age=.6;const before=JSON.stringify(g),camera=new THREE.PerspectiveCamera(62,1,.1,1000),target=new THREE.Vector3(0,3,0);camera.position.set(0,16,38);
 const shot=poseGyuwonHorizonCamera(camera,target,g);assert.ok(shot.active);assert.ok(target.z<-100);assert.ok(camera.position.y<16);assert.equal(JSON.stringify(g),before);
 assert.ok(shot.finish<h.warn);h.age=shot.finish;assert.equal(gyuwonHorizonShot(g).active,false);h.age=4;assert.equal(gyuwonHorizonShot(g).active,false);g.status='won';assert.equal(gyuwonHorizonShot(g).active,false);
});
test('other patterns receive no camera override and reduced motion retains a gentle reveal',()=>{
 const g=waveGame();g.gyuwon.hazards[0].age=.6;assert.ok(gyuwonHorizonShot(g,{reduced:true}).weight>0);assert.ok(gyuwonHorizonShot(g,{reduced:true}).weight<gyuwonHorizonShot(g).weight);startGyuwonPattern(g,'sword');assert.equal(gyuwonHorizonShot(g).active,false);
});
test('actual boss maps are built once, keep source geometry, switch exclusively and dispose',()=>{
 const previous=globalThis.document;
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:32}),getImageData:()=>({data:new Uint8ClampedArray(1024*1024*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);let maps;
 try{
  maps=createGyuwonRecallMaps(scene,{coarse:true,reduced:true});assert.equal(maps.stats().builds,4);
  const g=waveGame();for(let pass=0;pass<3;pass++)for(const id of Object.keys(RECALL_MAP_NAMES)){g.gyuwon.stageMemory=id;maps.update(g);assert.equal(maps.stats().originalRoot,RECALL_MAP_NAMES[id]);assert.equal(maps.root.children.filter(o=>o.visible).length,1);assert.equal(maps.stats().builds,4);assert.equal(scene.background.getHex(),0xffffff);}
  g.boss.phase=2;maps.update(g);assert.equal(maps.root.children.filter(o=>o.visible).length,0);g.boss.phase=3;g.status='won';maps.update(g);assert.equal(maps.stats().active,null);
 }finally{maps?.dispose();globalThis.document=previous;}
 assert.equal(scene.getObjectByName('gyuwon-real-boss-maps'),undefined);
});
test('public journey has no dedicated practice entry',()=>{assert.doesNotMatch(readFileSync(new URL('../src/journey.mjs',import.meta.url),'utf8'),/practice-gyuwon|최규원 연습/);});
