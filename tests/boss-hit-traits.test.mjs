import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGame,step,act} from '../src/combat.mjs';
import {createClownGame,hurt,stepClown} from '../src/clown-combat.mjs';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {createDiceGame,stepDice,DICE_PATTERNS} from '../src/dice-combat.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {applyBossHitTrait,tickBossHitTraits,playerIncapacitated,clearBossHitTraits} from '../src/boss-hit-traits.mjs';
import {tickPlayerResources} from '../src/player-tick.mjs';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';
import {activeBossTrait,createBossHitTraitView,TRAIT_SYMBOLS} from '../src/boss-hit-trait-view.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const advance=(g,seconds,fn=step,input={})=>{for(let left=seconds;left>1e-9;){const h=Math.min(left,.005);fn(g,h,input);left-=h;}};
test('a real Kwon blade projectile applies two seconds of bleed without recursive hit events',()=>{
 const g=createGame('sword',{register:false}),p=g.player;g.bossShots.push({x:p.x,z:p.z,yaw:0,speed:0,life:1,damage:10});step(g,.01);near(p.hp,p.maxHp-playerIncomingDamage(g,10));assert.equal(p.traits.bleed,2);g.hitstop=0;g.boss.stun=10;advance(g,2);near(p.hp,p.maxHp-playerIncomingDamage(g,10)-playerIncomingDamage(g,4,{dot:true}));assert.equal(p.traits.bleed,0);assert.equal(g.events.filter(e=>e.type==='player-hit').length,1);
});
test('bleed refreshes without stacking, boosts stamina by twenty percent, then stops',()=>{
 const g=createGame('sword',{register:false});g.player.stamina=0;applyBossHitTrait(g,10);tickPlayerResources(g,.5);near(g.player.stamina,18);tickBossHitTraits(g,.5);applyBossHitTrait(g,10);assert.equal(g.player.traits.bleed,2);const hp=g.player.hp;tickBossHitTraits(g,3);assert.ok(hp-g.player.hp>3.5&&hp-g.player.hp<=4,'bleed damage remains bounded');g.player.stamina=0;tickPlayerResources(g,.5);near(g.player.stamina,15);
});
test('roll protection rejects a real Kwon hit and never applies bleed',()=>{
 const g=createGame('sword',{register:false});act(g,'roll');g.player.action.t=.15;g.bossShots.push({x:g.player.x,z:g.player.z,yaw:0,speed:0,life:1,damage:10});step(g,.005);assert.equal(g.player.hp,g.player.maxHp);assert.equal(g.player.traits,undefined);
});
test('fatal bleed emits death once and clears pending attacks',()=>{
 const g=createGame('sword',{register:false});g.player.hp=1;applyBossHitTrait(g,10);g.projectiles.push({});tickBossHitTraits(g,1);tickBossHitTraits(g,1);assert.equal(g.status,'lost');assert.equal(g.player.hp,0);assert.equal(g.projectiles.length,0);assert.equal(g.events.filter(e=>e.type==='death').length,1);
});
test('Clown accepted damage stuns for .7 seconds and blocks all four weapons and movement',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createClownGame(weapon);g.player.x=0;g.player.z=15;assert.ok(hurt(g,10,'test'));g.hitstop=0;g.clown.stunT=10;const {x,z}=g.player;
  for(const input of ['light','skill','roll','heal','charge-start','charge-release'])assert.equal(act(g,input),false,input);
  advance(g,.69,stepClown,{x:1,z:1});near(g.player.x,x);near(g.player.z,z);assert.equal(playerIncapacitated(g.player),true);advance(g,.01,stepClown);assert.equal(playerIncapacitated(g.player),false);assert.equal(act(g,'roll'),true);
 }
});
test('invulnerability prevents clown stun, and pause leaves its clock untouched',()=>{
 const g=createClownGame();g.player.invuln=1;assert.equal(hurt(g,10,'no'),false);assert.equal(g.player.traits,undefined);g.player.invuln=0;hurt(g,10,'yes');tickBossHitTraits(g,0);assert.equal(g.player.traits.stun,.7);
});
test('a telegraphed phase-one charge respects invulnerability and never fabricates crush events',()=>{
 const g=createDicePlayerGame(),hp=g.player.hp;
 g.player.x=g.player.z=0;g.player.invuln=99;
 Object.assign(g.dice,{state:'charge',t:0,from:{x:0,z:0},to:{x:0,z:0,index:60},pose:{...g.dice.pose,x:0,z:0}});
 stepDicePlayer(g,.01);
 assert.equal(g.status,'playing');
 assert.equal(g.player.hp,hp,'ordinary charge must obey invulnerability');
 assert.equal(g.events.filter(e=>e.type==='player-crushed').length,0);
});
test('crush prevents player input for one second, then restores attacks without altering collision state',()=>{
 const g=createDicePlayerGame();g.dice.state='recovery';g.dice.t=-100;g.player.x=20;g.player.z=20;applyBossHitTrait(g,20,{boss:'dice'});const {x,z}=g.player;
 advance(g,.99,stepDicePlayer,{x:1,z:1});near(g.player.x,x);near(g.player.z,z);assert.ok(playerIncapacitated(g.player));advance(g,.01,stepDicePlayer);assert.equal(playerIncapacitated(g.player),false);assert.equal(actDice(g,'light'),true);
});
test('low-health ordinary charge may kill but never bypasses explicit roll protection',()=>{
 const g=createDiceGame();g.player.hp=20;g.player.x=g.player.z=0;
 Object.assign(g.dice,{state:'charge',t:0,from:{x:0,z:0},to:{x:0,z:0,index:60},pose:{...g.dice.pose,x:0,z:0}});
 stepDice(g,.01);
 assert.equal(g.status,'lost');assert.equal(g.player.hp,0);
 assert.equal(g.events.filter(e=>e.type==='death').length,1);
 const protectedHit=createDiceGame();protectedHit.player.invuln=1;protectedHit.player.x=protectedHit.player.z=0;
 Object.assign(protectedHit.dice,{state:'charge',t:0,from:{x:0,z:0},to:{x:0,z:0,index:60},pose:{...protectedHit.dice.pose,x:0,z:0}});
 stepDice(protectedHit,.01);
 assert.equal(protectedHit.player.hp,protectedHit.player.maxHp);
 assert.equal(protectedHit.status,'playing');
});
test('Blood heals from accepted damage only, caps at max health and does not drain during roll protection',()=>{
 const hit=(roll=false)=>{const g=createBloodGame();g.boss.hp=4000;g.player.x=0;g.player.z=-5;startBloodPattern(g,'burst');if(roll)g.player.invuln=10;advance(g,g.blood.hazards[0].warn+.3,stepBlood);return g;};
 const g=hit();const actual=playerIncomingDamage(g,38);near(g.player.hp,g.player.maxHp-actual);near(g.boss.hp,4000+actual*.25);assert.ok(g.player.traits.drain>0);const missed=hit(true);assert.equal(missed.boss.hp,4000);assert.equal(missed.player.traits,undefined);
 g.boss.hp=g.boss.maxHp-1;applyBossHitTrait(g,20,{boss:'blood'});assert.equal(g.boss.hp,g.boss.maxHp);
});
test('drain is proportional to actual health lost, while terminal state cannot heal or retain icons',()=>{
 const g=createBloodGame();g.boss.hp=4000;g.player.hp=3;g.player.x=0;g.player.z=-5;startBloodPattern(g,'burst');advance(g,g.blood.hazards[0].warn+.3,stepBlood);assert.equal(g.status,'lost');near(g.boss.hp,4000.75);assert.equal(activeBossTrait(g),null);applyBossHitTrait(g,100,{boss:'blood'});near(g.boss.hp,4000.75);clearBossHitTraits(g);assert.equal(g.player.traits.drain,0);
});
test('trait presentation contains only SVG shapes, restores body squash and disposes pooled resources',()=>{
 for(const symbol of Object.values(TRAIT_SYMBOLS))assert.doesNotMatch(symbol,/<(?:text|title|foreignObject)\b/i);
 const scene=new THREE.Scene(),body=new THREE.Group();body.position.y=1;scene.add(body);const view=createBossHitTraitView(scene,body,null),camera=new THREE.PerspectiveCamera(),g=createDicePlayerGame();applyBossHitTrait(g,10,{boss:'dice'});
 for(let i=0;i<100;i++)view.update(g,camera);near(body.scale.y,.32);near(body.position.y,.32);clearBossHitTraits(g);view.update(g,camera);near(body.scale.y,1);near(body.position.y,1);view.dispose();view.dispose();assert.equal(scene.children.length,1);
});
test('a cloned encounter HUD discards inherited status icons instead of retaining a previous boss effect',()=>{
 let removed=0;const shell={ownerDocument:{createElement:()=>({style:{},setAttribute(){},remove(){}})},querySelectorAll:()=>[{remove(){removed++;}}],appendChild(){}};
 const scene=new THREE.Scene(),body=new THREE.Group(),view=createBossHitTraitView(scene,body,shell);assert.equal(removed,1);view.dispose();
});
