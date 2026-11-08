import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonRecallMaps} from '../src/gyuwon-recall-maps.mjs';

async function fixture(run){
 const previous=globalThis.document,gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:32}),getImageData:()=>({data:new Uint8ClampedArray(1024*1024*4)})},{get:(o,k)=>k in o?o[k]:()=>{}});
 globalThis.document={createElement:()=>({width:512,height:512,getContext:()=>ctx})};
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
 const maps=createGyuwonRecallMaps(scene,{coarse:true,reduced:true});
 try{await run(maps);}finally{maps.dispose();globalThis.document=previous;}
}
test('map warmup yields bounded mesh batches and restores visibility and render target every time',async()=>{
 await fixture(async maps=>{
  const camera=new THREE.PerspectiveCamera(),original={name:'original-target'};let target=original,compiles=0,renders=0,yields=0;
  const renderer={getRenderTarget:()=>target,setRenderTarget:t=>target=t,compile(){compiles++;assert.equal(target,original);assert.equal(maps.root.children.filter(x=>x.visible).length,compiles===1?0:1);},render(){renders++;},initTexture(){}};
  await maps.prewarmProgressive(renderer,camera,{yieldFrame:async()=>{yields++;assert.equal(target,original);assert.equal(maps.root.children.filter(x=>x.visible).length,0);}});
  assert.ok(yields>4);assert.ok(renders>4);assert.equal(compiles,renders);
  assert.equal(maps.stats().compiled,4);assert.equal(maps.stats().prewarmed,true);
  assert.equal(maps.stats().warmAudit.mode,'progressive');
  const before=compiles;await maps.prewarmProgressive(renderer,camera);assert.equal(compiles,before);
 });
});
test('closing during warmup cancels future GPU work without reviving a disposed map',async()=>{
 await fixture(async maps=>{
  let compiles=0,target=null;
  const renderer={getRenderTarget:()=>target,setRenderTarget:t=>target=t,compile(){compiles++;},render(){},initTexture(){throw Error('must not upload after close');}};
  await maps.prewarmProgressive(renderer,new THREE.PerspectiveCamera(),{yieldFrame:async()=>maps.dispose()});
  assert.equal(compiles,1);assert.equal(maps.stats().loaded,0);assert.equal(maps.root.parent,null);assert.equal(target,null);
 });
});
