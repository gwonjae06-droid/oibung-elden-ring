import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattlePause,clearMovement,releaseCapturedPointer} from '../src/battle-pause.mjs';

test('duplicate pause signals do not resume combat and resume clears input collected while paused',()=>{
  let mode='playing',queued='attack';const keys=new Set(['KeyW']),stick={x:1,z:1},calls=[];
  const pause=createBattlePause({isPlaying:()=>mode==='playing',isPaused:()=>mode==='paused',
    setPaused:value=>{mode=value?'paused':'playing';},clearInput:()=>{clearMovement(keys,stick);queued=null;},
    onPause:()=>calls.push('pause'),onResume:()=>calls.push('resume')});
  assert.equal(pause.pause(),true);assert.equal(pause.pause(),false);
  assert.equal(queued,null);assert.equal(keys.size,0);assert.deepEqual(stick,{x:0,z:0});
  keys.add('KeyD');stick.z=1;
  assert.equal(pause.resume(),true);assert.equal(pause.resume(),false);
  assert.equal(keys.size,0);assert.deepEqual(stick,{x:0,z:0});assert.deepEqual(calls,['pause','resume']);
  mode='result';assert.equal(pause.pause(),false);assert.equal(pause.resume(),false);
});

test('movement reset supports both arena axis conventions and releases only owned captures',()=>{
  const keys=new Set(['ArrowUp']),stick={x:1,y:-1};clearMovement(keys,stick);
  assert.equal(keys.size,0);assert.deepEqual(stick,{x:0,y:0});
  const releases=[],target={hasPointerCapture:id=>id===7,releasePointerCapture:id=>releases.push(id)};
  releaseCapturedPointer(target,null);releaseCapturedPointer(target,6);releaseCapturedPointer(target,7);
  assert.deepEqual(releases,[7]);
});
