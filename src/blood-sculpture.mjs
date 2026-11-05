import * as THREE from 'three';

// Authored surfaces: pleated liquid crests, fluted columns and hollow blades.
// All positions share a normalized footprint; combat determines the world scale.
function surface(uSteps,vSteps,point,{wrap=false}={}){
 const p=[],uv=[],index=[];
 for(let y=0;y<=vSteps;y++)for(let x=0;x<=uSteps;x++){const u=x/uSteps,v=y/vSteps;p.push(...point(u,v));uv.push(u,v);}
 for(let y=0;y<vSteps;y++)for(let x=0;x<uSteps;x++){const a=y*(uSteps+1)+x,b=a+uSteps+1;index.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function bloodFanGeometry(arc=1.15,inner=0,segments=32){
 return surface(segments,5,(u,v)=>{const a=(u*2-1)*arc,r=inner+(1-inner)*v;return [Math.sin(a)*r,Math.sin(u*Math.PI*6)*.025*v,Math.cos(a)*r];});
}
export function bloodSculptureGeometries(segments=20){
 const tau=Math.PI*2,n=Math.max(12,segments),sphere=surface(n,Math.ceil(n*.65),(u,v)=>{
  const a=u*tau,t=v*Math.PI,bulge=.93+.05*Math.sin(a*5)*Math.sin(t)**2,r=Math.sin(t)*bulge;
  return [Math.cos(a)*r,Math.cos(t)*(1+.06*Math.sin(a*3)*Math.sin(t)),Math.sin(a)*r];
 });
 const column=surface(n,12,(u,v)=>{const a=u*tau,r=(.68*(1-v)+.19*v+.18*Math.sin(v*Math.PI))*(1+.12*Math.sin(a*7+v*5));return [Math.cos(a)*r+Math.sin(v*Math.PI)*.13,v-.5,Math.sin(a)*r];});
 const sheet=surface(n*2,14,(u,v)=>{
  const x=u-.5,crest=.14*Math.sin(u*Math.PI*3)**2+.055*Math.sin(u*Math.PI*9),curl=v*v*(.45+.12*Math.sin(u*Math.PI*5));
  return [x,(v-.5)*(1+crest),curl+.07*Math.sin(u*Math.PI*6)*v];
 });
 const torus=surface(n*3,7,(u,v)=>{const a=u*tau,b=v*tau,r=1+.055*Math.cos(b)*(1+.16*Math.sin(a*9));return [Math.sin(a)*r,Math.cos(a)*r,Math.sin(b)*.06+Math.sin(a*7)*.018];});
 function strand(spiral){return surface(n*3,6,(u,v)=>{
  const a=u*tau*2.5,b=v*tau,reach=spiral?.1+u*.88:.24,thickness=(spiral?.025:.08)*(1-.6*u);
  return [Math.sin(a)*reach+Math.cos(b)*thickness,spiral?Math.sin(b)*thickness+u*.1:u-.5,Math.cos(a)*reach+Math.sin(b)*thickness];
 });}
 const lance=surface(12,14,(u,v)=>{
  const a=u*tau,shaft=v<.7?.13+.1*Math.sin(v*Math.PI*4)**2:(1-v)/.3*.68,r=shaft*(1+.18*Math.cos(a*4));
  return [Math.cos(a)*r,v,Math.sin(a)*r];
 });
 return {sphere,column,sheet,torus,tendril:strand(false),spiral:strand(true),blade:bloodFanGeometry(),lance,judgement:bloodFanGeometry(.5),ritual:bloodFanGeometry(.45,5.5/26)};
}
