import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon,strikeGyuwonWard} from '../src/gyuwon-combat.mjs';
import {startGyuwonYearCast,resolveGyuwonExamGrade,gyuwonYearTitle,
 GYUWON_YEAR_PATTERNS,GYUWON_YEAR_SECONDS,GYUWON_SUBJECT_SECONDS} from '../src/gyuwon-years.mjs';
import {GYUWON_NIGHTMARE_BEATS} from '../src/gyuwon-year-signatures.mjs';
import {hazardPosition,hazardContains} from '../src/gyuwon-data.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {gyuwonHurtShapes} from '../src/boss-hit-regions.mjs';
import {GYUWON_RIFLE_SOCKET,gyuwonWeaponPose,tentacleYaw} from '../src/gyuwon-year-choreography.mjs';
const make=(year=1,seed=42)=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed});g.player.invuln=1e5;
 g.gyuwon.years.year=year;g.player.z=9;return g;
};
const tick=(g,seconds)=>{for(let i=0;i<Math.round(seconds*120);i++)stepGyuwon(g,1/120);};
test('authored 48 + 9 + 3 cycle and grade thresholds are exact',()=>{
 assert.equal(GYUWON_YEAR_SECONDS,48);assert.equal(GYUWON_SUBJECT_SECONDS*5,9);
 for(const [r,expected]of [[.299999,'great'],[.3,'normal'],[.699999,'normal'],[.7,'failure']]){
  const g=make();resolveGyuwonExamGrade(g,r);assert.equal(g.gyuwon.years.grade,expected);
  assert.equal(g.gyuwon.years.resultScene.duration,3);
 }
});
test('n수 continues counting years and schedules a new nightmare after every exam',()=>{
 const g=make(11),e=g.gyuwon.years;
 for(const year of [12,13,14]){
  resolveGyuwonExamGrade(g,.5);tick(g,3.01);assert.equal(e.year,year);
  assert.equal(gyuwonYearTitle(e.year),'n수');assert.equal(e.signatureUsed,false);
  e.recover=0;e.season=9.3;stepGyuwon(g,.02);
  assert.equal(e.cast,'nightmare365');assert.equal(e.signatureUsed,true);
 }
});
test('vehicle collision, actor position and jump all use the same continuous round-arena route',()=>{
 for(const id of ['bike','scooter','ultimateBike','ultimateScooter']){
  const g=make(),e=g.gyuwon.years;startGyuwonYearCast(g,id);
  const hits=g.gyuwon.hazards.filter(h=>h.visual==='year-vehicle');
  assert.equal(hits.length,id==='ultimateBike'?4:id==='ultimateScooter'?5:1);
  let previous={x:g.boss.x,z:g.boss.z};
  for(let t=0;t<e.rideTrack.at(-1).end;t+=1/120){
   stepGyuwon(g,1/120);
   assert.ok(Math.hypot(g.boss.x,g.boss.z)<=27.01);
   assert.ok(Math.hypot(g.boss.x-previous.x,g.boss.z-previous.z)<1,'no cast-local teleports');
   for(const h of g.gyuwon.hazards.filter(h=>h.rideSegment&&h.age>=h.warn&&h.age<h.warn+h.life)){
    const p=hazardPosition(h);assert.ok(Math.hypot(p.x-g.boss.x,p.z-g.boss.z)<1e-6);
    assert.equal(hazardContains(h,g.boss),true);
   }
   previous={x:g.boss.x,z:g.boss.z};
  }
 }
});
test('four giant textbooks hit the identical footprint only after leaning down',()=>{
 const g=make(3),stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 startGyuwonYearCast(g,'ultimateSmoke');assert.equal(g.gyuwon.hazards.length,4);
 const h=g.gyuwon.hazards[0];assert.equal(h.shape,'topple');
 h.age=h.warn-.2;fx.update(g);
 const pivot=stage.getObjectByName('gyuwon-textbook-hinge');assert.ok(pivot.rotation.x<Math.PI/2);
 h.age=h.warn;fx.update(g);assert.ok(Math.abs(pivot.rotation.x-Math.PI/2)<1e-6);
 assert.equal(hazardContains(h,{x:h.x,z:h.z}),true);
 assert.equal(hazardContains(h,{x:h.x+Math.cos(h.yaw)*4,z:h.z-Math.sin(h.yaw)*4}),false);
 fx.dispose();
});
test('rifle points horizontally and its physical muzzle matches the authoritative ray',()=>{
 const g=make(4),scene=new THREE.Group(),actor=createGyuwonActor(scene,{coarse:true});
 startGyuwonYearCast(g,'sniper');
 for(let i=0;i<185;i++){stepGyuwon(g,1/120);actor.update(g,0,1/120);}
 scene.updateMatrixWorld(true);
 const gun=scene.getObjectByName('gyuwon-fourth-year-rifle-rig');
 const direction=new THREE.Vector3(0,0,1).transformDirection(gun.matrixWorld);
 assert.ok(Math.abs(direction.y)<.01,'barrel must not point into the sky');
 assert.ok(Math.abs(Math.atan2(direction.x,direction.z)-g.boss.yaw)<.01);
 const muzzle=gun.localToWorld(new THREE.Vector3(0,.025,2.795));
 const h=g.gyuwon.hazards[0];
 assert.ok(Math.hypot(muzzle.x-h.muzzleX,muzzle.z-h.muzzleZ)<.04);
 assert.ok(Math.abs(muzzle.y-GYUWON_RIFLE_SOCKET.height)<.02);
 actor.dispose();
});
test('all ranged casts have mutually exclusive props and each arrow reloads independently',()=>{
 for(const id of ['sniper','archery','crossfire','ultimateMarksman','nightmare365']){
  const g=make(4);startGyuwonYearCast(g,id);
  for(let t=0;t<GYUWON_YEAR_PATTERNS[id][0];t+=.025){
   g.gyuwon.years.castT=t;for(const h of g.gyuwon.hazards)h.age=t;
   const pose=gyuwonWeaponPose(g.gyuwon.years,g.gyuwon.hazards);
   assert.ok(!(pose.rifle&&pose.bow),id+'/'+t);
  }
 }
 const g=make(4);startGyuwonYearCast(g,'archery');
 for(const h of g.gyuwon.hazards){
  for(const p of g.gyuwon.hazards)p.age=h.warn-.02;
  assert.ok(gyuwonWeaponPose(g.gyuwon.years,g.gyuwon.hazards).draw>.95);
 }
});
test('breaking every ward cancels each shrine projectile and earns a full groggy window',()=>{
 const g=make(6),e=g.gyuwon.years;startGyuwonYearCast(g,'ultimateShrine');
 const cards=g.gyuwon.hazards.filter(h=>h.wardIndex!==undefined);
 assert.equal(new Set(cards.map(h=>h.wardIndex)).size,6);
 for(const ward of e.wards)assert.equal(strikeGyuwonWard(g,ward.x,ward.z,52),true);
 assert.equal(e.cast,null);assert.equal(g.gyuwon.hazards.length,0);
 assert.equal(g.gyuwon.stun,3);assert.equal(g.boss.state,'recovery');
 tick(g,1);assert.equal(e.cast,null);assert.ok(g.gyuwon.stun>1.9);
});
test('inquiry grants three actual bounded benefits without invisible attack hazards',()=>{
 const seen=new Set();
 for(let seed=1;seed<=40;seed++){
  const g=make(2,seed*1234567),e=g.gyuwon.years;g.boss.hp=g.boss.maxHp*.5;
  e.season=GYUWON_YEAR_SECONDS;e.signatureUsed=true;e.recover=0;stepGyuwon(g,.01);
  for(let i=0;i<4;i++){e.subjectT=1.79;stepGyuwon(g,.02);}
  assert.equal(e.subject,4);assert.ok(g.gyuwon.hazards.every(h=>h.examShot));seen.add(e.inquiry);
  if(e.inquiry==='attack')assert.equal(e.attackBuff,5);
  if(e.inquiry==='speed')assert.equal(e.speedBuff,3);
  if(e.inquiry==='heal')assert.ok(Math.abs(g.boss.hp/g.boss.maxHp-.51)<1e-9);
 }
 assert.deepEqual([...seen].sort(),['attack','heal','speed']);
});
test('sweeping tentacle and collision turn through the same angle',()=>{
 const g=make(8);startGyuwonYearCast(g,'octoSweep');const h=g.gyuwon.hazards[0];
 const angles=[];
 for(const u of [0,.5,1]){h.age=h.warn+h.life*u;const a=tentacleYaw(h);angles.push(a);
  const point={x:h.originX+Math.sin(a)*10,z:h.originZ+Math.cos(a)*10};
  assert.equal(hazardContains(h,point),true);
 }
 assert.ok(angles[0]<angles[1]&&angles[1]<angles[2]);
});
test('nightmare has the requested textbook beat, non-overlapping strikes and a broad finale',()=>{
 const g=make(11);startGyuwonYearCast(g,'nightmare365');
 assert.equal(GYUWON_NIGHTMARE_BEATS[2],'bookfall');
 assert.equal(g.gyuwon.hazards[2].visual,'year-bookfall');
 for(let i=1;i<11;i++)assert.ok(g.gyuwon.hazards[i].warn>=g.gyuwon.hazards[i-1].warn+g.gyuwon.hazards[i-1].life);
 const last=g.gyuwon.hazards.findLast(h=>h.shape==='ring');assert.ok(last.r+last.grow*last.life>25);assert.equal(g.gyuwon.hazards.at(-1).visual,'year-final-omr');
});
test('year-mode keeps the visible human head targetable after year nine',()=>{
 for(const year of [9,10,11,18]){const g=make(year);g.boss.phase=3;
  assert.ok(gyuwonHurtShapes(g).some(h=>h.id==='anatomical-head'));
 }
});

