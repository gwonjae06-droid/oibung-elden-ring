import test from 'node:test';
import assert from 'node:assert/strict';
import {bombPose,headFrame,mountPose} from '../src/clown-visual-data.mjs';
import {transitionPose,advanceTransition,setTransitionCovered} from '../src/transition-data.mjs';
test('head flight lands exactly at the fixed target',()=>{const q={kind:'head',t:.9,fly:.9,warn:1.45,from:{x:1,y:9.9,z:2},x:8,z:12};assert.equal(bombPose(q).x,8);assert.equal(bombPose(q).z,12);assert.ok(bombPose(q).land);});
test('phase two always has a headless body on its own giant head',()=>{const g={boss:{phase:2,state:'clown',t:0},clown:{vis:{pose:'regrow',k:1}}};const f=headFrame(g);assert.equal(f.bodyHead,false);assert.equal(f.mount.visible,true);assert.equal(f.mount.ball,0);assert.equal(f.mount.y,2.6);assert.equal(f.mount.inflate,2.6);});
test('cutscene detaches continuously, retires the ball and lands under the feet',()=>{assert.equal(mountPose(1.59,true).bodyHead,true);const a=mountPose(1.6,true);assert.equal(a.bodyHead,false);assert.equal(a.visible,true);assert.equal(a.y,11.18);let prev=a;for(let t=1.61;t<=5.2;t+=.01){const p=mountPose(t,true);assert.ok(Math.abs(p.y-prev.y)<.15);assert.ok(p.ball>=0&&p.ball<=1);assert.ok(p.lift>=0);prev=p;}const e=mountPose(5.2,true);assert.equal(e.ball,0);assert.ok(Math.abs(e.y-2.6)<1e-9);assert.equal(e.z,0);assert.ok(Math.abs(e.lift)<1e-9);});
test('phase one still retains its original head',()=>{const g={boss:{phase:1,state:'clown'},clown:{vis:{pose:'inflate',k:.5}}};assert.equal(headFrame(g).bodyHead,true);assert.equal(headFrame(g).mount,null);});
test('covered entrance resumes normally',()=>{setTransitionCovered(true);assert.equal(advanceTransition(10,1),10);assert.equal(transitionPose(10).entry,0);setTransitionCovered(false);assert.equal(transitionPose(10).entry,1);});
