import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAlpha,createPoseContinuity} from '../src/boss-animation-continuity.mjs';
import {createGyuwonGame,startGyuwonPattern,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {gyuwonRawMotion,createGyuwonMotionDirector,GYUWON_MOTION_STYLE} from '../src/gyuwon-motion.mjs';
import {GYUWON_PATTERNS} from '../src/gyuwon-data.mjs';
test('visual continuity is frame-rate independent and freezes at the same sim clock',()=>{
 const run=n=>{const f=createPoseContinuity(),owner={};f.step({lean:0},0,{owner,time:0});let v;for(let i=1;i<=n;i++)v=f.step({lean:1},1/n,{owner,time:i/n,rate:12});assert.deepEqual(f.step({lean:0},1/n,{owner,time:1,rate:12}),v);return v.lean;};
 assert.ok(Math.abs(run(30)-run(120))<1e-8);assert.equal(poseAlpha(5,0),0);
});
test('every Gyuwon pattern has distinct, finite warning-linked arm and head poses',()=>{
 assert.deepEqual(Object.keys(GYUWON_MOTION_STYLE).sort(),Object.keys(GYUWON_PATTERNS).sort());
 for(const name of Object.keys(GYUWON_PATTERNS)){
  const g=createGyuwonGame();g.boss.phase=3;assert.ok(startGyuwonPattern(g,name));
  stepGyuwon(g,.4);
  const v=gyuwonRawMotion(g);
  assert.ok(Object.values(v).every(Number.isFinite),name);
  assert.ok(v.leftArm!==-.5||v.rightArm!==0,name);
  const f=createGyuwonMotionDirector(),a=f.update(g,0);
  stepGyuwon(g,1/120);const b=f.update(g,1/120);
  assert.ok(Math.abs(b.leftArm-a.leftArm)<.4,name);
 }
});
test('motion director turns continuously and resets when a new attempt begins',()=>{
 const g=createGyuwonGame(),f=createGyuwonMotionDirector();
 let a=f.update(g,0);assert.ok(Number.isFinite(a.facing));
 startGyuwonPattern(g,'line');stepGyuwon(g,.1);
 a=f.update(g,.1);assert.deepEqual(f.update(g,0),a);
 assert.ok(Number.isFinite(f.update(createGyuwonGame(),0).facing));
});
