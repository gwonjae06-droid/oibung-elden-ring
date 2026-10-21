import test from 'node:test';import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {createDiceGame,stepDice} from '../src/dice-combat.mjs';
import {DICE_BOARD,diceRollPose} from '../src/dice-data.mjs';
import {diceSegmentHit} from '../src/dice-hit.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/120)stepDicePlayer(g,1/120);};
function target(w){const g=createDicePlayerGame(w);g.player.x=g.dice.pose.x+6;g.player.z=g.dice.pose.z;g.dice.stun=999;return g;}
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' basic attack consumes stamina and damages the dice',()=>{const g=target(weapon),before=g.player.stamina;assert.equal(actDice(g,'light'),true);assert.ok(g.player.stamina<before);tick(g,.8);assert.ok(g.boss.hp<g.boss.maxHp);assert.ok(g.stats.hits>0);});
test('sword haste and bow charge are inherited from shared skill rules',()=>{const sword=target('sword');assert.equal(actDice(sword,'skill'),true);assert.ok(sword.player.skill.haste>0);const bow=target('bow');assert.equal(actDice(bow,'skill'),true);assert.equal(bow.player.skill.charges,2);tick(bow,.7);assert.ok(bow.boss.hp<bow.boss.maxHp);});
test('hammer lifesteal consumes charged hits and heals from damage',()=>{const g=target('hammer');g.player.skill.hammerHits=4;g.player.hp=60;assert.equal(actDice(g,'skill'),true);tick(g,.7);assert.equal(g.player.skill.hammerHits,0);assert.ok(g.player.hp>60);assert.ok(g.events.some(e=>e.type==='skill-heal'));});
test('yellow card applies one stun to its multi-projectile attack',()=>{const g=target('cards');g.player.skill.cycle=1.21;assert.equal(actDice(g,'skill'),true);assert.equal(actDice(g,'light'),true);tick(g,.6);assert.equal(g.events.filter(e=>e.type==='skill-stun').length,1);});
test('stun freezes the boss without blocking player movement',()=>{const g=createDiceGame(),t=g.dice.t,x=g.player.x;stepDice(g,.05,{x:-1,freezeBoss:true});assert.equal(g.dice.t,t);assert.ok(g.player.x<x);});
test('frozen body still crushes overlapping players',()=>{const g=createDiceGame();g.player.x=g.dice.pose.x;g.player.z=g.dice.pose.z;stepDice(g,.01,{freezeBoss:true});assert.equal(g.status,'lost');});
test('projectiles hit the cube rather than empty space above it',()=>{const p=diceRollPose(DICE_BOARD[0],DICE_BOARD[1],0);assert.equal(diceSegmentHit({x:p.x-10,y:1.2,z:p.z},{x:p.x+10,y:1.2,z:p.z},p),true);assert.equal(diceSegmentHit({x:p.x-10,y:20,z:p.z},{x:p.x+10,y:20,z:p.z},p),false);});
test('rolling players do not gain immunity against crushing',()=>{const g=createDicePlayerGame();g.player.x=g.dice.pose.x;g.player.z=g.dice.pose.z;g.dice.stun=999;assert.equal(actDice(g,'roll'),true);stepDicePlayer(g,1/120);assert.equal(g.status,'lost');assert.equal(g.player.hp,0);});
