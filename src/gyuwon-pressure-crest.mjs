import * as THREE from 'three';
// One continuous wall of pressure/fire, not beads orbiting a collision circle.
// Width is authored in world metres, even while the radius expands.
export function createGyuwonPressureCrest(material,{coarse=false}={}){
 const count=coarse?64:112,bands=4,positions=new Float32Array((count+1)*(bands+1)*3),indices=[];
 for(let i=0;i<count;i++)for(let j=0;j<bands;j++){
  const a=i*(bands+1)+j,b=a+bands+1;indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
 geometry.setIndex(indices);
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
 mesh.name='gyuwon-continuous-physical-pressure-crest';
 function update(radius,width,time,fire=false,ready=1){
  const attr=geometry.attributes.position;
  for(let i=0;i<=count;i++)for(let j=0;j<=bands;j++){
   const a=i/count*Math.PI*2,u=j/bands,r=radius+(u-.5)*width*1.44;
   const height=Math.sin(Math.PI*u)*(fire?1.5+.5*Math.sin(a*17-time*5):.65);
   attr.setXYZ(i*(bands+1)+j,Math.sin(a)*r,.04+height*(.2+.8*ready),Math.cos(a)*r);
  }
  attr.needsUpdate=true;geometry.computeVertexNormals();
 }
 return {mesh,update,dispose:()=>geometry.dispose()};
}

