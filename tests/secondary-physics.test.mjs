import test from 'node:test';
import assert from 'node:assert/strict';
import {springStep,createSpringBank} from '../src/secondary-physics.mjs';

test('critically damped secondary motion converges without oscillating or overshooting',()=>{
 let x=0,v=0;
 for(let i=0;i<180;i++){
  const next=springStep(x,v,1,1/60,13);
  assert.ok(Number.isFinite(next.position)&&Number.isFinite(next.velocity));
  assert.ok(next.position>=x-1e-10&&next.position<=1+1e-10);
  x=next.position;v=next.velocity;
 }
 assert.ok(Math.abs(x-1)<1e-9);
});
test('spring steps remain bounded on large or malformed frame deltas',()=>{
 for(const dt of [0,-1,1,Infinity,NaN]) {
  const s=springStep(.5,-2,1,dt);
  assert.ok(Number.isFinite(s.position)&&Number.isFinite(s.velocity));
  assert.ok(Math.abs(s.position)<5);
 }
 const bank=createSpringBank();
 assert.equal(bank.step('arm',.8,1/60),.8);
 const frozen=bank.step('arm',-.8,0);
 assert.equal(frozen,.8);
 for(let i=0;i<120;i++)bank.step('arm',-.8,1/60,16);
 assert.ok(Math.abs(bank.step('arm',-.8,0)+.8)<.00001);
 assert.equal(bank.size,1);bank.reset();assert.equal(bank.size,0);
 assert.equal(bank.step('arm',.2,.01),.2);
});
