import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,actGyuwon,damageGyuwon,stepGyuwon,
 strikeGyuwonWard} from '../src/gyuwon-combat.mjs';
import {GYUWON_YEAR_PATTERNS,GYUWON_MIN_TELEGRAPH,
 startGyuwonYearCast,resolveGyuwonExamGrade,tickGyuwonYears} from '../src/gyuwon-years.mjs';
import {GYUWON_YEAR_SIGNATURES,GYUWON_SIGNATURE_SPECS,
 GYUWON_NIGHTMARE_BEATS,gyuwonWorldBreak} from '../src/gyuwon-year-signatures.mjs';
import {createGyuwonYearApocalypseFx} from '../src/gyuwon-year-apocalypse-fx.mjs';
import {createGyuwonHazardFx} from '../src/gyuwon-hazard-vfx.mjs';

const make=year=>{
 const g=createGyuwonGame('sword',{seed:42,yearMode:true});
 g.gyuwon.years.year=year;g.gyuwon.years.mode='combat';
 g.gyuwon.stageMemory='sword';g.boss.phase=year>=9?3:1;
 g.player.invuln=10000;return g;
};
test('all eleven years have a separately scheduled physical ultimate and safe warning lead',()=>{
 assert.equal(Object.keys(GYUWON_YEAR_SIGNATURES).length,11);
 for(let year=1;year<=11;year++){
  const id=GYUWON_YEAR_SIGNATURES[year],g=make(year);
  assert.ok(GYUWON_SIGNATURE_SPECS[id],id);
  assert.ok(GYUWON_YEAR_PATTERNS[id],id);
  assert.ok(startGyuwonYearCast(g,id),id);
  assert.equal(g.gyuwon.years.cast,id);
  assert.equal(g.gyuwon.years.signatureUsed,true);
  assert.ok(g.gyuwon.hazards.length>=2,id);
  const latest=Math.max(...g.gyuwon.hazards.map(h=>h.warn+h.life));
  assert.ok(latest<=Math.max(GYUWON_SIGNATURE_SPECS[id][0],g.gyuwon.years.castDuration)+.01,id+' late '+latest);
  for(const h of g.gyuwon.hazards){
   assert.ok(h.warn>=GYUWON_MIN_TELEGRAPH-.001,id+' unreadable');
   assert.ok(h.damage>0&&h.life>0,id);
   assert.ok(h.signature===id,id+' missing timing tag');
  }
 }
});
test('an ultimate is guaranteed once each year without replacing the shuffled regular roster',()=>{
 const g=make(8),e=g.gyuwon.years;
 e.season=9.2;e.day=235;e.recover=0;
 tickGyuwonYears(g,.03,{hurt:()=>{},emit:()=>{}});
 assert.equal(e.cast,'ultimateOctopus');
 assert.equal(e.signatureUsed,true);
 assert.equal(e.year,8);
 assert.equal(e.castCount,1);
});
test('real grade cinematics last 3s and failed exams progressively break the world',()=>{
 const g=make(4),e=g.gyuwon.years;
 assert.ok(gyuwonWorldBreak(11,7)>gyuwonWorldBreak(3,1));
 resolveGyuwonExamGrade(g,.95);
 assert.equal(e.grade,'failure');
 assert.equal(e.failures,1);
 assert.ok(e.worldBreak>0);
 assert.equal(e.resultScene.duration,3);
 assert.equal(e.mode,'result');
 assert.equal(actGyuwon(g,'attack'),false,'no attacking through a non-skippable grade cinematic');
 const hp=g.boss.hp;assert.equal(damageGyuwon(g,123),0);
 assert.equal(g.boss.hp,hp);
 stepGyuwon(g,.05);assert.equal(e.mode,'result');
 e.gradeT=2.98;stepGyuwon(g,.05);
 assert.equal(e.year,5);
 assert.equal(e.mode,'combat');
 assert.equal(e.resultScene,null);
 assert.equal(e.failures,1);
});
test('sixth-year shrine effigies can be physically destroyed and their hitboxes vanish',()=>{
 const g=make(6),e=g.gyuwon.years;
 startGyuwonYearCast(g,'ultimateShrine');
 assert.equal(e.wards.length,6);
 assert.equal(e.wards.filter(w=>w.hp>0).length,6);
 const hp=g.boss.hp;damageGyuwon(g,100);
 assert.ok(Math.abs((hp-g.boss.hp)-78)<.001);
 const w=e.wards[0];
 assert.equal(strikeGyuwonWard(g,w.x,w.z,55),true);
 assert.equal(w.hp,0);
 assert.equal(e.wards.filter(q=>q.hp>0).length,5);
 assert.equal(g.gyuwon.hazards.some(h=>h.wardIndex===0),false);
 for(const q of e.wards)q.hp=0;
 const hp2=g.boss.hp;damageGyuwon(g,100);
 assert.ok(Math.abs((hp2-g.boss.hp)-100)<.001);
});
test('six outcome gachas are distinct, real combat layouts',()=>{
 const layouts=[];
 const g=make(7),e=g.gyuwon.years,seen=new Set();
 for(let result=0;result<6;result++){
  g.time=0;
  startGyuwonYearCast(g,'ultimateGacha');
  seen.add(e.gachaResult);
  const footprints=g.gyuwon.hazards.map(h=>[h.shape,h.visual,Math.round(h.x*10),Math.round(h.z*10)]);
  assert.ok(footprints.every(h=>h[0]==='circle'||h[0]==='ring'));
  layouts.push(JSON.stringify(footprints));
 }
 assert.equal(seen.size,6);
 assert.ok(new Set(layouts).size>=5,'six wheel sectors should visibly diverge');
});
test('eleventh-year nightmare uses ten sequential past selves and a dodgeable finale',()=>{
 const g=make(11),e=g.gyuwon.years;
 assert.equal(GYUWON_NIGHTMARE_BEATS.length,11);
 startGyuwonYearCast(g,'nightmare365');
 assert.equal(e.nightmareUsed,true);
 assert.equal(g.gyuwon.hazards.filter(h=>h.visual!=='year-omr-floor').length,12);assert.equal(g.gyuwon.hazards.filter(h=>h.visual==='year-omr-floor').length,2);
 const strikes=g.gyuwon.hazards.slice(0,11);
 for(let i=1;i<strikes.length;i++){
  assert.ok(strikes[i].warn>strikes[i-1].warn+.8,'past years must fight in sequence');
  assert.ok(strikes[i].warn>=strikes[i-1].warn+strikes[i-1].life,
   'no overlapping unfair impacts');
  assert.equal(strikes[i].nightmareBeat,i);
 }
 assert.equal(strikes[10].shape,'ring');
 const stage=new THREE.Group(),vfx=createGyuwonYearApocalypseFx(stage,{coarse:true});
 vfx.update(g);
 assert.equal(vfx.stats().ghosts,10);
 assert.ok(stage.getObjectByName('gyuwon-365-day-nightmare-ghost-relay')?.visible);
 assert.ok(stage.getObjectByName('gyuwon-progressive-broken-school'));
 vfx.dispose();
});
test('far-future signature beats have no premature triangular or visible floor warnings',()=>{
 const g=make(11),stage=new THREE.Group();
 startGyuwonYearCast(g,'nightmare365');
 const fx=createGyuwonHazardFx(stage,{coarse:true});
 fx.update(g);
 const visible=fx.root.children.filter(x=>x.visible&&x.name==='gyuwon-hazard-fractured-material');
 assert.ok(visible.length<=2);
 assert.ok(fx.root.children.every(x=>x.geometry?.userData.silhouette==='capped-rounded-stone-no-triangle-warnings'));
 fx.dispose();
});

