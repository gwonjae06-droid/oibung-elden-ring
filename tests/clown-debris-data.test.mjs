import test from 'node:test';
import assert from 'node:assert/strict';
import {clownDebris,stepClownDebris} from '../src/clown-debris-data.mjs';
test('debris is reproducible',()=>assert.deepEqual(clownDebris(4),clownDebris(4)));
test('paper and rubber both spawn',()=>assert.deepEqual(new Set(clownDebris().map(p=>p.kind)),new Set(['paper','rubber'])));
test('capacity is bounded',()=>{assert.equal(clownDebris(0,10000).length,128);assert.equal(clownDebris(0,-2).length,0);assert.equal(clownDebris(0,NaN).length,0);});
test('simulated fragments remain finite and above the floor',()=>{for(const p of clownDebris(3,128))for(let i=0;i<240;i++){stepClownDebris(p,1/120);for(const key of ['x','y','z','rx','ry','rz','life'])assert.ok(Number.isFinite(p[key]));assert.ok(p.y>=.08);}});
test('pause and invalid dt do not move fragments',()=>{const p=clownDebris()[0],before={...p};for(const h of [0,-1,NaN,Infinity])stepClownDebris(p,h);assert.deepEqual(p,before);});
test('particles expire',()=>{const p=clownDebris()[0];for(let i=0;i<300;i++)stepClownDebris(p,.05);assert.equal(p.life,0);});
