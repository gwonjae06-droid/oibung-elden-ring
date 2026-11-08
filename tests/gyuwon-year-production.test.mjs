import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {gyuwonYearRoster,GYUWON_YEAR_PATTERNS,GYUWON_MIN_TELEGRAPH,
 startGyuwonYearCast,GYUWON_SUBJECT_SECONDS} from '../src/gyuwon-years.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {gyuwonYearCuePhase} from '../src/gyuwon-year-cues.mjs';
import {hazardContains} from '../src/gyuwon-data.mjs';

function game(year=1){const g=createGyuwonGame('sword',{yearMode:true,seed:42});
 g.player.invuln=10000;g.gyuwon.years.year=year;g.gyuwon.years.mode='combat';
 g.boss.phase=year>=9?3:1;g.gyuwon.stageMemory='sword';
 return g;}
test('every year-specific attack has a visible anticipation preceding its first possible damage',()=>{
 for(let year=1;year<=11;year++)for(const id of gyuwonYearRoster(year)){
  const g=game(year);
  assert.ok(startGyuwonYearCast(g,id),String(id));
  assert.equal(g.gyuwon.years.cast,id);
  assert.ok(g.gyuwon.hazards.length>=1,String(id));
  for(const h of g.gyuwon.hazards){
   assert.ok(h.warn>=GYUWON_MIN_TELEGRAPH-.001,'short/no cue '+year+'/'+id+' '+h.warn);
   assert.ok(h.life>0&&h.damage>0,year+'/'+id);
   assert.equal(h.age,0);
   assert.ok(h.warn+h.life<=GYUWON_YEAR_PATTERNS[id][0]+.2,
    'hazard outlives visible attack '+year+'/'+id);
  }
 }
});

test('the examination subject cadence still gives at least one second of warning',()=>{
 const g=game();g.gyuwon.years.cast=null;g.gyuwon.years.recover=0;
 g.gyuwon.years.season=30;
 stepGyuwon(g,.03);
 assert.equal(g.gyuwon.years.mode,'exam');
 assert.ok(GYUWON_SUBJECT_SECONDS===1.8);
 for(const h of g.gyuwon.hazards)assert.ok(h.warn>=GYUWON_MIN_TELEGRAPH-.001);
});

test('rifle warning, ballistics and physical muzzle center share one aim vector',()=>{
 const g=game(4);startGyuwonYearCast(g,'sniper');
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 fx.update(g);
 const tracer=stage.getObjectByName('gyuwon-rifle-physical-tracer');
 assert.ok(tracer,'missing visible rifle cue');
 for(const h of g.gyuwon.hazards){
  const dx=(h.x-h.muzzleX),dz=(h.z-h.muzzleZ);
  assert.ok(Math.abs(Math.atan2(dx,dz)-h.yaw)<1e-6);
  assert.ok(Math.abs(Math.hypot(dx,dz)*2-h.length)<.001);
  const mid={x:h.x,z:h.z};
  assert.equal(hazardContains(h,mid),true);
 }
 fx.dispose();
});

test('seventh-year donation is a physical six-way exam gacha, never a translucent danger cone',()=>{
 const g=game(7);startGyuwonYearCast(g,'donation');
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 fx.update(g);
 assert.ok(stage.getObjectByName('gyuwon-seven-year-broadcast-studio'));
 const roulette=stage.getObjectByName('gyuwon-seven-year-suneung-gacha-roulette');
 assert.ok(roulette?.visible);
 assert.equal(fx.stats().gachaSectors,6);
 assert.ok(g.gyuwon.hazards.every(h=>h.shape==='circle'&&h.visual==='year-gacha-prize'));
 assert.ok(g.gyuwon.hazards.every(h=>h.warn>=3),'the outcome must be readable before prize impact');
 assert.equal(stage.getObjectByName('gyuwon-live-cone-surface'),undefined);
 fx.dispose();
});

test('eight suction-cup rigs and each attack center use the same orientation and 15m reach',()=>{
 const g=game(8);startGyuwonYearCast(g,'octoStrike');
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});fx.update(g);
 const cups=stage.getObjectByName('gyuwon-eight-arm-suction-cups');
 assert.ok(cups?.isInstancedMesh);
 assert.equal(cups.count,8*4*2);
 for(const h of g.gyuwon.hazards){
  assert.ok(Number.isInteger(h.armIndex)&&h.armIndex>=0&&h.armIndex<8);
  assert.ok(Math.abs(h.length-14.5)<1e-6);
  const dist=Math.hypot(h.x-g.boss.x,h.z-g.boss.z);
  assert.ok(Math.abs(dist-7.5)<.001);
 }
 const first=g.gyuwon.hazards[0];first.age=first.warn;fx.update(g);
 assert.ok(cups.instanceMatrix.needsUpdate!==false);
 fx.dispose();
});

