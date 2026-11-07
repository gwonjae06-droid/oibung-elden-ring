import * as THREE from 'three';
import {bloodVolumetricWaveGeometry} from './blood-volumetric-wave.mjs';

// Authored surfaces: pleated liquid crests, fluted columns and hollow blades.
// All positions share a normalized footprint; combat determines the world scale.
function surface(uSteps,vSteps,point,{wrap=false}={}){
 const p=[],uv=[],index=[];
 for(let y=0;y<=vSteps;y++)for(let x=0;x<=uSteps;x++){const u=x/uSteps,v=y/vSteps;p.push(...point(u,v));uv.push(u,v);}
 for(let y=0;y<vSteps;y++)for(let x=0;x<uSteps;x++){const a=y*(uSteps+1)+x,b=a+uSteps+1;index.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}

// Convert spell ribbons into closed wet volumes. The original grid is
// retained as the front skin; edges and the back skin are added ONCE when
// loading the geometry, never rebuilt in an attack frame.
export function thickenBloodSurface(original,thickness=.10){
 const src=original.getAttribute('position'),uvAttr=original.getAttribute('uv');
 const n=src.count,front=Array.from(src.array),back=front.slice();
 for(let i=0;i<n;i++)back[i*3+2]-=thickness;
 const originalIndices=Array.from(original.index.array),faces=[...originalIndices];
 for(let i=0;i<originalIndices.length;i+=3)
  faces.push(originalIndices[i+2]+n,originalIndices[i+1]+n,originalIndices[i]+n);
 const edges=new Map();
 for(let i=0;i<originalIndices.length;i+=3){
  const a=originalIndices[i],b=originalIndices[i+1],c=originalIndices[i+2];
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const key=Math.min(u,v)+':'+Math.max(u,v);
   if(edges.has(key))edges.get(key).count++;
   else edges.set(key,{u,v,count:1});
  }
 }
 for(const e of edges.values())if(e.count===1){
  faces.push(e.u,e.v,e.v+n,e.u,e.v+n,e.u+n);
 }
 const pos=new THREE.Float32BufferAttribute([...front,...back],3);
 const uv=uvAttr?Array.from(uvAttr.array):Array(n*2).fill(0);
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',pos);
 g.setAttribute('uv',new THREE.Float32BufferAttribute([...uv,...uv],2));
 g.setIndex(faces);g.computeVertexNormals();g.computeBoundingSphere();
 original.dispose();
 return g;
}

export function bloodFanGeometry(arc=1.15,inner=0,segments=24){
 return thickenBloodSurface(surface(segments,5,(u,v)=>{const a=(u*2-1)*arc,r=inner+(1-inner)*v;return [Math.sin(a)*r,Math.sin(u*Math.PI*6)*.025*v,Math.cos(a)*r];}),.09);
}
export function bloodSculptureGeometries(segments=20){
 const tau=Math.PI*2,n=Math.max(12,segments),sphere=surface(n,Math.ceil(n*.65),(u,v)=>{
  const a=u*tau,t=v*Math.PI,bulge=.93+.05*Math.sin(a*5)*Math.sin(t)**2,r=Math.sin(t)*bulge;
  return [Math.cos(a)*r,Math.cos(t)*(1+.06*Math.sin(a*3)*Math.sin(t)),Math.sin(a)*r];
 });
 const column=surface(n,12,(u,v)=>{const a=u*tau,r=(.68*(1-v)+.19*v+.18*Math.sin(v*Math.PI))*(1+.12*Math.sin(a*7+v*5));return [Math.cos(a)*r+Math.sin(v*Math.PI)*.13,v-.5,Math.sin(a)*r];});
 const sheet=thickenBloodSurface(surface(Math.max(16,Math.round(n*1.4)),10,(u,v)=>{
  const x=u-.5,crest=.14*Math.sin(u*Math.PI*3)**2+.055*Math.sin(u*Math.PI*9),curl=v*v*(.45+.12*Math.sin(u*Math.PI*5));
  return [x,(v-.5)*(1+crest),curl+.07*Math.sin(u*Math.PI*6)*v];
 }),.11);
 // The former near-zero-thickness torus looked like a painted outline.
 const torusPrimitive=new THREE.TorusGeometry(1,.12,n<17?7:10,n*3);
 const torus=new THREE.BufferGeometry().copy(torusPrimitive);torusPrimitive.dispose();
 function strand(spiral){return surface(n*3,6,(u,v)=>{
  const a=u*tau*2.5,b=v*tau,reach=spiral?.1+u*.88:.24,thickness=(spiral?.025:.08)*(1-.6*u);
  return [Math.sin(a)*reach+Math.cos(b)*thickness,spiral?Math.sin(b)*thickness+u*.1:u-.5,Math.cos(a)*reach+Math.sin(b)*thickness];
 });}
 const lance=surface(12,14,(u,v)=>{
  const a=u*tau,shaft=v<.7?.13+.1*Math.sin(v*Math.PI*4)**2:(1-v)/.3*.68,r=shaft*(1+.18*Math.cos(a*4));
  return [Math.cos(a)*r,v,Math.sin(a)*r];
 });
 return {sphere,column,sheet,surge:bloodVolumetricWaveGeometry(segments),undertow:bloodVolumetricWaveGeometry(segments,{undertow:true}),torus,tendril:strand(false),spiral:strand(true),blade:bloodFanGeometry(),lance,judgement:bloodFanGeometry(.5),ritual:bloodFanGeometry(.45,5.5/26)};
}
