import * as THREE from 'three';
import {BLOOD_SERAPH_TRANSITION} from './blood-data.mjs';

// A real, deliberately budgeted 3D seraph rig, NOT a fullscreen image.
// The enormous seraph is the ONLY visible 3P boss and occupies the real
// combat origin. The authored vessel/eye hurt shapes share its transform.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
const vec=(x,y,z)=>new THREE.Vector3(x,y,z);
function featherGeometry(){
 const vertices=[],indices=[],rows=7;
 for(let j=0;j<=rows;j++){
  const t=j/rows,w=.36*Math.sin(Math.PI*Math.pow(t,.72))**.8+.018*(1-t);
  for(const side of [-1,0,1]){
   vertices.push(side*w+.06*Math.sin(t*Math.PI),t,-.13*Math.sin(Math.PI*t)+.055*(1-side*side));
  }
 }
 for(let j=0;j<rows;j++)for(let k=0;k<2;k++){
  const a=j*3+k,b=a+3;indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 return geo;
}
function makeTube(parent,pts,radius,material,segments=14){
 const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>vec(...p))),segments,radius,5,false);
 const m=new THREE.Mesh(geo,material);parent.add(m);return m;
}
function makeMesh(parent,geo,mat,name,x=0,y=0,z=0){
 const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);parent.add(m);return m;
}
const WING_FORMS=[
 {y:3.1,span:9.1,rise:7.8,depth:-1.5,count:22},
 {y:1.8,span:11.3,rise:1.1,depth:-.55,count:24},
 {y:.7,span:8.7,rise:-6.8,depth:.3,count:20}
];
export function createBloodSeraph(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='blood-third-phase-crimson-seraph';root.userData.decorativeOnly=false;root.userData.bossCombatRig=true;
 scene.add(root);root.visible=false;
 const ruby=new THREE.MeshStandardMaterial({color:0x6a0a21,emissive:0x480718,emissiveIntensity:.52,metalness:.18,roughness:.33,side:THREE.DoubleSide});
 const pearl=new THREE.MeshStandardMaterial({color:0xe6a5a9,emissive:0x6f1a31,emissiveIntensity:.28,metalness:.14,roughness:.47});
 const edging=new THREE.MeshStandardMaterial({color:0xe2728a,emissive:0xa02a4e,emissiveIntensity:.54,metalness:.3,roughness:.29});
 const featherMat=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x2f0715,
  emissiveIntensity:.32,metalness:.07,roughness:.58,side:THREE.DoubleSide});
 const glow=new THREE.MeshBasicMaterial({color:0xfa496c,transparent:true,opacity:.75,depthWrite:false});
 const dark=new THREE.MeshStandardMaterial({color:0x13050c,metalness:.13,roughness:.22});
 // An anatomically continuous crown, breastplate and downward taper.
 // A physical, floor-reaching robe replaces the invisible old humanoid.
 const vessel=makeMesh(root,new THREE.CylinderGeometry(1.15,.58,8.6,coarse?12:20),ruby,
  'blood-seraph-floor-reaching-vessel',0,-1.35,-.35);
 vessel.scale.z=.83;
 const thorax=makeMesh(root,new THREE.IcosahedronGeometry(1,coarse?1:2),ruby,'blood-seraph-vestment',0,.5,-.35);
 thorax.scale.set(2.05,3.2,1.25);
 const throat=makeMesh(root,new THREE.CylinderGeometry(.74,1.05,3,coarse?10:16),pearl,
  'blood-seraph-neck',0,3,-.05);throat.rotation.x=.1;
 const crown=makeMesh(root,new THREE.ConeGeometry(1.26,3.9,coarse?8:16),pearl,
  'blood-seraph-crown',0,5.25,-.4);crown.rotation.x=.075;
 const centralSpire=makeMesh(root,new THREE.ConeGeometry(.35,2.2,8),edging,
  'blood-seraph-spire',0,7.2,-.35);
 // The eye is genuine volumetric geometry with an iris, pupil and socket.
 const socket=makeMesh(root,new THREE.SphereGeometry(1.42,coarse?16:30,coarse?12:22),
  dark,'blood-seraph-eye-socket',0,1.96,1.13);socket.scale.set(1.35,.78,.46);
 const irisMat=ruby.clone();irisMat.emissive.setHex(0x7a1832);
 const iris=makeMesh(root,new THREE.SphereGeometry(1.2,coarse?18:34,coarse?12:24),
  irisMat,'blood-seraph-crimson-iris',0,1.96,1.49);iris.scale.set(1.26,.64,.36);
 const pupil=makeMesh(root,new THREE.SphereGeometry(.55,coarse?12:24,coarse?8:16),
  dark,'blood-seraph-eye-pupil',0,1.96,1.78);pupil.scale.set(.74,.73,.3);
 const gleam=makeMesh(root,new THREE.SphereGeometry(.17,10,8),glow,
  'blood-seraph-eye-glint',-.4,2.22,1.98);
 // Laser is an articulated real 3D shaft. Its aim and visibility read the
 // same hazard yaw/warn/life that drives the floor collision footprint.
 const beamPivot=new THREE.Group();beamPivot.name='blood-seraph-eye-beam-socket';
 beamPivot.position.set(0,1.96,1.85);root.add(beamPivot);
 const shaft=vec(0,-7.3,26),axis=vec(0,1,0),middle=shaft.clone().multiplyScalar(.5);
 const beamMat=new THREE.MeshBasicMaterial({color:0xff9aa8,transparent:true,opacity:.86,
  blending:THREE.AdditiveBlending,depthWrite:false});
 const auraMat=new THREE.MeshBasicMaterial({color:0xc72247,transparent:true,opacity:.36,
  blending:THREE.AdditiveBlending,depthWrite:false});
 const beam=new THREE.Group();beam.name='blood-seraph-live-ocular-ray';beamPivot.add(beam);
 for(const [radius,material] of [[.21,beamMat],[1.0,auraMat]]){
  const m=makeMesh(beam,new THREE.CylinderGeometry(radius,radius,1,coarse?8:14),
   material,'blood-seraph-ocular-ray-shell');
  m.position.copy(middle);
  m.quaternion.setFromUnitVectors(axis,shaft.clone().normalize());
  m.scale.y=shaft.length();
 }
 beamPivot.visible=false;
 const haloAnchor=new THREE.Group();haloAnchor.name='blood-seraph-halo-assembly';
 haloAnchor.position.set(0,2.25,-3.4);root.add(haloAnchor);
 const rings=[];
 for(let i=0;i<3;i++){
  const ring=makeMesh(haloAnchor,new THREE.TorusGeometry(5.6+i*1.55,.09+i*.013,coarse?5:7,coarse?44:84),
   i===1?pearl:edging,'blood-seraph-ring-'+i);
  ring.rotation.z=i*.24;rings.push(ring);
 }
 const rayGeo=new THREE.ConeGeometry(.15,2.15,5),rayCount=coarse?12:20;
 const rays=new THREE.InstancedMesh(rayGeo,edging,rayCount);
 rays.name='blood-seraph-halo-rays';rays.frustumCulled=false;haloAnchor.add(rays);
 const dummy=new THREE.Object3D();
 for(let i=0;i<rayCount;i++){
  const a=i*Math.PI*2/rayCount;
  dummy.position.set(Math.sin(a)*8.2,Math.cos(a)*8.2,0);
  dummy.rotation.set(0,0,-a);dummy.scale.setScalar(i%2?.78:1);dummy.updateMatrix();
  rays.setMatrixAt(i,dummy.matrix);
 }
 rays.instanceMatrix.needsUpdate=true;
 // Six separately hinged feathered wings; feather detail is instanced per wing.
 const featherGeo=featherGeometry(),wings=[];
 for(let pair=0;pair<3;pair++)for(const side of [-1,1]){
  const form=WING_FORMS[pair],pivot=new THREE.Group();
  pivot.name='blood-seraph-wing-joint-'+pair+'-'+(side>0?'right':'left');
  pivot.position.set(side*1.55,form.y,-.6);pivot.scale.x=side;root.add(pivot);
  const path=[[0,0,0],[form.span*.27,form.rise*.45,.3],
   [form.span*.60,form.rise*.89,form.depth*.64],[form.span,form.rise,form.depth]];
  makeTube(pivot,path,pair===0?.27:.21,ruby,coarse?10:20);
  makeTube(pivot,path.map(([x,y,z])=>[x,y+.13,z+.25]),.052,edging,coarse?10:20);
  const joint=makeMesh(pivot,new THREE.IcosahedronGeometry(.55,1),pearl,
   'blood-seraph-shoulder-'+pair);joint.scale.set(1.3,.8,.9);
  const count=coarse?Math.ceil(form.count*.64):form.count;
  const feathers=new THREE.InstancedMesh(featherGeo,featherMat,count);
  feathers.name='blood-seraph-layered-feathers-'+pair+'-'+side;
  feathers.frustumCulled=false;pivot.add(feathers);
  const tint=new THREE.Color();
  for(let i=0;i<count;i++){
   const t=(i+.35)/count;
   const x=form.span*t,y=form.rise*Math.pow(t,.78)+Math.sin(t*Math.PI)*.3;
   dummy.position.set(x,y,form.depth*t+.16*Math.sin(t*5));
   dummy.rotation.set(-.12*Math.sin(i*1.3),0,-1.93+pair*.19-t*.26+(i%3)*.055);
   dummy.scale.set(.82+(i%4)*.095,(1.65+2.25*t)*(pair===2?.88:1),1);
   dummy.updateMatrix();feathers.setMatrixAt(i,dummy.matrix);
   tint.setHex(i%5===0?0xe98aa1:i%3===0?0xa92a4b:0x68112c);
   feathers.setColorAt(i,tint);
  }
  feathers.instanceMatrix.needsUpdate=true;
  if(feathers.instanceColor)feathers.instanceColor.needsUpdate=true;
  wings.push({pivot,pair,side,feathers});
 }
 for(const side of [-1,1]){
  makeTube(root,[[0,5.3,.8],[side*1.7,3.8,1.2],[side*2.25,1.2,.9],
   [side*.52,-2.6,.85]],.16,pearl,18);
  makeTube(root,[[side*.35,-2.3,.1],[side*1.4,-4.8,.35],
   [side*.52,-7.7,-.25]],.23,ruby,18);
 }
 // Soft material volumes, pooled once. No dynamic allocations or collision.
 const cloudGeo=new THREE.IcosahedronGeometry(1,coarse?0:1),
  cloudMat=new THREE.MeshBasicMaterial({color:0xb9244a,transparent:true,
   opacity:.11,depthWrite:false,side:THREE.DoubleSide});
 const clouds=new THREE.InstancedMesh(cloudGeo,cloudMat,coarse?7:13);
 clouds.name='blood-seraph-crimson-vapour';clouds.frustumCulled=false;
 clouds.renderOrder=-1;root.add(clouds);
 for(let i=0;i<clouds.count;i++){
  const a=i*2.4,rad=5+(i%4)*3;
  dummy.position.set(Math.sin(a)*rad,-3.7+(i%5)*2, -4.4-i%3);
  dummy.rotation.set(i*.5,i*.4,i*.2);
  dummy.scale.set(3+(i%3),2.5+(i%5)*.7,2);
  dummy.updateMatrix();clouds.setMatrixAt(i,dummy.matrix);
 }
 clouds.instanceMatrix.needsUpdate=true;
 let shown=0,disposed=false;
 function update(g,c,dt=0){
  if(disposed)return;
  const phase=g?.boss?.phase||1;
  const visible=phase===3&&g?.status!=='lost'&&g?.status!=='won';
  root.visible=visible;
  if(!visible){shown=0;return;}
  const s=g.blood,b=g.boss,p=g.player;
  const intro=b.state==='transition'?ease((s.t-.2)/(BLOOD_SERAPH_TRANSITION-.55)):1;
  const d=clamp(dt,0,.12),k=1-Math.exp(-d*4);
  shown+=(intro-shown)*k;
  const dx=p.x-b.x,dz=p.z-b.z,len=Math.hypot(dx,dz)||1,nx=dx/len,nz=dz/len;
  // No trailing ghost model: torso, floor vessel and eye follow actual
  // collision/lock-on position and yaw. LOD does not change world size.
  root.position.set(b.x,5.1+(reduced?0:Math.sin(g.time*.66)*.08),b.z);
  root.rotation.y=b.yaw||0;
  const scale=Math.max(.001,shown)*.82;
  root.scale.setScalar(scale);
  const t=g.time||0,pattern=b.state==='pattern'?s.pattern:null;
  const first=s.hazards?.length?Math.min(...s.hazards.map(h=>h.warn)):1.2;
  const charge=pattern?ease((s.t||0)/Math.max(.2,first)):0;
  // Never animate at guessed fixed times: use authoritative hazard warns,
  // which include the battle tempo multiplier and readability padding.
  const allBeats=(s.hazards||[]).map(h=>h.warn).sort((a,b)=>a-b);
  const wingAttack=['seraphWings','seraphFinale','seraphDescent'].includes(pattern);
  const slash=wingAttack?allBeats.reduce((m,beat)=>
   Math.max(m,Math.max(0,1-Math.abs((s.t||0)-beat)/.52)),0):0;
  const closing=pattern==='seraphEmbrace'?charge:0;
  const featherfall=pattern==='seraphFeathers'?charge:0;
  const gaze=pattern==='seraphGaze';
  const activeRay=gaze?(s.hazards||[]).find(h=>h.damage>0&&h.age>=h.warn&&h.age<h.warn+h.life):null;
  beamPivot.visible=!!activeRay;
  if(activeRay)beamPivot.rotation.y=activeRay.yaw-(b.yaw||0);
  const eyeCharge=gaze?Math.max(0,...(s.hazards||[]).map(h=>
   h.age<h.warn?Math.min(1,h.age/Math.max(.01,h.warn)):0)):0;
  wings.forEach(({pivot,pair,side})=>{
   const breath=reduced?0:Math.sin(t*(1.05+pair*.19)+side*.55)*.043;
   const flare=pattern==='seraphCrown'||pattern==='seraphFinale'?charge*.23:0;
   pivot.rotation.z=(pair===0?.11:pair===1?-.09:.19)+breath+
    side*(slash*.24+flare+featherfall*.16);
   pivot.rotation.y=side*(.06+charge*.085+slash*.15+closing*.85);
   pivot.rotation.x=breath*.5+slash*.09+closing*.18;
   if(pattern==='seraphDescent')pivot.rotation.z-=side*slash*.31;
  });
  rings.forEach((m,i)=>{m.rotation.z=(reduced?0:t*.12*(i%2?-1:1))+i*.24;
   const pulse=1+(reduced?0:Math.sin(t*1.7-i)*.02)+charge*.045;
   m.scale.setScalar(pulse);
  });
  const eyePulse=.85+.15*Math.sin(t*(pattern?5:2.4));
  iris.scale.z=.36*(1+charge*.3);
  iris.material.emissiveIntensity=.46+charge*.45+eyeCharge*1.1+
   (g.blood.seraphHealDone&&b.state==='transition'?.55:0);
  gleam.scale.setScalar(eyePulse+charge*.25);
 }
 function clear(){shown=0;root.visible=false;beamPivot.visible=false;
  root.position.set(0,0,0);root.rotation.set(0,0,0);
  wings.forEach(({pivot})=>pivot.rotation.set(0,0,0));}
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);
   if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return {root,update,clear,dispose,stats:()=>({visible:root.visible,
  wingPairs:3,hinges:wings.length,featherInstances:wings.reduce((n,w)=>n+w.feathers.count,0),
  haloRings:rings.length,hasEye:!!pupil,hasLiveEyeRay:!!beamPivot,
  eyeRayVisible:beamPivot.visible,decorativeOnly:false,
  ownsHurtSilhouette:true,damageSources:0})};
}
