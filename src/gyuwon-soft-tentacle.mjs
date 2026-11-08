import * as THREE from 'three';
// One continuous skinned-looking mesh per arm with deforming rings.
// No stack of straight cylinders, no exposed seams, no regeneration of geometry
// per frame. Update only a bounded vertex buffer and use smooth normals.
export function createGyuwonSoftTentacle(parent,material,{coarse=false,index=0}={}){
 const bands=coarse?17:29,sides=coarse?8:12;
 const position=new Float32Array((bands+1)*(sides+1)*3);
 const uv=new Float32Array((bands+1)*(sides+1)*2),indices=[];
 for(let j=0;j<=bands;j++)for(let k=0;k<=sides;k++){
  const u=j/bands,v=k/sides,n=(j*(sides+1)+k)*2;uv[n]=v;uv[n+1]=u;
  if(j<bands&&k<sides){
   const a=j*(sides+1)+k,b=a+sides+1;
   indices.push(a,b,a+1,a+1,b,b+1);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(position,3).setUsage(THREE.DynamicDrawUsage));
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
 const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;
 mesh.name='gyuwon-seamless-soft-octopus-tentacle';parent.add(mesh);
 const axis=new THREE.Vector3(),normal=new THREE.Vector3(),binormal=new THREE.Vector3(),curve=null;
 const pts=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const up=new THREE.Vector3(0,1,0),right=new THREE.Vector3(1,0,0);
 let lastTime=0,lastReady=0;
 function pose({x=0,z=0,yaw=0,reach=14.5,ready=0,time=0,attacking=false}={}){
  const side=Math.sin(yaw),forward=Math.cos(yaw),lateralX=forward,lateralZ=-side;
  const follow=attacking?1:0;
  const easing=Math.min(1,Math.max(0,ready));
  const sway=Math.sin(time*1.9+index*.64)*(.40*(1-easing)+.14);
  for(let i=0;i<5;i++){
   const t=i/4,d=reach*t,arc=Math.sin(t*Math.PI);
   const height=attacking?2.45+(1-t)*1.15+(1-easing)*2.8*arc:
    2.45+2.5*arc-1.2*t;
   const offset=sway*t+.38*arc*Math.sin(time*1.25+index+t*3)*(1-.60*easing);
   pts[i].set(x+side*d+lateralX*offset,height,z+forward*d+lateralZ*offset);
  }
  const spline=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.38);
  const v=geometry.getAttribute('position');
  for(let j=0;j<=bands;j++){
   const t=j/bands,c=spline.getPoint(t),next=spline.getTangent(t).normalize();
   const n=normal.copy(up).cross(next);
   if(n.lengthSq()<.0001)n.copy(right).cross(next);
   n.normalize();binormal.copy(next).cross(n).normalize();
   const radius=.64*Math.pow(1-t,.82)+.04;
   const ripple=.035*Math.sin(17*t-time*4+index)*(1-easing*.4);
   for(let k=0;k<=sides;k++){
    const theta=k/sides*2*Math.PI,
     r=Math.max(.045,radius+ripple)*(.96+.04*Math.sin(theta*3+time));
    const px=c.x+r*(n.x*Math.cos(theta)+binormal.x*Math.sin(theta)),
     py=c.y+r*(n.y*Math.cos(theta)+binormal.y*Math.sin(theta)),
     pz=c.z+r*(n.z*Math.cos(theta)+binormal.z*Math.sin(theta));
    v.setXYZ(j*(sides+1)+k,px,py,pz);
   }
  }
  v.needsUpdate=true;geometry.computeVertexNormals();
  lastTime=time;lastReady=ready;
  return {curve:spline,ready:easing,reach};
 }
 pose({index,time:0,reach:1});
 function dispose(){mesh.removeFromParent();geometry.dispose();}
 return {mesh,pose,dispose,stats:()=>({rings:bands+1,sides,vertices:position.length/3})};
}
