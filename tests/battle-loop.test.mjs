import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleLoop} from '../src/runtime/battle-loop.mjs';

function rig(update) {
  let now=0,id=0;
  const frames=new Map(),seen=[],errors=[];
  const loop=createBattleLoop({now:()=>now,request:fn=>{frames.set(++id,fn);return id;},
    cancel:id=>frames.delete(id),update:(time,dt)=>{seen.push(dt);update?.(loop,time,dt);},
    onError:error=>errors.push(error)});
  const step=time=>{now=time;const [key,fn]=frames.entries().next().value;frames.delete(key);fn(time);};
  return {loop,frames,seen,errors,step,setNow:value=>now=value};
}

test('battle frames clamp long gaps and backwards timestamps and keep a single owner',()=>{
  const r=rig();assert.equal(r.loop.start(),true);assert.equal(r.loop.start(),false);
  r.step(16);r.step(1016);r.step(1000);
  assert.deepEqual(r.seen,[.016,.05,0]);
  assert.equal(r.frames.size,1);
  r.loop.dispose();assert.equal(r.frames.size,0);
  assert.equal(r.loop.start(),false);
});

test('stop and restart discard stale callbacks and elapsed time while stopped',()=>{
  const r=rig();r.loop.start();const stale=[...r.frames.values()][0];r.loop.stop();
  r.setNow(10000);r.loop.start();stale(5000);assert.deepEqual(r.seen,[]);
  r.step(10016);assert.deepEqual(r.seen,[.016]);assert.equal(r.frames.size,1);
  r.loop.dispose();stale(20000);assert.equal(r.frames.size,0);
});

test('closing during render cannot schedule another frame',()=>{
  const r=rig(loop=>loop.dispose());r.loop.start();r.step(16);
  assert.equal(r.frames.size,0);assert.equal(r.loop.disposed,true);
});

test('render exceptions stop scheduling and are reported once',()=>{
  const r=rig(()=>{throw Error('render');});r.loop.start();r.step(16);
  assert.equal(r.frames.size,0);assert.equal(r.loop.running,false);
  assert.equal(r.errors.length,1);r.loop.dispose();
});
