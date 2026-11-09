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

test('every Gyuwon year and the final song share colored ink',()=>{
 assert.equal(isGyuwonLivingDoodleAct(null),false);
 for(let year=1;year<=11;year++)assert.equal(isGyuwonLivingDoodleAct({year}),true);
 assert.equal(isGyuwonLivingDoodleAct({year:11,finishing:true}),true);
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

test('2D ink reuses one texture and restores renderer state before returning to a resized 3D world',()=>{
 const renderer=fakeRenderer();renderer.autoClear=true;
 const pass=createGyuwonLivingDoodle(renderer),canvas={width:640,height:360};
 assert.equal(pass.renderCanvas(canvas,{time:2,opacity:.4}),true);
 const quad=renderer.calls.at(-1).scene.children[0],texture=quad.material.uniforms.tStage.value;
 // tStage is restored immediately; observe the uploaded canvas via render.
 const render=renderer.render.bind(renderer);let first=null,again=null;
 renderer.render=(scene,camera)=>{if(scene.children[0]?.material?.uniforms){const tex=scene.children[0].material.uniforms.tStage.value;if(tex.isCanvasTexture){if(!first)first=tex;else again=tex;}}render(scene,camera);};
 pass.renderCanvas(canvas,{time:3});pass.renderCanvas(canvas,{time:4});assert.equal(first,again);
 assert.equal(renderer.autoClear,true);assert.equal(quad.material.transparent,false);assert.equal(quad.material.uniforms.uCompositeAlpha.value,1);
 renderer.getDrawingBufferSize=v=>v.set(800,450);
 pass.render(new THREE.Scene(),new THREE.PerspectiveCamera(),{active:true});
 assert.deepEqual([texture.image.width,texture.image.height],[800,450]);assert.equal(pass.stats().source,'world');pass.dispose();
});
