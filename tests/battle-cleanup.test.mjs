import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleCleanup} from '../src/runtime/battle-cleanup.mjs';
import {cameraMovement} from '../src/battle-input.mjs';

test('battle cleanup invokes every step immediately and reports asynchronous failures',async()=>{
  const calls=[];
  const close=createBattleCleanup(()=>[
    ['first',()=>{calls.push('first');throw Error('failed');}],
    ['audio',()=>{calls.push('audio');return Promise.reject(Error('closed'));}],
    ['dialog',()=>calls.push('dialog')]
  ]);
  const result=close();
  assert.deepEqual(calls,['first','audio','dialog']);
  assert.equal(close(),result);
  assert.deepEqual((await result).errors.map(error=>error.label),['first','audio']);
});

test('shared camera movement normalizes diagonal input and keeps lock state',()=>{
  const movement=cameraMovement(new Set(['KeyW','KeyD']),{x:0,z:0},0,true);
  assert.ok(Math.abs(Math.hypot(movement.x,movement.z)-1)<1e-12);
  assert.ok(movement.x<0&&movement.z>0);
  assert.equal(movement.lock,true);
});
