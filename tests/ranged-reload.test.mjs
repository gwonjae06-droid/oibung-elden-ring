import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createGyuwonGame} from '../src/gyuwon-combat.mjs';
import {freshProfile,newRun,configureJourney} from '../src/journey-state.mjs';
import {actPlayer,tickPlayerAction} from '../src/player-combat.mjs';
import {tickPlayerResources} from '../src/player-tick.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {RANGED_MAGAZINES,rangedMagazineLabel} from '../src/ranged-reload.mjs';

const journey=(weapon='bow',stage=0,make=createGame)=>{
 const g=make(weapon,{register:false}),run=newRun(weapon);
 run.stage=stage;configureJourney(g,run,freshProfile());return g;
};
const shot=g=>{
 g.player.stamina=100;
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,1,WEAPONS[g.weapon]);
};
test('the real story remains the baseline and all five encounters have independent magazines',()=>{
 const factories=[createGame,createClownGame,createDicePlayerGame,createBloodGame,createGyuwonGame];
 for(const [stage,make] of factories.entries()){
  for(const weapon of ['bow','cards']){
   const g=journey(weapon,stage,make),r=g.player.ranged,rules=RANGED_MAGAZINES[weapon];
   assert.equal(r.loaded,rules.capacity);
   assert.equal(r.capacity,rules.capacity);
   assert.equal(r.remaining,0);
   assert.equal(g.boss.hp,g.boss.maxHp);
  }
 }
 assert.equal(journey('bow').boss.maxHp,4822);
 assert.equal(journey('cards').boss.maxHp,4822);
 assert.equal(journey('sword').player.ranged,null);
});
for(const [weapon,volleys,projectiles,reloadDuration] of [['bow',8,8,1.4],['cards',4,12,1.2]]){
 test(weapon+' spends its real magazine, auto-reloads, and never consumes permanent ammunition',()=>{
  const g=journey(weapon),r=g.player.ranged;
  for(let i=0;i<volleys;i++)shot(g);
  assert.equal(r.loaded,0);
  assert.equal(g.projectiles.length,projectiles);
  assert.equal(r.pending,true);
  g.player.stamina=100;
  assert.equal(actPlayer(g,'light'),false,'empty clip blocks new shots');
  tickPlayerResources(g,reloadDuration/2);
  assert.equal(r.loaded,0);
  assert.ok(r.remaining>0,'reload must be timed, not instantaneous');
  assert.equal(actPlayer(g,'light'),false,'cannot attack mid reload');
  tickPlayerResources(g,reloadDuration/2+.001);
  assert.equal(r.loaded,r.capacity);
  assert.equal(r.remaining,0);
  assert.equal(r.pending,false);
  assert.ok(g.events.some(e=>e.type==='ranged-reload-start'));
  assert.ok(g.events.some(e=>e.type==='ranged-reload-complete'));
  assert.equal(actPlayer(g,'light'),true);
 });
 test(weapon+' reload cannot finish for free during a dodge',()=>{
  const g=journey(weapon);
  for(let i=0;i<volleys;i++)shot(g);
  tickPlayerResources(g,.01);
  const before=g.player.ranged.remaining;
  g.player.stamina=100;
  assert.equal(actPlayer(g,'roll'),true);
  tickPlayerResources(g,.4);
  assert.equal(g.player.ranged.remaining,before);
  tickPlayerAction(g,.55,WEAPONS[g.weapon]);
  tickPlayerResources(g,.15);
  assert.ok(g.player.ranged.remaining<before);
 });
}
test('bow must genuinely draw for 0.45 seconds before a basic arrow appears',()=>{
 const g=journey(),r=g.player.ranged;
 assert.equal(WEAPONS.bow.wind,.45);
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,.44,WEAPONS.bow);
 assert.equal(g.projectiles.length,0);
 assert.equal(r.loaded,8);
 tickPlayerAction(g,.02,WEAPONS.bow);
 assert.equal(g.projectiles.length,1);
 assert.equal(r.loaded,7);
});
test('cancelling before the projectile release costs no ammo, cancelling after does',()=>{
 const g=journey(),r=g.player.ranged;
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,.15,WEAPONS.bow);
 assert.equal(actPlayer(g,'roll'),true);
 assert.equal(r.loaded,8);
 tickPlayerAction(g,.6,WEAPONS.bow);
 assert.equal(actPlayer(g,'light'),true);
 tickPlayerAction(g,.46,WEAPONS.bow);
 assert.equal(r.loaded,7);
 assert.equal(actPlayer(g,'roll'),true);
 assert.equal(r.loaded,7);
});
test('backstep shooting spends two arrows and cannot bypass a nearly empty magazine',()=>{
 const g=journey(),r=g.player.ranged;
 g.evolutions=['twin-arrow'];
 assert.equal(actPlayer(g,'skill'),true);
 tickPlayerAction(g,.25,WEAPONS.bow);
 assert.equal(g.projectiles.length,2);
 assert.equal(r.loaded,6);
 tickPlayerAction(g,.40,WEAPONS.bow);
 for(let i=0;i<5;i++)shot(g);
 assert.equal(r.loaded,1);
 g.player.skill.cooldown=0;
 assert.equal(actPlayer(g,'skill'),false);
 assert.equal(actPlayer(g,'light'),true,'last arrow is still usable as a normal shot');
});
test('reload label shows counts and a countdown rather than a fake infinite-ammo UI',()=>{
 const g=journey(),r=g.player.ranged;
 assert.equal(rangedMagazineLabel(r),'8 / 8');
 r.loaded=0;r.pending=true;
 assert.equal(rangedMagazineLabel(r),'장전 대기');
 tickPlayerResources(g,.2);
 assert.match(rangedMagazineLabel(r),/^장전 1\.2초$/);
});
