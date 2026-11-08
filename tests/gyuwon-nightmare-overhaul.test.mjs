import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,damageGyuwon,stepGyuwon,actGyuwon,strikeGyuwonWard} from '../src/gyuwon-combat.mjs';
import {annualFloor,annualBudget,applyAnnualCarry,annualDisplay} from '../src/gyuwon-annual-progress.mjs';
import {startGyuwonYearCast,GYUWON_YEAR_SECONDS,gyuwonMapInterval} from '../src/gyuwon-years.mjs';
import {GYUWON_YEAR_SIGNATURES} from '../src/gyuwon-year-signatures.mjs';
import {resolveAnnualProjectileCover} from '../src/gyuwon-nightmare-mechanics.mjs';
import {hazardPosition,hazardContains} from '../src/gyuwon-data.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {gyuwonMusicSection} from '../src/gyuwon-music.mjs';
import {bossTrack} from '../src/boss-tracks.mjs';

const make=(year=1,weapon='sword')=>{const g=createGyuwonGame(weapon,{yearMode:true,seed:811});g.gyuwon.years.year=year;g.player.invuln=1e7;return g;};
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)stepGyuwon(g,1/60);};

test('unlimited damage cannot skip any annual signature or kill through the last answer',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=make(1,weapon),seen=new Set();
  for(let i=0;i<45000&&g.status==='playing';i++){
   damageGyuwon(g,1e6);stepGyuwon(g,.025);
   for(const e of g.events)if(e.type==='gyuwon-warning')seen.add(e.pattern?.slice(5));
   g.events.length=0;
   if(!g.gyuwon.years.endingUnlocked)assert.ok(g.boss.hp>0);
  }
  assert.equal(g.status,'won',weapon);assert.equal(g.gyuwon.years.year,11);
  for(const id of Object.values(GYUWON_YEAR_SIGNATURES))assert.ok(seen.has(id),weapon+'/'+id);
 }
});

test('ordinary weapon actions, ammo and stamina keep advancing all eleven years',()=>{
 const random=Math.random;Math.random=()=>.5;
 try{for(const weapon of ['sword','hammer','bow','cards']){
  const g=make(1,weapon),years=new Set(),signatures=new Set();
  // Isolate progression from survival: shared real attack/reload/resource code,
  // with a stationary target follower and invulnerable QA player.
  for(let i=0;i<72000&&g.status==='playing';i++){
   years.add(g.gyuwon.years.year);
   const d=Math.hypot(g.boss.x,g.boss.z),reach=weapon==='bow'||weapon==='cards'?8:2.8;g.player.x=g.boss.x-(d?g.boss.x/d:0)*reach;g.player.z=g.boss.z-(d?g.boss.z/d:-1)*reach;
   actGyuwon(g,'light');stepGyuwon(g,1/60);
   for(const e of g.events)if(e.type==='gyuwon-warning')signatures.add(e.pattern?.slice(5));
   g.events.length=0;
   if(g.gyuwon.years.year>=12)break;
  }
  assert.equal(years.has(11),true,weapon);assert.ok(g.stats.hits>30,weapon);
  for(const id of Object.values(GYUWON_YEAR_SIGNATURES))assert.ok(signatures.has(id),weapon+'/'+id);
 }}finally{Math.random=random;}
});

test('annual HP floor converts overflow to visibly faster D-day instead of immunity',()=>{
 const g=make(),max=g.boss.maxHp,e=g.gyuwon.years,budget=annualBudget(g);
 const first=damageGyuwon(g,max*100),dayAfterFirst=e.day;
 assert.equal(g.boss.hp,annualFloor(g));
 assert.ok(Math.abs(e.damageBank-budget*.5)<1e-8);
 assert.ok(first>max*.0975,'extra impact is accepted as calendar pressure');
 assert.ok(dayAfterFirst<365&&e.season>0,'a heavy hit visibly advances the day counter');
 const after=damageGyuwon(g,120),dayAfterSecond=e.day;
 assert.ok(after>0,'another hit at the HP floor is not ignored');
 assert.ok(dayAfterSecond<dayAfterFirst,'extra hits advance the actual displayed time');
 assert.equal(g.boss.hp,annualFloor(g),'the next year is still protected');
 assert.equal(e.damageBank,budget*.5,'overflow is not banked twice');
 g.gyuwon.years.year=2;
 const before=g.boss.hp,spent=applyAnnualCarry(g);
 assert.ok(Math.abs(before-g.boss.hp-spent)<1e-9);assert.equal(applyAnnualCarry(g),0);
});
test('normal hits, dots and eleventh-year clock distortion obey the pressure rules',()=>{
 const game=make(),e=game.gyuwon.years;
 assert.equal(e.season,0);
 damageGyuwon(game,100);assert.ok(e.season>0&&e.day<365,'normal hits move the calendar');
 const normalAdvance=e.season;
 const dots=make();damageGyuwon(dots,100,null,{dot:true});
 assert.ok(dots.gyuwon.years.season>0&&dots.gyuwon.years.season<normalAdvance,'DoT pressure is smaller');
 const last=make(11);last.gyuwon.years.season=0;last.gyuwon.years.day=365;
 assert.equal(annualDisplay(last).day,365);
 damageGyuwon(last,100);
 assert.ok(annualDisplay(last).day<365,'the last-year pause cannot hide a real clock advance');
});


