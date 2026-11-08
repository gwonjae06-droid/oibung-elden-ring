import * as THREE from 'three';

// In-world, genuinely volumetric objects. Windup, contact and despawn are read
// from the identical hazard clock used by the authoritative combat engine.
// Neither a geometric warning cone nor a triangular HUD panel is drawn.
export const YEAR_PHYSICAL_CUES=Object.freeze(['year-smoke','year-bullet']);
export function gyuwonYearCuePhase(h){
 const pre=Math.max(.001,h.warn||1),elapsed=h.age||0;
 return {windup:Math.min(1,elapsed/pre),impact:elapsed>=pre&&elapsed<=pre+(h.life||0),
  live:elapsed<pre+(h.life||0)};
}
export function buildGyuwonYearAttackCues(stage,{coarse=false}={}){
 const group=new THREE.Group();group.name='gyuwon-physical-combat-telegraphs';stage.add(group);
 const mats=[],geos=[],items=new Map();let owner=null,disposed=false;
 const fog=new THREE.MeshPhysicalMaterial({color:0x8e9799,metalness:0,roughness:1,
  transparent:true,opacity:.20,depthWrite:false,side:THREE.DoubleSide});
 const ember=new THREE.MeshPhysicalMaterial({color:0xc1a58d,roughness:.43,
  emissive:0x723a28,emissiveIntensity:.29,transparent:true,opacity:.74,depthWrite:false});
 const charged=new THREE.MeshPhysicalMaterial({color:0xe6d9b5,roughness:.35,
  emissive:0x95623e,emissiveIntensity:.55,transparent:true,opacity:.39,depthWrite:false});
 mats.push(fog,ember,charged);
 const tube=new THREE.CylinderGeometry(.038,.075,1,coarse?8:14,2);
 const orb=new THREE.SphereGeometry(.28,coarse?8:14,coarse?6:12);
 const ring=new THREE.TorusGeometry(.30,.038,coarse?6:9,coarse?12:24);
 const puffGeo=new THREE.IcosahedronGeometry(.4,coarse?1:2);
 geos.push(tube,orb,ring,puffGeo);
 const clamp=x=>Math.max(0,Math.min(1,x));
 function make(h){
  const parent=new THREE.Group();parent.name='gyuwon-'+h.visual+'-volumetric';group.add(parent);
  const meshes=[];
  if(h.visual==='year-smoke'){
   // Scattered soft clouds along the breath cone's interior: visible vapor,
   // not a sector mesh or a translucent geometric warning wedge.
   const count=coarse?14:28;
   for(let i=0;i<count;i++){
    const fogMaterial=fog.clone();fogMaterial.opacity=.12;
    mats.push(fogMaterial);
    const puff=new THREE.Mesh(puffGeo,fogMaterial);
    puff.name='gyuwon-real-cigarette-smoke-plume';
    puff.userData.index=i;
    parent.add(puff);meshes.push(puff);
   }
  }else{
   const ray=new THREE.Mesh(tube,charged);
   ray.name='gyuwon-rifle-physical-tracer';
   ray.rotation.x=Math.PI/2;ray.scale.set(1.7,Math.max(1,h.length),1.7);
   parent.add(ray);meshes.push(ray);
   const muzzle=new THREE.Mesh(orb,charged);parent.add(muzzle);meshes.push(muzzle);
   const rim=new THREE.Mesh(ring,ember);rim.rotation.y=Math.PI/2;parent.add(rim);meshes.push(rim);
   ray.position.y=1.45;
   muzzle.position.set(0,1.5,-h.length/2);
   rim.position.set(0,1.5,-h.length/2);
  }
  return {parent,meshes,type:h.visual,id:h.id};
 }
 function release(id){const obj=items.get(id);if(!obj)return;
  obj.parent.removeFromParent();items.delete(id);}
 function clear(){for(const id of [...items.keys()])release(id);}
 function update(g){
  if(disposed)return;
  if(owner!==g){owner=g;clear();}
  const s=g?.gyuwon,e=s?.years;
  if(!e||g.status!=='playing'){clear();group.visible=false;return;}
  group.visible=true;
  const active=new Set();
  for(const h of s.hazards){
   if(!YEAR_PHYSICAL_CUES.includes(h.visual))continue;
   active.add(h.id);let obj=items.get(h.id);
   if(!obj){obj=make(h);items.set(h.id,obj);}
   const {parent,meshes}=obj,{windup,impact}=gyuwonYearCuePhase(h);
   parent.position.set(h.x,0,h.z);parent.rotation.y=h.yaw||0;
   if(obj.type==='year-bullet'){
    const [ray,muzzle,rim]=meshes;
    const ready=.13+.87*windup;
    ray.visible=true;
    ray.scale.set(impact?5:1,Math.max(1,h.length),impact?5:1);
    muzzle.scale.setScalar(impact?3.5:.45+ready*.85);
    rim.scale.setScalar(.7+ready*1.2);
    if(impact)rim.rotation.z+=(h.age-h.warn)*8;
    ray.material=impact?ember:charged;
   }else{
    for(const puff of meshes){
     const i=puff.userData.index,count=meshes.length;
     const along=.13+.79*((i*17)%count)/count;
     const spread=(((i*29)%count)/Math.max(1,count-1)*2-1)*(h.arc||.55)*.86;
     const r=(h.innerR||1.5)+((h.r||12)-(h.innerR||1.5))*along;
     puff.position.set(Math.sin(spread)*r,
      1.5+Math.sin(h.age*1.2+i)*.24+along*1.7,Math.cos(spread)*r);
     const size=(.36+along*.65)*(.60+.4*windup);
     puff.scale.set(size*1.45,size*.85,size*1.3);
     puff.rotation.set(h.age*.3+i*.4,h.age*.18+i*.2,i*.19);
     puff.material.opacity=(impact?.25:.10)+.14*windup;
    }
   }
  }
  for(const id of [...items.keys()])if(!active.has(id))release(id);
 }
 function dispose(){if(disposed)return;disposed=true;clear();group.removeFromParent();
  for(const geo of geos)geo.dispose();for(const mat of mats)mat.dispose();}
 return {group,update,clear,dispose,stats:()=>({active:items.size,volumetric:true})};
}
