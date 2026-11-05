import test from 'node:test';import assert from 'node:assert/strict';import {kwonLockFocus,kwonReticlePoint} from '../src/kwon-target-view.mjs';
test('raised chest lifts the camera focus above the old low target',()=>{const p=kwonLockFocus({x:0,y:0,z:10},{x:0,y:8,z:0});assert.ok(p.y>2.9);assert.equal(p.z,5.5);});
test('offset chest is followed rather than the body origin',()=>{const p=kwonLockFocus({x:0,y:0,z:10},{x:2,y:4,z:0});assert.equal(p.x,.9);});
test('focus blending remains bounded at long distance',()=>assert.equal(kwonLockFocus({x:0,y:0,z:0},{x:100,y:4,z:0}).x,45));
test('reticle projection uses the final camera screen point',()=>assert.deepEqual(kwonReticlePoint({x:0,y:0,z:.5},1000,600),{x:494,y:294}));
test('clipped points and invalid dimensions are rejected',()=>{assert.equal(kwonReticlePoint({x:0,y:0,z:2},100,100),null);assert.equal(kwonReticlePoint({x:NaN,y:0,z:0},100,100),null);assert.equal(kwonReticlePoint({x:0,y:0,z:0},0,100),null);assert.equal(kwonLockFocus({x:NaN,y:0,z:0},{x:0,y:3,z:0}),null);});
test('focus calculation does not mutate player or target',()=>{const p={x:1,y:0,z:5},t={x:2,y:4,z:0},before=structuredClone([p,t]);kwonLockFocus(p,t);assert.deepEqual([p,t],before);});
