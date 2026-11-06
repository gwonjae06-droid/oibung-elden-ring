import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEAPON_STATS,weaponStats,playerIncomingDamage} from '../src/weapon-stats.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame,hurt as hurtClown} from '../src/clown-combat.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createDiceGame} from '../src/dice-combat.mjs';
import {stepDiceRoulette} from '../src/dice-roulette-attack.mjs';
import {playerWalkSpeed,playerRollSpeed,PLAYER_WALK_SPEED,PLAYER_ROLL_SPEED} from '../src/player-movement-rules.mjs';
import {tickPlayerResources,completePlayerHeal} from '../src/player-tick.mjs';
import {PRESSURE} from '../src/clown-pressure.mjs';
import {SKILLS} from '../src/skills.mjs';

const CASES={
 sword:{maxHp:125,incomingDamage:.95,walkSpeed:1,rollDistance:1,staminaRegen:1},
 hammer:{maxHp:145,incomingDamage:.90,walkSpeed:.90,rollDistance:.95,staminaRegen:.90},
 bow:{maxHp:100,incomingDamage:1.05,walkSpeed:1.05,rollDistance:1.05,staminaRegen:1.10},
 cards:{maxHp:110,incomingDamage:1,walkSpeed:1,rollDistance:1,staminaRegen:1}
};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,
 'expected '+expected+', got '+actual);

test('each weapon owns an immutable five-stat profile and unknown dice state stays neutral',()=>{
 assert.deepEqual(Object.keys(WEAPON_STATS).sort(),Object.keys(CASES).sort());
 for(const [id,expected]of Object.entries(CASES)){
  assert.deepEqual(weaponStats(id),expected);
  assert.equal(Object.isFrozen(weaponStats(id)),true);
  near(playerIncomingDamage({weapon:id},100),100*expected.incomingDamage);
 }
 assert.equal(weaponStats('missing').maxHp,120);
 assert.equal(weaponStats('__proto__').incomingDamage,1);
 assert.equal(playerIncomingDamage({weapon:'sword'},-3),0);
 assert.equal(playerIncomingDamage({weapon:'sword'},Number.NaN),0);
 assert.equal(createDiceGame().player.maxHp,120,'unarmed low-level dice simulation remains neutral');
});

test('all four story boss entry points initialize equipped HP, not a shared 120',()=>{
 const factories=[
  id=>createGame(id,{register:false}),
  id=>createClownGame(id,{register:false}),
  id=>createDicePlayerGame(id),
  id=>createBloodGame(id)
 ];
 for(const [weapon,stats]of Object.entries(CASES)){
  for(const factory of factories){
   const g=factory(weapon);
   assert.equal(g.weapon,weapon);
   assert.equal(g.player.weapon,weapon);
   assert.equal(g.player.hp,stats.maxHp);
   assert.equal(g.player.maxHp,stats.maxHp);
   assert.equal(g.player.stamina,100);
  }
 }
});

test('move, dodge and stamina regeneration scale without altering existing skill bonuses',()=>{
 for(const [weapon,stats]of Object.entries(CASES)){
  const game=createGame(weapon,{register:false}),p=game.player;
  near(playerWalkSpeed(p),PLAYER_WALK_SPEED*stats.walkSpeed);
  near(playerRollSpeed(game),PLAYER_ROLL_SPEED*stats.rollDistance);
  near(playerWalkSpeed(p,.65),PLAYER_WALK_SPEED*stats.walkSpeed*.65);
  p.stamina=20;p.regen=0;p.action=null;
  tickPlayerResources(game,.5);
  near(p.stamina,20+15*stats.staminaRegen);
  p.hp=stats.maxHp-4;
  completePlayerHeal(game,{kind:'heal',done:false,t:1});
  assert.equal(p.hp,stats.maxHp);
 }
 const bow=createGame('bow',{register:false});
 bow.evolutions=['piercing-arrow','piercing-arrow'];
 near(playerRollSpeed(bow),PLAYER_ROLL_SPEED*1.05);
});

test('clown damage applies phase pressure first and then weapon defense, with accurate events',()=>{
 for(const [weapon,stats]of Object.entries(CASES)){
  const g=createClownGame(weapon,{register:false});
  const base=Math.round(30*PRESSURE.damage[0]),applied=base*stats.incomingDamage;
  assert.equal(hurtClown(g,30,'test-clown'),true);
  near(g.player.hp,stats.maxHp-applied);
  near(g.events.find(e=>e.type==='player-hit').amount,applied);
 }
});

test('casino roulette projectiles deal scaled damage while conserving their dodge rules',()=>{
 for(const [weapon,stats]of Object.entries(CASES)){
  const g=createDicePlayerGame(weapon),p=g.player;
  g.dice.roulette=null;
  g.dice.rouletteShots=[{x:p.x,z:p.z,vx:0,vz:0,age:.5,life:1,radius:2,damage:20}];
  stepDiceRoulette(g,.01);
  near(p.hp,stats.maxHp-20*stats.incomingDamage);
  assert.equal(g.dice.rouletteShots.length,0);
  const hit=g.events.find(e=>e.type==='player-hit');
  near(hit.amount,20*stats.incomingDamage);
 }
});

test('remaining combat damage handlers share the same incoming scaling and weapon identity remains independent from forge skills',()=>{
 for(const path of ['combat','clown-combat','blood-combat','dice-combat','dice-giant','dice-roulette-attack','boss-hit-traits']){
  const s=readFileSync(new URL('../src/'+path+'.mjs',import.meta.url),'utf8');
  assert.match(s,/playerIncomingDamage\(/,path);
 }
 const dice=readFileSync(new URL('../src/dice-combat.mjs',import.meta.url),'utf8');
 assert.match(dice,/R\.playerSpeed\*weaponStats\(g\.weapon\)\.walkSpeed/);
 assert.equal(SKILLS.sword.name,'검술');
 assert.equal(SKILLS.hammer.name,'망치 기술');
 assert.equal(SKILLS.bow.name,'궁술');
 assert.deepEqual(Object.keys(SKILLS),['sword','hammer','bow','cards']);
 const journey=readFileSync(new URL('../src/journey.mjs',import.meta.url),'utf8');
 assert.match(journey,/j-weapon-statline/);
});
