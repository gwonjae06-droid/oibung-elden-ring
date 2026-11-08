import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardPosition,bloodHazardFootprint,hazardContains} from '../src/blood-data.mjs';
import {SERAPH_CANONICAL_PATTERNS} from '../src/blood-seraph-doctrine.mjs';
import {createBloodSeraph} from '../src/blood-seraph.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';

const sample=(name)=>{
 const g=createBloodGame('sword',{seed:2921});
 g.boss.phase=3;g.boss.state='recovery';g.blood.seraphAwakened=true;
 g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
 g.player.invuln=100000;g.player.hp=g.player.maxHp=100000;
 assert.equal(startBloodPattern(g,name),true,name);
 return g;
};

test('the live 3P deck contains ONLY six distinct blood-angel weapons plus the signature finale',()=>{
 assert.deepEqual(bloodPool(3),[...SERAPH_CANONICAL_PATTERNS,'seraphFinale']);
 assert.equal(new Set(bloodPool(3)).size,7);
 const phaseOne=new Set(bloodPool(1)),phaseTwo=new Set(bloodPool(2));
 for(const name of SERAPH_CANONICAL_PATTERNS){
  assert.equal(phaseOne.has(name)||phaseTwo.has(name),false,name);
  assert.equal(BLOOD_PATTERNS[name].phase,3);
  assert.equal(!!BLOOD_PATTERNS[name].air,false,'ordinary combat retains a targetable body');
 }
 for(const retired of ['seraphWings','seraphPulse','seraphLances','seraphCrown',
  'seraphGaze','seraphFeathers','seraphEmbrace','seraphDescent']){
  assert.ok(!bloodPool(3).includes(retired),retired+' must not repeat 1P/2P concepts');
 }
});

test('the crimson face cannon really rotates left-to-right and only damages its LIVE ray',()=>{
 const g=sample('seraphSweep'),h=g.blood.hazards[0];
 assert.equal(g.blood.hazards.length,1);
 assert.equal(h.seraphAngularSweep,true);
 assert.ok(h.warn>=1&&h.life>=3);
 const start=hazardPosition(h);
 assert.ok(Math.abs(start.yaw-h.yawStart)<1e-6);
 assert.equal(hazardContains(h,{x:start.x,z:start.z}),true);
 h.age=h.warn+h.life*.5;
 const middle=hazardPosition(h),f=bloodHazardFootprint(h);
 assert.ok(middle.yaw>start.yaw+.9);
 assert.ok(Math.abs(f.yaw-middle.yaw)<1e-8);
 assert.equal(hazardContains(h,{x:middle.x,z:middle.z}),true);
 assert.ok(!hazardContains(h,{x:-middle.x,z:-middle.z}),
  'opposite side of the arena must not take invisible ray damage');
 h.age=h.warn+h.life;
 const end=hazardPosition(h);
 assert.ok(end.yaw>middle.yaw+.9);
});

test('the wing-disc leaves the map and crosses FOUR distinct warned lanes',()=>{
 const g=sample('seraphWingCross'),hs=g.blood.hazards;
 assert.equal(hs.length,4);
 assert.deepEqual(hs.map(h=>h.pass),[0,1,2,3]);
 assert.ok(hs.every(h=>Math.abs(h.x)>32&&h.shape==='lane'));
 assert.ok(hs.every(h=>h.warn>=1.2&&h.life>.7));
 assert.ok(hs.every((h,i)=>i===0||h.warn-hs[i-1].warn>.75));
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  hs[0].age=hs[0].warn-.5;
  rig.update(g,bloodTransformation(g),.12);
  assert.ok(rig.stats().warningGuides>=1,'warning must precede the actual passing disc');
  assert.equal(rig.stats().wingWheelVisible,true);
  hs[0].age=hs[0].warn+.16;
  rig.update(g,bloodTransformation(g),.12);
  assert.equal(rig.stats().wingWheelVisible,true);
  const m=scene.getObjectByName('blood-seraph-independent-crossing-wings');
  assert.ok(m&&m.visible);
  assert.ok(m.position.x>-37&&m.position.x<37);
 }finally{rig.dispose();}
});

test('the blood pillars converge in four ordered ranks but STOP outside the caster',()=>{
 const g=sample('seraphInwardPillars'),hs=g.blood.hazards;
 assert.equal(hs.length,12);
 assert.deepEqual([...new Set(hs.map(h=>h.rank))],[0,1,2,3]);
 assert.ok(hs.every(h=>h.shape==='circle'&&h.damage>0&&h.warn>=1));
 for(let rank=0;rank<4;rank++){
  const group=hs.filter(h=>h.rank===rank),avg=group.reduce((s,h)=>s+Math.hypot(h.x-g.boss.x,h.z-g.boss.z),0)/3;
  assert.equal(group.length,3);
  if(rank){const prev=hs.filter(h=>h.rank===rank-1),last=prev.reduce((s,h)=>s+Math.hypot(h.x-g.boss.x,h.z-g.boss.z),0)/3;
   assert.ok(avg<last,rank+' must get closer to Baeseojun');
   assert.ok(group[0].warn>prev[0].warn);
  }
  assert.ok(avg>8,'no column should erupt directly on his body');
 }
});

test('the frantic face cannon fires eleven distinct warned rays, without all warning at once',()=>{
 const g=sample('seraphFrenzy'),hs=g.blood.hazards;
 assert.equal(hs.length,11);
 assert.ok(hs.every(h=>h.shape==='lane'&&h.seraphCue==='frenzy'&&h.warn>1));
 assert.equal(bloodFloorField(g)?.hazards.length,0,
  'the floor must not display eleven future shots simultaneously');
 hs[0].age=hs[0].warn-.65;
 const field=bloodFloorField(g);
 assert.ok(field&&field.hazards.length===1,'only the imminent shot may be marked');
 hs[0].age=hs[0].warn+.08;
 assert.equal(field.hazards.length,1);
});

test('celestial wheels and martyr-rose have different movement and hitbox geometries',()=>{
 const halos=sample('seraphHaloProcession').blood.hazards;
 assert.equal(halos.length,4);
 assert.ok(halos.every(h=>h.shape==='ring'&&Math.abs(h.vx)>0));
 const petals=sample('seraphBloodRosette').blood.hazards;
 assert.equal(petals.length,6);
 assert.ok(petals.every(h=>h.shape==='cone'&&h.innerR>6&&h.arc<.3));
 assert.ok(petals.every((h,i)=>i===0||h.warn>petals[i-1].warn));
});
