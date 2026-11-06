import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_TEMPO} from '../src/boss-tempo.mjs';
import {createGame,patternConfig} from '../src/combat.mjs';
import {PATTERNS as CLOWN} from '../src/clown-combat.mjs';
import {clownPrecastTime,giantReadableWarning,READABLE_ATTACK} from '../src/attack-readability.mjs';
import {DICE_RULES} from '../src/dice-data.mjs';
import {DICE_PATTERNS} from '../src/dice-combat.mjs';
import {GIANT,GIANT_NAMES,FERAL_NAMES,giantPattern} from '../src/dice-giant.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {BLOOD_COUNTER_WINDOW} from '../src/blood-footwork.mjs';

test('Kwon windups remain visible, punishment windows remain available',()=>{
 assert.deepEqual(BOSS_TEMPO,{gap:.72,windup:.90,recovery:.78});
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false});g.boss.phase=phase;g.boss.pattern='thrust';
  const cfg=patternConfig(g.boss);
  assert.ok(cfg.wind>=READABLE_ATTACK.kwon.heavy);
  assert.ok(cfg.recover>=.8);
 }
 assert.ok(patternConfig({pattern:'thrust',phase:1}).wind<1.05);
 assert.ok(patternConfig({pattern:'thrust',phase:1}).recover<1.3);
});
test('Clown precasts stay matched to the visible performance',()=>{
 for(const [id,p] of Object.entries(CLOWN)){
  assert.equal(p.precast,clownPrecastTime(id));
  assert.ok(p.precast>=READABLE_ATTACK.clown.close);
  assert.ok(p.dur>p.precast+p.recover);
 }
 assert.ok(CLOWN.dash.precast<.52);
});
test('Dice speeds up without instant hits or prematurely ending a giant sequence',()=>{
 assert.ok(DICE_RULES.warning>=.9&&DICE_RULES.warning<1.08);
 assert.ok(DICE_RULES.recovery<1.2);
 for(const k of ['chargeWarning','jumpWarning','frenzyWarning','chainWarning','pipWarning','pipWarningP2'])
  assert.ok(DICE_PATTERNS[k]>=.8,k);
 assert.ok(GIANT.recovery<2.4&&GIANT.recovery>1.6);
 assert.ok(GIANT.feralRecovery<1.5&&GIANT.feralRecovery>1);
 for(const [kind,n] of [['controlled',GIANT_NAMES.length],['feral',FERAL_NAMES.length]])
  for(let i=0;i<n;i++){
   const p=giantPattern(i,{x:0,z:-43},kind,.2);
   for(const h of p.hazards){
    assert.ok(h.warn>=READABLE_ATTACK.dice.rapid);
    assert.equal(giantReadableWarning(h).warn,h.warn);
    assert.ok(p.duration>=h.start+h.warn+h.active);
   }
  }
});
test('Blood recovery still leaves a counterattack window',()=>{
 assert.ok(BLOOD_COUNTER_WINDOW>=1);
 for(const [id,s] of Object.entries(BLOOD_PATTERNS)){
  assert.ok(s.recover>=BLOOD_COUNTER_WINDOW,id);
  assert.ok(s.duration>s.recover,id);
 }
 assert.ok(BLOOD_PATTERNS.wave.recover<=2.2);
 assert.ok(BLOOD_PATTERNS.heartFeast.recover<3.75);
});
