import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_WEAKPOINT_MULTIPLIERS} from '../src/balance.mjs';
import {BOSS_REGISTRY,PLAYABLE_BOSSES} from '../src/boss-registry.mjs';
import {newRun,freshProfile,configureJourney} from '../src/journey-state.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame,diceGiantHitDamage} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {beginGiant} from '../src/dice-giant.mjs';
import {giantImpact} from '../src/dice-giant-hit.mjs';
import {createBloodGame,actBlood,stepBlood,damageBlood} from '../src/blood-combat.mjs';
import {tickBloodSiphon} from '../src/blood-siphon.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';

const factories=[createGame,createClownGame,createDicePlayerGame,createBloodGame];
test('only journey-campaign HP is authoritative for the four playable encounters',()=>{
 const expected=[3800,4030,4260,4480];
 assert.deepEqual(PLAYABLE_BOSSES,['kwon','clown','dice','blood']);
 for(let stage=0;stage<factories.length;stage++){
  const g=factories[stage]('sword',{register:false}),run={...newRun('sword'),stage};
  configureJourney(g,run,freshProfile());
  assert.equal(BOSS_REGISTRY[PLAYABLE_BOSSES[stage]].maxHp,expected[stage]);
  assert.equal(g.boss.hp,expected[stage]);
  assert.equal(g.boss.maxHp,expected[stage]);
  assert.equal(g.startGrace,1.6);
 }
});
test('Park Sungwon exposed feral head is exactly 1.5x while hands remain 1x',()=>{
 assert.equal(BOSS_WEAKPOINT_MULTIPLIERS.diceExposedHead,1.5);
 const g=createDicePlayerGame('sword');g.boss.phase=3;
 beginGiant(g);
 const q=g.dice.giant;q.state='attack';q.temperament='feral';
 q.t=1.4;q.hazards=[{headSlam:true,start:0,warn:1,active:1.2}];
 g.dice.pose={x:0,y:1.2,z:0,rotation:[0,0,0,1]};
 const target=giantImpact(g,{x:0,y:1.2,z:12},{x:0,y:1.2,z:4});
 assert.equal(target?.part,'head','head can be struck only when its slam exposes it');
 assert.equal(diceGiantHitDamage(g,100,target),150);
 const before=q.hands[0];
 assert.equal(diceGiantHitDamage(g,100,{part:'hand',index:0}),100);
 assert.equal(q.hands[0],before-100,'palm damage must not use the 1.5x head multiplier');
 q.temperament='controlled';
 assert.notEqual(giantImpact(g,{x:0,y:1.2,z:12},{x:0,y:1.2,z:4})?.part,'head',
  'normal giant state must not expose a 1.5x weak head');
});
test('blood angel recovery is 1.3x for actual melee hit; ordinary direct damage is unchanged',()=>{
 assert.equal(BOSS_WEAKPOINT_MULTIPLIERS.bloodGroundedRecovery,1.3);
 const g=createBloodGame('sword');const run={...newRun('sword'),stage:3};
 configureJourney(g,run,freshProfile());
 g.boss.phase=2;g.boss.hp=1800;g.boss.state='recovery';g.blood.recover=1000;
 g.blood.transitioned=true;g.player.z=-2;g.player.stamina=100;
 assert.ok(actBlood(g,'light'));
 for(let i=0;i<60;i++)stepBlood(g,1/120);
 assert.ok(g.stats.hits>0,'actual weapon attack should land during grounded recovery');
 assert.ok(Math.abs(g.boss.hp-(1800-WEAPONS.sword.damage*1.3))<1e-5);
 assert.ok(Math.abs(g.stats.damage-WEAPONS.sword.damage*1.3)<1e-5);
 const baseline=createBloodGame();
 baseline.boss.phase=2;baseline.boss.state='recovery';
 assert.equal(damageBlood(baseline,100),100,'direct/scripted damage should not receive player weak-point bonus');
});
test('journey phase thresholds and blood sea regeneration remain proportional to journey HP',()=>{
 const g=createDicePlayerGame(),run={...newRun('sword'),stage:2};
 configureJourney(g,run,freshProfile());
 damageDice(g,1420);assert.equal(g.boss.hp,2840);assert.equal(g.boss.phase,2);
 const b=createBloodGame();
 configureJourney(b,{...newRun('sword'),stage:3},freshProfile());
 assert.equal(b.boss.maxHp,4480);assert.equal(b.boss.maxHp/2,2240);
 b.boss.phase=2;b.boss.state='recovery';b.boss.hp=1000;
 b.blood.siphon.cooldown=0;
 tickBloodSiphon(b,.01);
 assert.equal(b.blood.siphon.active,true);
 tickBloodSiphon(b,2.4);
 assert.equal(b.boss.hp,1224,'5% of 4,480 HP = 224 HP restored');
 assert.equal(b.blood.siphon.totalHealed,224);
});
