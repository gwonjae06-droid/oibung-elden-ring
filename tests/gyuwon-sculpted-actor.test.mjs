import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGyuwonGame} from '../src/gyuwon-combat.mjs';
test('final boss uses the fixed photo sphere, shaped torso, articulated hands and LOD tiers',()=>{
 const hi=createGyuwonActor(new THREE.Scene()),lo=createGyuwonActor(new THREE.Scene(),{coarse:true});
 const face=hi.root.getObjectByName('gyuwon-anatomical-face'),lowFace=lo.root.getObjectByName('gyuwon-anatomical-face');
 assert.ok(face.geometry.getAttribute('position').count>2000);
 assert.ok(face.geometry.getAttribute('position').count>lowFace.geometry.getAttribute('position').count);
 for(const name of ['gyuwon-tailored-torso','gyuwon-tailored-leg','gyuwon-sculpted-sleeve','gyuwon-articulated-finger'])
  assert.ok(hi.root.getObjectByName(name),name);
 assert.equal(face.geometry.type,'SphereGeometry');assert.equal(face.scale.x,1);assert.equal(face.scale.y,1);assert.equal(face.scale.z,1);
 for(const name of ['gyuwon-sculpted-ear','gyuwon-jaw','gyuwon-nose','gyuwon-eye','gyuwon-layered-hair','gyuwon-expression-bones'])assert.equal(hi.root.getObjectByName(name),undefined,name+' must not cover the photograph');
 assert.match(face.material.userData.photoSource,/assets\/kyu.png$/);
 const g=createGyuwonGame();assert.doesNotThrow(()=>hi.update(g,0,1/60));
 assert.ok(hi.root.getObjectByName('gyuwon-head').visible);
});
