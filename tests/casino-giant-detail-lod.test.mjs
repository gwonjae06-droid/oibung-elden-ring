import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildGentlemanHand,buildGentlemanTorso} from '../src/dice-giant-model.mjs';
const m=()=>Object.fromEntries(['suit','satin','shirt','tie','gold','skin'].map(n=>[n,new THREE.MeshStandardMaterial()]));
const tris=mesh=>{let sum=0;mesh.traverse(o=>{const g=o.geometry;if(g)sum+=(g.index?g.index.count:g.attributes.position.count)/3;});return sum;};
test('tailored casino giant retains more face/hand detail on desktop than touch tier',()=>{
 const torsoHi=buildGentlemanTorso(THREE,m()),torsoLo=buildGentlemanTorso(THREE,m(),{coarse:true});
 assert.ok(tris(torsoHi.group)>3500);
 assert.ok(tris(torsoHi.group)>tris(torsoLo.group));
 const handHi=buildGentlemanHand(THREE,m(),1),handLo=buildGentlemanHand(THREE,m(),1,{coarse:true});
 assert.ok(tris(handHi.group)>4000);
 assert.ok(tris(handHi.group)>tris(handLo.group));
 assert.equal(handHi.fingers.length,4);
 assert.ok(handHi.fingers.every(parts=>parts.length===3));
});
