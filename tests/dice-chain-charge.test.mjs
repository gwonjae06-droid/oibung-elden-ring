import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_BOARD as B,DICE_RULES as R,diceRollPose} from '../src/dice-data.mjs';
import {createDiceGame,stepDice,damageDice,DICE_PATTERNS as P} from '../src/dice-combat.mjs';

function advance(g,seconds,input={}){for(let left=seconds;left>1e-9;){const dt=Math.min(.05,left);stepDice(g,dt,input);left-=dt;}}
function ready(count,phase){
 const g=createDiceGame();g.boss.phase=phase;
 Object.assign(g.dice,{index:60,pose:diceRollPose(B[60],B[61],0),rotation:[0,0,0,1],state:'recovery',t:R.recovery,pendingPattern:true,patternCount:count});
 g.player.x=-60;g.player.z=-60;stepDice(g,.05);return g;
}
const warnings=g=>g.events.filter(e=>e.type==='dice-charge-warning');

test('phase one never chains a charge',()=>{
 for(let count=0;count<9;count++){const g=ready(count,1);assert.ok(!g.dice.chainCharges,'count '+count);}
});

test('phase two adds a chained charge and a pip burst to the pattern cycle',()=>{
 assert.equal(ready(0,2).dice.state,'charge-warning');assert.ok(!ready(0,2).dice.chainCharges);
 assert.equal(ready(1,2).dice.state,'jump-warning');
 assert.equal(ready(2,2).dice.state,'frenzy-windup');
 const g=ready(3,2);
 assert.equal(g.dice.state,'charge-warning');
 assert.equal(g.dice.chainCharges,1);
 assert.equal(ready(4,2).dice.state,'pip-warning');
 assert.equal(ready(5,2).dice.state,'charge-warning');
 assert.ok(!ready(5,2).dice.chainCharges);
});

test('the second charge starts where the first ended, with no recovery in between',()=>{
 const g=ready(3,2),end={...g.dice.telegraph.to};
 advance(g,P.chargeWarning+.1);assert.equal(g.dice.state,'charge');
 advance(g,P.chargeTime+.05);
 assert.equal(g.dice.state,'charge-warning');
 assert.equal(g.dice.chainCharges,0);
 assert.deepEqual(g.dice.telegraph.from,end);
 const w=warnings(g);
 assert.equal(w.length,2);
 assert.ok(!w[0].combo);
 assert.equal(w[1].combo,true);
 assert.equal(g.status,'playing');
});

test('the chained warning is longer than the first and the sequence ends in recovery',()=>{
 const g=ready(3,2);
 advance(g,P.chargeWarning);advance(g,P.chargeTime);
 advance(g,P.chainWarning-.1);
 assert.equal(g.dice.state,'charge-warning');
 assert.ok(P.chainWarning>P.chargeWarning);
 advance(g,.2);
 assert.equal(g.dice.state,'charge');
 advance(g,P.chargeTime+.05);
 assert.equal(g.dice.state,'recovery');
 assert.equal(g.dice.chainCharges,0);
 assert.equal(warnings(g).length,2);
 assert.equal(g.dice.telegraph,null);
});

test('both corridors stay on the board',()=>{
 const g=ready(3,2);
 for(const t of [g.dice.telegraph]){assert.ok(Math.abs(t.to.x)<=60&&Math.abs(t.to.z)<=60);}
 advance(g,P.chargeWarning+.1);advance(g,P.chargeTime+.05);
 assert.ok(Math.abs(g.dice.telegraph.to.x)<=60&&Math.abs(g.dice.telegraph.to.z)<=60);
});

test('freezing the boss keeps the chained warning timer',()=>{
 const g=ready(3,2);
 advance(g,P.chargeWarning+.1);advance(g,P.chargeTime+.05);
 advance(g,.3);
 const t=g.dice.t;
 advance(g,.6,{freezeBoss:true});
 assert.equal(g.dice.t,t);
 assert.equal(g.dice.state,'charge-warning');
});

test('winning during the chain clears it and stops future attacks',()=>{
 const g=ready(3,2);
 advance(g,P.chargeWarning+.1);advance(g,P.chargeTime+.05);
 damageDice(g,g.boss.hp);
 assert.equal(g.status,'won');
 assert.equal(g.dice.chainCharges,0);
 assert.equal(g.dice.telegraph,null);
 const time=g.time;advance(g,3);assert.equal(g.time,time);
});
