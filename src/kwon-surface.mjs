// Image requests and GPU resources share the arena lifetime, including failed/late loads.
export function loadSurfaceTexture(THREE,runtime,{url,repeat=1,color=false,anisotropy=1,createImage=()=>new Image()}){
 const texture=runtime.own(new THREE.Texture()),image=createImage();
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);
 texture.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.anisotropy=anisotropy;
 image.onload=()=>{if(runtime.disposed)return;texture.image=image;texture.needsUpdate=true;};
 image.onerror=()=>{if(!runtime.disposed)console.warn('Kwon surface unavailable:',url);};
 runtime.own({dispose(){image.onload=image.onerror=null;image.src='';}});
 image.src=url;return texture;
}
