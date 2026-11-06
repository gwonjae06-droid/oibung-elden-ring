import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPONS} from '../src/weapon-data.mjs';
import {createGame,act,skillView} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';
import {playerMeleeReach,WEAPON_ACTIVE_COOLDOWN,tickWeaponBurn} from '../src/weapon-abilities.mjs';
import {advancePlayerProjectile,tickPlayerAction,rewardPlayerHit} from '../src/player-combat.mjs';
import {EVOLUTIONS} from '../src/weapon-evolution.mjs';
import {forgeInventory,forgedEvolutions,buyForgeTier} from '../src/purification-forge.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,'expected '+b+' got '+a);
const prepare=(weapon,id)=>{const g=createGame(weapon,{register:false});g.evolutions=id?[id]:[];g.boss.wait=999;return g;};

test('every weapon exposes precisely two mutually exclusive forge skills, with no unearned active skill',()=>{
 for(const id of ['sword','hammer','bow','cards']){
  assert.equal(EVOLUTIONS[id].length,2);
  const g=prepare(id);assert.equal(act(g,'skill'),false);
  const profile={forge:forgeInventory(),flames:3,earnedFlames:3};
  assert.equal(buyForgeTier(profile,id,EVOLUTIONS[id][0].id),true);
  assert.equal(buyForgeTier(profile,id,EVOLUTIONS[id][1].id),false);
  assert.deepEqual(forgedEvolutions(profile,id),[EVOLUTIONS[id][0].id]);
 }
});
test('sword wave is cast on normal swing and alternate path doubles the true melee reach',()=>{
 const wave=prepare('sword','blade-wave');assert.equal(act(wave,'light'),true);
 tickPlayerAction(wave,.18,WEAPONS.sword);assert.equal(wave.projectiles.length,1);
 assert.equal(wave.projectiles[0].kind,'wave');
 const long=prepare('sword','charged-blade');near(playerMeleeReach(long,2.85),5.7);
 assert.equal(long.projectiles.length,0);assert.equal(act(long,'skill'),false);
});
test('hammer absorbs exactly half of scaled received damage for 1.2 seconds and spends saved damage on the next strike',()=>{
 const g=prepare('hammer','earth-wave');assert.equal(act(g,'skill'),true);
 near(playerIncomingDamage(g,100),45);
 near(g.player.skill.storedDamage,45);
 tickPlayerAction(g,1.21,WEAPONS.hammer);
 near(playerIncomingDamage(g,100),90);
 assert.equal(act(g,'light'),true);
 near(g.player.action.bankedBonus,45);assert.equal(g.player.skill.storedDamage,0);
});
test('hammer flight is a physical returning projectile with 1.3x poise',()=>{
 const g=prepare('hammer','blood-hammer');assert.equal(act(g,'skill'),true);
 tickPlayerAction(g,.25,WEAPONS.hammer);assert.equal(g.projectiles.length,1);
 const q=g.projectiles[0];assert.equal(q.kind,'hammer-throw');near(q.poise,WEAPONS.hammer.poise*1.3);
 assert.equal(q.returningHammer,true);
 for(let i=0;i<100&&q.life>0;i++)advancePlayerProjectile(q,.03,g.player);
 assert.equal(q.life<=0,true,'auto returns without manual recall');
});
test('bow backstep fires exactly two regular-strength arrows while moving backward',()=>{
 const g=prepare('bow','twin-arrow');
 assert.equal(act(g,'skill'),true);
 let backed=0;tickPlayerAction(g,.21,WEAPONS.bow,{backstep:(_a,h)=>{backed+=h;}});
 near(backed,.21);assert.equal(g.projectiles.length,2);
 for(const q of g.projectiles){assert.equal(q.damage,WEAPONS.bow.damage);assert.equal(q.piercing,false);}
});
test('bow fire arrow applies additional damage over time approximately equal to its landed hit',()=>{
 const g=prepare('bow','piercing-arrow');let dot=0;
 g.applyBonusDamage=(n)=>{dot+=n;return n;};
 rewardPlayerHit(g,42,{basic:true},{canStun:true});
 assert.equal(g.weaponBurnStacks.length,1);
 for(let i=0;i<160;i++)tickWeaponBurn(g,.02);
 near(dot,42);
});
test('card sigil charges once per accepted basic volley, bursts on third hit and causes a short stun',()=>{
 const g=prepare('cards','wide-deck');let bonus=0,stun=0;
 g.applyBonusDamage=(n)=>{bonus+=n;return n;};
 const settle=(a)=>rewardPlayerHit(g,20,a,{canStun:true,stun:n=>stun=n});
 const a={basic:true};settle(a);settle(a);assert.equal(g.player.skill.sigilMarks,1);
 settle({basic:true});assert.equal(g.player.skill.sigilMarks,2);
 settle({basic:true});assert.equal(g.player.skill.sigilMarks,0);
 assert.ok(bonus>0);assert.ok(stun>0);
 assert.equal(act(g,'skill'),false);
});
test('card lifesteal applies only to accepted hits, never overheals',()=>{
 const g=prepare('cards','blood-deck');g.player.hp=40;
 rewardPlayerHit(g,100,{basic:true});near(g.player.hp,48);
 g.player.hp=g.player.maxHp-1;rewardPlayerHit(g,100,{basic:true});
 near(g.player.hp,g.player.maxHp);
});
test('all four arenas provide a boss-aware handler for sigil and burn extra hits',()=>{
 for(const factory of [()=>prepare('sword'),()=>createClownGame('sword',{register:false}),()=>createBloodGame('sword'),()=>createDicePlayerGame('sword')]){
  const g=factory();assert.equal(typeof g.applyBonusDamage,'function');
 }
 assert.equal(WEAPON_ACTIVE_COOLDOWN['twin-arrow'],10);
});
