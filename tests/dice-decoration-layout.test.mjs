import test from 'node:test';
import assert from 'node:assert/strict';
import {diceDecorations,dicePortraitUv} from '../src/dice-decoration-data.mjs';
test('each face has its numbered pips and spikes',()=>{const a=diceDecorations();assert.deepEqual(a.map(f=>f.count),[1,6,2,5,3,4]);for(const f of a){assert.equal(f.points.length,f.count);assert.equal(f.spikes.length,f.count);}assert.equal(a.reduce((n,f)=>n+f.count,0),21);});
test('pips protrude and spikes avoid their centers',()=>{for(const f of diceDecorations()){assert.ok(f.depth/f.radius>.8);assert.ok(f.offset+f.depth>.7);for(const [x,y]of f.spikes)for(const [a,b]of f.points)assert.ok(Math.hypot(x-a,y-b)>f.radius+f.spikeRadius);}});
test('portrait UV is centered and not mirrored',()=>{assert.deepEqual(dicePortraitUv(-1,-1,1),[0,0]);assert.deepEqual(dicePortraitUv(1,1,1),[1,1]);assert.deepEqual(dicePortraitUv(0,0,1),[.5,.5]);});
