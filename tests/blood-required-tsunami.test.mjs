import test from 'node:test';
import assert from 'node:assert/strict';
import {createBloodGame,damageBlood,startBloodPattern,stepBlood,skipBloodTransition} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';

function advance(g,seconds){for(let t=0;t<seconds;t+=.025){g.player.invuln=100;stepBlood(g,.025);}}
function phaseTwo(hp=3100){const g=createBloodGame();g.boss.phase=2;g.boss.hp=hp;g.player.invuln=100;return g;}

test('3000 HP interrupts an attack and starts the real two-row tsunami once',()=>{
 const g=phaseTwo();startBloodPattern(g,'wing');
 assert.equal(damageBlood(g,100),100);stepBlood(g,.025);
 assert.equal(g.blood.pattern,'requiem');assert.equal(g.blood.requiredTsunamiStarted,true);
 assert.equal(g.blood.hazards.filter(h=>h.tsunami).length,4);
 assert.equal(g.blood.tsunami.rows.length,2);
 assert.equal(startBloodPattern(g,'wing'),false);
 assert.equal(damageBlood(g,999999),0);assert.equal(g.boss.hp,3000);
 advance(g,BLOOD_PATTERNS.requiem.duration+.1);
 assert.equal(g.blood.requiredTsunamiDone,true);
 assert.equal(g.events.filter(e=>e.type==='blood-warning'&&e.pattern==='requiem').length,1);
 assert.equal(g.events.filter(e=>e.type==='blood-tsunami-approach').length,1);
 assert.equal(damageBlood(g,999999),3000);assert.equal(g.status,'won');
});

test('overkill and DoT cannot skip the threshold; a fresh fight resets it',()=>{
 const g=phaseTwo();assert.equal(g.applyBonusDamage(999999,0,{dot:true}),100);
 assert.equal(g.boss.hp,3000);assert.equal(g.status,'playing');
 stepBlood(g,.025);assert.equal(g.blood.pattern,'requiem');
 advance(g,.5);assert.equal(g.events.filter(e=>e.type==='blood-warning'&&e.pattern==='requiem').length,1);
 assert.equal(createBloodGame().blood.requiredTsunamiStarted,false);
});

test('a first-phase overkill preserves the transition before the mandatory wave',()=>{
 const g=createBloodGame();damageBlood(g,999999);assert.equal(g.boss.hp,3000);
 stepBlood(g,.025);assert.equal(g.boss.state,'transition');
 skipBloodTransition(g);stepBlood(g,.025);stepBlood(g,.025);
 assert.equal(g.boss.phase,2);assert.equal(g.blood.pattern,'requiem');
});

test('a random requiem above 3000 HP does not consume the threshold event',()=>{
 const g=phaseTwo(3150);startBloodPattern(g,'requiem');
 advance(g,BLOOD_PATTERNS.requiem.duration+.1);
 assert.equal(g.blood.requiredTsunamiStarted,false);
 damageBlood(g,999999);stepBlood(g,.025);
 assert.equal(g.blood.requiredTsunamiStarted,true);assert.equal(g.blood.pattern,'requiem');
});
