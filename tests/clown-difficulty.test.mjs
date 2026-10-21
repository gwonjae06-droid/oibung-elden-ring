import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESSURE,ROLL,segmentGap,waveCrosses,rollPosition} from '../src/clown-pressure.mjs';
test('pressure increases in both phases without removing idle gaps',()=>{assert.equal(PRESSURE.hp,2760);assert.ok(PRESSURE.wait[0]>PRESSURE.wait[1]&&PRESSURE.wait[1]>=.1);assert.ok(PRESSURE.chase[1]>PRESSURE.chase[0]);assert.ok(PRESSURE.damage[1]>PRESSURE.damage[0]);assert.equal(Math.round(30*PRESSURE.damage[0]),35);assert.equal(Math.round(30*PRESSURE.damage[1]),38);});
test('difficulty settings are deeply immutable',()=>{assert.ok(Object.isFrozen(PRESSURE));for(const k of ['wait','chase','damage'])assert.ok(Object.isFrozen(PRESSURE[k]));});
test('rolling-head warning and radius remain unchanged',()=>{assert.deepEqual(ROLL,{wind:.8,travel:.6,fuse:.45,radius:2.1,damage:31});});
test('swept collision detects crossing and degenerate segments',()=>{assert.equal(segmentGap({x:0,z:0},{x:-5,z:0},{x:5,z:0}),0);assert.equal(segmentGap({x:0,z:0},{x:3,z:4},{x:3,z:4}),5);});
test('wave crossing respects cone and range',()=>{const w={x:0,z:0,width:1.2,range:15,yaw:0,half:.5};assert.equal(waveCrosses(w,4,6,{x:0,z:5},{x:0,z:5}),true);assert.equal(waveCrosses(w,4,6,{x:5,z:0},{x:5,z:0}),false);assert.equal(waveCrosses(w,20,22,{x:0,z:21},{x:0,z:21}),false);});
test('rolling head position stays bounded by endpoints',()=>{const q={from:{x:0,z:0},x:12,z:6,travel:.6};assert.deepEqual(rollPosition({...q,t:-1}),{x:0,z:0});assert.deepEqual(rollPosition({...q,t:.3}),{x:6,z:3});assert.deepEqual(rollPosition({...q,t:3}),{x:12,z:6});});
