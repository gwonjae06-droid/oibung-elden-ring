import * as THREE from 'three';
// Capture the actual 3D curtain-call cast into a dedicated framebuffer.
// WebGL canvas.toDataURL() is unreliable with preserveDrawingBuffer=false.
export function captureGyuwonEnsemblePhoto(renderer,scene,camera,doc,{width=960,height=540}={}){
 const target=new THREE.WebGLRenderTarget(width,height,{depthBuffer:true,stencilBuffer:false});
 const previous=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4());
 const oldScissorTest=renderer.getScissorTest();
 const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:false});
 if(!ctx){target.dispose();return null;}
 const data=new Uint8Array(width*height*4);
 try{
  renderer.setScissorTest(false);
  renderer.setRenderTarget(target);
  renderer.setViewport(0,0,width,height);
  renderer.clear(true,true,true);
  renderer.render(scene,camera);
  renderer.readRenderTargetPixels(target,0,0,width,height,data);
  const image=ctx.createImageData(width,height);
  for(let y=0;y<height;y++){
   const src=(height-y-1)*width*4,dst=y*width*4;
   image.data.set(data.subarray(src,src+width*4),dst);
  }
  ctx.putImageData(image,0,0);
  const jpeg=canvas.toDataURL('image/jpeg',.74);
  return jpeg.startsWith('data:image/jpeg;base64,')&&jpeg.length>6000&&jpeg.length<900000?jpeg:null;
 }finally{
  renderer.setRenderTarget(previous);
  renderer.setViewport(viewport);
  renderer.setScissorTest(oldScissorTest);
  target.dispose();
 }
}
