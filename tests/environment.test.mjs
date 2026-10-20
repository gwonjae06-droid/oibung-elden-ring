import test from 'node:test';
import assert from 'node:assert/strict';
import {environmentPlan} from '../src/environment-data.mjs';
test('layout is deterministic',()=>assert.deepEqual(environmentPlan(),environmentPlan()));
test('different seeds change the layout',()=>assert.notDeepEqual(environmentPlan(17),environmentPlan(18)));
test('walls and rubble stay outside the movement area and camera buffer',()=>{
  const p=environmentPlan();
  for(const r of p.rubble)assert.ok(Math.hypot(r.x,r.z)-r.s>26);
  for(const w of p.walls)assert.ok(Math.hypot(w.x,w.z)-Math.hypot(w.w,w.d)/2>30);
  for(const a of p.arches)assert.ok(Math.hypot(a.x,a.z)-5>26);
});
test('dense perimeter but only low plants inside the arena',()=>{
  const p=environmentPlan();assert.equal(p.rubble.length,180);assert.equal(p.grass.length,260);assert.equal(p.arches.length,4);assert.equal(p.walls.length,32);
  for(const g of p.grass){assert.ok(g.h<=.28&&g.h>=.08);assert.ok(Math.hypot(g.x,g.z)>=18);}
});
test('all plan values are finite',()=>{
  function visit(x){if(typeof x==='number')assert.ok(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(visit);}
  visit(environmentPlan());
});
test('cracks stay on the arena floor',()=>{
  const p=environmentPlan();assert.ok(p.cracks.length>65);
  for(const c of p.cracks)for(const a of [c.a,c.b])assert.ok(Math.hypot(a.x,a.z)<24);
});