test('physical sewage wave opens the same gap as collision and remains fixed in Z profile',()=>{
 const g=game(5);startGyuwonYearCast(g,'sewageWave');
 const wave=g.gyuwon.hazards[0];
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:false});
 fx.update(g);
 const root=stage.getObjectByName('gyuwon-dday-examination-world');
 const body=root.children.filter(x=>x.name==='gyuwon-dday-wave-body');
 assert.equal(body.length,2);
 const gap=wave.opening-.55;
 for(const part of body){part.geometry.computeBoundingBox();
  const bbox=part.geometry.boundingBox;
  assert.ok(Math.abs(bbox.max.z-(wave.depth+.55))<.0001);
  assert.ok(Math.abs(bbox.min.z+(wave.depth+.55))<.0001);
  const xl=part.position.x+bbox.min.x,xr=part.position.x+bbox.max.x;
  assert.ok(xr<=wave.gap-gap+.001||xl>=wave.gap+gap-.001);
 }
 wave.age=wave.warn+2;fx.update(g);
 assert.equal(hazardContains(wave,{x:wave.gap,z:wave.z+2*wave.speed}),false);
 assert.equal(root.getObjectByName('gyuwon-exam-wave-passages').visible,false);
 fx.dispose();
});

test('six high-detail dolls actually descend onto their matching live strike centers',()=>{
 const g=game(6);startGyuwonYearCast(g,'figures');
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:false});fx.update(g);
 const group=stage.getObjectByName('gyuwon-figurines-and-photocards');
 assert.equal(group.children.length,6);
 for(const h of g.gyuwon.hazards)h.age=h.warn;
 fx.update(g);
 for(const fig of group.children){
  assert.ok(Math.abs(fig.position.y)<.01);
  const i=fig.userData.index,angle=i*Math.PI/3;
  assert.ok(Math.abs(fig.position.x-Math.sin(angle)*14)<.001);
  assert.ok(Math.abs(fig.position.z-Math.cos(angle)*14)<.001);
  assert.ok(fig.getObjectByName('gyuwon-2d-anime-girl-illustration'));
 }
 fx.dispose();
});

test('year-nine through eleventh-year battles retain the human face, no old headless god portrait',()=>{
 const stage=new THREE.Group(),actor=createGyuwonActor(stage,{coarse:true});
 const g=game(9);actor.update(g,0,.016);
 assert.equal(stage.getObjectByName('gyuwon-head')?.visible,true);
 assert.equal(stage.getObjectByName('gyuwon-divine-portrait')?.visible,false);
 assert.equal(stage.getObjectByName('gyuwon-final-halo')?.visible,false);
 for(const year of [1,2,3,4,5,6,7,8,9,10,11]){
  g.gyuwon.years.year=year;g.boss.phase=year>=9?3:1;
  actor.update(g,0,.016);
  assert.equal(stage.getObjectByName('gyuwon-head')?.visible,true);
 }
 actor.dispose();
});

test('visual cues activate on and only after the scheduled collision clock',()=>{
 const cue=gyuwonYearCuePhase({warn:1.6,age:1.3,life:.22});
 assert.equal(cue.impact,false);
 assert.ok(cue.windup>.7);
 assert.equal(gyuwonYearCuePhase({warn:1.6,age:1.6,life:.22}).impact,true);
 assert.equal(gyuwonYearCuePhase({warn:1.6,age:1.9,life:.22}).live,false);
});


test('third-year flame uses a continuous crest at its authoritative radius',()=>{
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(3);startGyuwonYearCast(g,'flame');fx.update(g);
 const crest=stage.getObjectByName('gyuwon-continuous-physical-pressure-crest');
 assert.ok(crest?.isMesh);assert.equal(crest.isInstancedMesh,undefined);
 const h=g.gyuwon.hazards[0];h.age=h.warn+.25;fx.update(g);
 const attr=crest.geometry.attributes.position,r=h.r+h.grow*.25;
 for(let i=0;i<attr.count;i++){
  const d=Math.hypot(attr.getX(i),attr.getZ(i));
  assert.ok(d>=r-h.width*.72-.001&&d<=r+h.width*.72+.001);
 }
 fx.dispose();
});

test('rider IK plants both character shoes on raised vehicle pegs, then blends out',()=>{
 const stage=new THREE.Group(),actor=createGyuwonActor(stage,{coarse:true});
 const g=game(1);startGyuwonYearCast(g,'bike');
 actor.update(g,0,.05);actor.update(g,0,.05);actor.update(g,0,.05);
 const shoe=stage.getObjectByName('gyuwon-leather-shoe');
 assert.ok(shoe?.position.y>.30,'bike rider boots must not stay planted on the arena floor');
 g.gyuwon.years.cast=null;
 for(let i=0;i<12;i++)actor.update(g,0,.05);
 assert.ok(shoe.position.y<.26,'shoes should settle back onto the floor after dismounting');
 actor.dispose();
});

