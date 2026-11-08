import * as THREE from 'three';

// In-world telegraphs for attacks that previously had collision but no visible
// volumetric body. Hazard age/position/windup are authoritative. No extra damage.
export const YEAR_PHYSICAL_CUES=Object.freeze(['year-smoke','year-stream','year-bullet']);
export function gyuwonYearCuePhase(h){
 const pre=Math.max(.001,h.warn||1),elapsed=h.age||0;
 return {windup:Math.min(1,elapsed/pre),impact:elapsed>=pre&&elapsed<=pre+(h.life||0),
  live:elapsed<pre+(h.life||0)};
}
export function buildGyuwonYearAttackCues(stage,{coarse=false}={}){
 const group=new THREE.Group();group.name='gyuwon-physical-combat-telegraphs';stage.add(group);
 const mats=[],geos=[],items=new Map(),coneGeoCache=new Map();let owner=null,disposed=false;
 const fog=new THREE.MeshPhysicalMaterial({color:0x767e83,metalness:.06,roughness:.77,
  transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide});
 const thundercard=new THREE.MeshPhysicalMaterial({color:0xb88f69,metalness:.35,roughness:.43,
  emissive:0x532817,emissiveIntensity:.25,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide});
 const charged=new THREE.MeshPhysicalMaterial({color:0xddd7b5,metalness:.48,roughness:.31,
  emissive:0x7c522b,emissiveIntensity:.35,transparent:true,opacity:.40,depthWrite:false});
 mats.push(fog,thundercard,charged);
 const unitTube=new THREE.CylinderGeometry(.038,.075,1,coarse?8:14,2);
 const muzzleSphere=new THREE.SphereGeometry(.25,coarse?8:14,coarse?6:12);
 const outerRing=new THREE.TorusGeometry(.30,.038,coarse?6:9,coarse?12:24);
 geos.push(unitTube,muzzleSphere,outerRing);
 const clamp=x=>Math.max(0,Math.min(1,x));
 // An actual arcing smoke plume, with a 3D raised skin on the front and sides.
 // The footprint is never enlarged beyond the cone's authoritative extent.
 function coneGeometry(h){
  const key=[h.visual,h.r,h.arc,h.innerR||0,coarse?1:0].join(':');
  if(coneGeoCache.has(key))return coneGeoCache.get(key);
  const segments=coarse?14:30;
  const inner=h.innerR||0,r=h.r,arc=h.arc,pts=[],index=[];
  const bands=[inner,inner+(r-inner)*.22,inner+(r-inner)*.52,r];
  for(let i=0;i<=segments;i++){
   const a=-arc+i/segments*arc*2;
   for(let j=0;j<bands.length;j++){
    const radius=bands[j],u=i/segments,v=j/(bands.length-1);
    const k=(i*bands.length+j),height=(h.visual==='year-smoke'?2.2:3.4)
     *(1-.46*v)*(.84+.16*Math.sin(i*.4+j*1.37));
    pts.push(Math.sin(a)*radius,height,Math.cos(a)*radius);
    if(i&&j){
     const k0=k-1,k1=k-bands.length,k2=k1-1;
     index.push(k2,k0,k1,k2,k-1,k0);
    }
   }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  geo.setIndex(index);geo.computeVertexNormals();geos.push(geo);coneGeoCache.set(key,geo);return geo;
 }
 function make(h){
  const parent=new THREE.Group();parent.name='gyuwon-'+h.visual+'-volumetric';
  group.add(parent);const meshes=[];
  if(h.visual==='year-smoke'||h.visual==='year-stream'){
   const smoke=new THREE.Mesh(coneGeometry(h),h.visual==='year-smoke'?fog:thundercard);
   smoke.name='gyuwon-live-cone-surface';parent.add(smoke);meshes.push(smoke);
   const spine=new THREE.Mesh(unitTube,h.visual==='year-smoke'?fog:charged);
   parent.add(spine);meshes.push(spine);
   spine.rotation.x=Math.PI/2;spine.position.z=(h.r+(h.innerR||0))*.42;
   spine.position.y=1.5;spine.scale.set(3.3,Math.max(1,h.r-(h.innerR||0)),3.3);
  }else{
   const ray=new THREE.Mesh(unitTube,charged);ray.name='gyuwon-rifle-physical-tracer';
   ray.rotation.x=Math.PI/2;ray.scale.set(1.7,Math.max(1,h.length),1.7);
   parent.add(ray);meshes.push(ray);
   const muzzle=new THREE.Mesh(muzzleSphere,charged);parent.add(muzzle);meshes.push(muzzle);
   const rim=new THREE.Mesh(outerRing,thundercard);rim.rotation.y=Math.PI/2;parent.add(rim);meshes.push(rim);
   ray.position.y=1.45;
   muzzle.position.set(0,1.5,-h.length/2);
   rim.position.set(0,1.5,-h.length/2);
  }
  return {parent,meshes,type:h.visual,id:h.id};
 }
 function release(id){
  const obj=items.get(id);if(!obj)return;
  obj.parent.removeFromParent();items.delete(id);
 }
 function clear(){for(const id of [...items.keys()])release(id);}
 function update(g){
  if(disposed)return;
  if(owner!==g){owner=g;clear();}
  const s=g?.gyuwon,e=s?.years;
  if(!e||g.status!=='playing'){clear();group.visible=false;return;}
  group.visible=true;
  const live=new Set();
  for(const h of s.hazards){
   if(!YEAR_PHYSICAL_CUES.includes(h.visual))continue;
   live.add(h.id);let obj=items.get(h.id);
   if(!obj){obj=make(h);items.set(h.id,obj);}
   const {parent,meshes}=obj,{windup,impact}=gyuwonYearCuePhase(h);
   parent.position.set(h.x,0,h.z);parent.rotation.y=h.yaw||0;
   if(obj.type==='year-bullet'){
    const [ray,muzzle,rim]=meshes;
    const ready=.13+.87*windup;
    ray.visible=true;
    // The visible vapor ray is thin during aim, dense only on a fired shot.
    ray.scale.set(impact?5:1,Math.max(1,h.length),impact?5:1);
    muzzle.scale.setScalar(impact?3.5:.45+ready*.85);
    rim.scale.setScalar(.7+ready*1.2);
    if(impact)rim.rotation.z+=(h.age-h.warn)*8;
    ray.material=impact?thundercard:charged;
   }else{
    const [skin,spine]=meshes;
    parent.scale.y=(.45+.55*windup)*(impact?1.18:1);
    // The cone and its incident radius share the exact same yaw and origin.
    skin.visible=true;spine.visible=true;
   }
  }
  for(const id of [...items.keys()])if(!live.has(id))release(id);
 }
 function dispose(){if(disposed)return;disposed=true;clear();group.removeFromParent();
  for(const geo of geos)geo.dispose();for(const m of mats)m.dispose();}
 return {group,update,clear,dispose,stats:()=>({active:items.size,volumetric:true})};
}
