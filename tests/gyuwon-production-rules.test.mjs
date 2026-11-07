import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createGyuwonHazardFx,gyuwonHazardFootprint} from '../src/gyuwon-hazard-vfx.mjs';
import {createGyuwonGame,startGyuwonPattern,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {GYUWON_PATTERNS,hazardContains} from '../src/gyuwon-data.mjs';
import {GYUWON_MOTION_STYLE,createGyuwonMotionDirector} from '../src/gyuwon-motion.mjs';

const source=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120);};

test('every named Gyuwon gesture is defined exactly once, including the five courtroom actions',()=>{
 const s=source('gyuwon-motion.mjs');
 const definitions=s.slice(s.indexOf('GYUWON_MOTION_STYLE='),s.indexOf('});',s.indexOf('GYUWON_MOTION_STYLE=')));
 assert.deepEqual(Object.keys(GYUWON_MOTION_STYLE).sort(),Object.keys(GYUWON_PATTERNS).sort());
 for(const id of Object.keys(GYUWON_PATTERNS)){
  assert.equal(definitions.split(id+':[').length-1,1,'duplicate / missing '+id);
 }
 assert.doesNotMatch(source('gyuwon-combat.mjs'),/export function skipGyuwonTransition/);
});
test('warning beats persist through retired hitboxes without changing real damage timings',()=>{
 const g=createGyuwonGame();g.boss.phase=2;g.player.invuln=100;
 assert.ok(startGyuwonPattern(g,'verdict'));
 const beats=[...g.gyuwon.motionBeats];
 assert.ok(beats.length>1);assert.deepEqual(beats,[...beats].sort((a,b)=>a-b));
 const director=createGyuwonMotionDirector();director.update(g,0);
 tick(g,3.4);assert.deepEqual(g.gyuwon.motionBeats,beats);
 const pose=director.update(g,1/60);assert.ok(Number.isFinite(pose.leftArm));
});
test('environmental rubble matches the authoritative moving hazard footprint and remains decorative',()=>{
 const scene=new THREE.Scene(),fx=createGyuwonHazardFx(scene,{coarse:true});
 const g=createGyuwonGame();g.boss.phase=2;g.player.invuln=1000;
 assert.ok(startGyuwonPattern(g,'axiom'));
 fx.update(g);
 assert.equal(fx.stats().liveHazards,g.gyuwon.hazards.length);
 assert.equal(fx.stats().damageSources,0);
 const mesh=scene.getObjectByName('gyuwon-hazard-fractured-material');
 assert.ok(mesh?.isMesh);
 assert.ok(mesh.geometry.getAttribute('position').count>30);
 const positions=mesh.geometry.getAttribute('position').array;
 assert.ok([...positions].some((y,i)=>i%3===1&&y>.2),'fractures must have real height');
 assert.ok(!source('gyuwon-view.mjs').includes('CircleGeometry(1,48)'),'old disc decals must be gone');
 for(const h of g.gyuwon.hazards){
  const f=gyuwonHazardFootprint(h);assert.ok(f);assert.ok(f.r>=0);
  for(const p of [{x:h.x,z:h.z},{x:h.x+5,z:h.z+1}]){
   assert.equal(typeof hazardContains(h,p),'boolean');
  }
 }
 const ring=g.gyuwon.hazards.find(h=>h.shape==='ring');
 assert.ok(ring);const ringGroup=[...fx.root.children].find(m=>m.userData.visualOnly&&m.geometry);
 assert.ok(ringGroup);
 ring.age=ring.warn+.24;fx.update(g);
 assert.ok(gyuwonHazardFootprint(ring).r>ring.r,'growing danger ring follows simulation time');
 let disposed=0;mesh.geometry.addEventListener('dispose',()=>disposed++);
 g.gyuwon.hazards=[];fx.update(g);
 assert.equal(fx.stats().liveHazards,0);
 assert.ok(disposed>0);
 fx.dispose();assert.equal(scene.getObjectByName('gyuwon-physical-rupture-cues'),undefined);
});
test('articulated fingers have three bending joints and scalable face detail',()=>{
 const hi=createGyuwonActor(new THREE.Scene()),lo=createGyuwonActor(new THREE.Scene(),{coarse:true});
 const count=(root,name)=>{let n=0;root.traverse(o=>{if(o.name===name)n++;});return n;};
 assert.equal(count(hi.root,'gyuwon-articulated-finger'),24);
 assert.equal(count(hi.root,'gyuwon-rigged-thumb'),4);
 const face=hi.root.getObjectByName('gyuwon-anatomical-face');
 const lower=lo.root.getObjectByName('gyuwon-anatomical-face');
 assert.ok(face.geometry.getAttribute('position').count>lower.geometry.getAttribute('position').count);
 const g=createGyuwonGame();hi.update(g,0,1/60);
 const finger=hi.root.getObjectByName('gyuwon-articulated-finger'),rest=finger.parent.rotation.x;
 g.boss.phase=2;startGyuwonPattern(g,'verdict');
 for(let i=0;i<40;i++){g.time+=1/60;g.gyuwon.t+=1/60;hi.update(g,0,1/60);}
 assert.ok(finger.parent.rotation.x>rest,'cast must bend real finger joints');
});
