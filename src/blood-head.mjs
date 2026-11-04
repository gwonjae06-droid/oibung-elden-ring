import * as THREE from 'three';

// A closed skull, rather than a portrait plane. Front UVs project the photo
// onto cheeks, jaw and nose; the atlas wraps into hair and skin at the sides.
export function bloodHeadGeometry(){
 const geo=new THREE.SphereGeometry(1,64,48),p=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),jaw=1-.17*Math.max(0,-y);
  const nose=z>0?.11*Math.exp(-Math.pow(x/.17,2)-Math.pow((y+.22)/.19,2)):0;
  p.setXYZ(i,x*.64*jaw,y*.84,z*.57+nose);
  // Positive Z is the actor's forward direction.
  const angle=Math.atan2(x,z);uv.setXY(i,.5+angle/(2*Math.PI),(y+1)/2);
 }
 p.needsUpdate=true;uv.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
export function createBloodHead(){
 const group=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0xc49c87,roughness:.82});
 const skull=new THREE.Mesh(bloodHeadGeometry(),material);skull.name='baeseojun-sculpted-head';group.add(skull);
 const neck=new THREE.Mesh(new THREE.CylinderGeometry(.25,.32,.48,24),new THREE.MeshStandardMaterial({color:0xb68d78,roughness:.85}));neck.position.y=-.83;group.add(neck);
 let disposed=false,texture=null;
 if(globalThis.document?.createElement&&globalThis.Image){
  const image=new Image();image.onload=()=>{
   if(disposed)return;
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
   const ctx=canvas.getContext('2d'),source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
   const s=source.getContext('2d');s.drawImage(image,0,0);const photo=s.getImageData(0,0,source.width,source.height),out=ctx.createImageData(1024,1024);
   for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
    const angle=(x/1023-.5)*Math.PI*2,sy=Math.min(source.height-1,Math.round(y/1023*(source.height-12))),sx=Math.max(0,Math.min(source.width-1,Math.round((.5+Math.sin(angle)*.485)*(source.width-1))));
    const q=(sy*source.width+sx)*4,k=(y*1024+x)*4;
    let blend=Math.max(0,Math.min(1,(Math.cos(angle)-.05)/.28))*(photo.data[q+3]/255);
    // The uploaded cutout includes a grey collar beside the jaw: do not wrap it onto skin.
    if(y>580)blend*=Math.max(0,Math.min(1,(photo.data[q]-photo.data[q+2]-12)/20));
    const hairline=480+Math.max(0,-Math.cos(angle))*270;
    const hair=y<hairline?1:Math.max(0,1-(y-hairline)/80),base=[181-137*hair,139-95*hair,119-69*hair];
    for(let c=0;c<3;c++)out.data[k+c]=photo.data[q+c]*blend+base[c]*(1-blend);out.data[k+3]=255;
   }
   ctx.putImageData(out,0,0);texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.color.setHex(0xffffff);material.needsUpdate=true;
  };image.src=new URL('../assets/baeseojun.png',import.meta.url).href;
 }
 return {group,dispose(){if(disposed)return;disposed=true;texture?.dispose();skull.geometry.dispose();material.dispose();neck.geometry.dispose();neck.material.dispose();}};
}
