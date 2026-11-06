import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAYER_STAMINA_COST_MULTIPLIER,playerStaminaCost} from '../src/balance.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {createGame} from '../src/combat.mjs';
import {createBloodGame,actBlood} from '../src/blood-combat.mjs';
import {createDicePlayerGame,actDice} from '../src/dice-player.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {actPlayer} from '../src/player-combat.mjs';
import {tickPlayerResources} from '../src/player-tick.mjs';

const fresh=weapon=>createGame(weapon,{register:false});
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,actual+' != '+expected);

test('stamina cost is reduced by 15% with predictable one-decimal costs',()=>{
 assert.equal(PLAYER_STAMINA_COST_MULTIPLIER,.85);
 assert.equal(playerStaminaCost(18),15.3);
 assert.equal(playerStaminaCost(27),23);
 assert.equal(playerStaminaCost(17),14.5);
 assert.equal(playerStaminaCost(22),18.7);
 assert.equal(playerStaminaCost(25),21.3);
});
test('basic attacks of all four weapons pay exactly the reduced stamina cost once',()=>{
 for(const [id,weapon] of Object.entries(WEAPONS)){
  const g=fresh(id),cost=playerStaminaCost(weapon.cost);
  assert.ok(actPlayer(g,'light'),id);
  near(g.player.stamina,100-cost);
  assert.equal(actPlayer(g,'light'),false);
  near(g.player.stamina,100-cost);
 }
});
test('roll cost is reduced in each encounter through the shared player action',()=>{
 const encounters=[
  ['kwon',()=>fresh('sword'),actPlayer],
  ['clown',()=>createClownGame('sword',{register:false}),actPlayer],
  ['dice',()=>createDicePlayerGame('sword'),actDice],
  ['blood',()=>createBloodGame('sword'),actBlood],
 ];
 for(const [name,create,act] of encounters){
  const g=create();
  assert.ok(act(g,'roll'),name);
  near(g.player.stamina,78.7);
  assert.equal(g.player.action.kind,'roll');
 }
});
test('stamina checks use the new costs and cannot overdraw',()=>{
 const roll=fresh('sword');roll.player.stamina=21.2;
 assert.equal(actPlayer(roll,'roll'),false);
 near(roll.player.stamina,21.2);
 roll.player.stamina=21.3;
 assert.ok(actPlayer(roll,'roll'));
 near(roll.player.stamina,0);
 const hammer=fresh('hammer');hammer.player.stamina=22.9;
 assert.equal(actPlayer(hammer,'light'),false);
 near(hammer.player.stamina,22.9);
 hammer.player.stamina=23;
 assert.ok(actPlayer(hammer,'light'));
 near(hammer.player.stamina,0);
});
test('journey attack and roll modifiers are both scaled after the final cost is assembled',()=>{
 const g=fresh('sword');g.journey={cost:6,rollCost:31};
 assert.equal(playerStaminaCost(WEAPONS.sword.cost+6),20.4);
 assert.ok(actPlayer(g,'light'));
 near(g.player.stamina,79.6);
 const roll=fresh('sword');roll.journey=g.journey;
 assert.ok(actPlayer(roll,'roll'));
 near(roll.player.stamina,73.6);
});
test('expanded sword reach remains passive with ordinary stamina cost',()=>{
 const g=fresh('sword');g.evolutions=['charged-blade'];
 assert.equal(actPlayer(g,'charge-start'),false);
 near(g.player.stamina,100);
 assert.ok(actPlayer(g,'light'));
 near(g.player.stamina,84.7);
 assert.equal(g.player.action.kind,'attack');
});
test('maximum stamina, recharge speed, and regeneration delay are unchanged',()=>{
 const g=fresh('sword');
 assert.equal(g.player.stamina,100);
 assert.ok(actPlayer(g,'roll'));
 assert.equal(g.player.regen,.85);
 const idle=fresh('sword');
 idle.player.stamina=0;
 tickPlayerResources(idle,.5);
 assert.equal(idle.player.stamina,15);
 tickPlayerResources(idle,10);
 assert.equal(idle.player.stamina,100);
});
