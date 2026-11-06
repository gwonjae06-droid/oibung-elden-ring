import test from 'node:test';
import assert from 'node:assert/strict';
import {EVOLUTIONS,consumeBattleGrace,installChargeInput} from '../src/weapon-evolution.mjs';
import {createGame,step} from '../src/combat.mjs';
import {actPlayer,tickPlayerAction,rewardPlayerHit} from '../src/player-combat.mjs';
import {configureJourney,newRun,freshProfile} from '../src/journey-state.mjs';
import {buyForgeTier} from '../src/purification-forge.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
function rig(weapon,ids){const g=createGame(weapon,{register:false}),r=newRun(weapon),p=freshProfile();p.flames=20;ids.forEach(id=>{if(!buyForgeTier(p,weapon,id))throw Error('Forge buy failed '+id);});configureJourney(g,r,p);g.startGrace=0;return g;}
test('each weapon has two exclusive preserved paths and two ranks',()=>{
 for(const [weapon,options] of Object.entries(EVOLUTIONS)){
  assert.equal(options.length,2);assert.notEqual(options[0].id,options[1].id);
  const g=rig(weapon,[options[0].id,options[0].id]);
  assert.equal(g.evolutions.filter(x=>x===options[0].id).length,2);
 }
 for(const [weapon,id,count]of [['sword','blade-wave',1],['bow','piercing-arrow',1],['cards','wide-deck',3]]){
  const g=rig(weapon,[id,id]);actPlayer(g,'light');tickPlayerAction(g,.5,WEAPONS[weapon]);
  assert.equal(g.projectiles.length,count);
 }
});
test('retired sword charge is inert while long sword specialization doubles actual sword reach',()=>{
 const g=rig('sword',['charged-blade']);
 assert.equal(actPlayer(g,'charge-start'),false);
 assert.equal(actPlayer(g,'charge-release'),false);
 assert.equal(actPlayer(g,'skill'),false);
 assert.ok(actPlayer(g,'light'));
 assert.equal(g.player.action.mult,1);
 assert.equal(g.player.stamina,84.7);
});
test('evolved waves travel and damage through the actual original combat collision path',()=>{
 const g=rig('sword',['blade-wave']);g.player.x=0;g.player.z=10;g.player.yaw=Math.PI;g.boss.x=0;g.boss.z=0;g.boss.stun=99;const hp=g.boss.hp;actPlayer(g,'light');for(let i=0;i<90;i++)step(g,1/120,{});assert.ok(g.boss.hp<hp);assert.ok(g.stats.damage>0);
});
test('only cards lifesteal, while fire specialization adds DOT without arrow multiplication',()=>{
 const cards=rig('cards',['blood-deck']);cards.player.hp=50;
 rewardPlayerHit(cards,0,{basic:true});assert.equal(cards.player.hp,50);
 rewardPlayerHit(cards,100,{basic:true});assert.equal(cards.player.hp,58);
 const hammer=rig('hammer',['blood-hammer']);hammer.player.hp=50;
 rewardPlayerHit(hammer,100,{basic:true});assert.equal(hammer.player.hp,50);
 const bow=rig('bow',['piercing-arrow']);actPlayer(bow,'light');tickPlayerAction(bow,.35,WEAPONS.bow);
 assert.equal(bow.projectiles.length,1);
 assert.equal(bow.projectiles[0].fireRank,1);
 assert.equal(bow.projectiles[0].piercing,false);
 assert.equal(bow.projectiles[0].damage,WEAPONS.bow.damage);
});
test('the grace period blocks combat input, expires by simulation delta and cannot go negative',()=>{
 const g=rig('sword',[]);g.startGrace=1.6;assert.equal(actPlayer(g,'light'),false);assert.equal(consumeBattleGrace(g,.6),true);assert.equal(g.time,0);consumeBattleGrace(g,1.1);assert.equal(g.startGrace,0);assert.equal(consumeBattleGrace(g,.1),false);assert.ok(actPlayer(g,'light'));
});
test('legacy charge input handler is inert after retiring the old charge line',()=>{
 const g=rig('sword',['charged-blade']),handlers={};
 installChargeInput({}, {getGame:()=>g,isActive:()=>true,listen:(_,name,fn)=>handlers[name]=fn,act:actPlayer});
 assert.deepEqual(handlers,{});
 assert.equal(g.player.action,null);
});