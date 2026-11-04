import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSurfaceTexture} from '../src/kwon-surface.mjs';
function fixture(){
 const resources=[],image={src:''},runtime={disposed:false,own(x){resources.push(x);return x;}};
 class Texture{constructor(){this.repeat={set:(x,y)=>{this.tiles=[x,y];}};}dispose(){this.disposed=true;}}
 const THREE={Texture,RepeatWrapping:1,SRGBColorSpace:'srgb',NoColorSpace:''};
 return {image,runtime,resources,THREE,load(options={}){return loadSurfaceTexture(THREE,runtime,{url:'stone.jpg',createImage:()=>image,...options});}};
}
test('surface color maps use sRGB while normal and roughness data stay linear',()=>{
 const f=fixture(),color=f.load({color:true,repeat:9}),normal=f.load();
 assert.equal(color.colorSpace,'srgb');assert.equal(normal.colorSpace,'');assert.deepEqual(color.tiles,[9,9]);
 f.image.onload();assert.equal(normal.image,f.image);assert.equal(normal.needsUpdate,true);
});
test('a late image completion cannot update a disposed arena texture',()=>{
 const f=fixture(),texture=f.load(),complete=f.image.onload;f.runtime.disposed=true;complete();
 assert.equal(texture.image,undefined);assert.equal(texture.needsUpdate,undefined);
 for(const resource of f.resources)resource.dispose();
 assert.equal(f.image.onload,null);assert.equal(f.image.onerror,null);assert.equal(f.image.src,'');assert.equal(texture.disposed,true);
});
