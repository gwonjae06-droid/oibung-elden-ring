import test from 'node:test';
import assert from 'node:assert/strict';
import {bombPose,headFrame} from '../src/clown-visual-data.mjs';
import {transitionPose,advanceTransition,setTransitionCovered} from '../src/transition-data.mjs';
test('a head follows a locked arc and ends at its target',()=>{const q={kind:'head',t:0,fly:.9,warn:1.45,from:{x:1,y:9.9,z:2},x:8,z:12};const a=bombPose(q);q.t=.45;const b=bombPose(q);q.t=.9;const c=bombPose(q);assert.equal(a.x,1);assert.equal(b.x,4.5);assert.equal(c.x,8);assert.equal(c.z,12);assert.ok(b.y>(a.y+c.y)/2);assert.ok(c.land);});
test('phase transition grows then restores the same head',()=>{const g={boss:{state:'transition',phase:2,t:3.1},clown:{vis:{pose:'idle',k:0}}};assert.ok(headFrame(g).inflate>5);g.boss.t=3.3;assert.ok(headFrame(g).burst);g.boss.t=5.2;assert.equal(headFrame(g).pose,'regrow');assert.equal(headFrame(g).k,1);});
test('battle coverage suspends the entrance, then restores it',()=>{setTransitionCovered(true);assert.equal(advanceTransition(10,1),10);assert.equal(transitionPose(10).entry,0);setTransitionCovered(false);assert.equal(transitionPose(10).entry,1);});
