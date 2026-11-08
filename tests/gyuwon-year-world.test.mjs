// Legacy-mode regression for retired annual mechanics; the live encounter uses musical genres after year four.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {startGyuwonYearCast,resolveGyuwonExamGrade} from '../src/gyuwon-years.mjs';
import {createGyuwonYearWorld} from '../src/gyuwon-year-world.mjs';
import {annualWorldLayers,annualFloorHeight,omrFloorAngle,resolveAnnualWorldMotion} from '../src/gyuwon-year-world-data.mjs';
import {hazardContains} from '../src/gyuwon-data.mjs';
import {spawnPlayerProjectiles} from '../src/player-combat.mjs';
import {gyuwonHurtShapes} from '../src/boss-hit-regions.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';

const game=year=>{const g=createGyuwonGame('sword',{yearMode:true,seed:42});g.gyuwon.years.legacyAnnual=true;g.gyuwon.years.year=year;g.player.invuln=1e6;return g;};
const scene=()=>{const s=new THREE.Scene();s.background=new THREE.Color();s.fog=new THREE.FogExp2();s.add(new THREE.DirectionalLight());return s;};
test('eleven years contain different real architecture and cache each world once',()=>{
 const s=scene(),art=Array.from({length:6},()=>new THREE.MeshBasicMaterial()),world=createGyuwonYearWorld(s,{coarse:true,artMaterials:art});
 try{
  const shapes=new Set();for(let year=1;year<=11;year++){
   const g=game(year);world.update(g,.016);const entry=world.prepare(year);assert.ok(entry.group.visible);
   assert.equal(world.stats().layers[0],year);assert.ok(entry.group.children.some(o=>o.isInstancedMesh||o.isGroup));
   let count=0;entry.group.traverse(o=>{if(o.isInstancedMesh)count+=o.count;});shapes.add(count);
  }
  assert.ok(shapes.size>=9,'worlds must differ in geometry, not just a colour');
  assert.ok(s.getObjectByName('gyuwon-sliding-bookcase'));
  assert.equal(world.prepare(6).wards.length,6);assert.equal(world.prepare(8).tentacles.length,8);
  assert.ok(s.getObjectByName('gyuwon-world-acrylic-character-5'));
  const before=world.stats().batches;for(let y=1;y<=11;y++)world.update(game(y),.01);
  assert.equal(world.stats().built,11);assert.equal(world.stats().batches,before);
 }finally{world.dispose();art.forEach(m=>m.dispose());}
 assert.equal(s.getObjectByName('gyuwon-eleven-lived-worlds'),undefined);
});
test('grade scene collapses the old world and raises the next before control resumes',()=>{
 const world=createGyuwonYearWorld(scene(),{coarse:true}),g=game(2),e=g.gyuwon.years;
 try{
  resolveGyuwonExamGrade(g,.9);e.gradeT=1.8;world.update(g,.016);
  assert.deepEqual(world.stats().layers,[2,3]);assert.ok(world.prepare(2).group.position.y<0);assert.ok(world.prepare(3).group.position.y<0);
  e.gradeT=2.999;world.update(g,.016);assert.ok(world.prepare(3).group.position.y>-.001);
  stepGyuwon(g,.02);world.update(g,.02);assert.equal(e.year,3);assert.deepEqual(world.stats().layers,[3]);assert.equal(world.prepare(3).group.position.y,0);
 }finally{world.dispose();}
});
test('broken shrines permanently collapse their matching shop wing within that life',()=>{
 const world=createGyuwonYearWorld(scene(),{coarse:true}),g=game(6);
 try{
  startGyuwonYearCast(g,'ultimateShrine');g.gyuwon.years.wards[2].hp=0;
  for(let i=0;i<90;i++)world.update(g,1/60);
  const entry=world.prepare(6);assert.ok(entry.wards[2].group.position.y<-6);assert.ok(Math.abs(entry.wards[1].group.position.y)<1e-9);
  g.gyuwon.years.wards=[];world.update(g,.016);assert.ok(entry.wards[2].group.position.y<-6);
  world.update(game(6),.016);assert.ok(Math.abs(entry.wards[2].group.position.y)<1e-9,'retry must restore destroyed wings');
 }finally{world.dispose();}
});
test('endless years choose stable distinct fused worlds without mutating attack randomness',()=>{
 const sets=new Set();for(let year=12;year<40;year++){const a=annualWorldLayers(year,42);assert.equal(a.length,2);assert.notEqual(a[0],a[1]);assert.ok(a.every(x=>x>=1&&x<=11));assert.deepEqual(a,annualWorldLayers(year,42));sets.add(a.join(','));}assert.ok(sets.size>12);
 const g=game(14),before=JSON.stringify(g),world=createGyuwonYearWorld(scene(),{coarse:true});try{world.update(g,.016);assert.equal(JSON.stringify(g),before);}finally{world.dispose();}
});
test('endless nightmare keeps its physical floor aligned despite the surrounding distortion',()=>{
 const g=game(15),world=createGyuwonYearWorld(scene(),{coarse:true});
 try{startGyuwonYearCast(g,'nightmare365');g.gyuwon.years.castT=18;world.update(g,.016);assert.ok(world.stats().layers.includes(11));assert.equal(world.prepare(11).group.rotation.y,0);}
 finally{world.dispose();}
});
test('OMR floor folds carry feet, block raised edges, and share their real slam footprint',()=>{
 const g=game(11);startGyuwonYearCast(g,'nightmare365');const e=g.gyuwon.years;
 const hits=g.gyuwon.hazards.filter(h=>h.visual==='year-omr-floor');assert.equal(hits.length,2);
 e.castT=17.99;assert.ok(omrFloorAngle(g)>.45);assert.ok(annualFloorHeight(g,18,0)>1);
 assert.equal(annualFloorHeight(g,0,0),0);assert.equal(annualFloorHeight(g,18,23),0);
 assert.deepEqual(resolveAnnualWorldMotion(g,{x:15.5,z:0},{x:15.7,z:0}),{x:15.5,z:0});
 g.player.x=18;g.player.z=0;stepGyuwon(g,.02);assert.ok(g.player.floorY>1);
 g.boss.x=18;g.boss.z=0;stepGyuwon(g,.01);assert.ok(g.boss.floorY>1);assert.ok(gyuwonHurtShapes(g).find(h=>h.id==='anatomical-head').y>4);
 e.castT=19.5;assert.equal(annualFloorHeight(g,18,0),0);assert.ok(hits.every(h=>h.warn===19.5&&h.life>0));
 assert.equal(hazardContains(hits[1],{x:18,z:0}),true);assert.equal(hazardContains(hits[1],{x:0,z:0}),false);
 const world=createGyuwonYearWorld(scene(),{coarse:true});try{world.update(g);const hinge=world.prepare(11).folds[1];assert.ok(Math.abs(hinge.group.rotation.z)<1e-9);}finally{world.dispose();}
});
test('ranged weapons release at the actual height of the folded floor',()=>{
 const g=createGyuwonGame('bow',{yearMode:true});g.player.floorY=1.7;
 assert.ok(spawnPlayerProjectiles(g,{projectileCount:1,yaw:0,mult:1},{projectile:true,damage:10,poise:1}));
 assert.equal(g.projectiles[0].y,2.9);
});
test('progressive preparation yields, preserves scene state, and leaves no active world',async()=>{
 const s=scene(),world=createGyuwonYearWorld(s,{coarse:true}),camera=new THREE.PerspectiveCamera();let target=null,yields=0;
 const renderer={getRenderTarget:()=>target,setRenderTarget:t=>target=t,compile(){assert.equal(target,null);},render(){},outputColorSpace:THREE.SRGBColorSpace};
 try{await world.prewarmProgressive(renderer,camera,{yieldFrame:async()=>{yields++;assert.equal(target,null);}});assert.ok(yields>11);assert.equal(world.stats().built,11);assert.equal(world.stats().prewarmed,true);assert.equal(world.stats().layers.length,0);}
 finally{world.dispose();}
});
test('closing during progressive preparation stops later allocations',async()=>{
 const world=createGyuwonYearWorld(scene(),{coarse:true});let compiles=0;
 await world.prewarmProgressive({compile(){compiles++;}},new THREE.PerspectiveCamera(),{yieldFrame:async()=>world.dispose()});
 assert.equal(compiles,0);assert.equal(world.stats().built,0);
});
test('waves clear the horizon fog and camera cutaway is reserved for the perimeter',async()=>{
 const s=scene(),world=createGyuwonYearWorld(s,{coarse:true}),g=game(5),camera=new THREE.PerspectiveCamera();
 try{
  await world.prewarmProgressive({compile(){}},camera,{yieldFrame:async()=>{}});
  startGyuwonYearCast(g,'sewageWave');world.update(g,.016);assert.ok(s.fog.density<=.0035);
  camera.position.set(0,7,23);world.setCamera(camera);s.onBeforeRender({},s,camera);assert.equal(world.stats().cutaway.meshes,0);s.onAfterRender();
  camera.position.z=38;world.setCamera(camera);s.onBeforeRender({},s,camera);assert.ok(world.stats().cutaway.meshes>0);s.onAfterRender();
 }finally{world.dispose();}
});
test('a close collectible cannot obscure the player, and clears again when moving away',()=>{
 const root=new THREE.Group(),fx=createGyuwonYearsFx(root,{coarse:true}),g=game(6),camera=new THREE.PerspectiveCamera();
 try{camera.position.set(0,7,23);g.player.x=0;g.player.z=14;startGyuwonYearCast(g,'photocard');fx.update(g);fx.occlude(camera,g);
  const art=root.getObjectByName('gyuwon-2d-anime-girl-illustration');assert.ok(art.material.opacity<.5);
  g.player.x=20;fx.occlude(camera,g);assert.equal(art.material.opacity,1);
 }finally{fx.dispose();}
});
