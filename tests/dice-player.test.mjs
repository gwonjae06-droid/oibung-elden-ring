import test from 'node:test';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {createDiceGame,stepDice} from '../src/dice-combat.mjs';
import {DICE_RULES as R,DICE_BOARD,diceRollPose,diceTouches} from '../src/dice-data.mjs';
import {diceSegmentHit} from '../src/dice-hit.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/120)stepDicePlayer(g,1/120);};
function target(w,weak=true){const g=createDicePlayerGame(w);g.player.x=g.dice.pose.x+(weak?6:0);g.player.z=g.dice.pose.z+(weak?0:6);g.dice.stun=999;return g;}
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' damages the photo face only',()=>{const g=target(weapon),before=g.player.stamina;assert.equal(actDice(g,'light'),true);assert.ok(g.player.stamina<before);tick(g,.8);assert.ok(g.boss.hp<g.boss.maxHp);assert.ok(g.stats.hits>0);});
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' is blocked by an armored face',()=>{const g=target(weapon,false);assert.equal(actDice(g,'light'),true);tick(g,.8);assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.stats.hits,0);assert.equal(g.stats.damage,0);assert.equal(g.player.skill.sigilMarks,0);assert.ok(g.events.some(e=>e.type==='dice-blocked'));});
test('casino inherits the new passive sword wave and active double-arrow backstep',()=>{
 const sword=target('sword');sword.evolutions=['blade-wave'];
 assert.equal(actDice(sword,'skill'),false);
 assert.equal(actDice(sword,'light'),true);tick(sword,.3);
 assert.ok(sword.events.some(e=>e.type==='shot'));
 const bow=target('bow');bow.evolutions=['twin-arrow'];
 assert.equal(actDice(bow,'skill'),true);tick(bow,.3);
 assert.ok(bow.events.some(e=>e.type==='shot'));
});
test('casino returning hammer is launched as a real projectile',()=>{
 const g=target('hammer');g.evolutions=['blood-hammer'];
 assert.equal(actDice(g,'skill'),true);tick(g,.25);
 assert.equal(g.projectiles.length,1);
 assert.equal(g.projectiles[0].kind,'hammer-throw');
});
test('armored casino faces never award card healing or sigil marks',()=>{
 const cards=target('cards',false);cards.evolutions=['wide-deck'];
 assert.equal(actDice(cards,'light'),true);tick(cards,.6);
 assert.equal(cards.player.skill.sigilMarks,0);
 const blood=target('cards',false);blood.evolutions=['blood-deck'];
 blood.player.hp=50;assert.equal(actDice(blood,'light'),true);tick(blood,.6);
 assert.equal(blood.player.hp,50);
});
test('fire arrows stop on armored faces without applying burn',()=>{
 const g=target('bow',false);g.evolutions=['piercing-arrow'];
 assert.equal(actDice(g,'light'),true);tick(g,.7);
 assert.equal(g.boss.hp,g.boss.maxHp);
 assert.equal(g.weaponBurnStacks?.length||0,0);
});
test('casino skill no longer allows deprecated color card actives',()=>{
 const g=target('cards');g.evolutions=['wide-deck'];
 assert.equal(actDice(g,'skill'),false);
});
test('stun freezes the boss without blocking player movement',()=>{const g=createDiceGame(),t=g.dice.t,x=g.player.x;stepDice(g,.05,{x:-1,freezeBoss:true});assert.equal(g.dice.t,t);assert.ok(g.player.x<x);});
test('frozen contact pushes a player out instead of killing',()=>{const g=createDiceGame();g.player.x=g.dice.pose.x;g.player.z=g.dice.pose.z;stepDice(g,.01,{freezeBoss:true});assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp);assert.equal(diceTouches(g.player,g.dice.pose),false);});
test('projectiles hit the cube rather than empty space above it',()=>{const p=diceRollPose(DICE_BOARD[0],DICE_BOARD[1],0);assert.equal(diceSegmentHit({x:p.x-10,y:1.2,z:p.z},{x:p.x+10,y:1.2,z:p.z},p),true);assert.equal(diceSegmentHit({x:p.x-10,y:20,z:p.z},{x:p.x+10,y:20,z:p.z},p),false);});
test('active roll invulnerability cannot block a real descending crush',()=>{const g=createDicePlayerGame();g.player.x=g.dice.to.x;g.player.z=g.dice.to.z;g.dice.state='rolling';g.dice.t=R.rollTime-1/120;assert.equal(actDice(g,'roll'),true);g.player.action.t=.1;g.player.invuln=999;stepDicePlayer(g,1/120);assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp-playerIncomingDamage(g,44));assert.ok(g.player.traits.crush>0);});
