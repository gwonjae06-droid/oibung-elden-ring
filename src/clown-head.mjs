import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {CLOWN_FACE,applyFaceAlpha} from './clown-face.mjs';
// All visible/throwable heads share one asynchronous JPEG decode and alpha-mask
// rasterization. Each head still owns its own texture for deterministic disposal.
let sharedCanvasPromise=null;
function clownFaceCanvas(){
 if(!sharedCanvasPromise)sharedCanvasPromise=new Promise(resolve=>{
  const image=new Image();image.onload=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=CLOWN_FACE.w;canvas.height=CLOWN_FACE.h;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   ctx.putImageData(applyFaceAlpha(ctx.getImageData(0,0,canvas.width,canvas.height)),0,0);
   resolve(canvas);
  }catch(error){console.error('Clown face rasterization failed',error);resolve(null);}};
  image.onerror=()=>resolve(null);image.src='data:image/jpeg;base64,'+CLOWN_FACE.jpeg;
 });
 return sharedCanvasPromise;
}

import {HEAD_RADII,uvFor,morphHead,headPose} from './clown-morph.mjs';
import {clownHeadMeshDetail} from './clown-photo-performance.mjs';
export function createClownHead({projectile=false}={}){
 return runThreeStartup(THREE,(THREE,own)=>{

 const group=new THREE.Group();group.name='clown-head';const R=HEAD_RADII,detail=clownHeadMeshDetail(projectile);
 const make=(start,front)=>{const geo=new THREE.SphereGeometry(1,detail.width,detail.height,start,Math.PI);geo.scale(R.x,R.y,R.z);const base=Float32Array.from(geo.attributes.position.array);if(front){const uv=geo.attributes.uv;for(let i=0;i<geo.attributes.position.count;i++){const t=uvFor(base[i*3],base[i*3+1],CLOWN_FACE.crop);uv.setXY(i,t[0],t[1]);}uv.needsUpdate=true;}return {geo,base};};
 const f=make(0,true),b=make(Math.PI,false),fm=new THREE.MeshStandardMaterial({color:0xd9b9a8,roughness:.72,alphaTest:.5}),bm=new THREE.MeshStandardMaterial({color:0x17120f,roughness:.92,side:THREE.DoubleSide});
 const front=new THREE.Mesh(f.geo,fm),back=new THREE.Mesh(b.geo,bm);back.scale.setScalar(.985);front.castShadow=back.castShadow=!projectile;
 // Deforming projectiles can grow past their idle bounding sphere. Keep them
 // visible without a per-frame bounding-sphere recalculation.
 if(projectile)front.frustumCulled=back.frustumCulled=false;
 group.add(back,front);let texture=null,disposed=false;
 const ready=clownFaceCanvas().then(c=>{if(disposed||!c)return false;try{
   texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
   fm.map=fm.emissiveMap=texture;fm.color.setHex(0xffffff);fm.emissive.setHex(0x555555);fm.needsUpdate=true;
   return true;
  }catch(e){console.error(e);return false;}});
 function setMorph(p,time=0){for(const part of[f,b]){morphHead(part.base,part.geo.attributes.position.array,p,time);part.geo.attributes.position.needsUpdate=true;part.geo.computeVertexNormals();if(!projectile)part.geo.computeBoundingSphere();}}
 function setPose(name,t=0,time=0){setMorph(headPose(name,t),time);}
 // Upload the first photo face texture before the shutter event, once the
 // asynchronous image decode finishes. Failure only skips prewarming.
 function prewarmTexture(renderer){return ready.then(ok=>{
  if(ok&&!disposed&&texture&&typeof renderer?.initTexture==='function')
   renderer.initTexture(texture);
  return ok;
 });}
 function dispose(){if(disposed)return;disposed=true;f.geo.dispose();b.geo.dispose();fm.dispose();bm.dispose();texture?.dispose();}
 setPose('idle');return {group,setMorph,setPose,prewarmTexture,ready,dispose};

 });
}
