import test from 'node:test';
import assert from 'node:assert/strict';
import {createDiceGame,stepDice,damageDice} from '../src/dice-combat.mjs';
import {DICE_RULES as R} from '../src/dice-data.mjs';
const step=(g,time)=>{for(let t=0;t<time;t+=1/120)stepDice(g,1/120);};
function ready(slot){
 const g=createDiceGame({seed:989});g.boss.phase=2;g.player.hp=g.player.maxHp=100000;
 g.player.invuln=100000;g.dice.pose={x:0,y:6,z:0,rotation:[0,0,-Math.SQRT1_2,Math.SQRT1_2],dx:1,dz:0,angle:0};
 Object.assign(g.dice,{state:'recovery',t:R.recovery,pendingPattern:true,forcedPatternSlot:slot});
 stepDice(g,.02);
 return g;
}
for(const [slot,kind,warning,release]of [
 [7,'portrait-barrage','dice-portrait-warning','dice-portrait-barrage'],
 [8,'chain-sweep','dice-chain-warning','dice-chain-sweep']
]){
 test('archived phase-two pattern '+kind+' now warns, fires and completes exclusively',()=>{
  const g=ready(slot);
  assert.equal(g.dice.state,'face-pattern');
  assert.equal(g.dice.groundSpikes?.kind,kind);
  assert.ok(g.events.some(e=>e.type===warning));
  const hp=g.player.hp;
  step(g,.35);assert.equal(g.player.hp,hp,'no contact before warning');
  // Stop at the first actual cast completion. A fixed 15-second wait could
  // begin another unrelated random move and produce a false failure.
  for(let i=0;i<16*120&&g.dice.state==='face-pattern';i++)stepDice(g,1/120);
  assert.ok(g.events.some(e=>e.type===release),kind+' attack never fired');
  assert.equal(g.dice.facePattern,null);
  assert.equal(g.dice.state,'recovery');
  assert.ok(g.dice.patternCount>=1);
 });
}
test('portrait does not silently fail when the photograph is the bottom face',()=>{
 const g=ready(7);
 assert.equal(g.dice.groundSpikes?.kind,'portrait-barrage');
 assert.ok(g.dice.groundSpikes.cards.length>=1);
});
test('death cancels explicit face attacks and its warning geometry',()=>{
 const g=ready(8);damageDice(g,g.boss.hp);
 assert.equal(g.status,'won');assert.equal(g.dice.groundSpikes,null);
 assert.equal(g.dice.facePattern,null);
});
