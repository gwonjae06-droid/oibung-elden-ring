import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {gyuwonYearRoster,startGyuwonYearCast,GYUWON_SUBJECT_SECONDS} from '../src/gyuwon-years.mjs';
import {createGyuwonHazardFx,gyuwonHazardFootprint} from '../src/gyuwon-hazard-vfx.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {createGyuwonSpectacle} from '../src/gyuwon-spectacle.mjs';

function game(year){
 const g=createGyuwonGame('sword',{yearMode:true,seed:14});
 g.gyuwon.years.year=year;g.gyuwon.years.mode='combat';
 g.boss.phase=year>=9?3:1;g.gyuwon.stageMemory='sword';
 g.player.invuln=1000;return g;
}
test('the shared Gyuwon renderer never draws a pointed triangular hazard panel in any year',()=>{
 const stage=new THREE.Group(),fx=createGyuwonHazardFx(stage,{coarse:true});
 for(let year=1;year<=11;year++)for(const attack of gyuwonYearRoster(year)){
  const g=game(year);
  assert.ok(startGyuwonYearCast(g,attack));
  fx.update(g);
  const bodies=fx.root.children.filter(o=>o.name==='gyuwon-hazard-fractured-material');
  const expected=g.gyuwon.hazards.filter(h=>h.shape!=='wave');
  assert.equal(bodies.length,expected.length,year+'/'+attack);
  for(const mesh of bodies){
   const geo=mesh.geometry,pos=geo.attributes.position;
   assert.equal(geo.userData.silhouette,'capped-rounded-stone-no-triangle-warnings');
   assert.ok(pos.count>=288,'the surface is a capped solid, not a single 3-vertex flat piece');
   assert.ok(mesh.material.transparent);
   const max=Math.min(8*36,pos.count),highest=Math.max(...Array.from({length:max},
    (_,i)=>pos.getY(i)));
   const top=new Set();
   for(let i=0;i<max;i++)if(Math.abs(pos.getY(i)-highest)<.0001)
    top.add(pos.getX(i).toFixed(3)+','+pos.getZ(i).toFixed(3));
   assert.ok(top.size>=8,'the visible top must be an octagonal cap, never a triangle apex');
  }
  for(const h of expected){
   const f=gyuwonHazardFootprint(h);
   assert.ok(f&&Number.isFinite(f.x)&&Number.isFinite(f.z));
  }
 }
 fx.dispose();
 assert.equal(stage.getObjectByName('gyuwon-physical-rupture-cues'),undefined);
});
test('all five exam subjects cause no attack warnings or damage',()=>{
 const stage=new THREE.Group(),fx=createGyuwonHazardFx(stage,{coarse:true});
 const g=game(1),e=g.gyuwon.years;
 e.season=48;e.signatureUsed=true;e.cast=null;e.recover=0;
 stepGyuwon(g,.03);assert.equal(e.mode,'exam');
 for(let i=0;i<5;i++){
  fx.update(g);assert.equal(g.gyuwon.hazards.length,0);
  assert.equal(fx.stats().liveHazards,0);
  if(i<4){e.subjectT=GYUWON_SUBJECT_SECONDS-.01;stepGyuwon(g,.03);}
 }
 fx.dispose();
});
test('third-year fire is no longer part of the roster',()=>{
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(3);startGyuwonYearCast(g,'letters');fx.update(g);
 assert.ok(!gyuwonYearRoster(3).includes('flame'));
 assert.equal(startGyuwonYearCast(g,'flame'),false);
 fx.dispose();
});
test('retrying with a different game never reuses the previous hazard silhouette',()=>{
 const stage=new THREE.Group(),fx=createGyuwonHazardFx(stage,{coarse:true});
 const first=game(7),second=game(8);
 startGyuwonYearCast(first,'donation');fx.update(first);
 const old=fx.root.children[0];
 assert.ok(old);
 startGyuwonYearCast(second,'octoStrike');fx.update(second);
 assert.ok(fx.stats().liveHazards>0);
 assert.ok(fx.root.children.every(m=>m!==old),'all old geometry is disposed on retry');
 fx.dispose();
});

