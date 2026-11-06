import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFreeLookCamera,mouseLookAngles} from '../src/free-look-camera.mjs';
function rig(){
 const listeners=new Map();
 const doc={pointerLockElement:null,addEventListener(k,fn){listeners.set(k,fn);},
  removeEventListener(k,fn){if(listeners.get(k)===fn)listeners.delete(k);},
  exitPointerLock(){this.pointerLockElement=null;}};
 const canvas={ownerDocument:doc,requestPointerLock(){doc.pointerLockElement=canvas;},
  getRootNode(){return {pointerLockElement:doc.pointerLockElement}}};
 return {doc,canvas,move:event=>listeners.get('mousemove')?.(event),listeners};
}
test('free camera follows mouse movement without a held button',()=>{
 const r=rig();let active=true,angles={yaw:1,pitch:.35};
 const camera=createFreeLookCamera({canvas:r.canvas,enabled:()=>active,getAngles:()=>angles,
  setAngles:next=>{angles=next;}});
 r.move({target:r.canvas,movementX:100,movementY:-40});
 assert.equal(angles.yaw,.5);assert.ok(Math.abs(angles.pitch-.19)<1e-9);
 r.move({target:{},movementX:100,movementY:100});
 assert.equal(angles.yaw,.5,'HUD mouse events must not move the camera');
 active=false;r.move({target:r.canvas,movementX:100,movementY:100});
 assert.equal(angles.yaw,.5,'lock-on or pause prevents free movement');
 camera.dispose();assert.equal(r.listeners.has('mousemove'),false);
});
test('pointer lock allows unlimited rotation and exits on relock/cleanup',async()=>{
 const r=rig();let active=true,angles={yaw:0,pitch:.4};
 const camera=createFreeLookCamera({canvas:r.canvas,enabled:()=>active,getAngles:()=>angles,
  setAngles:next=>{angles=next;}});
 camera.capture();await Promise.resolve();assert.equal(camera.captured,true);
 r.move({target:{},movementX:80,movementY:0});assert.equal(angles.yaw,-.4);
 camera.release();assert.equal(camera.captured,false);
 camera.capture();active=false;await Promise.resolve();
 assert.equal(camera.captured,false,'a late pointer lock is released when the fight ends');
 camera.dispose();
});
test('pitch limits, invalid deltas and shadow-root retargeting',()=>{
 assert.equal(mouseLookAngles({yaw:0,pitch:.4},0,-999).pitch,.08);
 assert.equal(mouseLookAngles({yaw:0,pitch:.4},0,999).pitch,1.18);
 assert.deepEqual(mouseLookAngles({yaw:0,pitch:.4},NaN,10),{yaw:0,pitch:.4});
 const r=rig();let angles={yaw:0,pitch:.4};
 const camera=createFreeLookCamera({canvas:r.canvas,getAngles:()=>angles,
  setAngles:next=>{angles=next;}});
 r.move({target:{},movementX:50,movementY:0,composedPath:()=>[r.canvas]});
 assert.equal(angles.yaw,-.25);camera.dispose();
});
test('all four boss scenes wire free-look capture, release, and cleanup',()=>{
 for(const file of ['arena','clown-battle','dice-battle','blood-battle']){
  const src=readFileSync(new URL('../src/'+file+'.mjs',import.meta.url),'utf8');
  assert.match(src,/createFreeLookCamera\(/,file+' controller');
  assert.match(src,/if\(lock\)freeLook\.release\(\);else freeLook\.capture\(\);/,file+' Q toggle');
  assert.match(src,/freeLook\.dispose\(\)/,file+' cleanup');
 }
 const clown=readFileSync(new URL('../src/clown-battle.mjs',import.meta.url),'utf8');
 assert.match(clown,/lock\?\(b\.x-p\.x\)\*\.42:0/,'unlocked clown view no longer follows the boss');
});
