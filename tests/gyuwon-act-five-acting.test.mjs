import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {ACT_FIVE_SCORE,actFivePerformanceAt,poseActFiveHands} from '../src/gyuwon-act-five-score.mjs';
import {GYUWON_LYRIC_BLOCKING,actFiveChoreographyAt} from '../src/gyuwon-act-five-choreography.mjs';
import {createGiantGyuwon} from '../src/gyuwon-giant-actor.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGyuwonGame,stepGyuwon,actGyuwon} from '../src/gyuwon-combat.mjs';

const approx=(a,b,tol=.2)=>assert.ok(Math.abs(a-b)<=tol,`expected ${a} ~= ${b} (+/-${tol})`);
function atFive(t=8){
 const g=createGyuwonGame('sword',{yearMode:true,seed:5052});
 g.gyuwon.years.year=5;stepGyuwon(g,.008);
 const m=g.gyuwon.years.musical;
 g.boss.hp=6000;m.transition=0;g.player.invuln=0;
 m.clock={source:'media',time:t,duration:179.95,ended:false};
 stepGyuwon(g,.016);m.clock=null;
 return {g,m};
}
const sample=(gesture,time=36)=>actFiveChoreographyAt(time,{gesture,weight:1,progress:.5},{bpm:136});
test('the aligned 5수 song has distinctive authored actions for every lyric cue',()=>{
 assert.equal(ACT_FIVE_SCORE.length,32);
 const distinct=new Set();
 for(const cue of ACT_FIVE_SCORE){
  assert.ok(GYUWON_LYRIC_BLOCKING[cue.gesture],`missing ${cue.gesture}`);
  const pose=actFiveChoreographyAt(cue.start+.5,actFivePerformanceAt(cue.start+.5));
  assert.equal(pose.gesture,cue.gesture);
  assert.ok(pose.hands.flat().every(Number.isFinite));
  distinct.add(cue.gesture);
 }
 assert.ok(distinct.size>=25,'the host should not recycle four generic motions');
 assert.notDeepEqual(sample('king').head,sample('laugh').head);
 assert.notDeepEqual(sample('dance').hands,sample('curtain').hands);
 assert.notDeepEqual(sample('sky').hands,sample('self').hands);
 assert.notDeepEqual(sample('welcome').hands,sample('friends').hands);
});

test('orchestral microacting stays bounded, finite, and rigid-body collision independent',()=>{
 for(const name of Object.keys(GYUWON_LYRIC_BLOCKING)){
  for(const w of [0,.35,.8,1]){
   const pose=actFiveChoreographyAt(73.1,{gesture:name,weight:w,progress:.7},
    {raidAttack:{part:0,age:1.1,wind:1.5},hitUntil:73.3,bpm:142});
   assert.ok(pose.torso.every(v=>Number.isFinite(v)&&Math.abs(v)<.6),name);
   assert.ok(pose.head.every(v=>Number.isFinite(v)&&Math.abs(v)<.6),name);
   assert.ok(pose.hands.flat().every(v=>Number.isFinite(v)&&Math.abs(v)<18),name);
   assert.ok(pose.palms.every(p=>p.curl>=0&&p.curl<=1));
  }
 }
 const m=atFive(4.8).m,original=m.enemies.slice(0,2).map(e=>[e.x,e.y,e.z]);
 poseActFiveHands(m,.05);
 assert.ok(m.enemies[0].x<original[0][0]);
 const after=m.enemies.slice(0,2).map(e=>[e.x,e.y,e.z]);
 poseActFiveHands(m,0);assert.deepEqual(m.enemies.slice(0,2).map(e=>[e.x,e.y,e.z]),after);
 m.raidAttack={part:0,age:.4,wind:1.5};
 poseActFiveHands(m,.1);
 assert.deepEqual(m.enemies.slice(0,2).map(e=>[e.x,e.y,e.z]),after,
  'the active attack has priority over decorative gesture');
});

test('full giant rig smoothly animates the actual actor model, all limbs and face together',()=>{
 const parent=new THREE.Group(),source=createGyuwonActor(new THREE.Scene(),{coarse:true});
 const giant=createGiantGyuwon(parent,source.root,{coarse:true});
 assert.ok(giant.head);assert.equal(giant.arms.length,2);
 const {m}=atFive(24);
 m.songPerformance=actFivePerformanceAt(24);
 for(let i=0;i<18;i++)giant.update(m,1/60);
 const torso=giant.root.getObjectByName('gyuwon-tailored-torso');
 assert.ok(torso.position.y>0);
 assert.ok(Math.abs(torso.rotation.x)>0);
 assert.ok(giant.arms.every(arm=>arm.hand.position.distanceTo(arm.target)<.35));
 for(const arm of giant.arms){
  assert.equal(arm.digits.length,5);
  assert.equal(arm.digits.flat().length,15);
  assert.ok(arm.hingeReady);
  assert.ok(arm.elbow.position.distanceTo(arm.hinge)<.001);
 }
 const old=giant.head.rotation.x;
 m.songPerformance=actFivePerformanceAt(69.3);
 m.time=69.3;
 giant.update(m,1/60);
 assert.ok(Math.abs(giant.head.rotation.x-old)<.20,'avoid snapped neck rotations');
 const snapshot=giant.head.rotation.x;
 giant.update(m,0);
 assert.equal(giant.head.rotation.x,snapshot,'paused soundtrack means paused pose');
 assert.ok(giant.root.getObjectByName('giant-musical-conductor-baton'));
 giant.dispose();
 source.dispose?.();
});

test('players can answer a visible hostile windup only once without consuming a turn or skipping the song',()=>{
 const {g,m}=atFive(44);g.player.invuln=500;
 m.turn='boss';m.turnActor='enemy2';m.enemyVictim='ally0';
 m.raidAttack=null;
 assert.equal(actGyuwon(g,'support'),false,'must not guard before a visible attack begins');
 for(let i=0;i<78;i++)stepGyuwon(g,1/120);
 assert.ok(m.raidAttack);
 assert.ok(m.raidAttack.age>m.raidAttack.wind*.28);
 const old=m.party.map(p=>p.energy),clock=m.time;
 assert.equal(actGyuwon(g,'support'),true);
 assert.equal(m.turn,'boss');
 assert.equal(m.raidAttack.blocked,true);
 assert.equal(actGyuwon(g,'support'),false,'one counter per windup');
 assert.equal(m.success>0,true);
 assert.equal(m.raidHistory.some(h=>h.event==='spotlight-counter'),true);
 for(let i=0;i<4;i++)assert.ok(m.party[i].energy>=old[i]);
 assert.equal(g.boss.hp,6000);
 assert.equal(m.time,clock,'counter must not change soundtrack time');
 for(let i=0;i<200;i++)stepGyuwon(g,1/120);
 assert.ok(m.raidHistory.some(h=>h.event==='song-pattern'));
 assert.equal(g.status,'playing');
});
