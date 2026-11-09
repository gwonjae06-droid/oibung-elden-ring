import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonLivingDoodle,isGyuwonLivingDoodleAct,gyuwonDoodleDrawingAt} from '../src/gyuwon-living-doodle.mjs';

function fakeRenderer(){
 const calls=[];let target=null;
 return {calls,
  getRenderTarget(){return target;},
  getDrawingBufferSize(v){return v.set(640,360);},
  setRenderTarget(value){target=value;},
  render(scene,camera){calls.push({scene,camera,target});},
  compile(){calls.push({kind:'prewarm'});}
 };
}

test('only the 5수 original 3D reference act receives the living doodle',()=>{
 assert.equal(isGyuwonLivingDoodleAct(null),false);
 assert.equal(isGyuwonLivingDoodleAct({year:4,reference:true}),false);
 assert.equal(isGyuwonLivingDoodleAct({year:5,reference:false}),false);
 assert.equal(isGyuwonLivingDoodleAct({year:5,reference:true}),true);
 assert.equal(isGyuwonLivingDoodleAct({year:5,reference:true,giantRaid:true}),true);
 assert.equal(isGyuwonLivingDoodleAct({year:5,reference:true,finishing:true}),false);
 assert.equal(isGyuwonLivingDoodleAct({year:6,reference:true}),false);
 assert.equal(isGyuwonLivingDoodleAct({year:11,reference:false}),false);
});

test('two hand-ink drawings alternate eight times a second, frozen on reduced motion',()=>{
 assert.equal(gyuwonDoodleDrawingAt(0),0);
 assert.equal(gyuwonDoodleDrawingAt(.124),0);
 assert.equal(gyuwonDoodleDrawingAt(.125),1);
 assert.equal(gyuwonDoodleDrawingAt(.25),0);
 assert.equal(gyuwonDoodleDrawingAt(123.625),1);
 assert.equal(gyuwonDoodleDrawingAt(123.625,true),0);
 assert.equal(gyuwonDoodleDrawingAt(Number.NaN),0);
});

test('doodle processes the 3D WORLD in two render passes without touching HUD',()=>{
 const renderer=fakeRenderer(),stage=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const pass=createGyuwonLivingDoodle(renderer,{coarse:false});
 pass.prewarm();
 assert.equal(renderer.calls[0].kind,'prewarm');
 assert.equal(pass.render(stage,camera,{active:false,time:1}),false);
 assert.equal(renderer.calls.length,2);
 assert.equal(renderer.calls[1].scene,stage);
 assert.equal(pass.render(stage,camera,{active:true,time:0}),true);
 assert.equal(renderer.calls.length,4);
 assert.equal(renderer.calls[2].scene,stage);
 assert.ok(renderer.calls[2].target instanceof THREE.WebGLRenderTarget);
 assert.equal(renderer.calls[3].target,null);
 assert.notEqual(renderer.calls[3].scene,stage);
 assert.equal(renderer.getRenderTarget(),null);
 assert.deepEqual([pass.stats().width,pass.stats().height],[640,360]);
 assert.equal(pass.render(stage,camera,{active:true,time:.125}),true);
 assert.equal(pass.stats().frame,1);
 pass.dispose();pass.dispose();
 assert.equal(pass.stats().active,false);
});

test('an unsupported shader falls back to unfiltered battle render rather than blocking music',()=>{
 const renderer=fakeRenderer(),stage=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
 const normalRender=renderer.render.bind(renderer);
 let fail=true;
 renderer.render=(scene,camera)=>{
  if(fail&&scene!==stage){fail=false;throw Error('GPU shader unavailable');}
  normalRender(scene,camera);
 };
 const pass=createGyuwonLivingDoodle(renderer,{coarse:true,reducedMotion:true});
 const old=console.warn;let warned=false;
 try{console.warn=()=>{warned=true};assert.equal(pass.render(stage,camera,{active:true,time:.2}),false);}
 finally{console.warn=old}
 assert.equal(warned,true);
 assert.equal(renderer.getRenderTarget(),null);
 assert.equal(renderer.calls.at(-1).scene,stage);
 assert.equal(pass.render(stage,camera,{active:true,time:.5}),false);
 assert.equal(pass.stats().active,false);
 pass.dispose();
});
