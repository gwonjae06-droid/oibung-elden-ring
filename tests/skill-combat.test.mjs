import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,skillView} from '../src/combat.mjs';
import {actPlayer,tickPlayerAction,rewardPlayerHit} from '../src/player-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';
import {registerSpecialHit,tickWeaponBurn} from '../src/weapon-specialization.mjs';
const make=(weapon,id)=>{const g=createGame(weapon,{register:false});g.evolutions=id?[id]:[];return g;};
test('forge is the only source of right-click weapon actives',()=>{
 for(const w of ['sword','hammer','bow','cards'])assert.equal(act(make(w),'skill'),false);
 for(const [w,id]of [['sword','blade-wave'],['sword','charged-blade'],['bow','piercing-arrow'],['cards','wide-deck'],['cards','blood-deck']]){
  const g=make(w,id);assert.equal(act(g,'skill'),false);
  assert.equal(skillView(g).ready,false);
 }
});
test('sword wave is a basic-attack effect, not a default haste cast',()=>{
 const g=make('sword','blade-wave');
 assert.equal(act(g,'light'),true);
 tickPlayerAction(g,.2,WEAPONS.sword);
 assert.equal(g.projectiles.filter(q=>q.kind==='wave').length,1);
 assert.equal(g.player.skill.haste,0);
 assert.equal(skillView(g).name,'검기');
});
test('hammer guard stores 50 percent mitigated damage for the next real basic',()=>{
 const g=make('hammer','earth-wave');
 assert.equal(act(g,'skill'),true);
 tickPlayerAction(g,.3,WEAPONS.hammer);
 assert.equal(playerIncomingDamage(g,40),18);
 assert.equal(g.player.skill.storedDamage,18);
 tickPlayerAction(g,1,WEAPONS.hammer);
 assert.equal(act(g,'light'),true);
 assert.equal(g.player.action.bonusDamage,18);
});
test('throwing hammer applies 1.3x poise and does not grant the retired lifesteal',()=>{
 const g=make('hammer','blood-hammer');
 assert.equal(act(g,'skill'),true);
 tickPlayerAction(g,.4,WEAPONS.hammer);
 assert.equal(g.projectiles.length,1);
 assert.equal(g.projectiles[0].kind,'hammer-throw');
 assert.equal(g.projectiles[0].poise,WEAPONS.hammer.poise*1.3);
 g.player.hp=30;rewardPlayerHit(g,100,{skill:true,basic:false});assert.equal(g.player.hp,30);
});
test('bow backstep fires two basic arrows, burn line instead fires one with DOT',()=>{
 const leap=make('bow','twin-arrow');
 assert.equal(act(leap,'skill'),true);
 tickPlayerAction(leap,.2,WEAPONS.bow);
 assert.equal(leap.projectiles.length,2);
 const burn=make('bow','piercing-arrow');
 assert.equal(act(burn,'skill'),false);
 assert.equal(act(burn,'light'),true);
 tickPlayerAction(burn,.4,WEAPONS.bow);
 assert.equal(burn.projectiles.length,1);
 assert.equal(burn.projectiles[0].fireRank,1);
 registerSpecialHit(burn,60,burn.projectiles[0].source,{fireRank:1});
 let dealt=0;for(let i=0;i<30;i++)tickWeaponBurn(burn,.1,damage=>(dealt+=damage,damage));
 assert.ok(Math.abs(dealt-60)<.0001);
});
test('card mark burst triggers after three valid hits; lifesteal is exclusive',()=>{
 const cards=make('cards','wide-deck');
 let bonus=0;
 for(let i=0;i<3;i++)registerSpecialHit(cards,30,{basic:true},{bonus:(damage)=>{bonus+=damage;return damage;}});
 assert.ok(bonus>0);assert.equal(cards.boss.cardMarks,0);
 const heal=make('cards','blood-deck');heal.player.hp=10;
 rewardPlayerHit(heal,100,{basic:true});assert.equal(heal.player.hp,18);
 assert.equal(heal.boss.cardMarks||0,0);
});
