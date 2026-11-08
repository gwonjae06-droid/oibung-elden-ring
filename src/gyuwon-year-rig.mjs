import * as THREE from 'three';
import {createGyuwonYearWeaponProps} from './gyuwon-year-weapon-props.mjs';

// The legacy humanoid's existing anatomical joint hierarchy is reused.
// All additions follow head/chest joints rather than drawing screen-space masks.
// A bounded per-year detail tier protects mobile GPU budgets.
export function createGyuwonYearRig({torso,head,wrists,coarse=false}={}){
 const handProps=createGyuwonYearWeaponProps({wrists,coarse});
 const mats=[],geos=[],perYear=new Map();
 const material=(color,options={})=>{
  const m=new THREE.MeshPhysicalMaterial({color,roughness:.66,...options});mats.push(m);return m;
 };
 const metal=material(0x48515a,{metalness:.71,roughness:.31});
 const leather=material(0x594737,{roughness:.82});
 const ember=material(0x9a5239,{emissive:0x61210a,emissiveIntensity:.28});
 const purple=material(0x9880b7,{metalness:.16,roughness:.21,clearcoat:.86});
 const olive=material(0x464d42,{roughness:.30,clearcoat:.55});
 const gild=material(0xbba478,{metalness:.72,roughness:.31});
 const skin=material(0xb5907b,{roughness:.75});
 const dark=material(0x24232b,{roughness:.85});
 const curve=(pts,r=.018)=>{
  const path=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const g=new THREE.TubeGeometry(path,coarse?7:17,r,coarse?5:8,false);geos.push(g);return g;
 };
 const box=(x,y,z)=>{const g=new THREE.BoxGeometry(x,y,z);geos.push(g);return g;};
 const sphere=(r,sections=24)=>{
  const g=new THREE.SphereGeometry(r,coarse?12:sections,coarse?8:16);geos.push(g);return g;
 };
 const torus=(r,t=.05)=>{
  const g=new THREE.TorusGeometry(r,t,coarse?6:9,coarse?18:34);geos.push(g);return g;
 };
 function add(parent,geo,mat,x=0,y=0,z=0,name=''){
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.name=name;
  m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
 }
 function yearGroup(n,parent=torso){
  const g=new THREE.Group();g.name='gyuwon-year-'+n+'-rig-gear';
  parent.add(g);if(!perYear.has(n))perYear.set(n,[]);perYear.get(n).push(g);return g;
 }
 // Detailed facial articulation: lids, brows, under-eye stress and moving jaw
 // without obscuring the provided photographic portrait.
 const face=new THREE.Group();face.name='gyuwon-expression-bones';head.add(face);
 const eyelids=[],brows=[],eyes=[],circles=[];
 for(const side of [-1,1]){
  const lid=add(face,sphere(.084,24),skin,side*.18,.105,.444,'gyuwon-lid-bone');
  lid.scale.set(1.12,.12,.22);eyelids.push(lid);
  const brow=add(face,curve([[side*.09,.168,.443],[side*.17,.203,.444],
   [side*.275,.156,.416]],.016),dark,0,0,0,'gyuwon-expression-brow');
  brows.push({mesh:brow,side});
  const iris=add(face,sphere(.029,20),dark,side*.18,.06,.469,'gyuwon-eye-aim');
  eyes.push({mesh:iris,side});
  const circle=add(face,curve([[side*.08,-.080,.435],
   [side*.16,-.098,.448],[side*.27,-.078,.412]],.008),skin,0,0,0,'gyuwon-exhaustion-crease');
  circles.push(circle);
 }
 const mouth=add(face,curve([[-.09,-.270,.459],[0,-.286,.476],[.09,-.27,.459]],.012),
  dark,0,0,0,'gyuwon-expressive-lip');
 // One extra crease sheet follows the existing cheek topology; very thin relief.
 const jaw=add(face,sphere(.25,coarse?12:24),skin,0,-.31,.23,'gyuwon-articulated-jaw-overlay');
 jaw.scale.set(1,.50,.74);
 const helmet=yearGroup(1,head);
 const helmetShape=new THREE.SphereGeometry(.547,coarse?22:42,coarse?13:28,0,Math.PI*2,0,Math.PI*.53);
 geos.push(helmetShape);
 const shell=add(helmet,helmetShape,metal,0,.16,-.04,'gyuwon-bike-sculpted-helmet');
 shell.scale.set(1.05,1.14,1.03);
 add(helmet,torus(.50,.034),gild,0,.08,.055,'gyuwon-helmet-rim').rotation.z=Math.PI;
 const bag=yearGroup(2);
 add(bag,curve([[-.53,.66,.25],[-.27,.27,.48],[.20,-.21,.50],[.50,-.66,.30]],.075),
  leather,0,0,0,'gyuwon-exam-workbook-sling');
 add(bag,box(.73,.64,.32),metal,.55,-.29,-.48,'gyuwon-zippered-study-bag');
 const exhausted=yearGroup(3);
 for(let i=0;i<6;i++){
  add(exhausted,curve([[-.47+i*.16,-.68,.32],[-.45+i*.16,-.12,.47],
   [-.42+i*.15,.44,.30]],.013),ember,0,0,0,'gyuwon-stress-cracked-fabric');
 }
 const tactical=yearGroup(4);
 for(const side of [-1,1]){
  add(tactical,box(.16,1.17,.15),metal,side*.39,.025,.44,'gyuwon-sniper-shoulder-strap');
  add(tactical,box(.36,.29,.26),leather,side*.48,-.45,.51,'gyuwon-arrow-sleeve');
 }
 const melted=yearGroup(5);
 const strips=[];
 for(let i=0;i<7;i++){
  const drip=add(melted,sphere(.16),olive,-.53+i*.18,-.76,.29+(i%2)*.10,'gyuwon-sludge-drooping-seam');
  drip.scale.set(.85,1.9+(i%3)*.4,.67);strips.push(drip);
 }
 const collector=yearGroup(6);
 const charms=[];
 for(let i=0;i<8;i++){
  const jewel=new THREE.OctahedronGeometry(.13,coarse?0:1);geos.push(jewel);
  const charm=add(collector,jewel,i%2?gild:purple,-.48+i*.14,.41-(i%3)*.27,.52,
   'gyuwon-collector-3d-charm');charms.push(charm);
 }
 const streamer=yearGroup(7,head);
 add(streamer,torus(.52,.075),metal,0,.05,-.035,'gyuwon-broadcast-headband').rotation.z=Math.PI;
 add(streamer,sphere(.19),metal,-.50,-.03,.08,'gyuwon-broadcast-earcup');
 add(streamer,curve([[-.5,.01,.0],[-.57,-.15,.18],[-.33,-.28,.44]],.035),
  gild,0,0,0,'gyuwon-broadcast-mic-boom');
 const cephalopod=yearGroup(8);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  const socket=add(cephalopod,torus(.18,.052),olive,
   Math.sin(a)*.43,-.12+Math.sin(a*2)*.13,-.43,'gyuwon-eight-tentacle-attachment');
  socket.rotation.x=.5;socket.rotation.y=a;
 }
 const memory=yearGroup(9);
 for(let i=0;i<6;i++)add(memory,curve([[Math.sin(i)*.47,-.60,.25],
   [Math.sin(i+1.3)*.40,-.11,.44],[Math.sin(i+2.1)*.38,.41,.31]],.012),
  gild,0,0,0,'gyuwon-memory-scar');
 const nightmare=yearGroup(11);nightmare.name='gyuwon-eleventh-year-accumulated-nightmare';
 add(nightmare,torus(.51,.09),metal,0,-.15,-.65,'gyuwon-nightmare-broken-motorcycle-rim').rotation.y=.6;
 for(let i=0;i<5;i++){const piece=add(nightmare,box(.24,.45,.12),i%2?leather:ember,-.55+i*.27,.45,-.48,'gyuwon-nightmare-embedded-textbook');piece.rotation.z=(i-2)*.17;}
 for(const side of [-1,1]){
  add(nightmare,curve([[side*.3,.4,-.4],[side*.9,.15,-.65],[side*.75,-.7,-.7],[side*1.2,-1.1,-.25]],.085),olive,0,0,0,'gyuwon-nightmare-fused-tentacle');
  add(nightmare,box(.15,.8,.12),metal,side*.62,.32,-.35,'gyuwon-nightmare-broken-rifle-fragment').rotation.z=side*.3;
  add(nightmare,sphere(.13,18),purple,side*.47,-.2,.57,'gyuwon-nightmare-collectible-remnant');
 }
 const yearTints=new Map(Object.entries({
  1:0xc5ced5,2:0xb4b5b2,3:0x7b8189,4:0x667179,5:0x53594f,
  6:0x85739a,7:0x384651,8:0x555a60,9:0x777080
 }).map(([id,color])=>[Number(id),new THREE.Color(color)]));
 let activeYear=0,disposed=false;
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,y=e?.year||0,stage=Math.min(9,y),t=g?.time||0;
  activeYear=stage;
  handProps.update(g);
  for(const [n,groups]of perYear)for(const group of groups)
   group.visible=!!e&&(stage===n||n===9&&stage>=9||n===11&&y>=11);
  helmet.visible=!!e&&stage===1&&['bike','ultimateBike'].includes(e.cast);
  for(const lid of eyelids){
   const blinkPhase=(t*(e?.mode==='exam'?.74:1.08)+y*.31)%3.35;
   const blink=blinkPhase<.15?Math.sin(Math.PI*blinkPhase/.15):0;
   lid.scale.y=.10+.48*blink;lid.position.y=.105-.064*blink;
  }
  for(const {mesh:brow,side}of brows){
   const fatigue=Math.min(1,Math.max(0,(y-1)/7));
   brow.position.y=-(fatigue*.018)+(e?.grade==='failure'?-.045:0);
   brow.rotation.z=side*(fatigue*.13+(e?.grade==='great'?.07:0));
  }
  for(const {mesh:eye,side}of eyes){
   eye.position.set(side*.18+(e?.mode==='exam'?0:Math.sin(t*.59)*.013),
    e?.mode==='exam'?.050:.065,.469);
  }
  const f=Math.max(0,y-2)/8;
  for(const fold of circles){fold.visible=!!e&&y>=2;fold.position.y=-.012*f;}
  jaw.position.y=-.31+(e?.grade==='failure'?-.044:e?.mode==='exam'?Math.sin(t*13)*.006:0);
  mouth.scale.y=e?.grade==='great'?1.22:e?.grade==='failure'?.6:1;
  for(let i=0;i<strips.length;i++)strips[i].rotation.z=.08*Math.sin(t*3.3+i);
  for(let i=0;i<charms.length;i++)charms[i].rotation.y=.22*Math.sin(t*2.4+i);
 }
 function dispose(){if(disposed)return;disposed=true;
  handProps.dispose();
  face.removeFromParent();
  for(const groups of perYear.values())for(const g of groups)g.removeFromParent();
  for(const g of new Set(geos))g.dispose();
  for(const m of new Set(mats))m.dispose();
 }
 return {update,dispose,get activeYear(){return activeYear},get tint(){return yearTints.get(activeYear)||null},stats:()=>({activeYear,faceControls:eyelids.length+brows.length+eyes.length,garments:perYear.size,handProps:handProps.stats()})};
}
