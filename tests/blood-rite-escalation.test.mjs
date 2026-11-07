import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOOD_RITE_ACCENTS} from '../src/blood-rite-escalation.mjs';
import {BLOOD_PATTERNS,BLOOD_RULES,bloodHazardFootprint,hazardContains} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_TSUNAMI} from '../src/blood-tsunami.mjs';
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
  if(accent.length)assert.ok(accent[0].warn>=1.15&&accent[0].warn>Math.min(...hazards.filter(h=>h!==accent[0]).map(h=>h.warn)),id+' counterbeat must be visibly delayed');
 }
});
test('the phase-two sea wall travels from the horizon and preserves the boss-facing safe corridor',()=>{
 const g=createBloodGame();g.boss.phase=2;
 assert.equal(startBloodPattern(g,'requiem'),true);

 const walls=g.blood.hazards.filter(h=>h.tsunami);
 assert.equal(walls.length,4);assert.equal(BLOOD_RULES.radius,32);
 for(const row of [0,1]){
  const pair=walls.filter(w=>w.row===row);
  assert.equal(pair.length,2);assert.deepEqual(pair.map(w=>w.side),[-1,1]);
  assert.ok(pair.every(w=>w.warn>=1.5&&w.life>3&&Math.hypot(w.vx,w.vz)>30));
  const age=pair[0].warn+(BLOOD_TSUNAMI.startDistance+row*BLOOD_TSUNAMI.rowOffset)/BLOOD_TSUNAMI.speed;
  const origin=g.blood.tsunami.origin;
  assert.ok(pair.every(w=>!hazardContains({...w,age},origin)),'safe boss corridor must remain safe');
  for(const side of [-1,1]){
   const w=pair.find(h=>h.side===side);
   const p={x:origin.x+side*16*Math.cos(w.yaw),z:origin.z-side*16*Math.sin(w.yaw)};
   assert.ok(hazardContains({...w,age},p),'moving flank must really inflict damage');
  }
 }

});
