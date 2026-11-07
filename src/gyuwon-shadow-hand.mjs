import * as THREE from 'three';
// Purely visual. The dark hand traces authoritative rehearsal hazard positions.
// One sculpted hand, one finger-tipped pointer, and one shared trail mesh;
// the existing collision system remains the only authority for damage.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const ease=x=>{x=sat(x);return x*x*(3-2*x);};
export function gyuwonHandTrace(h){
 if(!h)return null;
 const t=ease((h.age??0)/Math.max(.3,h.warn??1));
 if(h.shape==='lane'){
  const length=Math.min(22,Math.max(3,h.length||20));
  const distance=(t-.5)*length;
  return {x:h.x+Math.sin(h.yaw||0)*distance,z:h.z+Math.cos(h.yaw||0)*distance,
   yaw:h.yaw||0,progress:t};
 }
 if(h.shape==='ring'||h.shape==='circle'){
  const radius=h.shape==='ring'?Math.max(1,h.r+(h.grow||0)*t):Math.max(1,h.r||2);
  const angle=t*Math.PI*2-.7;
  return {x:h.x+Math.sin(angle)*radius,z:h.z+Math.cos(angle)*radius,
   yaw:angle,progress:t};
 }
 if(h.shape==='cone'){
  const a=(h.yaw||0)+(t*2-1)*(h.arc||.3);
  return {x:h.x+Math.sin(a)*(h.r||18)*.65,z:h.z+Math.cos(a)*(h.r||18)*.65,
   yaw:a,progress:t};
 }
 return {x:h.x,z:h.z,yaw:0,progress:t};
}
export function createGyuwonShadowHand(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-dark-world-hand-tracing-saved-proof';
 root.visible=false;root.userData.decorativeOnly=true;scene.add(root);
 const skin=new THREE.MeshPhysicalMaterial({color:0x201d32,roughness:.54,metalness:.18,
  emissive:0x78688c,emissiveIntensity:.48});
 const seams=new THREE.MeshStandardMaterial({color:0xe4d3bd,roughness:.42,
  emissive:0x9884a3,emissiveIntensity:.36});
 const make=(geo,mat,name)=>{const m=new THREE.Mesh(geo,mat);m.name=name;root.add(m);return m;};
 const palm=make(new THREE.SphereGeometry(1,coarse?12:24,coarse?9:16),skin,'ink-hand-palm');
 palm.scale.set(.68,.22,.93);
 const fingers=[];
 for(let i=0;i<5;i++){
  const cylinder=make(new THREE.CapsuleGeometry(.09,.62,coarse?3:6,coarse?6:10),
   skin,'ink-hand-articulated-finger');
  cylinder.position.set((i-2)*.26,.0,1.0);cylinder.rotation.x=Math.PI/2;
  cylinder.scale.set(1,1,1);
  const tip=make(new THREE.SphereGeometry(.09,coarse?7:13,coarse?6:10),seams,'ink-hand-finger-tip');
  tip.position.set((i-2)*.26,0,1.48);
  fingers.push({cylinder,tip});
 }
 // The uploaded likeness reappears on an actual curved sculpted back-of-hand cameo.
 let texture=null;
 if(typeof document!=='undefined'&&typeof document.createElementNS==='function'){
  try{texture=new THREE.TextureLoader().load(new URL('../assets/choi.png',import.meta.url).href);
   texture.colorSpace=THREE.SRGBColorSpace;}
  catch(error){console.warn('Gyuwon hand portrait unavailable',error);}
 }
 const faceMat=new THREE.MeshPhysicalMaterial({color:0xd1bdad,map:texture,metalness:.12,roughness:.68});
 const face=make(new THREE.SphereGeometry(.38,coarse?15:28,coarse?12:22),
  faceMat,'gyuwon-shadow-hand-choi-face');
 face.position.set(0,.23,-.24);face.scale.z=.6;
 // Pale tendon lines make the black fingers visible against the black room.
 const trace=make(new THREE.CylinderGeometry(.032,.032,1,coarse?5:9),seams,'ink-hand-tendon-trail');
 const origin=new THREE.Vector3(),destination=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0);
 const warpGeo=new THREE.TorusGeometry(1.5,.045,6,coarse?24:48);
 const warpMat=new THREE.MeshStandardMaterial({color:0xddd1a6,roughness:.4,transparent:true,opacity:.6,
  emissive:0xc7a983,emissiveIntensity:.45,depthWrite:false});
 const warpA=make(warpGeo,warpMat,'gyuwon-teleport-departure');
 const warpB=make(warpGeo,warpMat,'gyuwon-teleport-arrival');
 warpA.rotation.x=warpB.rotation.x=Math.PI/2;
 function update(g){
  const b=g?.boss,s=g?.gyuwon;
  const handActive=b?.phase===2&&s?.space==='dark'&&b.state==='pattern'&&g.status==='playing';
  const h=handActive?s.hazards?.find(v=>v.inkFinger&&!v.hit):null;
  const p=gyuwonHandTrace(h);
  palm.visible=face.visible=trace.visible=Boolean(p);
  for(const {cylinder,tip}of fingers){cylinder.visible=tip.visible=Boolean(p);}
  if(p){
   root.visible=true;root.position.set(p.x,3.1+Math.sin(g.time*4)*.18,p.z);
   root.rotation.y=p.yaw;
   const stretch=.40+.55*ease((h.age||0)/Math.max(.01,h.warn||1));
   for(let i=0;i<5;i++){
    const {cylinder,tip}=fingers[i],point=i===2?1:.4;
    cylinder.scale.y=.72+stretch*point;
    cylinder.position.z=1.0+stretch*point*.2;
    tip.position.z=1.42+stretch*point*.4;
   }
   trace.position.set(0,-.08,.5);trace.scale.y=1.65;trace.rotation.x=Math.PI/2;
  }
  const warp=Boolean(s?.teleport&&g.status==='playing');
  warpA.visible=warpB.visible=warp;
  if(warp){
   root.visible=true;
   const clock=s.teleport.t/1.25;
   warpA.position.set(s.teleport.from.x-root.position.x,1.2-root.position.y,s.teleport.from.z-root.position.z);
   warpB.position.set(s.teleport.to.x-root.position.x,.2-root.position.y,s.teleport.to.z-root.position.z);
   warpA.scale.setScalar(.4+ease(clock));warpB.scale.setScalar(1.15-ease(clock)*.55);
   warpMat.opacity=.3+.52*ease(clock);
  }
  if(!p&&!warp){root.visible=false;root.position.set(0,0,0);}
 }
 function dispose(){root.removeFromParent();
  const geos=new Set();root.traverse(o=>{if(o.geometry)geos.add(o.geometry);});
  for(const geo of geos)geo.dispose();for(const mat of [skin,seams,faceMat,warpMat])mat.dispose();texture?.dispose();
 }
 return {root,update,dispose};
}
