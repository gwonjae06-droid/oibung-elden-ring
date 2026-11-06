import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOOD_RITE_ACCENTS} from '../src/blood-rite-escalation.mjs';
import {BLOOD_PATTERNS,BLOOD_RULES,bloodHazardFootprint,hazardContains} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
test('every blood spell is expressly covered by a readable strengthened stage',()=>{
 assert.deepEqual(Object.keys(BLOOD_RITE_ACCENTS).sort(),Object.keys(BLOOD_PATTERNS).sort());
 for(const id of Object.keys(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=BLOOD_PATTERNS[id].phase;
  assert.equal(startBloodPattern(g,id),true,id);
  const hazards=g.blood.hazards;
  assert.ok(hazards.length>0,id);
  assert.ok(hazards.every(h=>h.warn>=1&&h.damage>0),id);
  assert.ok(hazards.every(h=>Number.isFinite(h.x)&&Number.isFinite(h.z)),id);
  const accent=hazards.filter(h=>h.visual==='blood-counterbeat');
  assert.equal(accent.length,BLOOD_RITE_ACCENTS[id]?1:0,id);
  if(accent.length)assert.ok(accent[0].warn>2,id+' extra beat needs wind-up');
 }
});
test('the phase-two sea wall travels from the horizon and preserves the boss-facing safe corridor',()=>{
 const g=createBloodGame();g.boss.phase=2;
 assert.equal(startBloodPattern(g,'requiem'),true);
 const walls=g.blood.hazards.filter(h=>h.visual==='blood-tsunami-wall');
 assert.equal(walls.length,2);assert.equal(BLOOD_RULES.radius,32);
 for(const w of walls){
  assert.ok(w.z<-BLOOD_RULES.radius-10);
  assert.ok(w.warn>=1.5&&w.life>3);
  assert.equal(hazardContains({...w,age:w.warn+2},{x:g.boss.x,z:w.z+56}),false);
 }
 const midway=walls[0].z+walls[0].vz*2;
 assert.ok(walls.every(w=>!hazardContains({...w,age:w.warn+2},{x:g.boss.x,z:midway})));
 assert.ok(walls.some(w=>hazardContains({...w,age:w.warn+2},{x:g.boss.x-18,z:midway})));
});
