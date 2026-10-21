import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_FACE_PIPS,diceWorldVector,diceTopFace} from '../src/dice-orientation.mjs';
const s=Math.SQRT1_2;
const mul=([x,y,z,w],[X,Y,Z,W])=>[w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z];
test('material indices and pip counts remain distinct',()=>assert.deepEqual(DICE_FACE_PIPS,[1,6,2,5,3,4]));
test('identity has +Y face on top',()=>assert.deepEqual(diceTopFace([0,0,0,1]),{face:2,pips:2}));
test('quarter turns put the correct local face on top',()=>{
 for(const [q,face] of [[[s,0,0,s],5],[[-s,0,0,s],4],[[0,0,s,s],0],[[0,0,-s,s],1],[[1,0,0,0],3]])assert.deepEqual(diceTopFace(q),{face,pips:DICE_FACE_PIPS[face]});
});
test('portrait normal +Z rotates to world up only for the matching turn',()=>{
 const v=diceWorldVector([0,0,1],[-s,0,0,s]);assert.ok(Math.abs(v[1]-1)<1e-9);assert.equal(diceTopFace([-s,0,0,s]).face,4);
});
test('scaled and sign-reversed quaternions give the same face',()=>{
 const q=[-s,0,0,s];for(const k of [2,-1,.01])assert.deepEqual(diceTopFace(q.map(v=>v*k)),diceTopFace(q));
});
test('all 24 cube orientations select exactly one upward material face',()=>{
 const queue=[[0,0,0,1]],seen=new Set(),counts=Array(6).fill(0);
 while(queue.length){const q=queue.shift(),basis=[[1,0,0],[0,1,0],[0,0,1]].flatMap(v=>diceWorldVector(v,q).map(Math.round)),key=basis.join(',');if(seen.has(key))continue;seen.add(key);
 const top=diceTopFace(q);counts[top.face]++;assert.equal(top.pips,DICE_FACE_PIPS[top.face]);
 for(const turn of [[s,0,0,s],[0,s,0,s],[0,0,s,s]])queue.push(mul(turn,q));
 }
 assert.equal(seen.size,24);assert.deepEqual(counts,[4,4,4,4,4,4]);
});
test('invalid quaternions fail closed',()=>{for(const q of [null,[],[0,0,0,0],[NaN,0,0,1],[0,0,Infinity,1]])assert.equal(diceTopFace(q),null);});
