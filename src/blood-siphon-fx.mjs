import * as THREE from 'three';
import {BLOOD_SIPHON_RULES} from './blood-siphon.mjs';

const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const fract=v=>v-Math.floor(v);
const rand=(i,j)=>fract(Math.sin(i*127.1+j*311.7)*43758.5453);
const ease=u=>u*u*(3-2*u);

// No collision volumes, sound or new combat damage. A deterministic stream of
// instanced blood drops visibly travels FROM the cathedral blood sea TO the boss.
export function createBloodSiphonFx(parent,{coarse=false,reduced=false}={}){
 const count=coarse?36:100,root=new THREE.Group();root.name='blood-sea-healing-siphon';
 root.userData.decorativeOnly=true;parent.add(root);
 const geometry=new THREE.SphereGeometry(1,coarse?6:9,coarse?5:7);
 const material=new THREE.MeshPhysicalMaterial({
  color:0xb51a3b,roughness:.16,metalness:0,clearcoat:1,clearcoatRoughness:.12,
  emissive:0x6c0923,emissiveIntensity:.44,depthWrite:true
 });
 const drops=new THREE.InstancedMesh(geometry,material,count);
 drops.name='blood-sea-absorbed-droplets';drops.count=0;
 drops.frustumCulled=false;drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(drops);
 const ringGeometry=new THREE.TorusGeometry(1,.07,6,coarse?24:48);
 const ringMaterial=new THREE.MeshBasicMaterial({color:0xf75a79,transparent:true,opacity:.0,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const ring=new THREE.Mesh(ringGeometry,ringMaterial);
 ring.name='blood-sea-healing-core-glow';ring.visible=false;root.add(ring);
 const edgeGeometry=new THREE.RingGeometry(28.85,29.14,coarse?48:96).rotateX(-Math.PI/2);
 const edgeMaterial=new THREE.MeshBasicMaterial({color:0xc81f46,transparent:true,opacity:0,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const edge=new THREE.Mesh(edgeGeometry,edgeMaterial);
 edge.name='blood-sea-absorption-shoreline';edge.position.y=.11;edge.visible=false;root.add(edge);
 const dummy=new THREE.Object3D(),tangent=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);let disposed=false;
 function clear(){drops.count=0;ring.visible=edge.visible=false;ringMaterial.opacity=edgeMaterial.opacity=0;}
 function update(g,dt=0){
  if(disposed)return;
  const s=g?.blood?.siphon,active=!!s?.active&&g.boss.phase===2&&g.status==='playing';
  const flash=clamp((s?.flash||0)/1.35);
  if(!active&&flash<=0){clear();return;}
  const b=g.boss,progress=active?clamp(s.t/BLOOD_SIPHON_RULES.channel):1;
  const coreY=4.7+(g.blood.elevation||0),pulse=1+(reduced?0:Math.sin((g.time||0)*9)*.08);
  ring.visible=true;ring.position.set(b.x,coreY,b.z);
  ring.rotation.set(-Math.PI/2,0,(g.time||0)*.4);
  ring.scale.setScalar(pulse*(active?1.1+progress*.5:1.6+flash*.8));
  ringMaterial.opacity=active?.22+.3*progress:.42*flash;
  edge.visible=active;edgeMaterial.opacity=active?.06+.18*progress:0;
  if(!active){drops.count=0;return;}
  // Each droplet begins in the flooded nave beyond the playable radius (28).
  // A raised Bezier-like arc closes around the moving blood-angel core.
  const visibleCount=reduced?Math.floor(count*.65):count;
  for(let i=0;i<visibleCount;i++){
   const a=TAU*(i*.61803398875+rand(i,3)*.035);
   const radius=30.1+rand(i,7)*5.3;
   const x0=Math.sin(a)*radius,z0=Math.cos(a)*radius;
   const delay=rand(i,13)*.57;
   const u=clamp((progress-delay)/Math.max(.38,1-delay));
   const travel=ease(u);
   // A heavy stream peels off the flooded shore, curves around the boss and
   // then settles into the actual moving chest. Tangent-aligned droplets
   // stretch ALONG their travel direction, never uniformly upward.
   const dx=b.x-x0,dz=b.z-z0,d=Math.max(1,Math.hypot(dx,dz)),
    perpendicularX=-dz/d,perpendicularZ=dx/d,
    swirl=reduced?0:(.65+rand(i,23)*1.15)*Math.sin(Math.PI*travel);
   const x=x0+dx*travel+perpendicularX*swirl,
    z=z0+dz*travel+perpendicularZ*swirl,
    height=3.7+rand(i,17)*2.8,
    y=.2+(coreY-.2)*travel+Math.sin(Math.PI*travel)*height;
   const waveSlope=reduced?0:Math.PI*Math.cos(Math.PI*travel)*(.65+rand(i,23)*1.15);
   tangent.set(dx+perpendicularX*waveSlope,(coreY-.2)+Math.PI*Math.cos(Math.PI*travel)*height,
    dz+perpendicularZ*waveSlope).normalize();
   const size=(.11+rand(i,19)*.2)*(u>0&&u<1?1:.035),
    elongation=1.12+(1-travel)*Math.min(1.25,d/48);
   dummy.position.set(x,y,z);dummy.quaternion.setFromUnitVectors(up,tangent);
   dummy.scale.set(size,size*elongation,size);
   dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);
  }
  drops.count=visibleCount;drops.instanceMatrix.needsUpdate=true;
 }
 function dispose(){
  if(disposed)return;disposed=true;clear();root.parent?.remove(root);
  geometry.dispose();material.dispose();ringGeometry.dispose();ringMaterial.dispose();
  edgeGeometry.dispose();edgeMaterial.dispose();drops.dispose();
 }
 clear();
 return {root,update,clear,dispose,
  stats:()=>({droplets:drops.count,poolSize:count,active:drops.count>0,
   collidable:false,soundSources:0})};
}
