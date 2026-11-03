import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_RULES as R,diceEntrancePose,diceEntranceRoll} from '../src/dice-data.mjs';

test('the entrance roll never throws at any point of the cutscene',()=>{
 for(let t=0;t<=6;t+=.01){
  const {k,pose}=diceEntranceRoll(diceEntrancePose(t).travel);
  assert.ok(Number.isInteger(k)&&k>=0&&k<=6);
  for(const v of [pose.x,pose.y,pose.z,pose.angle])assert.ok(Number.isFinite(v));
 }
 for(const bad of [NaN,-1,2,Infinity,undefined])assert.doesNotThrow(()=>diceEntranceRoll(bad));
});

test('each roll moves exactly one die edge, so it follows the current dice size',()=>{
 for(let k=0;k<6;k++){
  const a=diceEntranceRoll(k/6).pose,b=diceEntranceRoll((k+1)/6-1e-9).pose;
  assert.ok(Math.abs(b.x-a.x-R.edge)<1e-3,'roll '+k+' moved '+(b.x-a.x));
 }
});

test('the die enters from beyond the left edge and leaves beyond the right edge',()=>{
 assert.ok(diceEntranceRoll(0).pose.x<=-3*R.edge);
 assert.ok(diceEntranceRoll(1).pose.x>=3*R.edge);
 assert.ok(Math.abs(diceEntranceRoll(.5).pose.x)<R.edge);
});

test('the die only moves forward and keeps a unit rotation',()=>{
 let last=-Infinity;
 for(let i=0;i<=1000;i++){
  const {pose}=diceEntranceRoll(i/1000);
  assert.ok(pose.x>=last-1e-9);last=pose.x;
  assert.ok(Math.abs(Math.hypot(...pose.rotation)-1)<1e-9);
  assert.ok(pose.y>=R.edge/2-1e-9);
 }
});

test('the screen is flattened only after the die has started crossing',()=>{
 assert.equal(diceEntrancePose(0).screenScaleY,1);
 assert.ok(diceEntrancePose(1.6).press===0);
 assert.ok(diceEntrancePose(3).screenScaleY<.1);
 assert.equal(diceEntrancePose(4.6).ready,true);
});
