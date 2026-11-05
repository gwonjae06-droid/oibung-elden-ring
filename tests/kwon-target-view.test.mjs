import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {kwonLockFocus,kwonReticlePoint,createKwonTargetView} from '../src/kwon-target-view.mjs';
test('raised chest lifts the camera focus above the old low target',()=>{const p=kwonLockFocus({x:0,y:0,z:10},{x:0,y:8,z:0});assert.ok(p.y>2.9);assert.equal(p.z,5.5);});
test('offset chest is followed rather than the body origin',()=>{const p=kwonLockFocus({x:0,y:0,z:10},{x:2,y:4,z:0});assert.equal(p.x,.9);});
test('focus blending remains bounded at long distance',()=>assert.equal(kwonLockFocus({x:0,y:0,z:0},{x:100,y:4,z:0}).x,45));
test('reticle projection uses the final camera screen point',()=>assert.deepEqual(kwonReticlePoint({x:0,y:0,z:.5},1000,600),{x:494,y:294}));
test('clipped points and invalid dimensions are rejected',()=>{assert.equal(kwonReticlePoint({x:0,y:0,z:2},100,100),null);assert.equal(kwonReticlePoint({x:NaN,y:0,z:0},100,100),null);assert.equal(kwonReticlePoint({x:0,y:0,z:0},0,100),null);assert.equal(kwonLockFocus({x:NaN,y:0,z:0},{x:0,y:3,z:0}),null);});
test('focus calculation does not mutate player or target',()=>{const p={x:1,y:0,z:5},t={x:2,y:4,z:0},before=structuredClone([p,t]);kwonLockFocus(p,t);assert.deepEqual([p,t],before);});

test('the target reticle never overwrites the arena camera or scene render hooks',()=>{
 const scene=new THREE.Scene(),root=new THREE.Group(),model=new THREE.Group();
 scene.add(root);root.add(model);model.position.z=-4;
 const reticle={hidden:true,style:{}},host={querySelector:()=>reticle};
 const boss={root,model},torso={point:()=>({x:0,y:3,z:0})};
 const previousBefore=()=>{};scene.onBeforeRender=previousBefore;
 const camera=new THREE.PerspectiveCamera(60,16/9,.1,120);
 camera.position.set(0,6,16);camera.lookAt(0,3,-4);camera.updateMatrixWorld(true);
 const view=createKwonTargetView(THREE,boss,torso,host);
 assert.equal(scene.onBeforeRender,previousBefore,'no competing onBeforeRender camera owner');
 view.update({state:'active'});
 const before=camera.quaternion.clone(),position=camera.position.clone();
 const screen=view.project(camera,true,{clientWidth:1600,clientHeight:900});
 assert.ok(screen,'visible boss has a projected marker');
 assert.equal(reticle.hidden,false);
 assert.ok(camera.quaternion.equals(before),'target projection cannot override lock orientation');
 assert.ok(camera.position.equals(position),'target projection cannot move the camera');
 assert.equal(view.project(camera,false,{clientWidth:1600,clientHeight:900}),null);
 assert.equal(reticle.hidden,true,'unlock hides the marker');
 view.dispose();assert.equal(scene.onBeforeRender,previousBefore);
});
