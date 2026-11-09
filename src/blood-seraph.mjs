import * as THREE from 'three';
import {BLOOD_SERAPH_TRANSITION,hazardPosition} from './blood-data.mjs';
import {createBloodHead} from './blood-head.mjs';
import {SERAPH_EYE_ATTACKS} from './blood-seraph-doctrine.mjs';
import {createBloodSeraphPillars} from './blood-seraph-pillars.mjs';
import {sculptBloodSeraph} from './blood-seraph-sculpt.mjs';

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
 const pillars=createBloodSeraphPillars(scene,{coarse,reduced});
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
 // Use the SAME uploaded baeseojun.png and curved photo-wrapped face
 // geometry as phase one; never paste a 2D photograph onto a billboard.
 const socket=makeMesh(root,new THREE.SphereGeometry(1.7,coarse?16:30,coarse?12:22),
  dark,'blood-seraph-crimson-face-vessel',0,1.95,1.05);
 socket.scale.set(1.12,1.12,.70);
 const visage=createBloodHead({coarse,reduced,seraph:true,portrait:'3bae.png'});
 visage.group.name='blood-seraph-3bae-sculpted-visage';
 visage.group.position.set(0,1.92,1.76);visage.group.scale.setScalar(2.25);
 root.add(visage.group);
 const holyFaceRing=makeMesh(root,new THREE.TorusGeometry(2.12,.105,8,coarse?48:84),
  edging,'blood-seraph-sacred-face-ring',0,1.95,1.35);
 const gleam=makeMesh(root,new THREE.SphereGeometry(.14,10,8),glow,
  'blood-seraph-forehead-sanctum-light',-.46,3.07,2.52);
 // Face and halo, not an ugly rectangular strip across the floor, prepare
 // the sweeping cannon with a strong, holy circular energy charge.
 const chargeMat=new THREE.MeshBasicMaterial({color:0xff8ca6,transparent:true,
  opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending});
 const chargeRing=makeMesh(root,new THREE.TorusGeometry(1.95,.12,8,48),
  chargeMat,'blood-seraph-face-cannon-sacred-charge',0,1.95,3.4);
 chargeRing.visible=false;
 const teleportMat=new THREE.MeshBasicMaterial({color:0xff8a97,
  transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
 const teleportRings=[0,1].map(i=>{
  const ring=makeMesh(scene,new THREE.TorusGeometry(2.2,.14,7,48),
   teleportMat.clone(),'blood-seraph-teleport-sanctum-'+i);
  ring.rotation.x=-Math.PI/2;ring.visible=false;return ring;
 });
 // Laser is an articulated real 3D shaft. Its aim and visibility read the
 // same hazard yaw/warn/life that drives the floor collision footprint.
 const beamPivot=new THREE.Group();beamPivot.name='blood-seraph-eye-beam-socket';
 beamPivot.position.set(0,1.95,3.0);root.add(beamPivot);
 const shaft=vec(0,-7.3,26),axis=vec(0,1,0),middle=shaft.clone().multiplyScalar(.5);
 const beamMat=new THREE.MeshBasicMaterial({color:0xff9aa8,transparent:true,opacity:.86,
  blending:THREE.AdditiveBlending,depthWrite:false});
 const auraMat=new THREE.MeshBasicMaterial({color:0xc72247,transparent:true,opacity:.36,
  blending:THREE.AdditiveBlending,depthWrite:false});
 const beam=new THREE.Group();beam.name='blood-seraph-live-ocular-ray';beamPivot.add(beam);
 for(const [radius,material] of [[.44,beamMat],[1.30,auraMat]]){
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
  wings.push({pivot,pair,side,feathers,form});
 }
 const fineSculpt=sculptBloodSeraph(root,{coarse,reduced,wings,featherGeometry:featherGeo});
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
 // A real detached blood-wing gyroscope leaves the arena on each 3P pass.
 const wingWheel=new THREE.Group();wingWheel.name='blood-seraph-independent-crossing-wings';
 scene.add(wingWheel);wingWheel.visible=false;
 for(let i=0;i<3;i++){
  const m=makeMesh(wingWheel,new THREE.TorusGeometry(4.75+i*.27,.29,7,coarse?32:52),
   i===1?pearl:edging,'blood-seraph-gyroscopic-wing-'+i);
  m.rotation.x=Math.PI/2+i*.3;
 }
 const wheelFeathers=new THREE.InstancedMesh(featherGeo,featherMat,coarse?9:16);
 wheelFeathers.name='blood-seraph-wheel-feathers';wingWheel.add(wheelFeathers);
 for(let i=0;i<wheelFeathers.count;i++){
  const a=i*Math.PI*2/wheelFeathers.count;
  dummy.position.set(Math.cos(a)*4.85,0,Math.sin(a)*4.85);
  dummy.rotation.set(Math.PI/2,0,a);dummy.scale.set(.82,3.85,1.05);
  dummy.updateMatrix();wheelFeathers.setMatrixAt(i,dummy.matrix);
 }
 wheelFeathers.instanceMatrix.needsUpdate=true;
 // Telegraph each exact future path BEFORE the wheel enters from offscreen.
 const guideMat=new THREE.MeshBasicMaterial({color:0xf44f7b,transparent:true,
  opacity:.0,depthWrite:false,side:THREE.DoubleSide});
 const guides=Array.from({length:4},(_,i)=>{
  const mesh=makeMesh(scene,new THREE.PlaneGeometry(66,12.1).rotateX(-Math.PI/2),
   guideMat.clone(),'blood-seraph-wing-pass-warning-'+i);
  mesh.position.y=.19;mesh.visible=false;return mesh;
 });
 const haloWheel=new THREE.Group();haloWheel.name='blood-seraph-rolling-holy-halo';
 scene.add(haloWheel);haloWheel.visible=false;
 for(let i=0;i<2;i++)makeMesh(haloWheel,
  new THREE.TorusGeometry(6.55+i*.23,.34,8,coarse?36:58),
  i===0?edging:pearl,'blood-seraph-holy-halo-wheel-'+i).rotation.y=i*.3;
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
  if(!visible){
   shown=0;pillars.clear();chargeRing.visible=false;
   teleportRings.forEach(r=>r.visible=false);return;
  }
  const s=g.blood,b=g.boss,p=g.player;
  const intro=b.state==='transition'?(c.seraph??ease((s.t-.2)/(BLOOD_SERAPH_TRANSITION-.55))):1;
  const d=clamp(dt,0,.12),k=1-Math.exp(-d*6);
  // All transformation poses obey gameplay time, not a lagging frame timer.
  shown=b.state==='transition'?intro:shown+(1-shown)*k;
  const dx=p.x-b.x,dz=p.z-b.z,len=Math.hypot(dx,dz)||1,nx=dx/len,nz=dz/len;
  // No trailing ghost model: torso, floor vessel and eye follow actual
  // collision/lock-on position and yaw. LOD does not change world size.
  root.position.set(b.x,5.1+(reduced?0:Math.sin(g.time*.66)*.08),b.z);
  root.rotation.y=b.yaw||0;
  const scale=Math.max(.001,shown)*1.10; // 34% grander than the old 0.82 scale

  const blink=s.seraphBlink,age=blink?Math.max(0,blink.age||0):0;
  root.scale.setScalar(scale*(blink?Math.max(.14,ease(age/.34)):1));
  const evolving=b.state==='transition';
  const wingBirth=evolving?(c.wingUnfold??0):1;
  const faceBirth=evolving?(c.faceReveal??0):1;
  const haloBirth=evolving?(c.haloBirth??0):1;
  visage.group.scale.setScalar(2.25*Math.max(.025,faceBirth));
  fineSculpt.update(g,c);
  teleportRings.forEach((ring,i)=>{
   ring.visible=!!blink&&age<.62;
   if(!ring.visible)return;
   const site=i===0?blink.from:blink.to;
   ring.position.set(site.x,.35,site.z);
   ring.scale.setScalar(1+age*(i===0?2.1:1.35));
   ring.material.opacity=.50*(1-ease(age/.62));
  });
  pillars.update(g);
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
  const gaze=pattern==='seraphGaze'||SERAPH_EYE_ATTACKS.has(pattern);
  const activeRay=gaze?(s.hazards||[]).find(h=>h.damage>0&&h.age>=h.warn&&h.age<h.warn+h.life):null;
  beamPivot.visible=!!activeRay;
  if(activeRay){
   // Sweep and frenzy VFX hit the ACTUAL real-time lane end, not a guessed
   // pose; this exactly matches the shared damage/warning footprint.
   const now=hazardPosition(activeRay);
   const yaw=now.yaw??activeRay.yaw,
    distance=activeRay.seraphAngularSweep?31.5:activeRay.length/2;
   const tx=now.x+Math.sin(yaw)*distance,tz=now.z+Math.cos(yaw)*distance;
   const dx=tx-b.x,dz=tz-b.z,ca=Math.cos(b.yaw||0),sa=Math.sin(b.yaw||0);
   const end=vec((dx*ca-dz*sa)/scale,-5.1/scale,(dx*sa+dz*ca)/scale);
   const ray=end.sub(beamPivot.position),len=ray.length();
   for(const m of beam.children){
    m.position.copy(ray).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(axis,ray.clone().normalize());
    // The outer beam radius tracks the real lane half-width, including
    // the combat contact margin. No fat invisible line and no tiny laser.
    const thickness=(activeRay.width+.28)/1.30;
    m.scale.set(thickness,len,thickness);
   }
  }
  const eyeCharge=gaze?Math.max(0,...(s.hazards||[]).map(h=>
   h.age<h.warn?Math.min(1,h.age/Math.max(.01,h.warn)):0)):0;
  wings.forEach(({pivot,pair,side})=>{
   const breath=reduced?0:Math.sin(t*(1.05+pair*.19)+side*.55)*.043;
   const flare=pattern==='seraphCrown'||pattern==='seraphFinale'?charge*.23:
    ['seraphWingCross','seraphBloodRosette'].includes(pattern)?charge*.3:0;
   pivot.rotation.z=(pair===0?.11:pair===1?-.09:.19)+breath+
    side*(slash*.24+flare+featherfall*.16);
   // The three pairs open in sequence as the 2P body condenses.
   const pairBirth=evolving?ease((wingBirth*1.25-pair*.12)/.75):1;
   pivot.rotation.y=side*(.06+charge*.085+slash*.15+closing*.85+
     (pattern==='seraphWingCross'?charge*.95:0)+(1-pairBirth)*1.08);
   pivot.rotation.z+=side*(1-pairBirth)*.52;
   pivot.rotation.x=breath*.5+slash*.09+closing*.18+(1-pairBirth)*.43;
   if(pattern==='seraphDescent')pivot.rotation.z-=side*slash*.31;
  });
  rings.forEach((m,i)=>{m.rotation.z=(reduced?0:t*.12*(i%2?-1:1))+i*.24;
   const pulse=1+(reduced?0:Math.sin(t*1.7-i)*.02)+charge*.045;
   m.scale.setScalar(pulse*Math.max(.03,haloBirth));
  });
  visage.update(g,c,d,{cast:charge});
  holyFaceRing.scale.setScalar(1+charge*.18+eyeCharge*.22);
  const charging=pattern==='seraphSweep'&&(!activeRay||s.t<first);
  chargeRing.visible=charging&&eyeCharge>.05;
  chargeRing.scale.setScalar(.65+eyeCharge*.8);
  chargeRing.material.opacity=.12+.65*eyeCharge;
  chargeRing.rotation.z=t*2.2;
  holyFaceRing.rotation.z=(reduced?0:t*.38)+(pattern==='seraphFrenzy'?t*1.5:0);
  gleam.scale.setScalar(.86+.1*Math.sin(t*3)+charge*.35+eyeCharge*.65);
  // A rotating blood halo leaves the player's arena, charges and returns.
  const nextPass=(s.hazards||[]).find(h=>h.seraphCue==='wing-pass'&&
   h.age>=h.warn-.62&&h.age<=h.warn+h.life);
  // After four damage passes the wing-wheel flies back along an ELEVATED,
  // NON-DAMAGING arc and merges with the face halo instead of blinking out.
  const flight=s.seraphWingReturn,returnTime=flight?s.t-flight.start:-1,
   returning=flight&&returnTime>=0&&returnTime<flight.duration;
  wingWheel.visible=pattern==='seraphWingCross'&&(!!nextPass||!!returning);
  if(nextPass){
   const here=hazardPosition(nextPass);
   wingWheel.position.set(here.x,2.55,here.z);
   wingWheel.rotation.set(.25,t*11,Math.PI/2+t*15);
   wingWheel.scale.setScalar(.9+Math.min(1,nextPass.age/nextPass.warn)*.16);
  }else if(returning){
   const u=ease(returnTime/flight.duration);
   wingWheel.position.set(flight.x+(b.x-flight.x)*u,
    2.55+8*Math.sin(Math.PI*u),flight.z+(b.z-flight.z)*u);
   wingWheel.rotation.set(.25,t*11,Math.PI/2+t*13);
   wingWheel.scale.setScalar(Math.max(.05,.95*(1-u)));
  }
  guides.forEach((guide,i)=>{
   const h=(s.hazards||[]).find(h=>h.seraphCue==='wing-pass'&&h.pass===i);
   guide.visible=pattern==='seraphWingCross'&&!!h&&h.age>=h.warn-1.05&&h.age<h.warn;
   if(h){guide.position.z=h.z;
    // Physical warning thickness remains proportional to real impact lane.
    guide.scale.z=(h.width*2.08)/12.1;
    guide.material.opacity=guide.visible?.13+.13*(1-(h.warn-h.age)/1.05):0;}
  });
  const halo=(s.hazards||[]).find(h=>h.seraphCue==='rolling-halo'&&
   h.age>=h.warn-.45&&h.age<h.warn+h.life);
  haloWheel.visible=pattern==='seraphHaloProcession'&&!!halo;
  if(halo){const q=hazardPosition(halo);
   haloWheel.position.set(q.x,6.55,q.z);haloWheel.rotation.set(t*3,t*.9,t*2.9);}

 }
 function clear(){shown=0;root.visible=false;beamPivot.visible=false;
  pillars.clear();chargeRing.visible=false;
  teleportRings.forEach(r=>r.visible=false);
  wingWheel.visible=false;haloWheel.visible=false;
  guides.forEach(m=>m.visible=false);
  root.position.set(0,0,0);root.rotation.set(0,0,0);
  wings.forEach(({pivot})=>pivot.rotation.set(0,0,0));}
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  wingWheel.parent?.remove(wingWheel);haloWheel.parent?.remove(haloWheel);
  pillars.dispose();
  for(const ring of teleportRings)ring.parent?.remove(ring);
  for(const guide of guides)guide.parent?.remove(guide);
  visage.dispose();
  const geometries=new Set(),materials=new Set();
  for(const node of [root,wingWheel,haloWheel,...guides,...teleportRings])node.traverse(o=>{
   if(o.geometry)geometries.add(o.geometry);
   if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);
  });
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return {root,update,clear,dispose,stats:()=>({visible:root.visible,
  wingPairs:3,hinges:wings.length,featherInstances:wings.reduce((n,w)=>n+w.feathers.count,0),
  haloRings:rings.length,hasEye:false,hasFace:true,photoAsset:'assets/'+visage.portraitAsset,
  faceSculpt:!!visage.group,
  photoLoaded:visage.photoLoaded,sculpt:fineSculpt.stats(),
  hasLiveEyeRay:!!beamPivot,
  eyeRayVisible:beamPivot.visible,wingWheelVisible:wingWheel.visible,
  warningGuides:guides.filter(g=>g.visible).length,
  haloWheelVisible:haloWheel.visible,columns:pillars.stats(),
  sacredChargeVisible:chargeRing.visible,
  teleportRingsVisible:teleportRings.filter(r=>r.visible).length,
  decorativeOnly:false,
  ownsHurtSilhouette:true,damageSources:0})};
}
