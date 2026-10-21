import test from 'node:test';
import assert from 'node:assert/strict';
import {chainPose,screenChainPose} from '../src/screen-chain-data.mjs';
test('pull cannot start before binding completes',()=>{for(const b of [0,.3,.9,.999])assert.equal(chainPose(b,1).pull,0);});
test('completed pull clears the screen',()=>{const p=screenChainPose(1,1);assert.equal(p.pull,1);assert.equal(p.opacity,0);assert.equal(p.offset,120);});
test('all chains reach the screen before pull',()=>{for(let i=0;i<64;i++)assert.equal(screenChainPose(1,0,i,64).reach,1);});
test('positions remain inside viewport',()=>{for(let i=0;i<64;i++){const p=screenChainPose(1,0,i,64);assert.ok(p.x>0&&p.x<1);}});
test('invalid timeline inputs stay finite',()=>{for(const b of [NaN,Infinity,-10,10])for(const p of [NaN,Infinity,-10,10])for(const v of Object.values(screenChainPose(b,p)))assert.ok(Number.isFinite(v));});
test('pull is monotonic and bounded',()=>{let previous=0;for(let i=0;i<=100;i++){const p=chainPose(1,i/100).pull;assert.ok(p>=previous&&p<=1);previous=p;}});