test('memory time accumulates during attacks and switches only after the live cast ends',()=>{
 const g=make(9),e=g.gyuwon.years;g.boss.phase=3;g.gyuwon.stageMemory='sword';
 startGyuwonYearCast(g,'ultimateMemory');e.mapClock=gyuwonMapInterval(9)-.1;
 advance(g,.3);assert.equal(g.gyuwon.stageMemory,'sword');assert.equal(e.mapPending,true);
 assert.ok(e.mapClock>gyuwonMapInterval(9));
 for(let i=0;i<1200&&e.cast;i++)stepGyuwon(g,1/60);
 assert.equal(g.gyuwon.stageMemory,'sword');
 stepGyuwon(g,1/60);assert.notEqual(g.gyuwon.stageMemory,'sword');
 assert.equal(e.mapPending,false);assert.ok(e.mapClock<.1);
});

test('exam countdown is shorter and has no incoming attacks',()=>{
 const g=make(),e=g.gyuwon.years;
 g.boss.x=0;g.boss.z=0;g.player.x=0;g.player.z=25;
 e.season=GYUWON_YEAR_SECONDS;e.signatureUsed=true;e.recover=0;
 stepGyuwon(g,.025);assert.equal(e.mode,'exam');
 assert.equal(g.gyuwon.hazards.length,0);advance(g,1.1);
 assert.equal(e.subject,1);assert.equal(g.gyuwon.hazards.length,0);
});
test('cover stops actual bullets, loses health, and then lets subsequent shots through',()=>{
 const g=make(4),e=g.gyuwon.years;
 startGyuwonYearCast(g,'ultimateMarksman');assert.equal(e.cover.length,5);
 const base=g.gyuwon.hazards.find(h=>h.visual==='year-bullet'),sx=base.muzzleX,sz=base.muzzleZ;
 e.cover=[{x:sx+Math.sin(base.yaw)*8,z:sz+Math.cos(base.yaw)*8,hp:90,maxHp:90}];
 for(let i=0;i<2;i++){const h={...base};resolveAnnualProjectileCover(g,h,()=>{});assert.ok(h.length<9);assert.equal(hazardContains(h,{x:sx+Math.sin(h.yaw)*16,z:sz+Math.cos(h.yaw)*16}),false);}
 assert.equal(e.cover[0].hp,0);
 const last={...base};resolveAnnualProjectileCover(g,last,()=>{});assert.equal(last.length,base.length);
});

test('sewage leaves a visible bounded poison source with separate anticipation',()=>{
 const g=make(5);startGyuwonYearCast(g,'sewageThrow');advance(g,1.3);
 const puddle=g.gyuwon.hazards.find(h=>h.puddle);
 assert.ok(puddle?.persistent);assert.equal(puddle.damage,5);assert.ok(puddle.warn>=.8);assert.ok(puddle.life>=6);
 const id=puddle.id;startGyuwonYearCast(g,'sewageBomb');
 assert.ok(g.gyuwon.hazards.some(h=>h.id===id));advance(g,9);
 assert.ok(g.gyuwon.hazards.filter(h=>h.persistent).length<=12);
});

test('six gacha results have six mechanics and each ward cancels only its own family',()=>{
 const g=make(7),types=new Set();
 for(let i=0;i<6;i++){
  startGyuwonYearCast(g,'ultimateGacha');const h=g.gyuwon.hazards,e=g.gyuwon.years;
  types.add(JSON.stringify([h.length,h.map(x=>[x.shape,!!x.rideSegment,!!x.vx,!!x.reversed]) ]));
  assert.ok(Math.max(...h.map(x=>x.warn+x.life))<=e.castDuration);
 }
 assert.equal(types.size,6);
 const shrine=make(6);startGyuwonYearCast(shrine,'ultimateShrine');
 const families=new Set(shrine.gyuwon.hazards.filter(h=>h.wardIndex!==undefined).map(h=>h.visual+':'+h.shape));assert.ok(families.size>=5);
 const e=shrine.gyuwon.years;for(const w of [...e.wards]){assert.ok(strikeGyuwonWard(shrine,w.x,w.z,w.maxHp));assert.ok(shrine.gyuwon.hazards.every(h=>h.wardIndex!==w.index));}
 assert.equal(shrine.gyuwon.stun,3);
});

