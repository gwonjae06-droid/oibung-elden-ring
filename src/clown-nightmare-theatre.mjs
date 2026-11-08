import * as THREE from 'three';
import {disposeScene} from './runtime/scene-resources.mjs';
// Visual-only horror theatre: ghosts, audience, shadows and masks are never
// registered as combat zones or hurtboxes. True hazards remain the regular
// soft-edged spotlights and physical moving props.
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const TAU=Math.PI*2;
export function createClownNightmareTheatre(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='uncanny-circus-theatre';root.userData.decorativeOnly=true;scene.add(root);
 const phantomMat=new THREE.MeshStandardMaterial({color:0x2a1824,roughness:.96,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const porcelain=new THREE.MeshStandardMaterial({color:0xbab3a7,roughness:.61,transparent:true,opacity:0,emissive:0x150812});
 const socket=new THREE.MeshBasicMaterial({color:0x0c0813,transparent:true,opacity:0,depthWrite:false});
 const eye=new THREE.MeshBasicMaterial({color:0xcf6b68,transparent:true,opacity:0,depthWrite:false});
 const curtainMat=new THREE.MeshStandardMaterial({color:0x591e36,roughness:.91,metalness:.04,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
 const shadowMat=new THREE.MeshBasicMaterial({color:0x0a0713,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const headGeo=new THREE.SphereGeometry(1,12,9),bodyGeo=new THREE.CapsuleGeometry(.59,2.4,4,8),
  maskGeo=new THREE.SphereGeometry(.9,12,10),orbGeo=new THREE.SphereGeometry(.17,8,6);
 function mesh(parent,geo,mat,name,x=0,y=0,z=0){
  const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o;
 }
 const ghosts=[],ghostCount=coarse?3:4;
 for(let i=0;i<ghostCount;i++){
  const g=new THREE.Group();g.name='false-clown-stage-double';root.add(g);
  mesh(g,bodyGeo,phantomMat,'not-an-attack-hurtbox',0,2.35,0).scale.set(1.0,1.1,.65);
  mesh(g,headGeo,porcelain,'false-grinning-face',0,4.75,.18).scale.set(.83,1.1,.67);
  const l=mesh(g,orbGeo,socket,'unblinking-dark-eye',-.31,4.82,.86);
  l.scale.set(1.3,.5,.35);
  const rr=mesh(g,orbGeo,socket,'unblinking-dark-eye',.3,4.79,.86);
  rr.scale.set(.65,1.4,.35);
  ghosts.push(g);
 }
 const masks=[],maskCount=coarse?5:8;
 for(let i=0;i<maskCount;i++){
  const g=new THREE.Group();g.name='falling-porcelain-audience-mask';root.add(g);
  mesh(g,maskGeo,porcelain,'split-mask-not-projectile').scale.set(.82,1,.32);
  for(const sign of[-1,1])mesh(g,orbGeo,socket,'empty-mask-socket',sign*.34,.15,.28).scale.set(.75,1.2,.45);
  const m=mesh(g,orbGeo,socket,'too-wide-mask-mouth',0,-.45,.24);m.scale.set(2.4,.45,.3);
  masks.push(g);
 }
 const spectators=[];
 for(let i=0;i<(coarse?8:14);i++){
  const a=(i+.5)*TAU/(coarse?8:14),g=new THREE.Group();
  g.name='impossible-silent-audience';root.add(g);g.position.set(Math.sin(a)*33,0,Math.cos(a)*33);
  mesh(g,bodyGeo,phantomMat,'audience-body',0,3.2,0).scale.set(1.2,1,.8);
  mesh(g,headGeo,phantomMat,'audience-head',0,6.0,0).scale.set(1,1.1,.8);
  mesh(g,orbGeo,eye,'audience-left-eye',-.34,6.05,.76).scale.set(.55,.32,.25);
  mesh(g,orbGeo,eye,'audience-right-eye',.34,6.05,.76).scale.set(.55,.32,.25);
  spectators.push(g);
 }
 const shadows=[];
 for(let i=0;i<3;i++){
  const m=mesh(root,new THREE.CircleGeometry(1,32),shadowMat,'shadow-that-moves-before-the-clown',0,.11,0);
  m.rotation.x=-Math.PI/2;m.renderOrder=1;shadows.push(m);
 }
 const curtains=[];
 for(const side of[-1,1]){
  const geo=new THREE.PlaneGeometry(10,23,9,11);
  const m=mesh(root,geo,curtainMat,'cloth-behind-the-unlit-stage',side*15,12.5,-28);
  m.rotation.y=side*.12;curtains.push(m);
 }
 let pulse=0,clock=0,disposed=false;
 function reset(){clock=0;pulse=0;for(const o of [...ghosts,...masks,...spectators,...shadows,...curtains])o.visible=false;}
 function event(e){
  if(disposed||!e)return;
  if(e.type==='clown-phase3')pulse=1.9;
  if(e.type==='clown-horror')pulse=Math.min(1.8,pulse+.25);
 }
 function update(g,dt=0){
  if(disposed||!g)return;
  const h=sat(dt/.05)*.05;
  clock+=h;pulse=Math.max(0,pulse-h*1.2);
  const c=g.clown||{},b=g.boss||{},name=c.name||'',age=Math.max(0,c.pt-(c.state==='pattern'? .7:0)),
   stage=c.horrorStage||1,live=g.status==='playing',evil=stage===3&&b.phase!==3;
  const ghostShow=live&&b.phase!==3&&(name='wrongTwin'||name==='foldedCrawl'||name==='mouthOfTheAudience'),maskShow=live&&b.phase!==3&&(name='porcelainRain'||name==='clockOfTeeth'||name==='hatchingBalloons'||name==='stolenFace'),
   seatShow=live&&b.phase!==3&&(name='emptyAudience'||name==='mouthOfTheAudience'||name==='synchronizedHush'||name==='mouthlessLament'||evil),shadowShow=live&&b.phase!==3&&(name='livingShadow'||name==='wrongTwin'||name==='stageRupture'||name==='corpseMarionetteReprise');
  const active=live?(evil?1:stage===2?.7:.35):0;
  phantomMat.opacity=(ghostShow?.34:seatShow?.28:0)*active;
  porcelain.opacity=(maskShow?.72:ghostShow?.36:0)*active;
  socket.opacity=(maskShow?.7:ghostShow?.65:0)*active;
  eye.opacity=seatShow?.52*active:0;
  shadowMat.opacity=shadowShow?.22*active:0;
  curtainMat.opacity=live&&(name==='curtainNightmare'||name==='stageRupture'||name==='corpseMarionetteReprise')?.64:evil?.18:0;
  for(let i=0;i<ghosts.length;i++){
   const q=ghosts[i];q.visible=ghostShow;
   if(!ghostShow)continue;
   const a=i*TAU/ghosts.length+clock*.17;
   q.position.set((b.x||0)+Math.cos(a)*5,(!reduced?Math.sin(clock*1.2+i)*.11:0),(b.z||0)+Math.sin(a)*5);
   q.rotation.y=a+Math.PI; // each wrong double has one visibly late motion
   q.rotation.z=!reduced?Math.sin(clock*2.6+i)*.13:0;
   q.scale.setScalar(i===0?.98:i%2?1.1:.89);
  }
  const zones=(c.zones||[]).filter(z=>z.state==='warn'&&
    (name==='porcelainRain'?z.sound==='porcelainRain':
     name==='clockOfTeeth'?z.sound==='clockOfTeeth':
     name==='hatchingBalloons'?z.sound==='hatchingBalloons':
     name==='stolenFace'?z.sound==='stolenFace':false));
  for(let i=0;i<masks.length;i++){
   const m=masks[i],z=zones[i%Math.max(1,zones.length)];
   m.visible=maskShow&&Boolean(z)&&i<zones.length;
   if(!m.visible)continue;
   const k=sat((z.age||0)/Math.max(.01,z.warn));
   // The mask falls into the *same* spot whose light is warning the player.
   m.position.set(z.x,Math.max(2.8,11*(1-k)+2.8*k),z.z);
   m.rotation.set(!reduced?clock*.25:0,clock*.53+i*.3,Math.PI*sat((k-.63)/.35)*.3);
   m.scale.setScalar(name==='clockOfTeeth'?.95:name==='stolenFace'?2.05:1.5);
  }
  for(let i=0;i<spectators.length;i++){
   const q=spectators[i];q.visible=seatShow;
   if(!seatShow)continue;
   q.rotation.y=Math.atan2((b.x||0)-q.position.x,(b.z||0)-q.position.z);
   q.scale.y=1+(!reduced?.06*Math.sin(clock*1.6+i*2):0);
  }
  const lane=c.f?.shadowLane;
  for(let i=0;i<shadows.length;i++){
   const m=shadows[i];m.visible=shadowShow;
   if(!shadowShow)continue;
   const a=lane?.yaw??(c.yaw||0),len=lane?.len??9,k=sat(age/1.55);
   const stretch=name==='livingShadow'?len*(.15+.5*k):name==='stageRupture'?6.2*(.3+k):4.5;
   m.position.set((lane?.x??b.x??0)+Math.sin(a)*(2+i*stretch*.27),
    .105+i*.002,(lane?.z??b.z??0)+Math.cos(a)*(2+i*stretch*.27));
   m.rotation.z=-a;
   m.scale.set(1.4+i*.55,2.6+i*stretch*.46,1);
  }
  for(let i=0;i<curtains.length;i++){
   const m=curtains[i];m.visible=curtainMat.opacity>.01;
   if(!m.visible)continue;
   m.position.x=(i===0?-1:1)*(evil?12:16)+(name==='curtainNightmare'?(i===0?-1:1)*Math.sin(clock*1.2)*1.5:0);
   m.rotation.y=(i===0?-1:1)*(.08+(reduced?0:Math.sin(clock*.8)*.08));
  }
 }
 function dispose(){if(disposed)return;disposed=true;root.parent?.remove(root);disposeScene(root);}
 reset();
 return {root,reset,update,event,dispose,stats:()=>({ghosts:ghosts.length,masks:masks.length,spectators:spectators.length,decorativeOnly:true})};
}
