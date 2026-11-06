import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createSkillState} from '../src/skills.mjs';
import {actPlayer,tickPlayerAction,advancePlayerProjectile,rewardPlayerHit} from '../src/player-combat.mjs';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {EVOLUTIONS} from '../src/weapon-evolution.mjs';
import {ABILITY_BRANCHES,equippedAbility,abilityDisplay,registerSpecialHit,tickWeaponBurn} from '../src/weapon-specialization.mjs';
import {syncWeaponSpecializationVisuals} from '../src/player-weapons.mjs';
import {forgeInventory,forgedEvolutions} from '../src/purification-forge.mjs';
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-6,`${x} != ${y}`);

test('exactly two exclusive forge branches per weapon, matching legacy save IDs',()=>{
 for(const [weapon,branches] of Object.entries(ABILITY_BRANCHES)){
  assert.equal(branches.length,2);
  assert.deepEqual(branches.map(b=>b.id),EVOLUTIONS[weapon].map(b=>b.id));
  const inventory=forgeInventory();inventory[weapon][branches[1].id]=1;
  assert.deepEqual(forgedEvolutions({forge:inventory},weapon),[branches[1].id]);
 }
});
test('unforged weapons have no universal right-click skill in any encounter',()=>{
 const factories=[w=>createGame(w,{register:false}),w=>createClownGame(w,{register:false}),w=>createBloodGame(w),w=>createDicePlayerGame(w)];
 for(const w of Object.keys(ABILITY_BRANCHES))for(const create of factories){
  const g=create(w);
  assert.equal(equippedAbility(g),null);
  assert.equal(abilityDisplay(g).ready,false);
  assert.equal(actPlayer(g,'skill'),false);
 }
 assert.equal(createSkillState().storedDamage,0);
});
test('sword basic wave is passive and the other forge line doubles visible sword length',()=>{
 const g=createGame('sword',{register:false});g.evolutions=['blade-wave'];
 assert.equal(actPlayer(g,'skill'),false);
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,.25,WEAPONS.sword);
 assert.ok(g.projectiles.some(q=>q.kind==='wave'));
 const fake={weaponRigs:{sword:{scale:{z:1}},hammer:{visible:false}}};
 g.evolutions=['charged-blade'];syncWeaponSpecializationVisuals(fake,g);
 assert.equal(fake.weaponRigs.sword.scale.z,2);
 assert.equal(abilityDisplay(g).ready,false);
});
test('hammer guarding lasts 1.2s, halves mitigated hits and banks blocked damage only once',()=>{
 const g=createGame('hammer',{register:false});g.evolutions=['earth-wave'];
 assert.equal(actPlayer(g,'skill'),true);
 assert.equal(g.player.action.kind,'guard');
 tickPlayerAction(g,.2,WEAPONS.hammer);
 near(playerIncomingDamage(g,40),18);
 near(g.player.skill.storedDamage,18);
 tickPlayerAction(g,1,WEAPONS.hammer);
 assert.equal(g.player.action,null);
 assert.equal(actPlayer(g,'light'),true);
 near(g.player.action.bonusDamage,18);
 assert.equal(g.player.skill.storedDamage,0);
 assert.equal(actPlayer(g,'skill'),false);
});
test('hammer throw flies, gains exactly 1.3x poise and returns to the user',()=>{
 const g=createGame('hammer',{register:false});g.evolutions=['blood-hammer'];
 assert.equal(actPlayer(g,'skill'),true);
 tickPlayerAction(g,.42,WEAPONS.hammer);
 const q=g.projectiles[0];
 assert.equal(q.kind,'hammer-throw');
 near(q.poise,WEAPONS.hammer.poise*1.3);
 assert.equal(q.piercing,true);
 const before=q.z;
 advancePlayerProjectile(q,.4,g.player);
 assert.notEqual(q.z,before);
 advancePlayerProjectile(q,.4,g.player);
 assert.equal(q.returning,true);
 const fake={weaponRigs:{hammer:{visible:true},sword:{scale:{z:1}}}};
 syncWeaponSpecializationVisuals(fake,g);
 assert.equal(fake.weaponRigs.hammer.visible,false);
});
test('bow backstep fires exactly two ordinary arrows and fire specialization leaves full damage DOT',()=>{
 const back=createGame('bow',{register:false});back.evolutions=['twin-arrow'];
 assert.equal(actPlayer(back,'skill'),true);
 let retreat=0;
 tickPlayerAction(back,.20,WEAPONS.bow,{leap:()=>{retreat++;}});
 assert.equal(retreat,1);
 assert.equal(back.projectiles.length,2);
 assert.ok(back.projectiles.every(q=>q.damage===WEAPONS.bow.damage&&q.fireRank===0));
 const fire=createGame('bow',{register:false});fire.evolutions=['piercing-arrow'];
 assert.equal(actPlayer(fire,'skill'),false);
 assert.equal(actPlayer(fire,'light'),true);
 tickPlayerAction(fire,.35,WEAPONS.bow);
 const q=fire.projectiles[0];assert.equal(q.fireRank,1);
 registerSpecialHit(fire,100,q.source,{fireRank:1});
 let total=0;for(let i=0;i<30;i++)tickWeaponBurn(fire,.1,d=>{total+=d;return d;});
 near(total,100);
 assert.equal(fire.boss.weaponBurns.length,0);
});
test('three accepted card projectile hits explode with poise; blocked hits do not count',()=>{
 const g=createGame('cards',{register:false});g.evolutions=['wide-deck'];
 assert.equal(actPlayer(g,'skill'),false);
 let blasts=0,poise=0;
 for(let i=0;i<2;i++){
  registerSpecialHit(g,WEAPONS.cards.damage,{basic:true},{bonus:(d,p)=>{blasts++;poise=p;return d;}});
  assert.equal(g.boss.cardMarks,i+1);
 }
 registerSpecialHit(g,0,{basic:true},{bonus:()=>blasts++});
 assert.equal(g.boss.cardMarks,2);
 registerSpecialHit(g,WEAPONS.cards.damage,{basic:true},{bonus:(d,p)=>{blasts++;poise=p;return d;}});
 assert.equal(g.boss.cardMarks,0);
 assert.equal(blasts,1);
 assert.ok(poise>WEAPONS.cards.poise);
});
test('card second line heals from actual damage, bounded by maximum health',()=>{
 const g=createGame('cards',{register:false});g.evolutions=['blood-deck'];g.player.hp=10;
 rewardPlayerHit(g,100,{basic:true});
 near(g.player.hp,18);
 g.evolutions=['blood-deck','blood-deck'];
 rewardPlayerHit(g,100,{basic:true});
 near(g.player.hp,34);
 rewardPlayerHit(g,10000,{basic:true});
 near(g.player.hp,g.player.maxHp);
});