test('all four real weapon attacks can clear six shrines before the cast expires',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=make(6,weapon);startGyuwonYearCast(g,'ultimateShrine');const e=g.gyuwon.years;
  for(let i=0;i<1120&&e.cast;i++){
   const ward=e.wards.find(w=>w.hp>0);if(!ward)break;
   const dx=ward.x-g.boss.x,dz=ward.z-g.boss.z,d=Math.hypot(dx,dz);
   g.player.x=ward.x+dx/d*2;g.player.z=ward.z+dz/d*2;
   actGyuwon(g,'light');stepGyuwon(g,1/60);g.events.length=0;
  }
  assert.ok(e.wards.length===6&&e.wards.every(w=>w.hp===0),weapon);
  assert.ok(g.gyuwon.stun>2.9,weapon);
 }
});

test('last OMR physically falls into its hit footprint, keeps the old relay, and unlocks the ending',()=>{
 const g=make(11),stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 try{
  startGyuwonYearCast(g,'nightmare365');const h=g.gyuwon.hazards.at(-1);
  assert.equal(h.visual,'year-final-omr');assert.equal(g.gyuwon.hazards.filter(x=>x.nightmareBeat!==undefined).length,11);
  h.age=h.warn-2;fx.update(g);const hinge=stage.getObjectByName('gyuwon-last-answer-omr-hinge');
  assert.ok(hinge.parent.visible);assert.ok(hinge.rotation.x<Math.PI/2);
  h.age=h.warn;fx.update(g);assert.equal(hinge.rotation.x,Math.PI/2);
  assert.ok(hazardContains(h,{x:h.x,z:h.z}));assert.equal(hazardContains(h,{x:h.x+Math.cos(h.yaw)*8,z:h.z-Math.sin(h.yaw)*8}),false);
  advance(g,23.6);assert.equal(g.gyuwon.years.endingUnlocked,true);assert.equal(g.boss.state,'recovery');
 }finally{fx.dispose();}
});

test('remembered sword moves the actual wave passage and repeated waves reuse geometry',()=>{
 const g=make(10),stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 try{
  g.gyuwon.stageMemory='tsunami';startGyuwonYearCast(g,'recallMix');
  const wave=g.gyuwon.hazards.find(h=>h.shape==='wave');assert.notEqual(wave.gap,wave.gapTarget);
  fx.update(g);const geometry=stage.getObjectByName('gyuwon-dday-wave-body').geometry;
  advance(g,2);assert.equal(wave.gap,wave.gapTarget);fx.update(g);
  startGyuwonYearCast(g,'sewageWave');fx.update(g);
  assert.equal(stage.getObjectByName('gyuwon-dday-wave-body').geometry,geometry);
  const next=g.gyuwon.hazards.find(h=>h.shape==='wave');next.age=next.warn+2;
  assert.equal(hazardContains(next,{x:next.gap,z:next.z+next.speed*2}),false);
 }finally{fx.dispose();}
});

test('display distortion never changes combat state and music uses years without requesting absent assets',()=>{
 const g=make();for(let year=1;year<=18;year++){
  g.gyuwon.years.year=year;g.gyuwon.years.day=200;g.time=17;
  const before=JSON.stringify(g);const visual=annualDisplay(g);assert.equal(JSON.stringify(g),before);assert.ok(visual.day>=0&&visual.day<=365);
  assert.equal(gyuwonMusicSection(year),Math.min(5,Math.floor((year-1)/2)));
  assert.equal(bossTrack({boss:'gyuwon',year,phase:3}),null);
 }
});

test('210 real bullets arrive in 30 warned groups of seven',()=>{
 const g=make(4);startGyuwonYearCast(g,'ultimateMarksman');
 const shots=new Set();
 for(let i=0;i<1380&&g.gyuwon.years.cast;i++){
  for(const h of g.gyuwon.hazards)if(h.visual==='year-bullet')shots.add(h.id);
  stepGyuwon(g,1/60);
 }
 assert.equal(shots.size,210);assert.equal(g.gyuwon.years.marksmanVolleys,30);
 assert.equal(g.gyuwon.years.cover.length,5);
});
