import test from 'node:test';
import assert from 'node:assert/strict';
import {EVOLUTIONS,consumeBattleGrace,installChargeInput} from '../src/weapon-evolution.mjs';
import {createGame,step} from '../src/combat.mjs';
import {actPlayer,tickPlayerAction,rewardPlayerHit} from '../src/player-combat.mjs';
import {configureJourney,newRun,freshProfile} from '../src/journey-state.mjs';
import {buyForgeTier} from '../src/purification-forge.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
function rig(weapon,ids){const g=createGame(weapon,{register:false}),r=newRun(weapon),p=freshProfile();p.flames=20;ids.forEach(id=>{if(!buyForgeTier(p,weapon,id))throw Error('Forge buy failed '+id);});configureJourney(g,r,p);g.startGrace=0;return g;}
test('each weapon has two paths and tiers enhance effects without multiplying bow or card projectiles',()=>{
 for(const [weapon,options] of Object.entries(EVOLUTIONS)){assert.equal(options.length,2);assert.notEqual(options[0].id,options[1].id);}
 for(const [weapon,id,count] of [['sword','blade-wave',1],['hammer','earth-wave',0],['bow','twin-arrow',1],['cards','wide-deck',3]]){const g=rig(weapon,[id,id]);actPlayer(g,'light');tickPlayerAction(g,.5,WEAPONS[weapon]);assert.equal(g.projectiles.length,count);assert.ok(g.projectiles.every(q=>q.damage>0&&Number.isFinite(q.speed)));}
});
test('expanded sword reach is passive and never installs charging input',()=>{
 const g=rig('sword',['charged-blade']);
 assert.equal(actPlayer(g,'charge-start'),false);
 assert.equal(actPlayer(g,'skill'),false);
 assert.equal(g.player.stamina,100);
 assert.equal(actPlayer(g,'light'),true);
 assert.equal(g.player.action.kind,'attack');
});
test('evolved waves travel and damage through the actual original combat collision path',()=>{
 const g=rig('sword',['blade-wave']);g.player.x=0;g.player.z=10;g.player.yaw=Math.PI;g.boss.x=0;g.boss.z=0;g.boss.stun=99;const hp=g.boss.hp;actPlayer(g,'light');for(let i=0;i<90;i++)step(g,1/120,{});assert.ok(g.boss.hp<hp);assert.ok(g.stats.damage>0);
});
test('card lifesteal only rewards accepted damage; flaming arrows remain single non-piercing projectiles',()=>{
 const g=rig('cards',['blood-deck']);g.player.hp=50;
 rewardPlayerHit(g,0,{basic:true});assert.equal(g.player.hp,50);
 rewardPlayerHit(g,100,{basic:true});assert.equal(g.player.hp,56);
 const bow=rig('bow',['piercing-arrow']);actPlayer(bow,'light');tickPlayerAction(bow,.47,WEAPONS.bow);
 assert.equal(bow.projectiles.length,1);
 assert.equal(bow.projectiles[0].fireRank,1);
 assert.equal(bow.projectiles[0].piercing,false);
 assert.equal(bow.projectiles[0].damage,WEAPONS.bow.damage);
});
test('the grace period blocks combat input, expires by simulation delta and cannot go negative',()=>{
 const g=rig('sword',[]);g.startGrace=1.6;assert.equal(actPlayer(g,'light'),false);assert.equal(consumeBattleGrace(g,.6),true);assert.equal(g.time,0);consumeBattleGrace(g,1.1);assert.equal(g.startGrace,0);assert.equal(consumeBattleGrace(g,.1),false);assert.ok(actPlayer(g,'light'));
});
test('retired charge-input helper deliberately installs no listeners',()=>{
 const g=rig('sword',['charged-blade']);let handlers=0;
 installChargeInput({}, {getGame:()=>g,isActive:()=>true,listen:()=>handlers++,act:actPlayer});
 assert.equal(handlers,0);
});
