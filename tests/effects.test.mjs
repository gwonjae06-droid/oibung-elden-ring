import test from 'node:test';
import assert from 'node:assert/strict';
import {createParticlePool,FX_LIMIT,impactDue,trailAllowed} from '../src/effects-data.mjs';
test('particle count is capped even under repeated hit events',()=>{
  const p=createParticlePool();for(let i=0;i<100;i++)p.emit(0,0,0,80,[1,.5,0]);assert.equal(p.particles.length,FX_LIMIT);
});
test('expired particles are reclaimed and can be spawned again',()=>{
  const p=createParticlePool(12,()=>.5);p.emit(0,1,0,12,[1,1,1]);
  for(let i=0;i<50;i++)p.step(.05);assert.equal(p.particles.length,0);
  p.emit(0,1,0,5,[1,1,1]);assert.equal(p.particles.length,5);
});
test('clear removes every live effect particle',()=>{const p=createParticlePool();p.emit(0,1,0,20,[1,0,0]);p.clear();assert.equal(p.particles.length,0);});
test('particles move, stay above the floor and keep finite coordinates',()=>{
  const p=createParticlePool(80,()=>.4);p.emit(0,.1,0,20,[1,1,0]);p.emit(0,.1,0,20,[.5,.4,.3],true);p.step(.05);
  assert.ok(p.particles.some(x=>Math.abs(x.x)>0));
  for(let i=0;i<20;i++)p.step(.05);
  for(const q of p.particles){assert.ok(q.y>=.025);for(const k of ['x','y','z','vx','vy','vz','life'])assert.ok(Number.isFinite(q[k]));}
});
test('negative time is ignored and long frames are clamped',()=>{
  const p=createParticlePool(2,()=>.5);p.emit(0,1,0,1,[1,1,1]);const life=p.particles[0].life;
  p.step(-1);assert.equal(p.particles[0].life,life);p.step(50);assert.ok(Math.abs(p.particles[0].life-(life-.05))<1e-9);
});
test('impact happens late in the strike, not in windup or recovery',()=>{
  assert.equal(impactDue({state:'windup',pattern:'slam',t:2},1),false);
  assert.equal(impactDue({state:'active',pattern:'slam',t:.83},1),false);
  assert.equal(impactDue({state:'active',pattern:'slam',t:.84},1),true);
  assert.equal(impactDue({state:'active',pattern:'leap',t:.7},1),true);
  assert.equal(impactDue({state:'recovery',pattern:'leap',t:1},1),false);
});
test('trails show only during physical sword attacks',()=>{
  for(const pattern of ['sweep','jab','whirl'])assert.equal(trailAllowed({state:'active',pattern}),true);
  for(const pattern of ['wave','retreat'])assert.equal(trailAllowed({state:'active',pattern}),false);
  assert.equal(trailAllowed({state:'idle',pattern:'slam'}),false);
});
