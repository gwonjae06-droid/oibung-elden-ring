import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPONS} from '../src/weapon-data.mjs';
import {createGame} from '../src/combat.mjs';
import {actPlayer,tickPlayerAction,advancePlayerProjectile,rewardPlayerHit} from '../src/player-combat.mjs';
import {tickWeaponBurn,BOW_BURN_DAMAGE_FACTOR} from '../src/weapon-abilities.mjs';
import {RANGED_MAGAZINES} from '../src/ranged-reload.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-6,
  'expected '+expected+', got '+actual);
const shot=(weapon)=>{
 const g=createGame(weapon,{register:false});
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,WEAPONS[weapon].wind+.01,WEAPONS[weapon]);
 return g;
};

test('melee weapon damage, timing and reach are unaffected by the ranged nerf',()=>{
 assert.equal(WEAPONS.sword.damage,Math.round(72*.9));
 assert.equal(WEAPONS.sword.wind,.17);
 assert.equal(WEAPONS.hammer.damage,Math.round(114*.9));
 assert.equal(WEAPONS.hammer.range,3.7);
});

test('bow/card range is real flight lifetime; one card volley still contains three distinct projectiles',()=>{
 for(const [weapon,count] of [['bow',1],['cards',3]]){
  const g=shot(weapon);
  assert.equal(g.projectiles.length,count);
  for(const projectile of g.projectiles){
   assert.equal(projectile.kind,weapon);
   near(projectile.life,WEAPONS[weapon].range/projectile.speed);
   const x=projectile.x,z=projectile.z,remaining=projectile.life;
   advancePlayerProjectile(projectile,remaining);
   near(Math.hypot(projectile.x-x,projectile.z-z),WEAPONS[weapon].range);
   assert.ok(projectile.life<=0);
  }
 }
});

test('bow burn gives at most three quarters of one landed arrow as extra damage',()=>{
 assert.equal(BOW_BURN_DAMAGE_FACTOR,.75);
 const game=shot('bow');
 game.evolutions=['piercing-arrow'];
 const dealt=[];
 game.applyBonusDamage=amount=>{dealt.push(amount);return amount;};
 rewardPlayerHit(game,60,{basic:true});
 for(let i=0;i<200;i++)tickWeaponBurn(game,.02);
 near(dealt.reduce((a,b)=>a+b,0),45);
});

test('cards still lifesteal without overhealing but no longer recover sixteen percent per hit',()=>{
 const game=shot('cards');
 game.evolutions=['blood-deck','blood-deck'];
 game.player.hp=30;
 rewardPlayerHit(game,100,{basic:true});
 near(game.player.hp,42);
 game.player.hp=game.player.maxHp-.5;
 rewardPlayerHit(game,100,{basic:true});
 near(game.player.hp,game.player.maxHp);
});

test('sustained no-stagger, on-target ranged DPS is lower than before without making either weapon unusable',()=>{
 const oldBowPerArrow=Math.round(51*.9);
 const oldCardPerCard=Math.round(20*.9);
 const oldBowCycle=.45+.08+.33+1.4/8;
 const oldCardCycle=.23+.10+.33+1.2/4;
 const oldBowDps=oldBowPerArrow*2/oldBowCycle;
 const oldCardDps=oldCardPerCard*3*.89/oldCardCycle;
 const newBowCycle=WEAPONS.bow.wind+WEAPONS.bow.active+WEAPONS.bow.end+RANGED_MAGAZINES.bow.reloadDuration/RANGED_MAGAZINES.bow.capacity;
 const newCardCycle=WEAPONS.cards.wind+WEAPONS.cards.active+WEAPONS.cards.end+RANGED_MAGAZINES.cards.reloadDuration/(RANGED_MAGAZINES.cards.capacity/RANGED_MAGAZINES.cards.shotCost);
 const newBowDps=WEAPONS.bow.damage*(1+BOW_BURN_DAMAGE_FACTOR)/newBowCycle;
 const newCardDps=WEAPONS.cards.damage*3*.89/newCardCycle;
 assert.ok(newBowDps<oldBowDps*.85 && newBowDps>oldBowDps*.60);
 assert.ok(newCardDps<oldCardDps*.85 && newCardDps>oldCardDps*.60);
 assert.ok(newBowDps>30 && newCardDps>25);
});
