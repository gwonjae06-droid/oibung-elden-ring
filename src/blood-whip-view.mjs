import * as THREE from 'three';
import {BLOOD_WHIP,bloodWhipExtension,bloodWhipPath} from './blood-whip.mjs';

// Attached, animated blood cord. Its XY ground footprint is identical to the
// simulation capsule, unlike a decorative full-screen attack warning.
const up=new THREE.Vector3(0,1,0);
const clamp=x=>Math.max(0,Math.min(1,x));
export function createBloodWhipView(root,{coarse=false,reduced=false,hand=null}={}){
 const geometry=new THREE.CylinderGeometry(.34,.52,1,coarse?5:8);
 const material=new THREE.MeshStandardMaterial({
  color:0x600919,emissive:0x700820,emissiveIntensity:.72,
  roughness:.3,metalness:.06
 });
 const group=new THREE.Group();group.name='blood-lord-interstitial-whip';root.add(group);
 const segments=Array.from({length:coarse?12:20},(_,i)=>{
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='blood-whip-physical-segment-'+i;
  mesh.visible=false;group.add(mesh);return mesh;
 });
 const tipGeometry=new THREE.SphereGeometry(.72,coarse?9:14,7);
 const tip=new THREE.Mesh(tipGeometry,material);group.add(tip);tip.visible=false;
 // A ragged, direction-locked seep of real blood, not a geometric danger ring.
 // Keep a single pooled mesh even on mobile; the physical cable remains the hitbox.
 const omenPoints=[];
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,b=(i+1)*Math.PI/12;
  const radii=t=>({inner:.30+.07*Math.sin(t*3+.4),outer:.82+.16*Math.sin(t*5)+.09*Math.cos(t*7)});
  const ra=radii(a),rb=radii(b);
  const p=(r,t)=>[Math.cos(t)*r,0,Math.sin(t)*r];
  omenPoints.push(...p(ra.inner,a),...p(ra.outer,a),...p(rb.outer,b),
   ...p(ra.inner,a),...p(rb.outer,b),...p(rb.inner,b));
 }
 const omenGeometry=new THREE.BufferGeometry();
 omenGeometry.setAttribute('position',new THREE.Float32BufferAttribute(omenPoints,3));
 const omenMaterial=new THREE.MeshBasicMaterial({
  color:0xd04757,transparent:true,opacity:.31,depthWrite:false,side:THREE.DoubleSide
 });
 const omen=new THREE.Mesh(omenGeometry,omenMaterial);omen.name='blood-whip-locked-aim-liquid-omen';
 omen.position.y=.10;group.add(omen);
 const start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),mid=new THREE.Vector3(),handWorld=new THREE.Vector3();
 function sample(w,t,out){
  const p=bloodWhipPath(w,t),curve=Math.sin(t*Math.PI);
  // Blend the opening coil into the actual animated casting wrist without
  // moving the floor-level locked impact footprint.
  const anchor=hand?Math.max(0,1-t/.24):0;
  return out.set(
   p.x+anchor*(handWorld.x-w.x),
   (.9+3.8*Math.pow(1-t,5)+curve*(reduced?.08:.22))*(1-anchor)+handWorld.y*anchor,
   p.z+anchor*(handWorld.z-w.z)
  );
 }
 function update(g){
  const w=g?.status==='playing'?g?.blood?.whip:null;
  group.visible=!!w;
  if(!w){for(const m of segments)m.visible=false;tip.visible=omen.visible=false;return;}
  if(hand)hand.getWorldPosition(handWorld);else handWorld.set(w.x,4.7,w.z);
  const warning=w.age<BLOOD_WHIP.warning;
  const charge=clamp(w.age/BLOOD_WHIP.warning);
  const extension=warning?.07+.12*charge:bloodWhipExtension(w);
  const length=Math.max(.008,extension);
  const used=Math.max(2,Math.min(segments.length,Math.ceil(segments.length*length)));
  // Telegraph: the caster coils its arm and a small blood seep appears at
  // the *locked* destination; dodge timing starts before the whip extends.
  const destination=bloodWhipPath(w);
  omen.visible=warning;omen.position.set(destination.x,.09,destination.z);
  // Rising pooled blood, with enough contrast to survive pale cathedral floors.
  // Size describes the physical caster's locked aim, never a fabricated AoE.
  omen.scale.set(1.04+.22*charge,.95+.19*charge,1.09+.34*charge);
  omen.rotation.y=w.yaw;
  omenMaterial.opacity=.31+.37*charge;
  for(let i=0;i<segments.length;i++){
   const mesh=segments[i];mesh.visible=i<used;
   if(!mesh.visible)continue;
   const t0=(i/used)*length,t1=((i+1)/used)*length;
   sample(w,t0,start);sample(w,t1,end);
   direction.copy(end).sub(start);const distance=direction.length();
   mid.copy(start).addScaledVector(direction,.5);
   mesh.position.copy(mid);
   mesh.quaternion.setFromUnitVectors(up,direction.normalize());
   mesh.scale.set(1+Math.sin(t1*Math.PI)*.24,Math.max(.01,distance),1);
  }
  tip.visible=true;sample(w,length,end);tip.position.copy(end);
  tip.scale.setScalar(warning?.55+.45*charge:1.3);
  material.emissiveIntensity=warning?.63+charge*.38:1.35;
 }
 function clear(){group.visible=false;for(const m of segments)m.visible=false;tip.visible=omen.visible=false;}
 function dispose(){clear();group.parent?.remove(group);geometry.dispose();tipGeometry.dispose();omenGeometry.dispose();material.dispose();omenMaterial.dispose();}
 return {update,clear,dispose,group,stats:()=>({segments:segments.length,damageSources:0})};
}
