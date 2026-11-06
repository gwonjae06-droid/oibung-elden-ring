import * as THREE from 'three';
import {createGyuwonMotionDirector} from './gyuwon-motion.mjs';

// Scalable anatomical sculpture: silhouettes are authored with curved profiles,
// rather than stacking primitive eight-sided cylinders on top of each other.
// The mobile tier retains the same anatomy with a smaller vertex budget.
export function createGyuwonActor(stage,{coarse=false}={}){
 const detail=coarse?28:64,minor=coarse?16:32;
 const root=new THREE.Group();root.name='gyuwon-student';stage.add(root);
 const cloth=new THREE.MeshPhysicalMaterial({color:0xc5ced5,roughness:.91,sheen:0.3,sheenRoughness:.86});
 const pants=new THREE.MeshStandardMaterial({color:0x232b3d,roughness:.88});
 const skin=new THREE.MeshPhysicalMaterial({color:0xc6a68e,roughness:.76,clearcoat:.035});
 const hair=new THREE.MeshStandardMaterial({color:0x191b23,roughness:.94});
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
 const legs=[],feet=[];
 for(const side of [-1,1]){
  const hip=new THREE.Group();hip.position.set(side*.31,1.28,0);root.add(hip);legs.push(hip);
  const leg=mesh(hip,lathe([[.08,-.82],[.16,-.78],[.20,-.57],[.23,-.27],[.22,-.11],[.26,.02],[.23,.11],[.08,.12]]),pants,0,0,0,'gyuwon-tailored-leg');
  leg.scale.z=.92;
  mesh(hip,curve([[side*.09,-.08,.17],[side*.09,-.34,.17],[side*.09,-.65,.13]],.008),thread,0,0,0,'gyuwon-trouser-seam');
  const shoe=mesh(root,new THREE.SphereGeometry(.25,detail,coarse?16:28),leather,side*.32,.15,.15,'gyuwon-leather-shoe');
  shoe.scale.set(1.12,.51,1.62);feet.push(shoe);
  const sole=mesh(shoe,new THREE.BoxGeometry(.46,.09,.76),ink,0,-.27,0,'gyuwon-shoe-sole');
  sole.castShadow=false;
 }
 const bodyMaterials=[cloth,pants,skin,hair],originalColors=bodyMaterials.map(m=>m.color.clone()),goldColor=new THREE.Color(0xffd56d);
 const arms=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.64,2.58,0);root.add(arm);arms.push(arm);
  const sleeve=mesh(arm,lathe([[.08,-1.09],[.16,-1.03],[.19,-.80],[.23,-.50],[.20,-.23],[.27,.03],[.23,.14],[0,.17]],minor),cloth,side*.035,-.10,0,'gyuwon-sculpted-sleeve');
  sleeve.scale.z=.91;
  mesh(arm,lathe([[.14,-.05],[.18,.0],[.16,.10],[.13,.14]],minor),shirt,side*.035,-1.14,0,'gyuwon-cuff');
  const palm=mesh(arm,new THREE.SphereGeometry(.17,minor,coarse?10:18),skin,side*.035,-1.22,0,'gyuwon-palm');
  palm.scale.set(.85,1.13,.52);
  for(let i=0;i<4;i++){
   const x=side*.035+(i-1.5)*.066;
   mesh(arm,curve([[x,-1.31,0],[x+(i-1.5)*.008,-1.41,-.009],[x+(i-1.5)*.013,-1.48,-.015]],.024),skin,0,0,0,'gyuwon-articulated-finger');
  }
  mesh(arm,curve([[side*.035+side*.11,-1.20,.02],[side*.035+side*.16,-1.28,.08],[side*.035+side*.12,-1.34,.12]],.03),skin,0,0,0,'gyuwon-thumb');
 }
 const head=new THREE.Group();head.name='gyuwon-head';head.position.y=3.15;root.add(head);
 const face=mesh(head,new THREE.SphereGeometry(.5,detail,coarse?26:48),skin,0,0,0,'gyuwon-anatomical-face');
 face.scale.set(.88,1.14,.91);
 const jaw=mesh(head,new THREE.SphereGeometry(.29,minor,coarse?12:24),skin,0,-.30,.13,'gyuwon-jaw');
 jaw.scale.set(1,.57,1.15);
 for(const side of [-1,1]){
  const ear=mesh(head,new THREE.SphereGeometry(.135,minor,coarse?12:24),skin,side*.44,-.025,-.02,'gyuwon-sculpted-ear');
  ear.scale.set(.5,1.15,.72);
  const cheek=mesh(head,new THREE.SphereGeometry(.165,minor,coarse?10:20),skin,side*.22,-.13,.30,'gyuwon-cheekbone');
  cheek.scale.set(1,.64,.53);
  const socket=mesh(head,new THREE.SphereGeometry(.075,minor,12),ink,side*.18,.055,.423,'gyuwon-eye-socket');
  socket.scale.set(1.12,.65,.23);
  mesh(head,new THREE.SphereGeometry(.031,minor,12),leather,side*.18,.058,.445,'gyuwon-eye');
  mesh(head,curve([[side*.095,.162,.429],[side*.18,.19,.431],[side*.26,.157,.416]],.022),hair,0,0,0,'gyuwon-brow');
 }
 const nose=mesh(head,lathe([[.025,-.10],[.060,-.07],[.075,.08],[.048,.20],[.022,.23]],minor),skin,0,-.13,.46,'gyuwon-nose');
 nose.rotation.x=Math.PI/2;
 mesh(head,curve([[-.095,-.26,.432],[0,-.285,.458],[.095,-.26,.432]],.012),ink,0,0,0,'gyuwon-mouth');
 const cap=mesh(head,new THREE.SphereGeometry(.513,detail,coarse?15:30,0,Math.PI*2,0,Math.PI*.58),hair,0,.11,-.02,'gyuwon-layered-hair');
 cap.scale.set(.90,1.02,.94);
 for(let i=0;i<(coarse?6:13);i++){
  const a=(i/Math.max(1,(coarse?6:13)-1)-.5)*2.25;
  mesh(head,curve([[Math.sin(a)*.34,.43,Math.cos(a)*.31],[Math.sin(a)*.41,.29,Math.cos(a)*.35],[Math.sin(a)*.39,.20,Math.cos(a)*.40]],.025),hair,0,0,0,'gyuwon-hair-strand');
 }
 const book=new THREE.Group();arms[0].add(book);book.position.set(-.1,-1,.35);book.rotation.x=-.6;
 mesh(book,new THREE.BoxGeometry(.76,.135,.96),leather,0,0,0,'gyuwon-book-cover');
 mesh(book,new THREE.BoxGeometry(.68,.095,.89),paper,0,.08,0,'gyuwon-book-pages');
 for(let i=0;i<6;i++)mesh(book,new THREE.BoxGeometry(.7,.004,.89),ink,0,.031+i*.009,0,'gyuwon-page-edge');
 const halo=mesh(root,new THREE.TorusGeometry(.73,.025,coarse?6:12,coarse?48:112),new THREE.MeshStandardMaterial({color:0xffd56d,emissive:0xc18d35,emissiveIntensity:.6,metalness:.7,roughness:.27}),0,3.45,0,'gyuwon-final-halo');
 const pages=[],pageGeo=new THREE.PlaneGeometry(.45,.65,coarse?3:8,coarse?4:10);
 const uv=pageGeo.attributes.position;
 for(let i=0;i<uv.count;i++)uv.setZ(i,Math.sin(uv.getX(i)*7)*.038+Math.cos(uv.getY(i)*5)*.02);
 pageGeo.computeVertexNormals();
 for(let i=0;i<6;i++)pages.push(mesh(root,pageGeo,new THREE.MeshStandardMaterial({color:0xd4bd83,side:THREE.DoubleSide,transparent:true,opacity:.8,roughness:.86}),0,0,0,'gyuwon-floating-page'));
 const motion=createGyuwonMotionDirector();
 return {root,update(g,death=0,dt=0){
  const s=g.gyuwon,b=g.boss,p=motion.update(g,dt),t=Number.isFinite(g.time)?g.time:0;
  bodyMaterials.forEach((m,i)=>m.color.copy(originalColors[i]).lerp(goldColor,g.status==='won'?Math.min(1,death/2):0));
  const transition=b.state==='transition';
  root.position.set(b.x,g.status==='won'?death*death*1.5:0,b.z);
  root.rotation.y=p.facing;
  root.scale.setScalar(g.status==='won'?Math.max(.03,1-death/9):1);
  torso.rotation.set(p.lean*.42,p.twist*.28,p.twist*.16);
  torso.position.y=1.95-p.steps*.035;
  head.rotation.set(p.headPitch,p.headYaw,Math.sin(t*2)*.02);
  // Phase transformation retains the previous head pose until the story beat completes.
  const visibleHead=b.phase===1?1:transition?Math.max(.001,1-(s.t||0)/3):.001;
  head.scale.setScalar(visibleHead);head.visible=visibleHead>.01;
  halo.visible=b.phase>1;halo.rotation.z=t*.3;
  arms[0].rotation.x=p.leftArm;arms[0].rotation.z=p.twist*.12;
  arms[1].rotation.x=p.rightArm;arms[1].rotation.z=-p.twist*.18;book.rotation.x=p.book;
  for(let i=0;i<legs.length;i++){
   const phase=t*8+(i?Math.PI:0),swing=Math.sin(phase)*p.steps;
   legs[i].rotation.x=swing*.12;
   feet[i].position.z=.15+swing*.12;
   feet[i].position.y=.15+Math.max(0,swing)*.035;
  }
  for(let i=0;i<pages.length;i++){const item=pages[i],a=t*.6+i*Math.PI/3;
   item.visible=b.phase>1;item.position.set(Math.sin(a)*1.6,2+Math.sin(a*2)*.4,Math.cos(a)*1.6);
   item.rotation.set(.3+Math.sin(t+i)*.08,a,.2);
  }
 }};
}
