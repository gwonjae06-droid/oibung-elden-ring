import test from 'node:test';
import assert from 'node:assert/strict';
import {HARD_STORY_HP_SCALE,JOURNEY_BOSS_HP} from '../src/journey-balance.mjs';
import {freshProfile,newRun,configureJourney} from '../src/journey-state.mjs';
import {createGame,chooseOpening,SEQUENCES} from '../src/combat.mjs';
import {createClownGame,choosePattern} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createBloodGame,damageBlood} from '../src/blood-combat.mjs';
import {createBloodPatternDeck,nextBloodPattern} from '../src/blood-pattern-director.mjs';
import {bloodPool} from '../src/blood-data.mjs';
import {nextGiantPressureSlot} from '../src/dice-giant.mjs';
import {createPatternShuffle} from '../src/pattern-shuffle.mjs';
import {actPlayer,tickPlayerAction} from '../src/player-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {damageDice} from '../src/dice-combat.mjs';

const story=(game,stage)=>{
 const run=newRun(game.weapon);run.stage=stage;
 configureJourney(game,run,freshProfile());return game;
};

test('all four story bosses gain exactly 35 percent HP without changing independent HP',()=>{
 const old={kwon:3572,clown:3760,dice:4230,blood:4700};
 assert.equal(HARD_STORY_HP_SCALE,1.35);
 const games=[createGame('sword',{register:false}),createClownGame('sword',{register:false}),
   createDicePlayerGame('sword'),createBloodGame('sword')];
 for(const [stage,id] of ['kwon','clown','dice','blood'].entries()){
  const originalHp=games[stage].boss.maxHp;
  const expected=Math.round(old[id]*HARD_STORY_HP_SCALE);
  assert.equal(JOURNEY_BOSS_HP[id],expected,id);
  story(games[stage],stage);
  assert.equal(games[stage].boss.maxHp,expected,id);
  assert.equal(games[stage].boss.hp,expected,id);
  assert.notEqual(originalHp,expected,id);
 }
});

test('story sword chooses exactly one new specialization: wave or double reach',()=>{
 const g=story(createGame('sword',{register:false}),0);
 g.evolutions=['blade-wave','blade-wave'];
 assert.equal(actPlayer(g,'charge-start'),false);
 assert.equal(actPlayer(g,'skill'),false);
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,.22,WEAPONS.sword);
 assert.equal(g.projectiles.length,1);
 assert.ok(Math.abs(g.projectiles[0].damage-WEAPONS.sword.damage*.9)<1e-8);
 const reach=story(createGame('sword',{register:false}),0);
 reach.evolutions=['charged-blade'];
 assert.equal(actPlayer(reach,'skill'),false);
 assert.equal(actPlayer(reach,'light'),true);
 assert.equal(reach.player.action.mult,1);
});
test('upgraded story cards remain three and fire arrows remain one',()=>{
 for(const [weapon,upgrade,count] of [['cards','wide-deck',3],['bow','twin-arrow',1]]){
  const g=story(createGame(weapon,{register:false}),0);
  g.evolutions=[upgrade,upgrade];
  assert.equal(actPlayer(g,'light'),true);
  tickPlayerAction(g,.5,WEAPONS[weapon]);
  assert.equal(g.projectiles.length,count);
  assert.ok(g.projectiles.every(q=>q.damage>0&&Number.isFinite(q.damage)));
 }
});

test('Kwon story prioritizes real combos at close and far ranges',()=>{
 const g=story(createGame('sword',{register:false}),0);
 g.player.z=g.boss.z+3;
 assert.ok(['hunt','skewer','counterDancer','skyJudge','backsweep'].includes(chooseOpening(g)));
 g.boss.phase=2;g.player.z=g.boss.z+20;
 assert.ok(Object.hasOwn(SEQUENCES,chooseOpening(g)),'far attack must be a real authored sequence');
});

test('Clown story links its existing performance after ball cannon',()=>{
 const g=story(createClownGame('sword',{register:false}),1);
 g.boss.phase=2;g.clown.last='ballCannon';
 g.player.x=g.boss.x;g.player.z=g.boss.z+8;
 assert.equal(choosePattern(g),'bounceChain');
});

test('Giant story offers distinct slots in its weighted controlled and feral cycles',()=>{
 const g={player:{x:0,z:-40},dice:{patternShuffle:createPatternShuffle(2026),giant:{temperament:'controlled'}}};
 for(const [feral,total] of [[false,14],[true,16]]){
  g.dice.giant={temperament:feral?'feral':'controlled'};
  const chosen=Array.from({length:total},()=>nextGiantPressureSlot(g));
  assert.equal(new Set(chosen).size,total);
  assert.ok(chosen.every(n=>Number.isInteger(n)&&n>=0&&n<total),'only defined casino/bestial slots can be scheduled');
 }
});

test('Blood adaptive deck remains complete with signature opener and phase-two ground cue',()=>{
 for(const phase of [1,2]){
  const deck=createBloodPatternDeck(456);
  const out=Array.from({length:bloodPool(phase).length},(_,i)=>nextBloodPattern(deck,phase,{distance:i%2?4:23}));
  assert.deepEqual([...out].sort(),bloodPool(phase).sort());
  assert.ok((phase===1?['lances','cross']:['judgement','ritual']).includes(out[0]));
  if(phase===2)assert.ok(['wing','pulse'].includes(out[1]));
 }
});

test('story phase thresholds are still based on current max HP',()=>{
 const dice=story(createDicePlayerGame('sword'),2);
 const twoThirds=dice.boss.maxHp*2/3;
 damageDice(dice,dice.boss.hp-(twoThirds-1));
 assert.equal(dice.boss.phase,2);
 assert.equal(dice.dice.giant.state,'transition');
 const blood=story(createBloodGame('sword'),3);
 damageBlood(blood,blood.boss.hp-(blood.boss.maxHp*.5-1));
 assert.equal(blood.blood.phasePending,true);
 assert.equal(blood.boss.phase,1);
});
