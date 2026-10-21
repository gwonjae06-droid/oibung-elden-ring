import test from 'node:test';import assert from 'node:assert/strict';
import {diceSegmentImpact,diceSegmentHit,diceWeakHit} from '../src/dice-hit.mjs';
const pose={x:0,y:4,z:0,rotation:[0,0,0,1]};
test('only the uploaded positive Z face is vulnerable',()=>{for(let axis=0;axis<3;axis++)for(const sign of [1,-1]){const a={x:0,y:4,z:0};a[['x','y','z'][axis]]+=sign*10;const h=diceSegmentImpact(a,{x:0,y:4,z:0},pose);assert.equal(h.face,axis*2+(sign<0?1:0));assert.equal(diceWeakHit(h),axis===2&&sign===1);}});
test('a ray crossing the whole die reports the first armor face only',()=>{const h=diceSegmentImpact({x:0,y:4,z:-10},{x:0,y:4,z:10},pose);assert.equal(h.face,5);assert.equal(diceWeakHit(h),false);});
test('the photo weakness rotates with the full quaternion',()=>{for(const rotation of [[Math.SQRT1_2,0,0,Math.SQRT1_2],[0,Math.SQRT1_2,0,Math.SQRT1_2],[.5,.5,.5,.5]]){const [x,y,z,w]=rotation,n={x:2*(x*z+w*y),y:2*(y*z-w*x),z:1-2*(x*x+y*y)},a={x:n.x*10,y:4+n.y*10,z:n.z*10};assert.equal(diceSegmentImpact(a,{x:0,y:4,z:0},{...pose,rotation}).face,4);}});
test('grazing a shared corner cannot bypass the armor',()=>{assert.equal(diceWeakHit(diceSegmentImpact({x:10,y:4,z:10},{x:0,y:4,z:0},pose)),false);});
test('misses and rays starting inside the cube do not count as valid attacks',()=>{assert.equal(diceSegmentHit({x:10,y:20,z:0},{x:-10,y:20,z:0},pose),false);assert.equal(diceSegmentImpact({x:0,y:4,z:0},{x:0,y:4,z:10},pose),null);});
test('invalid rotations and coordinates fail safely',()=>{assert.equal(diceSegmentImpact({x:NaN,y:4,z:0},{x:0,y:4,z:0},pose),null);assert.equal(diceSegmentImpact({x:0,y:4,z:10},{x:0,y:4,z:0},{...pose,rotation:[0,0,0,0]}),null);});
