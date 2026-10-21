import test from 'node:test';import assert from 'node:assert/strict';
import {DICE_PHOTO_FACE,DICE_PHOTO_PATH,fitDicePhoto} from '../src/dice-photo-data.mjs';
test('photo replaces the single-pip positive X face',()=>{assert.equal(DICE_PHOTO_FACE,0);assert.equal(DICE_PHOTO_PATH,'../sungwon.jpg');});
test('photo fits portrait landscape and square without stretch',()=>{assert.deepEqual(fitDicePhoto(400,800),{x:128,y:0,width:256,height:512});assert.deepEqual(fitDicePhoto(800,400),{x:0,y:128,width:512,height:256});assert.deepEqual(fitDicePhoto(512,512),{x:0,y:0,width:512,height:512});});
test('invalid photo dimensions are rejected',()=>{for(const v of [0,-1,NaN,Infinity]){assert.throws(()=>fitDicePhoto(v,400));assert.throws(()=>fitDicePhoto(400,v));assert.throws(()=>fitDicePhoto(400,400,v));}});
