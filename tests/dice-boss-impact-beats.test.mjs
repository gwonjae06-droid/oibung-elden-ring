import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantPattern,skipGiant} from '../src/dice-giant.mjs';
const intro=()=>{const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 g.events.length=0;g.player.invuln=999;return g;};
test('giant palms emit one impact event at the actual contact moment',()=>{
 const g=intro(),q=g.dice.giant,p=giantPattern(7,{x:0,z:-40});
 Object.assign(q,{state:'attack',slot:7,t:0,hazards:p.hazards,duration:p.duration});
 for(let i=0;i<113;i++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-palm-impact').length,0);
 for(let i=0;i<22;i++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-palm-impact'&&e.handIndex===0).length,1);
 for(let i=0;i<200;i++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-palm-impact'&&e.handIndex===0).length,2,
  'both independent left-hand hazards impact only once');
});
test('disabled palms cannot trigger phantom impact effects',()=>{
 const g=intro(),q=g.dice.giant,p=giantPattern(7,{x:0,z:-40});
 Object.assign(q,{state:'attack',slot:7,t:0,hazards:p.hazards,duration:p.duration});
 q.destroyed[0]=true;q.disabledFor[0]=10;
 for(let i=0;i<195;i++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-palm-impact'&&e.handIndex===0).length,0);
 assert.ok(g.events.some(e=>e.type==='dice-giant-palm-impact'&&e.handIndex===1));
});
