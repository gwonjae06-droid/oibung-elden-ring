import test from 'node:test';import assert from 'node:assert/strict';
import {solveKwonLeg,kwonStanceWeights,blendKwonLimbTarget} from '../src/kwon-leg-rig.mjs';
const rest=[[0,0,0],[1.6,1.2,.5],[3.2,-.5,1],[3.9,-2,1.3]],dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('same limb blends continuously from walking foot to stance target',()=>{const a=rest[3],b=[2,-1,-3.5];assert.deepEqual(blendKwonLimbTarget(a,b,0),a);assert.deepEqual(blendKwonLimbTarget(a,b,1),b);let last=a;for(let i=0;i<=100;i++){const p=blendKwonLimbTarget(a,b,i/100);assert.ok(dist(last,p)<.2);last=p;}});
test('stance targets preserve every link length',()=>{for(let i=0;i<=100;i++){const t=blendKwonLimbTarget(rest[3],[2,-1,-3.5],i/100),p=solveKwonLeg(rest,t);for(let j=0;j<3;j++)assert.ok(Math.abs(dist(p[j],p[j+1])-dist(rest[j],rest[j+1]))<1e-6);}});
test('rear support and front reach have independent bounded weights',()=>{assert.deepEqual(kwonStanceWeights(1,0,0),{rear:1,front:0});assert.deepEqual(kwonStanceWeights(.5,.6,.9),{rear:.5,front:.9});assert.deepEqual(kwonStanceWeights(NaN,-2,5),{rear:0,front:1});assert.equal(kwonStanceWeights(0,0,0,true).front,1);});
