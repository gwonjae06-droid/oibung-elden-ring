import * as T from 'three';

export const GYUWON_FACE_URL=new URL('../assets/kyu.png',import.meta.url).href;

// The requested likeness is one unmodified sphere and one photograph. Project
// the whole photograph over its front, without a second set of facial features.
export function gyuwonPhotoGeometry(radius=.5,{coarse=false}={}){
 const geometry=new T.SphereGeometry(radius,coarse?28:64,coarse?26:48);
 const p=geometry.attributes.position,uv=geometry.attributes.uv;
 for(let i=0;i<p.count;i++)uv.setXY(i,.5+p.getX(i)/(radius*2),.5+p.getY(i)/(radius*2));
 uv.needsUpdate=true;return geometry;
}

export function gyuwonPhotoMaterial(){
 let texture=null;
 if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
  texture=new T.TextureLoader().load(GYUWON_FACE_URL);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 }
 const material=new T.MeshBasicMaterial({map:texture,color:0xffffff,toneMapped:false});
 material.userData.gyuwonPhoto=true;material.userData.photoSource=GYUWON_FACE_URL;
 // Tag only the offscreen ink render's alpha channel. The existing ink pass
 // keeps these source pixels intact; normal world renders remain opaque.
 const mask={value:0};
 material.onBeforeRender=renderer=>{mask.value=renderer.getRenderTarget()?.texture?.name==='gyuwon-act-five-doodle-world'?1:0;};
 material.onBeforeCompile=shader=>{shader.uniforms.uGyuwonPhotoMask=mask;shader.fragmentShader='uniform float uGyuwonPhotoMask;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\nif(uGyuwonPhotoMask>.5) gl_FragColor.a=.5;');};
 material.customProgramCacheKey=()=> 'gyuwon-fixed-kyu-sphere-v1';
 return {material,texture};
}

export function drawGyuwonPhoto(c,image,x,y,r,{mirror=false}={}){
 c.save();c.translate(x,y);if(mirror)c.scale(-1,1);c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.clip();
 c.fillStyle='#d2b69e';c.fillRect(-r,-r,r*2,r*2);
 if(image?.complete&&image.naturalWidth>0)c.drawImage(image,-r,-r,r*2,r*2);
 const edge=c.createRadialGradient(-r*.24,-r*.3,r*.35,0,0,r);edge.addColorStop(0,'#00000000');edge.addColorStop(1,'#00000028');c.fillStyle=edge;c.fillRect(-r,-r,r*2,r*2);c.restore();
}
