import * as THREE from 'three';
import {bloodHazardFootprint} from './blood-data.mjs';

// The warning is fractured material rising from the *actual* collision footprint.
// No transparent discs, rectangular hitbox decals or separate gameplay timings.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const COLOR=Object.freeze({
 line:0x8498ad,mark:0x98898a,repeat:0xa4988c,choice:0x9b8f70,
 contradiction:0x7e899b,timetable:0x8d8fa0,blank:0xc1b6ab,
 negate:0x65748d,reverse:0x68607a,stop:0x7b7785,
 verdict:0xb19b82,mirror:0xa9c6c9,axiom:0x9297ab,
 paradox:0x976d8a,erasure:0xb6ada9,counterproof:0x7a608d,
 sword:0xa9c3d6,circus:0xb49773,gamble:0xc2a674,chalk:0xc3b8a2
});
export const gyuwonHazardFootprint=h=>h?.shape==='wave'?null:bloodHazardFootprint(h);

// Every triangle is an upright, irregular fragment. Its base touches the floor
// and its tip rises BEFORE the hit, like lifting stone, pages or broken glass.
function fragments(h,f,coarse=false){
 const points=[];
 const add=(x,z,tx,tz,i,variation=0)=>{
  const len=(coarse?.36:.44)+(i%4)*.10;
  const height=.30+(i%7)*.12+variation;
  const off=(i%3-1)*.07;
  points.push(
   x-tx*len, .025, z-tz*len,
   x+tx*len, .025, z+tz*len,
   x+tx*off, height, z+tz*off
  );
 };
 if(f.kind===1||f.kind===2){
  const rings=f.kind===2?[Math.max(.12,f.r-f.halfWidth),f.r+f.halfWidth]:[f.r];
  const count=coarse?12:20;
  rings.forEach((r,k)=>{for(let i=0;i<count;i++){
   const a=(i+(k?.42:0))*Math.PI*2/count,si=Math.sin(a),co=Math.cos(a);
   add(si*r,co*r,co,-si,i+k*3,k*.09);
  }});
 }else if(f.kind===3){
  // Local z is the lane axis; rotation.y follows the exact collision yaw.
  const length=Math.max(.1,f.halfLength),count=coarse?9:15;
  for(const side of [-1,1])for(let i=0;i<count;i++){
   const z=-length+2*length*(i+.35)/(count+.7);
   add(side*f.halfWidth,z,0,1,i+(side+1)*13,.07);
  }
  for(const side of [-1,1])for(let j=0;j<5;j++){
   const x=-f.halfWidth+2*f.halfWidth*(j+.4)/5;
   add(x,side*length,1,0,j+(side+1)*4,.03);
  }
 }else if(f.kind===4){
  const count=coarse?10:18,r=Math.max(.2,f.r);
  for(let i=0;i<=count;i++){
   const angle=-f.arc+2*f.arc*i/count,si=Math.sin(angle),co=Math.cos(angle);
   add(si*r,co*r,co,-si,i,.15);
  }
  for(const side of [-1,1])for(let j=0;j<9;j++){
   const rj=f.inner+(r-f.inner)*(j+.4)/9,a=side*f.arc;
   add(Math.sin(a)*rj,Math.cos(a)*rj,Math.cos(a),-Math.sin(a),j+15,.04);
  }
 }
 return new Float32Array(points);
}
export function createGyuwonHazardFx(stage,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-physical-rupture-cues';stage.add(root);
 const states=new Map();let disposed=false;
 function release(s){
  root.remove(s.mesh);s.mesh.geometry.dispose();s.mesh.material.dispose();
 }
 function clear(){for(const s of states.values())release(s);states.clear();}
 function make(h,f,pattern){
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(fragments(h,f,coarse),3));
  geo.computeVertexNormals();
  const material=new THREE.MeshPhysicalMaterial({
   color:COLOR[pattern]||0x9c9ca5,roughness:.72,metalness:.18,
   side:THREE.DoubleSide,transparent:true,opacity:.2,depthWrite:false
  });
  const mesh=new THREE.Mesh(geo,material);mesh.name='gyuwon-hazard-fractured-material';
  mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;
  mesh.userData.visualOnly=true;root.add(mesh);
  return {mesh,r:f.r,pattern};
 }
 function update(g){
  if(disposed)return;
  const active=g?.status==='playing',s=g?.gyuwon,b=g?.boss;
  const live=new Set();
  if(active&&s&&b?.state==='pattern')for(const h of s.hazards||[]){
   if(h.shape==='wave')continue; // The actual tsunami surface is rendered by the memory stage.
   const f=gyuwonHazardFootprint(h);if(!f)continue;
   live.add(h.id);
   let state=states.get(h.id);
   if(!state){state=make(h,f,s.pattern);states.set(h.id,state);}
   const mesh=state.mesh;
   // Expanding ring crests follow the same time-varying footprint as damage.
   if(f.kind===2&&Math.abs(f.r-state.r)>.09){
    const values=fragments(h,f,coarse),attr=mesh.geometry.getAttribute('position');
    if(values.length===attr.array.length){
     attr.array.set(values);attr.needsUpdate=true;
     mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
    }
    state.r=f.r;
   }
   const charge=clamp(h.age/Math.max(.01,h.warn)),hit=h.age>=h.warn;
   const impact=hit?smooth((h.age-h.warn)/Math.max(.08,h.life)):0;
   mesh.position.set(f.x,.005,f.z);
   mesh.rotation.y=f.kind===3||f.kind===4?f.yaw:0;
   mesh.scale.y=.18+.9*smooth(charge)+.3*(1-impact)*(hit?1:0);
   mesh.material.opacity=.14+.33*smooth(charge)+(hit?.16*(1-impact):0);
   mesh.material.color.setHex(COLOR[s.pattern]||0x9c9ca5);
  }
  for(const [id,state]of states)if(!live.has(id)){release(state);states.delete(id);}
 }
 function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);}
 return {root,update,clear,dispose,stats:()=>({liveHazards:states.size,damageSources:0,drawCalls:states.size})};
}
