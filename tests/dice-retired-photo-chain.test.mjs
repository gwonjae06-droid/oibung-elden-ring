import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiceGame,stepDice,damageDice} from '../src/dice-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {DICE_RULES as R} from '../src/dice-data.mjs';
import {GIANT_NAMES,FERAL_NAMES,giantPattern,skipGiant,nextGiantPressureSlot} from '../src/dice-giant.mjs';
import {createPatternShuffle} from '../src/pattern-shuffle.mjs';

const forbidden=/portrait-barrage|dice-portrait-|chain-sweep|dice-chain-/;
test('old ordinary phase-two slot IDs cannot schedule photo or golden-chain attacks',()=>{
 for(const slot of [7,8,99]){
  const g=createDiceGame({seed:515});
  g.boss.phase=2;g.player.hp=g.player.maxHp=100000;g.player.invuln=100000;
  Object.assign(g.dice,{state:'recovery',t:R.recovery,pendingPattern:true,forcedPatternSlot:slot});
  stepDice(g,.01);
  assert.equal(g.dice.lastAttackSlot,0,'invalid old attack slot must become a legitimate first slot');
  assert.notEqual(g.dice.state,'face-pattern');
  assert.equal('groundSpikes' in g.dice,false);
  assert.equal('facePattern' in g.dice,false);
  assert.ok(g.events.every(e=>!forbidden.test(e.type)));
 }
});
test('the entire playable phase-two shuffle deck excludes obsolete attack slots',()=>{
 const g=createDiceGame({seed:720});
 g.boss.phase=2;g.player.hp=g.player.maxHp=100000;g.player.invuln=100000;
 const seen=[];
 for(let i=0;i<7*3;i++){
  Object.assign(g.dice,{state:'recovery',t:R.recovery,pendingPattern:true});
  stepDice(g,.01);
  seen.push(g.dice.lastAttackSlot);
 }
 for(let i=0;i<3;i++)assert.deepEqual(seen.slice(i*7,(i+1)*7).sort((a,b)=>a-b),[0,1,2,3,4,5,6]);
 assert.ok(g.events.every(e=>!forbidden.test(e.type)));
});
test('giant gentleman has 14 physical and roulette patterns, never portrait or chain',()=>{
 assert.equal(GIANT_NAMES.length,14);
 assert.equal(GIANT_NAMES.some(n=>/초상화|사슬/.test(n)),false);
 const g={player:{x:0,z:-42},dice:{patternShuffle:createPatternShuffle(318),giant:{temperament:'controlled'}}};
 for(let i=0;i<GIANT_NAMES.length*3;i++){
  const slot=nextGiantPressureSlot(g);
  assert.ok(slot>=0&&slot<14);
  const p=giantPattern(slot,g.player,'controlled');
  assert.ok(p.hazards.length>0);
  assert.ok(p.hazards.every(h=>!h.faceAttack));
 }
});
test('real phase-two giant cannot emit retired attack warnings',()=>{
 const g=createDicePlayerGame('sword',{seed:194});
 damageDice(g,g.boss.maxHp/3+.2);assert.equal(g.boss.phase,2);
 skipGiant(g);stepDice(g,1/120);
 const q=g.dice.giant;
 for(let i=0;i<GIANT_NAMES.length;i++){
  q.state='recovery';q.t=20;
  stepDice(g,1/120);
  assert.ok(q.slot<GIANT_NAMES.length);
  assert.ok(g.events.every(e=>!forbidden.test(e.type)));
  assert.equal('groundSpikes' in g.dice,false);
 }
});
test('phase-three feral table destruction patterns remain intact',()=>{
 assert.equal(FERAL_NAMES.length,16);
 for(const slot of [13,14,15]){
  const p=giantPattern(slot,{x:0,z:-40},'feral',.2);
  assert.equal(p.slot,slot);
  assert.ok(p.hazards.some(h=>h.tableShock));
 }
});
