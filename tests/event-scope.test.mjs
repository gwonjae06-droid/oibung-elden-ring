import test from 'node:test';
import assert from 'node:assert/strict';
import {createEventScope} from '../src/runtime/event-scope.mjs';

function rig() {
  let next=0;
  const timers=new Map(),listeners=new Map();
  const win={setTimeout:fn=>{timers.set(++next,fn);return next;},clearTimeout:id=>timers.delete(id)};
  const target={addEventListener(type,fn){const set=listeners.get(type)||new Set();set.add(fn);listeners.set(type,set);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);}};
  return {win,target,timers,listeners};
}

test('closing one battle removes its listeners and timers and rejects saved callbacks',()=>{
  const r=rig(),scope=createEventScope(r.win);let calls=0;
  scope.listen(r.target,'keydown',()=>calls++);
  scope.setTimeout(()=>calls++,850);
  const listener=[...r.listeners.get('keydown')][0],timer=[...r.timers.values()][0];
  listener();assert.equal(calls,1);
  scope.dispose();scope.dispose();
  assert.equal(r.listeners.get('keydown').size,0);assert.equal(r.timers.size,0);
  listener();timer();assert.equal(calls,1);
  assert.equal(scope.setTimeout(()=>calls++,0),null);
});

test('adopted property handlers become inert while replacement handlers stay owned by their installer',()=>{
  const r=rig(),scope=createEventScope(r.win);let calls=0;
  const element={onclick(){calls++;return this;},onpointerdown(){calls++;}};
  scope.ownHandlers({querySelectorAll:()=>[element]});
  const saved=element.onclick;
  assert.equal(element.onclick(),element);
  const replacement=()=>{};element.onpointerdown=replacement;
  scope.dispose();assert.equal(element.onclick,null);assert.equal(element.onpointerdown,replacement);
  saved();assert.equal(calls,1);
});

test('reinstalling a battle does not retain old subscriptions and cleanup continues after failure',()=>{
  const r=rig(),old=createEventScope(r.win);let calls=0;
  old.listen(r.target,'blur',()=>calls++);old.add(()=>{throw Error('cleanup');});
  assert.equal(old.dispose().errors.length,1);
  const fresh=createEventScope(r.win);fresh.listen(r.target,'blur',()=>calls++);
  assert.equal(r.listeners.get('blur').size,1);
  for(const fn of r.listeners.get('blur'))fn();assert.equal(calls,1);
  fresh.dispose();assert.equal(r.listeners.get('blur').size,0);
});
