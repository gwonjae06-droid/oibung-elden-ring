// Legacy-mode regression for retired annual mechanics; the live encounter uses musical genres after year four.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,damageGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {annualFloor,syncAnnualHealth} from '../src/gyuwon-annual-progress.mjs';
import {startGyuwonYearCast,gyuwonYearRoster} from '../src/gyuwon-years.mjs';
import {ARSENAL_PATTERNS,ARSENAL_ROSTERS,ARSENAL_SIGNATURES,arsenalKind} from '../src/gyuwon-arsenal.mjs';
import {hazardPosition,hazardContains} from '../src/gyuwon-data.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createArsenalFx} from '../src/gyuwon-arsenal-view.mjs';
const game=year=>{const g=createGyuwonGame('sword',{yearMode:true,seed:42});g.gyuwon.years.legacyAnnual=true;g.gyuwon.years.year=year;g.boss.hp=g.boss.maxHp*(1-.065*(year-1));g.gyuwon.years.yearStartHp=g.boss.hp;g.player.invuln=1e6;return g;};
const advance=(g,time)=>{for(let t=0;t<time-1e-8;t+=1/120)stepGyuwon(g,1/120);};
test('waiting without damage never advances the HP display or starts an examination',()=>{
 for(const year of [1,5,6,7,8,9,11]){const g=game(year),e=g.gyuwon.years,hp=g.boss.hp;advance(g,90);assert.equal(g.boss.hp,hp);assert.equal(e.year,year);assert.equal(e.day,365);assert.equal(e.season,0);assert.equal(e.mode,'combat');assert.equal(e.signatureUsed,false);}
});
test('the HP threshold finishes the current attack, then enters the exam without a forced signature',()=>{
 const g=game(5),e=g.gyuwon.years;startGyuwonYearCast(g,'hammerCrush');damageGyuwon(g,1e6);assert.equal(g.boss.hp,annualFloor(g));
 advance(g,1);assert.equal(e.mode,'combat');assert.equal(e.cast,'hammerCrush');
 advance(g,4.1);assert.equal(e.mode,'exam');assert.equal(e.signatureUsed,false);
});
test('real HP damage determines progress while idle time and overflow do not',()=>{
 const g=game(6),e=g.gyuwon.years;damageGyuwon(g,g.boss.maxHp*.0325);assert.ok(Math.abs(e.season-24)<1e-8);const day=e.day;
 e.recover=100;advance(g,10);assert.equal(e.day,day);assert.equal(e.mode,'combat');
 g.boss.hp=annualFloor(g);syncAnnualHealth(g);damageGyuwon(g,100);assert.equal(e.day,0);
});
test('only weapon attacks are selected in years five through eight; later rosters stay intact',()=>{
 for(let year=5;year<=8;year++){assert.deepEqual(gyuwonYearRoster(year),ARSENAL_ROSTERS[year]);const g=game(year);
  for(const id of [...ARSENAL_ROSTERS[year],ARSENAL_SIGNATURES[year]]){startGyuwonYearCast(g,id);assert.equal(g.gyuwon.years.weaponPlan.kind,arsenalKind(year));assert.ok(g.gyuwon.hazards.length);assert.ok(g.gyuwon.hazards.every(h=>h.arsenal&&h.warn>=1.05&&h.damage>0));}
 }
 assert.deepEqual(gyuwonYearRoster(9),['recall']);assert.deepEqual(gyuwonYearRoster(10),['recallMix']);assert.deepEqual(gyuwonYearRoster(12),['recallAll']);
});
test('melee approaches have continuous real movement, a warning before contact and a sideways escape',()=>{
 for(const id of ['hammerCrush','swordAdvance'])for(const dodge of [false,true]){
  const g=game(id.startsWith('hammer')?5:6);g.player.z=7;startGyuwonYearCast(g,id);const e=g.gyuwon.years;let prev={...g.boss};
  for(let i=0;i<120;i++){stepGyuwon(g,1/120);assert.ok(Math.hypot(g.boss.x-prev.x,g.boss.z-prev.z)<.25);prev={...g.boss};}
  g.player.invuln=0;if(dodge)g.player.x=10;const hp=g.player.hp;advance(g,1.1);assert.equal(g.player.hp<hp,!dodge);
 }
});
test('cards return through their real outbound corridor and arrows have bounded physical hit radii',()=>{
 const g=game(8);startGyuwonYearCast(g,'cardsReturn');const h=g.gyuwon.hazards[0];h.age=h.warn+.6;const a=hazardPosition(h);h.age=h.warn+2.3;const b=hazardPosition(h);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-8);assert.ok(hazardContains(h,b));assert.equal(hazardContains(h,{x:b.x+3,z:b.z}),false);
});
test('all sixteen weapon casts render actual handheld weapons and reuse effect slots',()=>{
 const scene=new THREE.Group(),actor=createGyuwonActor(scene,{coarse:true}),fx=createArsenalFx(scene);
 try{for(let year=5;year<=8;year++)for(const id of [...ARSENAL_ROSTERS[year],ARSENAL_SIGNATURES[year]]){
  const g=game(year);startGyuwonYearCast(g,id);advance(g,1.2);actor.update(g,0,.05);fx.update(g);
  const rig=scene.getObjectByName(year===7?'gyuwon-fourth-year-bow-rig':'gyuwon-arsenal-'+arsenalKind(year));assert.ok(rig?.visible,id);
  let meshes=0;rig.traverse(x=>{if(x.isMesh)meshes++;});assert.ok(meshes>0,id+' has physical geometry');
  scene.updateMatrixWorld(true);scene.traverseVisible(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),id+'/'+o.name+' has finite joint transforms'));
  const slots=fx.stats().pooled;fx.update(g);assert.equal(fx.stats().pooled,slots);
 }
 }finally{actor.dispose();fx.dispose();}
});
