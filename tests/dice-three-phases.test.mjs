import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {GIANT,skipGiant,giantPattern,giantHazards,strikeGiantHand} from '../src/dice-giant.mjs';
test('three phases split the shared 3000 health at 2000 and 1000',()=>{
 const g=createDicePlayerGame();damageDice(g,999);assert.equal(g.boss.phase,1);
 damageDice(g,1);assert.equal(g.boss.phase,2);assert.equal(g.boss.hp,2000);
 skipGiant(g);stepDice(g,1/120);
 damageDice(g,999);assert.equal(g.boss.phase,2);
 damageDice(g,1);assert.equal(g.boss.phase,3);assert.equal(g.boss.hp,1000);
 assert.equal(g.dice.giant.temperament,'feral');
 assert.equal(g.events.filter(e=>e.type==='dice-phase-change').length,2);
});
test('shattered palm suppresses only its own attacks and regenerates after eight seconds',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 g.player.invuln=999;g.player.hp=g.player.maxHp=5000;
 const q=g.dice.giant,pat=giantPattern(7,{x:0,z:0});
 Object.assign(q,{state:'attack',slot:7,t:1.3,hazards:pat.hazards,duration:pat.duration});
 strikeGiantHand(g,0,GIANT.handHp);
 assert.equal(q.disabledFor[0],8);
 assert.ok(giantHazards(g).some(h=>h.handIndex===1));
 assert.ok(giantHazards(g).every(h=>h.handIndex!==0));
 assert.ok(pat.hazards.filter(h=>h.handIndex===0).every(h=>h.cancelled));
 q.state='recovery';q.t=0;q.hazards=[];
 for(let i=0;i<960;i++)stepDice(g,1/120);
 assert.equal(q.destroyed[0],false);assert.equal(q.hands[0],GIANT.handHp);
 assert.equal(g.boss.phase,2);
});
test('both palms broken never cause early phase three',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 strikeGiantHand(g,0,340);strikeGiantHand(g,1,340);
 stepDice(g,1/120);assert.equal(g.boss.phase,2);
});
test('two new controlled and feral patterns have usable warning timelines',()=>{
 for(let i=0;i<9;i++){const v=giantPattern(i,{x:0,z:-40});assert.ok(v.hazards.length&&v.hazards.every(h=>h.warn>.3));}
 for(let i=0;i<10;i++){const v=giantPattern(i,{x:0,z:-40},'feral');assert.ok(v.hazards.length&&v.hazards.every(h=>h.warn>.3));}
});
