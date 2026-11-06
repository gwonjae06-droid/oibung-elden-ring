import test from 'node:test';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {createDiceGame,stepDice} from '../src/dice-combat.mjs';
import {DICE_RULES as R,DICE_BOARD,diceRollPose,diceTouches} from '../src/dice-data.mjs';
import {diceSegmentHit} from '../src/dice-hit.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/120)stepDicePlayer(g,1/120);};
function target(w,weak=true){const g=createDicePlayerGame(w);g.player.x=g.dice.pose.x+(weak?6:0);g.player.z=g.dice.pose.z+(weak?0:6);g.dice.stun=999;return g;}
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' damages the photo face only',()=>{const g=target(weapon),before=g.player.stamina;assert.equal(actDice(g,'light'),true);assert.ok(g.player.stamina<before);tick(g,.8);assert.ok(g.boss.hp<g.boss.maxHp);assert.ok(g.stats.hits>0);});
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' is blocked by an armored face',()=>{const g=target(weapon,false);assert.equal(actDice(g,'light'),true);tick(g,.8);assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.stats.hits,0);assert.equal(g.stats.damage,0);assert.equal(g.player.skill.hammerHits,0);assert.ok(g.events.some(e=>e.type==='dice-blocked'));});
test('casino sword wave and bow backward double shot inherit the new forge-only skills',()=>{
 const sword=target('sword');sword.evolutions=['blade-wave'];
 assert.equal(actDice(sword,'skill'),false);
 assert.equal(actDice(sword,'light'),true);
 tick(sword,.25);
 assert.ok(sword.events.some(e=>e.type==='shot'));
 const bow=target('bow');bow.evolutions=['twin-arrow'];
 assert.equal(actDice(bow,'skill'),true);
 tick(bow,.23);
 assert.equal(bow.projectiles.length,2);
});
test('casino hammer guard stores the prevented 50 percent of damage',()=>{
 const g=target('hammer');g.evolutions=['earth-wave'];
 assert.equal(actDice(g,'skill'),true);
 assert.equal(g.player.action.kind,'guard');
 assert.equal(playerIncomingDamage(g,40),18);
 assert.equal(g.player.skill.storedDamage,18);
});
test('armored hits cannot heal or apply yellow stun',()=>{const hammer=target('hammer',false);hammer.player.skill.hammerHits=4;hammer.player.hp=60;actDice(hammer,'skill');tick(hammer,.7);assert.equal(hammer.player.hp,60);assert.ok(!hammer.events.some(e=>e.type==='skill-heal'));const cards=target('cards',false);cards.player.skill.cycle=1.21;actDice(cards,'skill');actDice(cards,'light');tick(cards,.6);assert.ok(!cards.events.some(e=>e.type==='skill-stun'));});
test('ordinary bow arrows still stop on the armored casino face',()=>{
 const g=target('bow',false);g.evolutions=['piercing-arrow'];
 assert.equal(actDice(g,'skill'),false);
 assert.equal(actDice(g,'light'),true);
 tick(g,.7);
 assert.equal(g.boss.hp,g.boss.maxHp);
 assert.equal(g.projectiles.length,0);
});
test('casino card marks replace the retired color skill on valid photo hits',()=>{
 const g=target('cards');g.evolutions=['wide-deck'];
 assert.equal(actDice(g,'skill'),false);
 assert.equal(actDice(g,'light'),true);
 tick(g,.6);
 assert.ok(g.events.some(e=>e.type==='card-mark'||e.type==='card-mark-burst'));
 assert.equal(g.events.filter(e=>e.type==='skill-stun').length,0);
});
test('stun freezes the boss without blocking player movement',()=>{const g=createDiceGame(),t=g.dice.t,x=g.player.x;stepDice(g,.05,{x:-1,freezeBoss:true});assert.equal(g.dice.t,t);assert.ok(g.player.x<x);});
test('frozen contact pushes a player out instead of killing',()=>{const g=createDiceGame();g.player.x=g.dice.pose.x;g.player.z=g.dice.pose.z;stepDice(g,.01,{freezeBoss:true});assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp);assert.equal(diceTouches(g.player,g.dice.pose),false);});
test('projectiles hit the cube rather than empty space above it',()=>{const p=diceRollPose(DICE_BOARD[0],DICE_BOARD[1],0);assert.equal(diceSegmentHit({x:p.x-10,y:1.2,z:p.z},{x:p.x+10,y:1.2,z:p.z},p),true);assert.equal(diceSegmentHit({x:p.x-10,y:20,z:p.z},{x:p.x+10,y:20,z:p.z},p),false);});
test('active roll invulnerability cannot block a real descending crush',()=>{const g=createDicePlayerGame();g.player.x=g.dice.to.x;g.player.z=g.dice.to.z;g.dice.state='rolling';g.dice.t=R.rollTime-1/120;assert.equal(actDice(g,'roll'),true);g.player.action.t=.1;g.player.invuln=999;stepDicePlayer(g,1/120);assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp-playerIncomingDamage(g,44));assert.ok(g.player.traits.crush>0);});
