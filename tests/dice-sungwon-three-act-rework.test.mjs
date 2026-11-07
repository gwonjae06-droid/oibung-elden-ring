import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDiceGame,stepDice,damageDice} from '../src/dice-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {beginDiceRoulette} from '../src/dice-roulette-attack.mjs';
import {giantPattern,GIANT_NAMES,FERAL_NAMES,GIANT,giantPropType,giantHazards,giantContactBeat,hazardContains,skipGiant,handCanAttack,strikeGiantHand} from '../src/dice-giant.mjs';
import {tableRuinState,buildDiceTableRuin,TABLE_RUIN_SLOTS} from '../src/dice-table-ruin.mjs';

test('phase one has no roulette coins and cycles through its physical patterns',()=>{
 const g=createDiceGame();assert.equal(g.boss.phase,1);
 assert.equal(beginDiceRoulette(g,'count'),false);assert.equal(beginDiceRoulette(g,'jackpot'),false);
 for(const n of [3,4,5,6,7,8]){
  g.dice.state='recovery';g.dice.t=9;g.dice.pendingPattern=true;g.dice.forcedPatternSlot=n;
  stepDice(g,.01);
  assert.notEqual(g.dice.state,'roulette-spin','phase one shot leak at pattern '+n);
  assert.equal(g.dice.roulette,null);
 }
 assert.equal(createDicePlayerGame().dice.patternCount,0);
});
test('gentleman phase inherits the original count and jackpot roulette shot ranges',()=>{
 assert.equal(GIANT_NAMES.length,14);
 for(let turn=0;turn<8;turn++){
  for(const [slot,min,max]of [[6,2,6],[12,4,6]]){
   const p=giantPattern(slot,{x:6,z:-38},'controlled',.55,turn);
   const expected=slot===6?2+turn%5:4+turn%3;
   assert.equal(p.hazards.length,expected);assert.ok(expected>=min&&expected<=max);
   assert.match(p.name,RegExp(expected+'발'));
   assert.ok(p.hazards.every(h=>h.rouletteCoin&&h.throwSlowed&&h.flightSeconds>=1.2));
   assert.ok(p.hazards.every(h=>giantPropType({slot,temperament:'controlled'},h)==='coin'));
   assert.ok(p.hazards.every(h=>h.warn>2.2&&h.damage>0&&h.handIndex!=null));
  }
 }
});
test('actual giant selects roulette after possession and announces its locked count',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);assert.equal(g.boss.phase,2);
 assert.equal(skipGiant(g),true);stepDice(g,.05);
 const s=g.dice.giant;let roulette=false;
 for(let i=0;i<GIANT_NAMES.length;i++){
  s.state='recovery';s.t=GIANT.recovery+1;stepDice(g,.01);
  if(s.slot===6){roulette=true;assert.equal(s.state,'attack');
   const locked=s.hazards.filter(h=>h.rouletteCoin).length;
   // Pattern selection is shuffled each attempt; the roulette's salvo size
   // is also selected per turn, so validate the announced LOCKED result.
   assert.ok(locked>=2&&locked<=6);
   assert.equal(s.hazards.length,locked);
   assert.match(s.name,new RegExp(locked+'발 예고'));
   assert.ok(g.events.some(e=>e.type==='dice-gentleman-roulette'&&e.count===locked));break;}
 }
 assert.ok(roulette,'randomized cycle must contain the ordinary roulette');
});
test('phase three has new torso-driven table patterns with at least one safe route',()=>{
 assert.equal(FERAL_NAMES.length,16);assert.deepEqual(TABLE_RUIN_SLOTS,[13,14,15]);
 for(const slot of TABLE_RUIN_SLOTS){
  const pattern=giantPattern(slot,{x:8,z:-41},'feral',.2);
  assert.ok(pattern.hazards.length>=3);
  assert.ok(pattern.hazards.some(h=>h.tableShock));
  assert.ok(pattern.hazards.every(h=>h.warn>=.79&&h.damage>0&&h.active>0));
  assert.ok(pattern.hazards.every(h=>giantPropType({slot,temperament:'feral'},h)===null));
  for(const t of [0,1.4,3.2]){
   const live=pattern.hazards.filter(h=>t>=h.start+h.warn&&t<h.start+h.warn+h.active);
   const safe=[[-55,0],[55,0],[0,55],[0,-55],[0,0]].some(([x,z])=>live.every(h=>{
    if(h.tableShock){const v=(t-h.start-h.warn)/h.active;return !hazardContains({...h,r:(h.reverse?1-v:v)*62},{x,z});}
    return !hazardContains(h,{x,z});
   }));
   assert.ok(safe,'there must be a navigable safe position during '+slot+' / '+t);
  }
 }
});
test('table shockwave grows with the visible ring and has no remote instant contact',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,.02);
 damageDice(g,1000);const s=g.dice.giant;assert.equal(s.temperament,'feral');
 const p=giantPattern(13,{x:0,z:-40},'feral',.2);
 Object.assign(s,{state:'attack',slot:13,t:0,hazards:p.hazards,duration:p.duration});
 const h=p.hazards.find(h=>h.tableShock);
 s.t=h.start+h.warn-.01;
 assert.equal(giantHazards(g).find(x=>x.tableShock).live,false);
 s.t=h.start+h.warn+h.active*.5;
 const ring=giantHazards(g).find(x=>x.tableShock);
 assert.equal(ring.contactKind,'table');assert.ok(ring.r>27&&ring.r<35);
 assert.ok(giantContactBeat(ring));
 assert.equal(hazardContains(ring,{x:ring.r,z:0}),true);
 assert.equal(hazardContains(ring,{x:0,z:0}),false);
 assert.equal(hazardContains(ring,{x:56,z:0}),false);
});
test('disabled hands suppress their table attack but cannot invent thrown projectiles',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,.02);
 damageDice(g,1000);const s=g.dice.giant;
 const p=giantPattern(15,{x:0,z:-40},'feral',.2);
 Object.assign(s,{state:'attack',slot:15,t:0,hazards:p.hazards,duration:p.duration});
 s.revive=[0,0];assert.ok(handCanAttack(s,0));strikeGiantHand(g,0,GIANT.handHp);
 assert.ok(p.hazards.some(h=>h.handIndex===0));
 assert.ok(s.hazards.every(h=>h.handIndex!==0||h.cancelled));
 assert.ok(s.hazards.some(h=>h.tableShock&&!h.cancelled),'the independent table cannot be deleted by a hand break');
});
test('casino ruin view rotates only peripheral scenery and draws exact growing ring and finite shards',()=>{
 const scene=new THREE.Scene(),deck=new THREE.Group();scene.add(deck);
 const view=buildDiceTableRuin(THREE,scene,deck,{coarse:true,reduced:false});
 const g={time:3,boss:{phase:3},dice:{giant:{temperament:'feral',state:'attack',slot:13,t:3.35,hazards:giantPattern(13,{x:0,z:-40},'feral').hazards}}};
 const pose=tableRuinState(g);assert.equal(pose.slot,13);assert.ok(pose.spin>2);assert.ok(pose.waves.some(w=>w.visible));
 for(let i=0;i<50;i++){g.time+=.02;g.dice.giant.t+=.02;view.update(g,.02);}
 assert.ok(deck.rotation.y>.1,'exterior trim must rotate smoothly');
 assert.ok(scene.getObjectByName('sungwon-table-breaking-fissures')?.visible);
 assert.ok(view.stats().shards<=24&&view.stats().dust<=18&&view.stats().extraLights===0);
 const rings=scene.children.filter(o=>o.name==='sungwon-table-visible-shockwave');
 assert.ok(rings.some(o=>o.visible));
});
