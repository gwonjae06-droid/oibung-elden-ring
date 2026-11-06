import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {skipGiant,GIANT_NAMES,giantPattern,stepGiant} from '../src/dice-giant.mjs';
const step=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepDice(g,1/120,{freezeBoss:false});};
test('the real giant encounter launches the former missing portrait and chain skills first',()=>{
 const g=createDicePlayerGame('sword',{seed:194});
 damageDice(g,g.boss.maxHp/3+.2);
 assert.equal(g.boss.phase,2);assert.ok(g.dice.giant);
 skipGiant(g);stepDice(g,.01);
 const q=g.dice.giant;g.player.invuln=1e6;g.player.hp=g.player.maxHp=1e6;
 const seen=[];
 for(let n=0;n<2;n++){
  q.state='recovery';q.t=5;
  stepDice(g,1/120);
  seen.push(q.slot);
  assert.equal(q.state,'attack');
  assert.equal(g.dice.groundSpikes?.kind,q.slot===14?'portrait-barrage':'chain-sweep');
  assert.ok(g.events.some(e=>e.type=== (q.slot===14?'dice-portrait-warning':'dice-chain-warning')));
  // Exhaust only the special attack's own warning and active span.
  step(g,q.duration+.7);
 }
 assert.deepEqual(seen.sort((a,b)=>a-b),[14,15]);
 assert.equal(GIANT_NAMES.length,16);
 for(const slot of [14,15]){const p=giantPattern(slot,g.player);assert.ok(p.hazards.length&&p.duration>1);}
});
