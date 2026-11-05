import * as THREE from 'three';
import {createBloodLegRig} from './blood-leg-rig.mjs';
import {createSpringBank} from './secondary-physics.mjs';

// Sculpted, articulated costume geometry. Every detail is actual depth geometry;
// the spell system and all damage volumes remain independent of this visual rig.
const TAU=Math.PI*2;
const hemLift=a=>.45*Math.max(0,Math.cos(a))**4;
const point=(x,y,z)=>new THREE.Vector3(x,y,z);
const material=(color,metalness=0,roughness=.8,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
function attach(parent,geometry,mat,x=0,y=0,z=0){
 const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;
}
function tube(parent,points,radius,mat,segments=24){
 return attach(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>point(...p))),segments,radius,6,false),mat);
}
function panelGeometry(angle,width,segments=12){
 const verts=[],ids=[],rows=8;
 for(let j=0;j<=rows;j++){
  const t=j/rows,y=.55+t*1.91,r=1.52-t*.67;
  for(let i=0;i<=segments;i++){
   const u=i/segments,a=angle+(u-.5)*width;
   const fold=1+.055*Math.cos(u*Math.PI*4)*(1-t)*Math.sin(Math.PI*t*.8);
   verts.push(Math.sin(a)*r*fold,y+hemLift(a)*(1-t)**2,Math.cos(a)*r*fold);
  }
 }
 for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
  const a=j*(segments+1)+i,b=a+segments+1;ids.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
function taperedCuff(parent,side,mat){
 const cuff=attach(parent,new THREE.CylinderGeometry(.26,.36,.64,12),mat,side*.02,-.29,.04);
 cuff.rotation.z=-side*.12;
 return cuff;
}
function armature(actor,side,{dark,red,metal,edge,skin,vein}){
 const arm=new THREE.Group();arm.position.set(side*1.06,3.26,-.02);actor.add(arm);
 const shoulder=attach(arm,new THREE.SphereGeometry(.56,20,12),metal,side*.08,-.08,-.03);
 shoulder.scale.set(1.17,.66,1);
 const top=attach(arm,new THREE.CylinderGeometry(.28,.43,.95,14),dark,side*.14,-.64,0);
 top.rotation.z=side*.2;
 const ridge=attach(arm,new THREE.CylinderGeometry(.32,.39,.68,14),red,side*.17,-.63,.07);
 ridge.rotation.z=side*.2;
 attach(arm,new THREE.TorusGeometry(.39,.065,7,24,Math.PI*1.2),edge,side*.17,-.6,.09).rotation.z=-side*.3;
 const elbow=attach(arm,new THREE.SphereGeometry(.28,12,10),metal,side*.23,-1.02,0);
 elbow.scale.set(1,1,.95);
 const forearm=new THREE.Group();forearm.position.set(side*.23,-1.02,0);arm.add(forearm);
 taperedCuff(forearm,side,metal);
 tube(forearm,[[0,-.04,.29],[side*.07,-.32,.38],[side*.09,-.62,.32]],.043,edge,16);
 const hand=new THREE.Group();hand.position.set(side*.07,-.73,.12);forearm.add(hand);
 const palm=attach(hand,new THREE.SphereGeometry(.26,12,10),skin,0,0,0);palm.scale.set(1.03,.78,.65);
 const fingers=[];
 for(let f=0;f<4;f++){
  const x=(f-1.5)*.117,len=.18+(1-Math.abs(f-1.5)/2)*.11;
  const joint=new THREE.Group();joint.position.set(x,-.15,.035);hand.add(joint);
  const finger=attach(joint,new THREE.CapsuleGeometry(.052,len,4,7),skin,0,-.12,0);
  finger.rotation.z=(f-1.5)*.085;
  attach(joint,new THREE.SphereGeometry(.05,8,6),vein,0,-.25-(1-Math.abs(f-1.5)/2)*.06,.01);
  fingers.push(joint);
 }
 const thumb=attach(hand,new THREE.CapsuleGeometry(.07,.18,4,7),skin,-side*.25,-.14,.13);
 thumb.rotation.z=-side*.58;
 // A split, hinged pauldron: it remains attached to the arm during attacks.
 for(const sign of [-1,1]){
  const plate=attach(arm,new THREE.SphereGeometry(.34,12,8),sign===1?metal:red,side*(.28+sign*.16),-.28,-.05);
  plate.scale.set(1,.36,1.25);plate.rotation.z=side*sign*.25;
 }
 const thorn=attach(arm,new THREE.ConeGeometry(.15,.78,8),vein,side*.47,.11,-.12);
 thorn.rotation.z=-side*.45;thorn.visible=false;
 return {arm,forearm,hand,fingers,thorn,side};
}
export function createBloodRegalia(actor,{coarse=false,reduced=false}={}){
 const dark=material(0x1a1118,0,.92),wine=material(0x35111e,0,.84,{side:THREE.DoubleSide});
 const red=material(0x511728,.04,.65),metal=material(0x9b8873,.6,.34);
 const edge=material(0xd5ba88,.7,.28),skin=material(0xb38b80,0,.85);
 const vein=material(0x790a2c,.16,.29,{emissive:0x310612,emissiveIntensity:.5});
 const bone=material(0xb8a8a0,.16,.44),ashes=material(0x26131f,.2,.6);
 const legRig=createBloodLegRig(actor,{dark,metal,edge});
 const torso=new THREE.Group();actor.add(torso);
 // The inner robe is one continuous lathed volume, rather than a flat cone.
 const outline=[new THREE.Vector2(1.28,.55),new THREE.Vector2(1.43,.65),new THREE.Vector2(1.25,1.02),new THREE.Vector2(.98,1.65),new THREE.Vector2(.73,2.48),new THREE.Vector2(.89,3.15),new THREE.Vector2(.68,3.48)];
 const robe=attach(torso,new THREE.LatheGeometry(outline,coarse?20:40),dark);
 // The front of the hem clears the boots while the back retains its long fall.
 const robePos=robe.geometry.attributes.position;
 for(let i=0;i<robePos.count;i++){const y=robePos.getY(i),a=Math.atan2(robePos.getX(i),robePos.getZ(i));robePos.setY(i,y+hemLift(a)*Math.max(0,1-(y-.55)/1.91)**2);}
 robePos.needsUpdate=true;robe.geometry.computeVertexNormals();
 const drapes=[];
 const count=coarse?8:12;
 for(let i=0;i<count;i++){
  const m=attach(torso,panelGeometry(i*TAU/count,TAU/count*.9,coarse?6:12),i%3===0?red:wine);
  m.userData.rest=i*TAU/count;drapes.push(m);
 }
 const hemGeo=new THREE.TorusGeometry(1.47,.044,8,64).rotateX(Math.PI/2),hemPos=hemGeo.attributes.position;
 for(let i=0;i<hemPos.count;i++)hemPos.setY(i,hemPos.getY(i)+hemLift(Math.atan2(hemPos.getX(i),hemPos.getZ(i))));
 hemGeo.computeVertexNormals();attach(torso,hemGeo,edge,0,.64,0);
 const waist=attach(torso,new THREE.TorusGeometry(1.07,.085,8,40),metal,0,2.05,0);waist.rotation.x=Math.PI/2;
 const sash=attach(torso,new THREE.BoxGeometry(.27,.47,.12),edge,0,2.08,.99);sash.rotation.z=Math.PI/4;
 // Layered breastplate with a raised sternum, bevelled plates and engraved filigree.
 const cuirass=new THREE.Group();cuirass.position.y=2.96;torso.add(cuirass);
 for(const side of [-1,1]){
  const p=attach(cuirass,new THREE.SphereGeometry(.76,24,16),metal,side*.44,.12,.16);
  p.scale.set(.82,.78,.54);p.rotation.z=side*.14;
  const inlay=attach(cuirass,new THREE.SphereGeometry(.58,20,12),ashes,side*.42,.1,.39);
  inlay.scale.set(.86,.65,.3);
  tube(cuirass,[[side*.07,.56,.53],[side*.29,.42,.65],[side*.64,.24,.56],[side*.8,-.23,.34]],.032,edge,18);
  for(let i=0;i<3;i++){
   const stud=attach(cuirass,new THREE.SphereGeometry(.07,8,8),edge,side*(.3+i*.16),-.16-i*.09,.62-i*.11);
   stud.scale.z=.65;
  }
 }
 const sternum=attach(cuirass,new THREE.ConeGeometry(.22,.71,8),edge,0,-.18,.62);sternum.rotation.z=Math.PI;
 attach(cuirass,new THREE.OctahedronGeometry(.16),vein,0,.25,.7).rotation.y=Math.PI/4;
 // Tall collar wraps the neck but leaves the portrait unobscured.
 for(const side of [-1,1]){
  const collar=attach(torso,new THREE.SphereGeometry(.69,16,12),wine,side*.49,3.76,-.18);
  collar.scale.set(.64,.55,.38);collar.rotation.z=-side*.32;
  const seam=tube(torso,[[side*.92,3.85,-.22],[side*.7,4.14,-.24],[side*.32,4.1,-.32]],.056,edge,16);
  seam.scale.set(1,1,1);
 }
 // Heavy curtain cape with a separate over-shoulder mantle.
 const cape=new THREE.Group();actor.add(cape);cape.position.set(0,3.66,-.32);
 for(const side of [-1,1]){
  const sh=attach(cape,new THREE.SphereGeometry(.8,20,12),wine,side*.7,-.05,-.45);
  sh.scale.set(.95,.37,.7);
  const fall=attach(cape,new THREE.CylinderGeometry(.62,1.28,3.4,18,8,true,side<0?Math.PI*.46:Math.PI*1.08,Math.PI*.46),dark,side*.4,-1.8,-.4);
  fall.rotation.z=side*.07;
  tube(cape,[[side*.36,0,-.74],[side*.67,-1.0,-1],[side*1.12,-3.38,-.85]],.034,edge,22);
 }
 const arms=[armature(actor,-1,{dark,red,metal,edge,skin,vein}),armature(actor,1,{dark,red,metal,edge,skin,vein})];
 // Phase two: exposed ribs and needlelike bone growth originate from beneath the armor.
 const growth=new THREE.Group();actor.add(growth);growth.visible=false;
 for(const side of [-1,1]){
  for(let i=0;i<4;i++){
   const y=2.3+i*.32,spread=.45+i*.12;
   tube(growth,[[side*.1,y,.61],[side*spread,y+.14,.67],[side*(spread+.17),y+.25,.22]],.075-i*.008,i%2===0?bone:vein,14);
  }
  for(let i=0;i<4;i++){
   const h=attach(growth,new THREE.ConeGeometry(.12-i*.012,.85+i*.24,8),i%2?vein:bone,side*(.77+i*.16),3.45+i*.07,-.35);
   h.rotation.z=-side*(.8+i*.1);
  }
  tube(growth,[[side*.15,1.9,.75],[side*.54,2.75,.75],[side*.7,3.48,.37]],.09,vein,24);
 }
 const heart=attach(growth,new THREE.IcosahedronGeometry(.3,1),vein,0,3.12,.76);
 const ring=attach(growth,new THREE.TorusGeometry(.52,.04,6,32),edge,0,3.12,.73);
 // A restrained moving silhouette in phase one; violent structural bloom in phase two.
 let bloom=0,lastOwner=null,lastClock=-Infinity;
 const joints=createSpringBank();
 function update(g,c,dt,cast=0,pose={}){
  const time=g.time||0,t=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  if(lastOwner!==g||time<lastClock){joints.reset();lastOwner=g;}lastClock=time;
  const follow=(key,goal,frequency=15)=>joints.step(key,goal,t,frequency);
  const target=c.veins||0;bloom+=(target-bloom)*(1-Math.exp(-t*5));
  const sway=reduced?0:Math.sin(time*1.5)*.023;
  // When the boots trade support, the hips lead and the armored chest
  // counter-rotates. The face and all damage volumes remain authoritative.
  const feet=pose.walk?.feet||[],walkWeight=pose.walk?.moving?1:0;
  const balance=Math.max(-.055,Math.min(.055,((feet[0]||0)-(feet[1]||0))*.022*walkWeight));
  const pelvisRoll=follow('pelvis:roll',balance+(pose.body?.roll||0)*.035,11);
  torso.rotation.y=sway*.5+(pose.body?.twist||0)*.24;
  torso.rotation.x=(pose.body?.lean||0)*.16;
  torso.rotation.z=(pose.body?.roll||0)*.15-(pose.anticipation||0)*.023+pelvisRoll;
  cape.rotation.x=follow('cape:x',(reduced?0:Math.sin(time*1.4)*.035)+cast*.06+(pose.cape||0)*.17+(pose.followThrough||0)*.06,8);
  cape.rotation.z=follow('cape:z',(reduced?0:Math.sin(time*.9)*.025)+(pose.body?.roll||0)*.55,9);
  drapes.forEach((p,i)=>{p.rotation.y=follow('drape:y:'+i,(reduced?0:Math.sin(time*1.35+i*.65)*.018)+(pose.body?.twist||0)*.07,10);p.rotation.x=follow('drape:x:'+i,(reduced?0:Math.sin(time*1.7+i*.85)*.014)+(pose.cape||0)*.026*Math.sin(i*1.7),8);});
  cuirass.rotation.x=-cast*.025-(pose.body?.chest||0)*.12;
  cuirass.rotation.z=follow('chest:counter',-pelvisRoll*.68+(pose.body?.twist||0)*.025,13);waist.scale.setScalar(1+Math.sin(time*1.4)*(reduced?0:.012));
  for(const {arm,forearm,hand,fingers,thorn,side}of arms){
   const gesture=pose.arms?.[side<0?0:1];
   const raise=gesture?.raise??cast,open=gesture?.open??cast;
   const stride=pose.walk?.moving?((pose.walk.feet[0]||0)-(pose.walk.feet[1]||0))*.14:0;
   arm.rotation.x=follow('arm:x:'+side,-raise*.88+side*stride+(reduced?0:Math.sin(time*1.2+side)*.018),21);
   arm.rotation.z=follow('arm:z:'+side,side*(.17+open*.32),18);
   arm.rotation.y=follow('arm:y:'+side,(pose.body?.twist||0)*.14-side*pelvisRoll*.10,17);
   forearm.rotation.x=follow('elbow:x:'+side,-(gesture?.elbow||0)*.62-cast*.05,23);
   forearm.rotation.z=follow('elbow:z:'+side,side*(gesture?.open||0)*.08,20);
   hand.rotation.x=follow('wrist:x:'+side,-(gesture?.hand||0)*.34-(gesture?.elbow||0)*.12,18);
   hand.rotation.z=follow('wrist:z:'+side,side*((reduced?0:Math.sin(time*1.6+side)*.03)+(gesture?.hand||0)*.12),16);
   // Finger joints contract as energy gathers, uncurl at the impact and relax
   // after the wrist. No new geometry or IK allocation is needed per frame.
   const grip=Math.max(0,Math.min(1,(pose.anticipation||0)*.73+(pose.release||0)*.14-(pose.followThrough||0)*.24));
   fingers.forEach((finger,i)=>{finger.rotation.x=-grip*(.38+i*.055);finger.rotation.z=side*(pose.release||0)*.07*(i-1.5);});
   thorn.visible=bloom>.01;thorn.scale.y=Math.max(.001,bloom);
  }
  growth.visible=bloom>.004;growth.scale.set(1,Math.max(.001,bloom),1);
  heart.rotation.y=reduced?0:time*.4;heart.scale.setScalar(1+bloom*(reduced?0:Math.sin(time*3)*.09));
  ring.rotation.z=reduced?0:time*.28;
  vein.emissiveIntensity=.3+bloom*.9;
 }
 return {update,arms,drapes,growth,legs:legRig.legs,plantFeet:legRig.update,resetPose(){joints.reset();lastOwner=null;lastClock=-Infinity;},dispose(){joints.reset();}};
}
