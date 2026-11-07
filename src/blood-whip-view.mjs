import * as THREE from 'three';
import {BLOOD_WHIP,bloodWhipExtension,bloodWhipPath} from './blood-whip.mjs';

// Attached, animated blood cord. Its XY ground footprint is identical to the
// simulation capsule, unlike a decorative full-screen attack warning.
const up=new THREE.Vector3(0,1,0);
const clamp=x=>Math.max(0,Math.min(1,x));
export function createBloodWhipView(root,{coarse=false,reduced=false}={}){
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
 const omenGeometry=new THREE.RingGeometry(.4,.72,20).rotateX(-Math.PI/2);
 const omenMaterial=new THREE.MeshBasicMaterial({
  color:0x900c28,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide
 });
 const omen=new THREE.Mesh(omenGeometry,omenMaterial);omen.name='blood-whip-locked-aim-liquid-omen';
 omen.position.y=.09;group.add(omen);
 const start=new THREE.Vector3(),end=new THREE.Vector3(),direction=new THREE.Vector3(),mid=new THREE.Vector3();
 function sample(w,t){
  const p=bloodWhipPath(w,t),curve=Math.sin(t*Math.PI);
  return new THREE.Vector3(p.x,4.7*(1-t)+.9*t+curve*(reduced?.5:1.7),p.z);
 }
 function update(g){
  const w=g?.status==='playing'?g?.blood?.whip:null;
  group.visible=!!w;
  if(!w){for(const m of segments)m.visible=false;tip.visible=omen.visible=false;return;}
  const warning=w.age<BLOOD_WHIP.warning;
  const charge=clamp(w.age/BLOOD_WHIP.warning);
  const extension=warning?.07+.12*charge:bloodWhipExtension(w);
  const length=Math.max(.008,extension);
  const used=Math.max(2,Math.min(segments.length,Math.ceil(segments.length*length)));
  // Telegraph: the caster coils its arm and a small blood seep appears at
  // the *locked* destination; dodge timing starts before the whip extends.
  const destination=bloodWhipPath(w);
  omen.visible=warning;omen.position.set(destination.x,.09,destination.z);
  omen.scale.setScalar(1+.28*charge);
  omenMaterial.opacity=.12+.34*charge;
  for(let i=0;i<segments.length;i++){
   const mesh=segments[i];mesh.visible=i<used;
   if(!mesh.visible)continue;
   const t0=(i/used)*length,t1=((i+1)/used)*length;
   start.copy(sample(w,t0));end.copy(sample(w,t1));
   direction.copy(end).sub(start);const distance=direction.length();
   mid.copy(start).addScaledVector(direction,.5);
   mesh.position.copy(mid);
   mesh.quaternion.setFromUnitVectors(up,direction.normalize());
   mesh.scale.set(1+Math.sin(t1*Math.PI)*.24,Math.max(.01,distance),1);
  }
  tip.visible=true;tip.position.copy(sample(w,length));
  tip.scale.setScalar(warning?.55+.45*charge:1.3);
  material.emissiveIntensity=warning?.45+charge*.38:1.35;
 }
 function clear(){group.visible=false;for(const m of segments)m.visible=false;tip.visible=omen.visible=false;}
 function dispose(){clear();group.parent?.remove(group);geometry.dispose();tipGeometry.dispose();omenGeometry.dispose();material.dispose();omenMaterial.dispose();}
 return {update,clear,dispose,group,stats:()=>({segments:segments.length,damageSources:0})};
}
