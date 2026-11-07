import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,chooseGyuwonPattern,startGyuwonPattern,stepGyuwon,GYUWON_FOLLOWUPS} from '../src/gyuwon-combat.mjs';
import {GYUWON_PATTERNS,gyuwonPool} from '../src/gyuwon-data.mjs';
import {GYUWON_GESTURES,gyuwonRawMotion} from '../src/gyuwon-motion.mjs';

const advance=(g,t,input={})=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120,input);};

test('three-phase authored followups never sacrifice the seeded shuffle coverage',()=>{
 for(const [phase,space,prior,expected] of [
  [1,'white','mark','repeat'],[1,'white','line','contradiction'],
  [2,'white','verdict','mirror'],[2,'dark','reverse','paradox'],
  [3,'white','sword','circus']
 ]){
  const g=createGyuwonGame('sword',{seed:47});g.boss.phase=phase;g.gyuwon.space=space;g.gyuwon.pattern=prior;
  const pool=gyuwonPool(phase,space),chosen=[];
  chosen.push(chooseGyuwonPattern(g));assert.equal(chosen[0],expected,phase+'/'+prior);
  g.gyuwon.pattern=chosen[0];
  while(chosen.length<pool.length){
   const next=chooseGyuwonPattern(g);chosen.push(next);g.gyuwon.pattern=next;
  }
  assert.deepEqual([...chosen].sort(),[...pool].sort(),phase+'/'+space);
 }
 assert.ok(GYUWON_FOLLOWUPS['3'].tsunami.includes('chalk'));
});

test('the memory arena follows a real cast, never an unrelated stage timer',()=>{
 const g=createGyuwonGame('sword',{seed:41});g.boss.phase=3;g.gyuwon.stageMemory=null;
 assert.equal(g.gyuwon.stageIndex,0);
 startGyuwonPattern(g,'tsunami');
 assert.equal(g.gyuwon.stageMemory,'tsunami');assert.equal(g.gyuwon.stageIndex,1);
 const born=g.events.filter(e=>e.type==='memory-stage').length;
 g.player.invuln=100;advance(g,6);
 assert.equal(g.gyuwon.stageIndex,1,'active hazard must not switch its room');
 assert.equal(g.events.filter(e=>e.type==='memory-stage').length,born);
 advance(g,2.1);assert.equal(g.boss.state,'recovery');
 assert.equal(g.gyuwon.stageIndex,1);
 g.gyuwon.recover=0;advance(g,.01);
 assert.equal(g.gyuwon.stageIndex,2,'next memory cast actually advances the stage');
 assert.equal(g.events.filter(e=>e.type==='memory-stage').length,born+1);
});

test('repeat attacks replay only bounded physical traces',()=>{
 const g=createGyuwonGame();startGyuwonPattern(g,'choice');
 assert.equal(g.gyuwon.memory.length,5);
 startGyuwonPattern(g,'repeat');
 assert.ok(g.gyuwon.hazards.length<=6);
 assert.ok(g.gyuwon.hazards.every(h=>h.shape==='lane'||h.shape==='circle'));
 const mark=createGyuwonGame();startGyuwonPattern(mark,'mark');startGyuwonPattern(mark,'repeat');
 assert.equal(mark.gyuwon.hazards.length,6,'three marks replay twice');
});

test('each phase supplies warning lead time and never truncates a live hitbox mid-cast',()=>{
 for(const [phase,space] of [[1,'white'],[2,'white'],[2,'dark'],[3,'white']])
  for(const id of gyuwonPool(phase,space)){
   const g=createGyuwonGame();g.boss.phase=phase;g.gyuwon.space=space;
   assert.ok(startGyuwonPattern(g,id));
   assert.ok(g.gyuwon.hazards.length,id);
   assert.ok(g.gyuwon.hazards.every(h=>h.warn>=1&&h.warn+h.life<=GYUWON_PATTERNS[id].duration+.01),id);
   assert.ok(g.gyuwon.motionBeats[0]>=1,id);
  }
});

test('every attack uses a distinct finite hand/head direction on the same rig',()=>{
 assert.deepEqual(Object.keys(GYUWON_GESTURES).sort(),Object.keys(GYUWON_PATTERNS).sort());
 for(const [id,bias] of Object.entries(GYUWON_GESTURES)){
  assert.equal(bias.length,3,id);assert.ok(bias.every(Number.isFinite),id);
  const g=createGyuwonGame();g.boss.phase=3;startGyuwonPattern(g,id);advance(g,.4);
  assert.ok(Object.values(gyuwonRawMotion(g)).every(Number.isFinite),id);
 }
});

test('recovery reserves a planted counterattack beat before the boss advances',()=>{
 const g=createGyuwonGame();g.player.x=24;g.player.z=0;g.boss.phase=2;
 startGyuwonPattern(g,'verdict');
 g.boss.state='recovery';g.gyuwon.recover=GYUWON_PATTERNS.verdict.recover;
 const x=g.boss.x,z=g.boss.z;advance(g,.45);
 assert.ok(Math.hypot(g.boss.x-x,g.boss.z-z)<.02,'landing cannot immediately become a chase');
 advance(g,.70);
 assert.ok(Math.hypot(g.boss.x-x,g.boss.z-z)>.1,'measured approach starts after the punish beat');
});
