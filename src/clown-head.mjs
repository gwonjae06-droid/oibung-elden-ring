import * as THREE from 'three';
import {CLOWN_FACE,applyFaceAlpha} from './clown-face.mjs';
import {HEAD_RADII,uvFor,morphHead,headPose} from './clown-morph.mjs';
export function createClownHead(){
 const group=new THREE.Group();group.name='clown-head';const R=HEAD_RADII;
 const make=(start,front)=>{const geo=new THREE.SphereGeometry(1,72,56,start,Math.PI);geo.scale(R.x,R.y,R.z);const base=Float32Array.from(geo.attributes.position.array);if(front){const uv=geo.attributes.uv;for(let i=0;i<geo.attributes.position.count;i++){const t=uvFor(base[i*3],base[i*3+1],CLOWN_FACE.crop);uv.setXY(i,t[0],t[1]);}uv.needsUpdate=true;}return {geo,base};};
 const f=make(0,true),b=make(Math.PI,false),fm=new THREE.MeshStandardMaterial({color:0xd9b9a8,roughness:.72,alphaTest:.5}),bm=new THREE.MeshStandardMaterial({color:0x17120f,roughness:.92,side:THREE.DoubleSide});
 const front=new THREE.Mesh(f.geo,fm),back=new THREE.Mesh(b.geo,bm);back.scale.setScalar(.985);front.castShadow=back.castShadow=true;group.add(back,front);let texture=null;
 const ready=new Promise(resolve=>{const img=new Image();img.onload=()=>{try{const c=document.createElement('canvas');c.width=CLOWN_FACE.w;c.height=CLOWN_FACE.h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);ctx.putImageData(applyFaceAlpha(ctx.getImageData(0,0,c.width,c.height)),0,0);texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;fm.map=fm.emissiveMap=texture;fm.color.setHex(0xffffff);fm.emissive.setHex(0x555555);fm.needsUpdate=true;resolve(true);}catch(e){console.error(e);resolve(false);}};img.onerror=()=>resolve(false);img.src='data:image/jpeg;base64,'+CLOWN_FACE.jpeg;});
 function setMorph(p,time=0){for(const part of[f,b]){morphHead(part.base,part.geo.attributes.position.array,p,time);part.geo.attributes.position.needsUpdate=true;part.geo.computeVertexNormals();part.geo.computeBoundingSphere();}}
 function setPose(name,t=0,time=0){setMorph(headPose(name,t),time);}
 function dispose(){f.geo.dispose();b.geo.dispose();fm.dispose();bm.dispose();texture?.dispose();}
 setPose('idle');return {group,setMorph,setPose,ready,dispose};
}
