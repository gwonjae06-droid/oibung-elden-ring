import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,patternConfig,attackZone,HUG_TIME} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {actPlayer,tickPlayerAction} from '../src/player-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {kwonCloseSituation,chooseKwonCloseDefense,KWON_CLOSE_DEFENSE} from '../src/kwon-close-defense.mjs';
import {playerRolling} from '../src/player-movement-rules.mjs';

test('front/rear/flank and prolonged proximity choose distinct authored Kwon defenses',()=>{
 const b={x:0,z:0,yaw:0,state:'idle',stun:0,punishable:false,closeCooldown:0,hug:.85};
 assert.deepEqual([kwonCloseSituation(b,{x:0,z:2}).region,kwonCloseSituation(b,{x:0,z:-2}).region,kwonCloseSituation(b,{x:2,z:0}).region],['front','rear','flank']);
 assert.equal(chooseKwonCloseDefense(b,{x:0,z:2}),'shove');
 assert.equal(chooseKwonCloseDefense({...b,hug:.3},{x:0,z:-2}),'backsweep');
 assert.equal(chooseKwonCloseDefense({...b,hug:.45},{x:2,z:0}),'retreat');
 assert.equal(chooseKwonCloseDefense({...b,hug:HUG_TIME+.1},{x:0,z:2}),'stomp');
 assert.equal(chooseKwonCloseDefense({...b,hug:.03},{x:0,z:2}),null);
 assert.equal(chooseKwonCloseDefense(b,{x:0,z:4}),null);
 assert.equal(chooseKwonCloseDefense({...b,closeCooldown:1},{x:0,z:2}),null);
 assert.equal(chooseKwonCloseDefense({...b,state:'recovery'},{x:0,z:2}),null);
 assert.equal(chooseKwonCloseDefense({...b,punishable:true},{x:0,z:2}),null);
 assert.equal(chooseKwonCloseDefense({...b,stun:.2},{x:0,z:2}),null);
 assert.equal(KWON_CLOSE_DEFENSE.cooldown>patternConfig({pattern:'shove',phase:1}).wind,true);
});

test('AI only begins visible counter windup from idle, with no instant contact damage',()=>{
 for(const [position,hug,expected] of [
  [{x:0,z:2},.8,'shove'],
  [{x:0,z:-2},.3,'backsweep'],
  [{x:2,z:0},.5,'retreat'],
  [{x:0,z:2},1.7,'stomp']
 ]){
  const g=createGame('sword',{register:false,seed:900}),b=g.boss,p=g.player;
  b.x=b.z=0;b.yaw=0;b.wait=100;b.state='idle';b.hug=hug;
  p.x=position.x;p.z=position.z;p.action=null;
  const hp=p.hp;
  step(g,1/120);
  assert.equal(b.pattern,expected,expected);
  assert.equal(b.state,'windup',expected);
  assert.equal(b.hit,false);
  assert.equal(p.hp,hp,'counter must be telegraphed before damage');
  assert.ok(b.closeCooldown>KWON_CLOSE_DEFENSE.cooldown-.1);
  assert.equal(b.queue.length,0,'counter must leave a proper punish recovery');
  if(expected==='backsweep')assert.ok(Math.abs(b.turnTarget-Math.PI)<.01,'rear counter visibly turns toward the player');
  if(expected==='stomp')assert.equal(attackZone(b)?.r,6.5);
 }
});

test('Kwon never cancels a recovery, stagger or a committed combo to counter a hug',()=>{
 for(const state of ['recovery','stagger','windup','active']){
  const g=createGame('sword',{register:false}),b=g.boss;
  b.x=b.z=0;b.yaw=0;g.player.x=0;g.player.z=2;
  b.hug=3;b.state=state;b.pattern='sweep';b.queue=['cross'];b.wait=0;b.recovery=1;
  b.t=0;if(state==='stagger')b.t=0;
  step(g,1/120);
  assert.equal(b.pattern,'sweep',state);
  assert.deepEqual(b.queue,['cross']);
  assert.equal(b.closeCooldown,0);
 }
});

test('accepted basic dodge cancels windup immediately in every weapon and keeps stamina costs',()=>{
 for(const weapon of Object.keys(WEAPONS)){
  const g=createGame(weapon,{register:false,seed:14});
  assert.equal(actPlayer(g,'light'),true);
  const original=g.player.action,stamina=g.player.stamina;
  assert.equal(original.kind,'attack');
  assert.equal(actPlayer(g,'roll'),true,weapon);
  assert.equal(g.player.action.kind,'roll',weapon);
  assert.equal(g.player.action.t,0,'roll begins in same input frame');
  assert.ok(Math.abs((stamina-g.player.stamina)-playerStaminaCost(25))<1e-8,weapon);
  tickPlayerAction(g,.02,WEAPONS[weapon]);
  assert.equal(g.events.filter(e=>e.type==='swing').length,0,'cancelled windup may not fire');
  assert.equal(g.projectiles.length,0,'cancelled windup may not spawn projectiles');
 }
});

test('a released attack keeps its earned damage/projectile, but its follow-through can be cancelled',()=>{
 const g=createGame('cards',{register:false});
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,WEAPONS.cards.wind+.01,WEAPONS.cards);
 const shots=g.projectiles.length;
 assert.ok(shots>0);
 const events=g.events.filter(e=>e.type==='shot').length;
 assert.equal(actPlayer(g,'roll'),true);
 tickPlayerAction(g,.05,WEAPONS.cards);
 assert.equal(g.projectiles.length,shots);
 assert.equal(g.events.filter(e=>e.type==='shot').length,events);
});

test('dodge cancellation never bypasses stamina, heal, hurt, roll or special commitments',()=>{
 const g=createGame('sword',{register:false});
 actPlayer(g,'light');const attack=g.player.action;
 g.player.stamina=1;
 assert.equal(actPlayer(g,'roll'),false);
 assert.equal(g.player.action,attack,'no cancellation if the roll cannot be afforded');
 for(const kind of ['skill','heal','hurt','roll']){
  g.player.action={kind,t:0,basic:false};
  assert.equal(actPlayer(g,'roll'),false,kind);
  assert.equal(g.player.action.kind,kind);
 }
});

test('the normal delayed roll invulnerability window is not made permanent by animation cancel',()=>{
 const g=createGame('sword',{register:false});
 actPlayer(g,'light');assert.equal(actPlayer(g,'roll'),true);
 assert.equal(playerRolling(g.player),false);
 g.player.action.t=.1;assert.equal(playerRolling(g.player),true);
 g.player.action.t=.4;assert.equal(playerRolling(g.player),false);
});

test('all four boss encounters share normal-attack-to-roll cancellation',()=>{
 const factories=[createGame,createClownGame,createBloodGame,createDicePlayerGame];
 for(const factory of factories){
  const g=factory('sword',{register:false,seed:30});
  assert.equal(actPlayer(g,'light'),true,factory.name);
  assert.equal(actPlayer(g,'roll'),true,factory.name);
  assert.equal(g.player.action.kind,'roll',factory.name);
 }
});
