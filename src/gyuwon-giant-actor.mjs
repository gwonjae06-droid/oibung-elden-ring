import * as T from 'three';
import {actFiveChoreographyAt} from './gyuwon-act-five-choreography.mjs';
import {gyuwonCinematicMotionAt} from './gyuwon-cinematic-motion-score.mjs';
import {createActFivePhotoMouth} from './gyuwon-act-five-photo-mouth.mjs';
import {createActFiveWings} from './gyuwon-act-five-wings.mjs';
import {solveFixedLimb} from './clown-performance-rig.mjs';
// Shares Gyuwon's sculpted likeness and photo material with the existing boss.
// The sleeves, elbows, palms and three-joint digits are connected 3D meshes.
export function createGiantGyuwon(parent,source,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-giant-musical-host';parent.add(root);
 const ownM=new Set(),ownG=new Set(),mat=(...args)=>{const m=new T.MeshStandardMaterial(...args);ownM.add(m);return m;},geo=g=>(ownG.add(g),g);
 const skin=source.getObjectByName('gyuwon-palm')?.material||mat({color:0xd3ae96,roughness:.75});
 const velvet=mat({color:0x30445d,roughness:.88,metalness:.08}),silk=mat({color:0xf4ead7,roughness:.53}),gold=mat({color:0xc8a26a,metalness:.76,roughness:.3}),dark=mat({color:0x241118,roughness:.92});
 const torso=source.getObjectByName('gyuwon-tailored-torso').clone(true);root.add(torso);torso.scale.setScalar(10.5);torso.position.set(0,7.5,0);torso.rotation.y=0;
 // Two linked articulation pivots: grounded waist, then freely turning chest.
 // The rig is not a whole-body rotation around the giant's distant feet.
 const waist=new T.Group();waist.name='gyuwon-act-five-articulated-waist';waist.position.set(0,8,-25);root.add(waist);waist.add(torso);
 torso.traverse(o=>{
  if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))o.visible=false;
  if(o.material&&/torso|jacket|lapel/.test(o.name))o.material=o.name.includes('lapel')?silk:velvet;
 });
 // Strip retired annual costumes from the borrowed likeness entirely. Their
 // source model owns them; this host wears only his tuxedo, never all years.
 const retired=[];torso.traverse(o=>{if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))retired.push(o);});
 for(const o of retired)o.removeFromParent();
 const head=torso.getObjectByName('gyuwon-head');
 // Raise the photographed face slightly within the original animated rig.
 if(head)head.position.y+=.12;
 const wings=createActFiveWings(waist,{coarse});
 const photoMouth=createActFivePhotoMouth(head,{coarse});
 const sphere=geo(new T.SphereGeometry(1,coarse?20:36,coarse?14:26)),cylinder=geo(new T.CylinderGeometry(1,1,1,coarse?14:24)),digitGeo=geo(new T.CapsuleGeometry(.19,.65,4,10));
 const add=(p,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const tailGeo=geo(new T.PlaneGeometry(3,8,8,12)),tailPos=tailGeo.attributes.position;
 for(let i=0;i<tailPos.count;i++)tailPos.setZ(i,Math.sin(tailPos.getX(i)*2)*.13+Math.pow(tailPos.getY(i)/8,2)*.2);tailGeo.computeVertexNormals();
 const tails=[-1,1].map(side=>{const o=add(waist,tailGeo,velvet,'giant-inertial-tailcoat-panel');o.position.set(side*5,-1.6,0);o.rotation.y=side*.28;return o;});
 const arms=[-1,1].map((side,index)=>{
  const sleeve=add(root,cylinder,velvet,'giant-upper-sleeve'),elbow=add(root,sphere,velvet,'giant-connected-elbow'),forearm=add(root,cylinder,velvet,'giant-forearm');
  const hand=new T.Group();hand.name=index?'giant-right-hand':'giant-left-hand';root.add(hand);
  const cuff=add(hand,cylinder,silk,'giant-shirt-cuff');cuff.scale.set(2,1.1,1.5);cuff.position.set(0,.35,-1.1);cuff.rotation.x=Math.PI/2;
  const palm=add(hand,sphere,skin,'giant-sculpted-palm');palm.scale.set(2.1,.7,2.3);
  const digits=[];for(let i=0;i<5;i++){
   const digit=new T.Group();digit.position.set(i===4?side*2.1:(i-1.5)*1.05,0,i===4?.1:1.65);digit.rotation.y=i===4?side*.95:(i-1.5)*-.06;hand.add(digit);
   const joints=[];let p=digit;for(let j=0;j<3;j++){const joint=new T.Group();joint.position.z=j===0?0:1.0-j*.09;p.add(joint);const bone=add(joint,digitGeo,skin,'giant-articulated-finger');bone.rotation.x=Math.PI/2;bone.position.z=.38;bone.scale.set(i===4?1.15:1,.9-j*.06,1);joints.push(joint);p=joint;}digits.push(joints);
  }
  const shoulder=new T.Vector3(side*6.8,21,-25),target=new T.Vector3(side*13,2.7,-3),
   hinge=new T.Vector3(),desiredHinge=new T.Vector3();
  return {side,index,sleeve,elbow,forearm,hand,digits,shoulder,target,hinge,desiredHinge,hingeReady:false};
 });
 // A tiny physical conductor's baton keeps the final verse visually active.
 // It never becomes a projectile or a damaging hitbox.
 const baton=add(arms[1].hand,cylinder,gold,'giant-musical-conductor-baton');
 baton.position.set(1.55,.2,4.4);baton.rotation.x=Math.PI/2;baton.scale.set(.09,4.7,.09);baton.visible=false;
 const mask=new T.Group();mask.name='giant-breakable-theater-mask';root.add(mask);
 const shellGeo=geo(new T.SphereGeometry(5.9,coarse?24:48,coarse?18:32,0,Math.PI*2,0,Math.PI));
 const maskMat=mat({color:0xd7bb7c,roughness:.33,metalness:.64,side:T.DoubleSide});
 const shell=add(mask,shellGeo,maskMat,'giant-gold-half-mask');shell.scale.set(.77,.82,.31);shell.position.z=.7;
 for(const side of [-1,1]){const socket=add(mask,sphere,dark,'theater-mask-eye');socket.position.set(side*1.8,.4,2.35);socket.scale.set(.95,.5,.12);}
 const cracks=[];for(let i=0;i<6;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(-2+i*.8,2,2.15),new T.Vector3(-2.2+i*.8,.2,2.6),new T.Vector3(-1.6+i*.8,-2.3,2.3)]);const c=add(mask,geo(new T.TubeGeometry(curve,8,.035,5,false)),dark,'mask-physical-crack');cracks.push(c);}
 // Dedicated handheld and worn props are physically parented to the bone
 // hierarchy, not stuck at a fixed spot in world space.
 const royalCrown=new T.Group();royalCrown.name='gyuwon-giant-worn-royal-crown';head.add(royalCrown);
 royalCrown.position.set(0,.66,0);
 const band=add(royalCrown,geo(new T.TorusGeometry(.58,.08,10,32)),gold,'giant-royal-crown-band');
 band.rotation.x=Math.PI/2;band.position.y=.08;
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9;
  const spike=add(royalCrown,geo(new T.ConeGeometry(.12,.35,8)),gold,'giant-royal-crown-point');
  spike.position.set(Math.cos(a)*.57,.28,Math.sin(a)*.57);
  const jewel=add(royalCrown,sphere,maskMat,'giant-royal-crown-gem');
  jewel.position.set(Math.cos(a)*.59,.02,Math.sin(a)*.59);jewel.scale.set(.068,.075,.062);
 }
 const cinemaSword=new T.Group();cinemaSword.name='giant-handheld-knight-sword';arms[1].hand.add(cinemaSword);
 cinemaSword.position.set(1,.4,3.9);cinemaSword.rotation.x=Math.PI/2;
 const swordSteel=add(cinemaSword,geo(new T.ConeGeometry(.42,5.5,4)),silk,'giant-knight-forged-blade');
 swordSteel.position.y=3.5;swordSteel.rotation.y=Math.PI/4;
 const hilt=add(cinemaSword,cylinder,dark,'giant-knight-sword-hilt');hilt.scale.set(.18,1.75,.18);
 hilt.position.y=.45;
 const crossbar=add(cinemaSword,cylinder,gold,'giant-knight-crossguard');
 crossbar.scale.set(.17,2.25,.2);crossbar.rotation.z=Math.PI/2;crossbar.position.y=1.25;
 const horn=new T.Group();horn.name='giant-handheld-fanfare-horn';arms[0].hand.add(horn);
 horn.position.set(-1.1,0,4.1);horn.rotation.x=Math.PI/2;
 const hornTube=add(horn,cylinder,gold,'giant-fanfare-horn-tube');hornTube.scale.set(.21,3.8,.21);
 hornTube.position.y=1.8;
 const hornBell=add(horn,geo(new T.ConeGeometry(.9,1.5,18)),gold,'giant-fanfare-flared-bell');
 hornBell.position.y=4.25;
 const hornRim=add(horn,geo(new T.TorusGeometry(.78,.08,8,24)),silk,'giant-fanfare-bell-rim');
 hornRim.position.y=5;hornRim.rotation.x=Math.PI/2;
 const magicCard=add(arms[0].hand,geo(new T.BoxGeometry(2.7,3.3,.11)),silk,'giant-lyric-story-card');
 magicCard.position.set(-1.0,1.4,4.4);magicCard.rotation.x=.42;
 const direction=new T.Vector3(),mid=new T.Vector3(),up=new T.Vector3(0,1,0),costumeColor=new T.Color(0x725080);let disposed=false;
 function link(mesh,a,b,r1,r2){direction.subVectors(b,a);mesh.position.copy(mid.copy(a).add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(up,direction.clone().normalize());mesh.scale.set(r1,direction.length(),r2);}
 function update(m,dt){
  if(disposed)return;
  const step=Math.max(0,Math.min(.05,dt));
  const beat=m.time*2*Math.PI*(m.bpm||136)/60,bow=m.finishProgress||0;
  photoMouth.update(m.time);
  wings.update(m,step);
  const pose=actFiveChoreographyAt(m.time,m.songPerformance,{
   hitUntil:m.hitTargetUntil||0,raidAttack:m.raidAttack,bpm:m.bpm||136
  });
  const gesture=pose.gesture,weight=pose.weight;
  const cinema=gyuwonCinematicMotionAt(5,m.time)?.pose;
  const lyric=m.lyricAction,cinemaInfluence=m.raidAttack?.age<2?.18:.62;
  const bodyEase=1-Math.exp(-step*6.2),faceEase=1-Math.exp(-step*9.5),waistEase=1-Math.exp(-step*4.7);
  const aim=m.party?.find(a=>a.id===(m.raidAttack?.victim||m.turnActor));
  const focusX=aim?.x||0;
  const attackWind=pose.anticipation;
  const body=pose.chest,face=pose.head;
  // Substantial, weighted waist bending precedes the ribcage. The neck,
  // sleeves and fingers inherit these motions through the same matrices.
  waist.rotation.x=T.MathUtils.lerp(waist.rotation.x,pose.waist[0],waistEase);
  waist.rotation.y=T.MathUtils.lerp(waist.rotation.y,pose.waist[1],waistEase);
  waist.rotation.z=T.MathUtils.lerp(waist.rotation.z,pose.waist[2],waistEase);
  waist.position.x=T.MathUtils.lerp(waist.position.x,pose.lean.x*.68,waistEase);
  waist.position.z=T.MathUtils.lerp(waist.position.z,-25+pose.lean.z*.52,waistEase);
  // The entire giant performs the lyric rather than rotating a face texture
  // on a rigid statue. Small secondary breathing survives instrumental gaps.
  torso.position.y=T.MathUtils.lerp(torso.position.y,
   7.5+pose.bounce*1.5-Math.sin(bow*Math.PI)*1.7,bodyEase);
  torso.position.x=T.MathUtils.lerp(torso.position.x,pose.lean.x*.45,bodyEase);
  torso.position.z=T.MathUtils.lerp(torso.position.z,pose.lean.z*.55,bodyEase);
  torso.rotation.x=T.MathUtils.lerp(torso.rotation.x,
   body[0]+bow*.12+(cinema?.chest||0)*cinemaInfluence*.28,bodyEase);
  torso.rotation.y=T.MathUtils.lerp(torso.rotation.y,
   body[1]+Math.atan2(focusX,50)*.11+(cinema?.turn||0)*cinemaInfluence*.19,bodyEase);
  torso.rotation.z=T.MathUtils.lerp(torso.rotation.z,body[2]+(cinema?.bank||0)*cinemaInfluence*.30,bodyEase);
  head.rotation.x=T.MathUtils.lerp(head.rotation.x,face[0]+(cinema?.headPitch||0)*cinemaInfluence*.34,faceEase);
  head.rotation.y=T.MathUtils.lerp(head.rotation.y,
   face[1]+Math.atan2(focusX,40)*.22+(cinema?.headYaw||0)*cinemaInfluence*.46,faceEase);
  head.rotation.z=T.MathUtils.lerp(head.rotation.z,face[2],faceEase);
  velvet.color.setHex(0x30445d).lerp(costumeColor,
   gesture==='costume'?weight:gesture==='king'||gesture==='crowns'?.2*weight:0);
  torso.updateWorldMatrix(true,false);
  // Coat tails lag the chest; they should not behave as detached panels.
  tails.forEach((o,i)=>{
   const sign=i===0?-1:1;
   o.rotation.x=T.MathUtils.lerp(o.rotation.x,
    Math.sin(m.time*1.35+i)*.035+bow*.12+body[0]*.30,
    1-Math.exp(-step*4.3));
   o.rotation.z=T.MathUtils.lerp(o.rotation.z,
    Math.sin(m.time*.8+i)*.032+sign*body[2]*.52,
    1-Math.exp(-step*4.3));
  });
  royalCrown.visible=['kingTomorrow','everyCrown','becomeAnyone'].includes(lyric?.actionId)&&!m.raidAttack;
  royalCrown.rotation.y=Math.sin(m.time*.55)*.07;
  cinemaSword.visible=['savingKnight','heroDancerStar'].includes(lyric?.actionId)&&!m.raidAttack;
  cinemaSword.rotation.y=Math.sin(m.time*1.2)*.09;
  horn.visible=lyric?.actionId==='trumpetFanfare'&&!m.raidAttack;
  magicCard.visible=['thousandDoors','whereBegin','dreamWorld','onlyBeginning'].includes(lyric?.actionId)&&!m.raidAttack;
  magicCard.rotation.z=Math.sin(m.time*1.7)*.12;
  baton.visible=(pose.style==='conduct'||pose.style==='fanfare')&&weight>.2&&!m.finishing
    &&!m.enemies[1]?.destroyed;
  baton.rotation.z=Math.sin(m.time*5)*.14*weight;
  for(const arm of arms){
   arm.shoulder.set(arm.side*.64,.63,0).applyMatrix4(torso.matrixWorld);
   root.worldToLocal(arm.shoulder);
   // Rendering follows the *simulation-controlled* target, including actual
   // enemy windup/travel/recovery. Decorative gestures never reassign hits.
   const enemy=m.enemies[arm.index];
   arm.target.set(enemy.x,enemy.y,enemy.z);
   const handEase=1-Math.exp(-step*(m.raidAttack?.part===arm.index?36:25));
   arm.hand.position.lerp(arm.target,handEase);
   const shoulder=pose.shoulders[arm.index];
   // Bend a real elbow, rather than nudging the midpoint of two stretching
   // tubes. Contact attacks may reach farther, but singing uses stable bones.
   const reach=Math.max(1,arm.shoulder.distanceTo(arm.hand.position)/28.8);
   const solved=solveFixedLimb(arm.shoulder.toArray(),arm.hand.position.toArray(),{
    upper:13*reach,lower:16*reach,pole:[arm.side*.8,-.45,.12],previous:arm.hingeReady?arm.hinge.toArray():null});
   arm.hinge.set(...solved.joint);arm.hingeReady=true;
   link(arm.sleeve,arm.shoulder,arm.hinge,1.8,1.5);
   link(arm.forearm,arm.hinge,arm.hand.position,1.35,1.1);
   arm.elbow.position.copy(arm.hinge);arm.elbow.scale.set(1.8,1.8,1.6);
   const p=pose.palms[arm.index],attack=m.raidAttack?.part===arm.index?m.raidAttack:null;
   const wind=attack&&attack.age<attack.wind?Math.sin(attack.age/attack.wind*Math.PI)*.6:0;
   const curl=enemy.broken>0?.02:Math.max(p.curl*weight,wind);
   arm.digits.forEach((joints,i)=>joints.forEach((j,k)=>{
    // Pointing keeps the index extended; fists, grasping and applause
    // articulate all 15 joints instead of moving an undifferentiated palm.
    const effective=p.point&&i===1?.06:curl;
    const target=-(effective*(1-k*.13))*(i===4?.64:1);
    j.rotation.x=T.MathUtils.lerp(j.rotation.x,target,1-Math.exp(-step*15));
   }));
   const roll=arm.side*Math.sin(beat*.5+arm.index)*.015+p.roll*weight;
   const pitch=enemy.broken>0?.12:p.pitch*weight-attackWind*.16;
   arm.hand.rotation.z=T.MathUtils.lerp(arm.hand.rotation.z,roll,faceEase);
   arm.hand.rotation.x=T.MathUtils.lerp(arm.hand.rotation.x,pitch,faceEase);
   arm.hand.rotation.y=T.MathUtils.lerp(arm.hand.rotation.y,
    (p.yaw||0)*weight+arm.side*(gesture==='choose'?.10:gesture==='doors'?.16:0)*weight+shoulder.twist,faceEase);
  }
  const e=m.enemies[3];
  mask.visible=e.active&&!e.destroyed;
  mask.position.set(e.x,e.y,e.z+2.8);
  mask.rotation.z=T.MathUtils.lerp(mask.rotation.z,
   Math.sin(m.time*.9)*.025+pose.flinch*.11,faceEase);
  cracks.forEach((c,i)=>c.visible=e.hp/e.maxHp<1-(i+1)/8);
 }
 return {root,head,waist,torso,photoMouth,arms,mask,wings,update,stats:()=>({wings:wings.stats(),hands:arms.map(a=>a.hand.position.toArray()),elbows:arms.map(a=>a.hinge.toArray())}),dispose(){if(disposed)return;disposed=true;wings.dispose();photoMouth.dispose();root.removeFromParent();for(const g of ownG)g.dispose();for(const m of ownM)m.dispose();}};
}
