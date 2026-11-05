import test from 'node:test';import assert from 'node:assert/strict';import {solveClownArm} from '../src/clown-arm-rig.mjs';
const dist=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i])),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
test('arm links meet at the same elbow and end at the requested hand',()=>{const p=solveClownArm([.9,3,0],[2,2.5,1]);near(dist(p.shoulder,p.elbow),p.upper);near(dist(p.elbow,p.hand),p.lower);assert.deepEqual(p.hand,[2,2.5,1]);});
test('large cartoon reach is preserved rather than clamped',()=>{const p=solveClownArm([.9,3,0],[15,2.5,4]);assert.deepEqual(p.hand,[15,2.5,4]);assert.ok(p.upper>1.2);near(dist(p.shoulder,p.elbow),p.upper);near(dist(p.elbow,p.hand),p.lower);});
test('left and right elbows mirror',()=>{const a=solveClownArm([.9,3,0],[2,2,1],1),b=solveClownArm([-.9,3,0],[-2,2,1],-1);near(a.elbow[0],-b.elbow[0]);near(a.elbow[1],b.elbow[1]);near(a.elbow[2],b.elbow[2]);});
test('coincident endpoints remain finite',()=>{const p=solveClownArm([0,0,0],[0,0,0]);assert.ok(p.elbow.every(Number.isFinite));near(dist(p.elbow,p.hand),p.lower);});
test('previous elbow maintains a continuous bend during motion',()=>{let previous=null;for(let i=0;i<300;i++){const p=solveClownArm([.9,3,0],[2+Math.sin(i*.02),2.5,1+Math.cos(i*.02)],1,previous);if(previous)assert.ok(dist(previous,p.elbow)<.1);previous=p.elbow;}});
test('endpoint inputs are not mutated',()=>{const a=[.9,3,0],b=[1.7,2.5,2.9];solveClownArm(a,b);assert.deepEqual(a,[.9,3,0]);assert.deepEqual(b,[1.7,2.5,2.9]);});
test('invalid endpoints are rejected',()=>{assert.throws(()=>solveClownArm([NaN,0,0],[1,2,3]),TypeError);});
