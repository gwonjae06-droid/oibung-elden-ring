import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodPatternDeck,nextBloodPattern} from '../src/blood-pattern-director.mjs';
import {BLOOD_PATTERNS,bloodPool} from '../src/blood-data.mjs';
import {createBloodGame,stepBlood,startBloodPattern} from '../src/blood-combat.mjs';
import {createBloodWalk,sampleBloodWalk,bloodFootTargets,BLOOD_COUNTER_WINDOW} from '../src/blood-footwork.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
const advance=(g,t,input={})=>{for(let n=0;n<t-1e-8;n+=.01)stepBlood(g,Math.min(.01,t-n),input);};

test('seeded decks cover every attack without repeats, introduce signature spells early and mix grounded phase-two attacks',()=>{
 const openings=new Set();
 for(let seed=1;seed<=64;seed++)for(const phase of [1,2]){
  const state=createBloodPatternDeck(Math.imul(seed,0x9e3779b9));let last=null;
  for(let cycle=0;cycle<3;cycle++){
   const deck=Array.from({length:bloodPool(phase).length},()=>nextBloodPattern(state,phase));assert.deepEqual([...deck].sort(),bloodPool(phase).sort());assert.notEqual(deck[0],last);
   const signature=phase===1?['lances','cross']:['judgement','ritual'];assert.ok(signature.every(id=>deck.indexOf(id)<4));
   if(phase===2)assert.ok(['wing','pulse'].includes(deck[1]));last=deck.at(-1);if(cycle===0)openings.add(phase+':'+deck.join(','));
  }
 }
 assert.ok(openings.size>80,'retries still share one fixed order');
 const a=createBloodPatternDeck(42),b=createBloodPatternDeck(42);assert.deepEqual(Array.from({length:30},()=>nextBloodPattern(a,2)),Array.from({length:30},()=>nextBloodPattern(b,2)));
});

test('actual automatic combat reaches all eleven attacks per phase and never loses the final hazards',()=>{
 for(const phase of [1,2]){
  const g=createBloodGame('sword',{seed:9341});g.boss.phase=phase;g.player.hp=g.player.maxHp=1e9;const seen=[],warnings=new Map(),impacts=new Map();
  const total=bloodPool(phase).length;for(let i=0;i<2800&&seen.length<total+1;i++){
   stepBlood(g,.05);
   for(const e of g.events){if(e.type==='blood-warning'){seen.push(e.pattern);warnings.set(e.pattern,g.blood.hazards.length);}if(e.type==='blood-impact')impacts.set(e.pattern,(impacts.get(e.pattern)||0)+1);}
   g.events=[];
  }
  assert.equal(seen.length,total+1);assert.equal(new Set(seen.slice(0,total)).size,total);
  for(const id of bloodPool(phase))assert.equal(impacts.get(id),warnings.get(id),id+' was selected but not fully executed');
 }
});

test('recovery takes finite locked footsteps, then leaves a stationary melee counter window even when the player runs away',()=>{
 const g=createBloodGame('hammer',{seed:2});g.player.hp=g.player.maxHp=1e9;
 // Inspect recovery footwork without the independent ranged blood-whip pause.
 g.blood.whipCooldown=Infinity;startBloodPattern(g,'wave');advance(g,BLOOD_PATTERNS.wave.duration+.02);
 assert.equal(g.boss.state,'recovery');assert.ok(g.blood.walk.steps>0);const start={x:g.boss.x,z:g.boss.z};
 while(g.blood.recover>BLOOD_COUNTER_WINDOW)advance(g,.01,{x:1});const planted={x:g.boss.x,z:g.boss.z};
 assert.ok(Math.hypot(planted.x-start.x,planted.z-start.z)<1.8);assert.ok(Math.hypot(planted.x-start.x,planted.z-start.z)>.5);
 advance(g,BLOOD_COUNTER_WINDOW-.1,{x:1});assert.deepEqual({x:g.boss.x,z:g.boss.z},planted);assert.equal(g.boss.state,'recovery');
 const near=createBloodWalk({x:0,z:0,yaw:0},{x:0,z:3},3);assert.equal(near.steps,0);
 const frozen=JSON.stringify(g);stepBlood(g,0);assert.equal(JSON.stringify(g),frozen);
});

test('real articulated boots meet the shared foot targets and planted feet stay fixed as the body advances',()=>{
 const scene=new THREE.Scene(),root=new THREE.Group(),actor=new THREE.Group();scene.add(root);root.add(actor);root.scale.setScalar(1.25);
 const rig=createBloodRegalia(actor,{coarse:true}),g=createBloodGame();g.boss.x=g.boss.z=0;g.player.z=20;g.blood.walk=createBloodWalk(g.boss,g.player,3.2);
 let previous=null;
 for(let i=0;i<=140;i++){
  const w=g.blood.walk;w.t=i/140*1.4;const sample=sampleBloodWalk(w);g.boss.x=sample.x;g.boss.z=sample.z;g.boss.yaw=sample.yaw;
  root.position.set(sample.x,0,sample.z);root.rotation.y=sample.yaw;actor.rotation.set(.035,0,.015);actor.position.y=sample.bob;
  rig.plantFeet(g);const expected=bloodFootTargets(g),actual=rig.legs.map(leg=>leg.ankle.getWorldPosition(new THREE.Vector3()));
  for(let j=0;j<2;j++){
   assert.ok(actual[j].distanceTo(new THREE.Vector3(expected[j].x,expected[j].y,expected[j].z))<1e-5,'boot '+j+' detached at '+w.t);
   if(previous&&expected[j].lift===0&&previous.expected[j].lift===0)assert.ok(actual[j].distanceTo(previous.actual[j])<1e-5,'stance foot slid');
  }
  previous={expected,actual};
 }
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('dive flies to the locked impact point continuously and every aerial attack descends before recovery',()=>{
 for(const id of bloodPool(2).filter(id=>BLOOD_PATTERNS[id].air)){
  const g=createBloodGame();g.boss.phase=2;g.player.hp=g.player.maxHp=1e9;startBloodPattern(g,id);const target={...g.blood.target};let prev={x:g.boss.x,z:g.boss.z,y:0};
  const duration=BLOOD_PATTERNS[id].duration;
  for(let t=.01;t<=duration+.001;t+=.01){
   stepBlood(g,.01);const b=g.boss,y=g.blood.elevation;
   assert.ok(Math.hypot(b.x-prev.x,b.z-prev.z)<.5,id+' teleported');assert.ok(Math.abs(y-prev.y)<.25,id+' snapped vertically');
   if(id==='dive'&&Math.abs(t-1.8)<.001){assert.ok(Math.hypot(b.x-target.x,b.z-target.z)<1e-6);assert.ok(y<1e-6);}
   prev={x:b.x,z:b.z,y};
  }
  advance(g,.01);assert.ok(g.blood.elevation<1e-6,id+' did not land');assert.equal(g.boss.state,'recovery');
 }
});
