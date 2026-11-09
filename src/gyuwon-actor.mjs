import {gyuwonPhotoGeometry,gyuwonPhotoMaterial} from './gyuwon-photo-face.mjs';
import {arsenalKind} from './gyuwon-arsenal.mjs';
import * as THREE from 'three';
import {gyuwonLyricActorMotion} from './gyuwon-lyric-actor-motion.mjs';
import {ridePose,rideFrame,gyuwonWeaponPose} from './gyuwon-year-choreography.mjs';
import {createGyuwonHandIk} from './gyuwon-hand-ik.mjs';
import {createGyuwonMotionDirector} from './gyuwon-motion.mjs';
import {createGyuwonYearRig} from './gyuwon-year-rig.mjs';

// Scalable anatomical sculpture: silhouettes are authored with curved profiles,
// rather than stacking primitive eight-sided cylinders on top of each other.
// The mobile tier retains the same anatomy with a smaller vertex budget.
export function createGyuwonActor(stage,{coarse=false}={}){
 const detail=coarse?28:64,minor=coarse?16:32;
 const root=new THREE.Group();root.name='gyuwon-student';stage.add(root);
 const cloth=new THREE.MeshPhysicalMaterial({color:0xc5ced5,roughness:.91,sheen:0.3,sheenRoughness:.86});
 const pants=new THREE.MeshStandardMaterial({color:0x232b3d,roughness:.88});
 const skin=new THREE.MeshPhysicalMaterial({color:0xc6a68e,roughness:.76,clearcoat:.035});
 const {texture:photo,material:faceSkin}=gyuwonPhotoMaterial();

 const shirt=new THREE.MeshStandardMaterial({color:0xdce0dd,roughness:.95});
 const leather=new THREE.MeshStandardMaterial({color:0x151923,roughness:.63});
 const thread=new THREE.MeshStandardMaterial({color:0x83909b,roughness:1});
 const ink=new THREE.MeshStandardMaterial({color:0x353842,roughness:.9});
 const paper=new THREE.MeshStandardMaterial({color:0xd7d0b7,roughness:.94});
 const mesh=(parent,geo,material,x=0,y=0,z=0,name='')=>{
  const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);
  m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
 };
 const lathe=(profile,n=detail)=>new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),n);
 const curve=(points,r=.015)=>new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),coarse?10:24,r,coarse?5:8,false);
 const shape=(pts,depth=.035)=>{
  const s=new THREE.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:coarse?1:3,steps:1});
 };
 const torso=mesh(root,lathe([[.36,-.78],[.51,-.7],[.54,-.38],[.49,-.13],[.58,.13],[.68,.49],[.57,.75],[.24,.83],[0,.84]]),cloth,0,1.95,0,'gyuwon-tailored-torso');
 torso.scale.z=.81;
 const collar=mesh(torso,lathe([[.17,0],[.23,.04],[.27,.14],[.23,.20],[.17,.23]],minor),shirt,0,.66,0,'gyuwon-shirt-collar');
 const tie=mesh(torso,shape([[-.045,.46],[.045,.46],[.075,.12],[0,.01],[-.075,.12]]),ink,0,0,.50,'gyuwon-tie');
 for(const side of [-1,1]){
  const lapel=mesh(torso,shape([[side*.23,.69],[side*.48,.55],[side*.27,.16],[side*.07,.34]]),side<0?cloth:shirt,0,0,.45,'gyuwon-tailored-lapel');
  lapel.rotation.y=side*.08;
  for(let i=0;i<3;i++){
   const seam=mesh(torso,curve([[side*(.40+i*.02),-.57,.34],[side*(.43+i*.012),-.16,.37],[side*(.50+i*.01),.29,.27]],.006),thread,0,0,0,'gyuwon-jacket-seam');
   seam.visible=!coarse||i===0;
  }
 }
 for(const y of [-.18,-.35,-.52])
  mesh(torso,new THREE.SphereGeometry(.028,minor,coarse?10:16),ink,.10,y,.46,'gyuwon-jacket-button');
 // A genuinely connected two-bone leg rig. Every knee and shin spans
 // its current hip/ankle positions; shoes are always planted on y=0 ground.
 const legs=[],feet=[],boneAxis=new THREE.Vector3(0,1,0),
  boneDirection=new THREE.Vector3(),boneMidpoint=new THREE.Vector3();
 const setBone=(bone,from,to)=>{
  boneDirection.subVectors(to,from);
  const length=boneDirection.length();
  bone.position.copy(boneMidpoint.copy(from).addScaledVector(boneDirection,.5));
  bone.quaternion.setFromUnitVectors(boneAxis,boneDirection.normalize());
  bone.scale.y=Math.max(.02,length);
 };
 const thighProfile=lathe([[.18,-.5],[.21,-.39],[.235,-.13],[.26,.17],[.29,.43],[.22,.5]],minor);
 const shinProfile=lathe([[.135,-.5],[.15,-.4],[.17,-.2],[.19,.15],[.21,.42],[.18,.5]],minor);
 const kneeGeo=new THREE.SphereGeometry(.205,minor,coarse?12:24);
 for(const side of [-1,1]){
  const hip=new THREE.Vector3(side*.31,1.27,0),
    knee=new THREE.Vector3(side*.31,.72,.08),
    ankle=new THREE.Vector3(side*.32,.17,.10);
  const thigh=mesh(root,thighProfile,pants,0,0,0,'gyuwon-tailored-leg');
  const shin=mesh(root,shinProfile,pants,0,0,0,'gyuwon-rigged-shin');
  const joint=mesh(root,kneeGeo,pants,side*.31,.72,.08,'gyuwon-rigged-knee');
  const shoe=mesh(root,new THREE.SphereGeometry(.25,detail,coarse?16:28),
   leather,side*.32,.15,.15,'gyuwon-leather-shoe');
  shoe.scale.set(1.12,.51,1.62);
  const sole=mesh(shoe,new THREE.BoxGeometry(.46,.09,.76),ink,0,-.27,0,'gyuwon-shoe-sole');
  sole.castShadow=false;
  legs.push({side,hip,knee,ankle,thigh,shin,joint,shoe});
  feet.push(shoe);
  setBone(thigh,knee,hip);setBone(shin,ankle,knee);
 }
 const bodyMaterials=[cloth,pants,skin],originalColors=bodyMaterials.map(m=>m.color.clone()),goldColor=new THREE.Color(0xffd56d);
 // Shoulder -> upper sleeve -> elbow -> forearm -> wrist -> fingers.
 // Parenting upper body joints to the leaning chest prevents arm gaps.
 const arms=[],forearms=[],wrists=[],fingerChains=[];
 const neck=mesh(torso,new THREE.CylinderGeometry(.15,.195,.51,minor),skin,0,.89,0,'gyuwon-rigged-neck');
 const shoulderGeometry=new THREE.SphereGeometry(.28,minor,coarse?10:20);
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.name=side<0?'gyuwon-left-shoulder-rig':'gyuwon-right-shoulder-rig';
  arm.position.set(side*.64,.63,0);torso.add(arm);arms.push(arm);
  mesh(arm,shoulderGeometry,cloth,0,0,0,'gyuwon-rigged-shoulder');
  const sleeve=mesh(arm,lathe([[.17,-.65],[.22,-.58],[.20,-.40],[.245,-.16],[.27,.04],[.24,.13]],minor),
   cloth,side*.025,-.01,0,'gyuwon-sculpted-sleeve');
  sleeve.scale.z=.91;
  const elbow=new THREE.Group();elbow.name='gyuwon-elbow-pivot';elbow.position.set(side*.03,-.67,0);
  arm.add(elbow);forearms.push(elbow);
  mesh(elbow,new THREE.SphereGeometry(.185,minor,coarse?10:20),cloth,0,0,0,'gyuwon-sculpted-elbow');
  mesh(elbow,lathe([[.14,-.57],[.175,-.51],[.195,-.30],[.21,-.13],[.18,.065]],minor),
   cloth,0,-.01,0,'gyuwon-rigged-forearm');
  mesh(elbow,lathe([[.14,-.045],[.185,0],[.16,.10],[.135,.13]],minor),
   shirt,0,-.56,0,'gyuwon-cuff');
  const wrist=new THREE.Group();wrist.name='gyuwon-wrist-pivot';
  wrist.position.set(0,-.62,0);elbow.add(wrist);wrists.push(wrist);
  const palm=mesh(wrist,new THREE.SphereGeometry(.17,minor,coarse?10:18),skin,0,0,0,'gyuwon-palm');
  palm.scale.set(.85,1.13,.56);
  function articulatedDigit(x,y,z,lengths,index,thumb=false){
   const digit=new THREE.Group();digit.position.set(x,y,z);
   digit.rotation.z=thumb?side*.44:(index-1.5)*.08;
   wrist.add(digit);
   let parent=digit;
   const joints=[];
   for(let j=0;j<lengths.length;j++){
    const joint=new THREE.Group();
    if(j>0)joint.position.y=-lengths[j-1];
    parent.add(joint);joints.push(joint);
    const length=lengths[j],radius=(thumb?.031:.022)*(1-j*.13);
    mesh(joint,new THREE.CapsuleGeometry(radius,Math.max(.006,length-2*radius),
      coarse?3:6,coarse?8:14),skin,0,-length/2,0,
      thumb?'gyuwon-rigged-thumb':'gyuwon-articulated-finger');
    parent=joint;
   }
   fingerChains.push({joints,side,index,thumb});
  }
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.066;
   articulatedDigit(x,-.09,-.01,[.071,.067,.049],i);
  }
  articulatedDigit(side*.14,.02,.04,[.095,.073],4,true);
 }
 const head=new THREE.Group();head.name='gyuwon-head';head.position.y=1.20;torso.add(head);
 // Every retake and every clone uses the same plain spherical photo head.
 const faceGeo=gyuwonPhotoGeometry(.5,{coarse});
 mesh(head,faceGeo,faceSkin,0,0,0,'gyuwon-anatomical-face');
 const book=new THREE.Group();wrists[0].add(book);book.position.set(-.1,-.02,.35);book.rotation.x=-.6;
 mesh(book,new THREE.BoxGeometry(.76,.135,.96),leather,0,0,0,'gyuwon-book-cover');
 mesh(book,new THREE.BoxGeometry(.68,.095,.89),paper,0,.08,0,'gyuwon-book-pages');
 for(let i=0;i<6;i++)mesh(book,new THREE.BoxGeometry(.7,.004,.89),ink,0,.031+i*.009,0,'gyuwon-page-edge');
 // The same photographed likeness returns as a suspended godlike 3D visage.
 const divineFace=new THREE.Group();divineFace.name='gyuwon-divine-portrait';root.add(divineFace);
 const godSkin=faceSkin;
 const god=mesh(divineFace,gyuwonPhotoGeometry(.92,{coarse}),
  godSkin,0,0,0,'gyuwon-god-face');god.scale.setScalar(1);
 mesh(divineFace,new THREE.TorusGeometry(1.28,.044,8,coarse?32:72),
  new THREE.MeshStandardMaterial({color:0xf0d3a7,metalness:.69,roughness:.29,emissive:0x896344,emissiveIntensity:.43}),
  0,0,-.25,'gyuwon-portrait-mandorla');
 const halo=mesh(root,new THREE.TorusGeometry(.73,.025,coarse?6:12,coarse?48:112),new THREE.MeshStandardMaterial({color:0xffd56d,emissive:0xc18d35,emissiveIntensity:.6,metalness:.7,roughness:.27}),0,3.45,0,'gyuwon-final-halo');
 const pages=[],pageGeo=new THREE.PlaneGeometry(.45,.65,coarse?3:8,coarse?4:10);
 const uv=pageGeo.attributes.position;
 for(let i=0;i<uv.count;i++)uv.setZ(i,Math.sin(uv.getX(i)*7)*.038+Math.cos(uv.getY(i)*5)*.02);
 pageGeo.computeVertexNormals();
 for(let i=0;i<6;i++)pages.push(mesh(root,pageGeo,new THREE.MeshStandardMaterial({color:0xd4bd83,side:THREE.DoubleSide,transparent:true,opacity:.8,roughness:.86}),0,0,0,'gyuwon-floating-page'));
 const yearRig=createGyuwonYearRig({torso,head,wrists,coarse});
 const handIk=createGyuwonHandIk({arms,forearms,wrists,torso});
 let rideBlend=0;
 const motion=createGyuwonMotionDirector();
 return {root,update(g,death=0,dt=0){
  const s=g.gyuwon,b=g.boss,p=motion.update(g,dt),t=s.years?.musical?.time??(Number.isFinite(g.time)?g.time:0);
  const years=s.years,weapon=gyuwonWeaponPose(years,s.hazards);
  const lyricMotion=(years?.year===11||years?.musical?.finishing)
   ?gyuwonLyricActorMotion(years?.musical?.lyricAction,t):null;
  const mounted=ridePose(years);
  const mountTarget=mounted?1:0;
  rideBlend+=(mountTarget-rideBlend)*(1-Math.exp(-Math.min(.05,Math.max(0,dt))*10));
  bodyMaterials.forEach((m,i)=>m.color.copy(originalColors[i]).lerp(goldColor,g.status==='won'?Math.min(1,death/2):0));
  if(years){
   const tone=yearRig.tint;
   if(tone){cloth.color.copy(originalColors[0]).lerp(tone,.88);
    pants.color.copy(originalColors[1]).lerp(tone,.20);}
  }
  const transition=b.state==='transition';
  const rider=mounted?rideFrame(mounted):null;
  root.position.set(rider?.x??b.x,g.status==='won'?death*death*1.5:rider?.y||0,rider?.z??b.z);
  root.rotation.set(rider?.pitch||0,p.facing,rider?.bank||0,'YXZ');
  if(years?.musical?.finishing)root.position.y-=.72*Math.min(1,years.musical.curtain/8);
  const roll=s.years?.dodge;
  if(roll)root.rotation.z=Math.sin(Math.PI*Math.min(1,roll.t/.72))*Math.sign(roll.toX-roll.fromX)*2.7;
  root.scale.setScalar(g.status==='won'?Math.max(.03,1-death/9):1);
  torso.rotation.set(weapon.rifle?0:mounted?.28:p.lean*.42,weapon.rifle?0:p.twist*.28,weapon.rifle?0:p.twist*.10+(p.weightShift||0)*.035);
  if(lyricMotion){torso.rotation.x+=lyricMotion.torsoX;torso.rotation.y+=lyricMotion.torsoY;
   torso.rotation.z+=lyricMotion.torsoZ;root.rotation.y+=lyricMotion.twist;}
  const breath=weapon.rifle?0:Math.sin(t*1.9)*.007;
  torso.position.y=(years?.mode==='exam'?1.54:1.95+rideBlend*.36)-p.steps*.035+breath+(lyricMotion?.lift||0);
  head.rotation.set(p.headPitch+(lyricMotion?.headX||0),p.headYaw+(lyricMotion?.headY||0),Math.sin(t*2)*.012);
  neck.rotation.z=(p.weightShift||0)*.018;
  // Year nine memories must never trigger the legacy headless final phase.
  // The same human student remains fully visible through every retake.
  const visibleHead=years?1:b.phase===1?1:transition?Math.max(.001,1-(s.t||0)/3):.001;
  head.scale.setScalar(visibleHead);head.visible=visibleHead>.01;
  neck.visible=visibleHead>.01;neck.scale.y=Math.max(.001,visibleHead);
  halo.visible=!years&&b.phase>1;halo.rotation.z=t*.3;
  divineFace.visible=!years&&b.phase===3&&g.status==='playing';
  divineFace.position.set(0,6.9+Math.sin(t*.75)*.28,-2.25);
  divineFace.rotation.y=Math.sin(t*.22)*.14;
  divineFace.scale.setScalar(.78+.05*Math.sin(t*.8));
  arms[0].rotation.set(p.leftArm,0,p.twist*.12);
  arms[1].rotation.set(p.rightArm,0,-p.twist*.18);
  if(lyricMotion){arms[0].rotation.x+=lyricMotion.leftArm;arms[1].rotation.x+=lyricMotion.rightArm;}
  forearms[0].rotation.set(p.leftElbow??-.1,0,0);
  forearms[1].rotation.set(p.rightElbow??-.1,0,0);
  if(lyricMotion){forearms[0].rotation.x+=lyricMotion.leftElbow;forearms[1].rotation.x+=lyricMotion.rightElbow;}
  wrists[0].rotation.set(p.leftWrist??0,0,0);
  wrists[1].rotation.set(p.rightWrist??0,0,0);
  if(years)handIk.update(years,weapon,mounted);
  yearRig.update(g);
  book.rotation.x=p.book;
  book.visible=!years||years.mode==='combat'&&[2,3].includes(years.year);
   // Joint curls follow the same attack movement and relax after each cast.
   const effort=b.state==='pattern'?
    Math.min(1,(Math.abs(p.leftArm+.5)+Math.abs(p.rightArm))*.40):0;
   for(const finger of fingerChains){
    const amount=finger.thumb?effort*.72:effort*(.9+finger.index*.045);
    const [proximal,middle,tip]=finger.joints;
    proximal.rotation.x=.06+amount*.42;
    middle.rotation.x=.11+amount*.65;
    if(tip)tip.rotation.x=.08+amount*.40;
   }
  for(const leg of legs){
   const phase=t*7.2+(leg.side<0?0:Math.PI),
    swing=Math.sin(phase)*(p.steps+(lyricMotion?.step||0)),
    lift=Math.max(0,swing)*.18;
   // Knees always join the current thigh and calf. The shoe never sinks
   // below the table and returns to the same planted rest coordinates.
   leg.hip.set(leg.side*.31,s.years?.mode==='exam'?1.02:1.27+(p.weightShift||0)*leg.side*.025,0);
   leg.hip.y+=rideBlend*.34;
   leg.ankle.set(leg.side*.32,.17+(years?.mode==='exam'?0:lift),years?.mode==='exam'?1.2:.10+swing*.19);
   const vehicleIsBike=mounted?.ride==='bike',onDeck=leg.side<0;
   const mountFootY=vehicleIsBike?.77:onDeck?.53:.21;
   const mountFootZ=vehicleIsBike?-.54:onDeck?-.35:.51;
   leg.ankle.y+=(mountFootY-leg.ankle.y)*rideBlend;
   leg.ankle.z+=(mountFootZ-leg.ankle.z)*rideBlend;
   leg.ankle.x+=(leg.side*.58-leg.ankle.x)*rideBlend;
   leg.knee.set(leg.side*.315,years?.mode==='exam'?.85:.72+lift*.36,
    years?.mode==='exam'?.67:.055+swing*.10+Math.abs(swing)*.14);
   leg.knee.x+=(leg.side*.63-leg.knee.x)*rideBlend;
   leg.knee.y+=(1.12-leg.knee.y)*rideBlend;
   leg.knee.z+=(.68-leg.knee.z)*rideBlend;
   if(years?.year===7&&!arsenalKind(years.year)&&years.cast&&!mounted){
    const step=Math.sin((years.castT-1.2)*Math.PI*2/.67+(leg.side<0?0:Math.PI));
    const lift=Math.max(0,step)*.26;
    leg.ankle.y+=lift;leg.ankle.z+=Math.max(0,step)*.20;leg.knee.y+=lift*.4;
    leg.hip.y-=Math.abs(p.weightShift||0)*.07;
   }
   setBone(leg.thigh,leg.knee,leg.hip);
   setBone(leg.shin,leg.ankle,leg.knee);
   leg.joint.position.copy(leg.knee);
   leg.shoe.position.set(leg.ankle.x,years?.mode==='exam'?.15:leg.ankle.y,leg.ankle.z+.07);
   leg.shoe.rotation.x=swing*.06;
  }
  for(let i=0;i<pages.length;i++){const item=pages[i],a=t*.6+i*Math.PI/3;
   item.visible=!years&&b.phase>1;item.position.set(Math.sin(a)*1.6,2+Math.sin(a*2)*.4,Math.cos(a)*1.6);
   item.rotation.set(.3+Math.sin(t+i)*.08,a,.2);
  }
 },dispose(){yearRig.dispose();photo?.dispose();faceSkin.dispose();}};
}

