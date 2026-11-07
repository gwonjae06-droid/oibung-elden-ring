import test from 'node:test';
import assert from 'node:assert/strict';
import {bombPose,headFrame,PHASE_TWO_SCALE} from '../src/clown-visual-data.mjs';
import {clownDismountPose,phaseTwoBallScale} from '../src/clown-grounded-physics.mjs';
import {transitionPose,advanceTransition,setTransitionCovered} from '../src/transition-data.mjs';
test('head flight lands exactly at the fixed target',()=>{const q={kind:'head',t:.9,fly:.9,warn:1.45,from:{x:1,y:9.9,z:2},x:8,z:12};assert.equal(bombPose(q).x,8);assert.equal(bombPose(q).z,12);assert.ok(bombPose(q).land);});
test('phase two keeps the original attached face when standing or hunting',()=>{const g={boss:{phase:2,state:'clown',t:0},clown:{vis:{pose:'regrow',k:1}}};const f=headFrame(g);assert.equal(f.bodyHead,true);assert.equal(f.mount,null);});
test('cutscene grows the original ball, rolls it away and lands on both feet',()=>{
 let last=clownDismountPose(0).bodyY;
 for(let t=.01;t<=5.2;t+=.01){
  const p=clownDismountPose(t);
  assert.ok(Number.isFinite(p.bodyY)&&p.bodyY>=0);
  assert.ok(Math.abs(p.bodyY-last)<.2);
  last=p.bodyY;
 }
 assert.equal(clownDismountPose(5.2).bodyY,0);
 assert.ok(Math.abs(phaseTwoBallScale(5.2)-PHASE_TWO_SCALE)<1e-9);
});
test('phase one still retains its original head',()=>{const g={boss:{phase:1,state:'clown'},clown:{vis:{pose:'inflate',k:.5}}};assert.equal(headFrame(g).bodyHead,true);assert.equal(headFrame(g).mount,null);});
test('covered entrance resumes normally',()=>{setTransitionCovered(true);assert.equal(advanceTransition(10,1),10);assert.equal(transitionPose(10).entry,0);setTransitionCovered(false);assert.equal(transitionPose(10).entry,1);});
