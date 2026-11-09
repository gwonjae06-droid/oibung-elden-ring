import * as T from 'three';
import {actFiveChoreographyAt} from './gyuwon-act-five-choreography.mjs';
// Shares Gyuwon's sculpted likeness and photo material with the existing boss.
// The sleeves, elbows, palms and three-joint digits are connected 3D meshes.
export function createGiantGyuwon(parent,source,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-giant-musical-host';parent.add(root);
 const ownM=new Set(),ownG=new Set(),mat=(...args)=>{const m=new T.MeshStandardMaterial(...args);ownM.add(m);return m;},geo=g=>(ownG.add(g),g);
 const skin=source.getObjectByName('gyuwon-palm')?.material||mat({color:0xd3ae96,roughness:.75});
 const velvet=mat({color:0x30445d,roughness:.88,metalness:.08}),silk=mat({color:0xf4ead7,roughness:.53}),gold=mat({color:0xc8a26a,metalness:.76,roughness:.3}),dark=mat({color:0x241118,roughness:.92});
 const torso=source.getObjectByName('gyuwon-tailored-torso').clone(true);root.add(torso);torso.scale.setScalar(10.5);torso.position.set(0,15.5,-25);torso.rotation.y=0;
 torso.traverse(o=>{
  if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))o.visible=false;
  if(o.material&&/torso|jacket|lapel/.test(o.name))o.material=o.name.includes('lapel')?silk:velvet;
 });
 // Strip retired annual costumes from the borrowed likeness entirely. Their
 // source model owns them; this host wears only his tuxedo, never all years.
 const retired=[];torso.traverse(o=>{if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))retired.push(o);});
 for(const o of retired)o.removeFromParent();
 const head=torso.getObjectByName('gyuwon-head');
 const sphere=geo(new T.SphereGeometry(1,coarse?20:36,coarse?14:26)),cylinder=geo(new T.CylinderGeometry(1,1,1,coarse?14:24)),digitGeo=geo(new T.CapsuleGeometry(.19,.65,4,10));
 const add=(p,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const tailGeo=geo(new T.PlaneGeometry(3,8,8,12)),tailPos=tailGeo.attributes.position;
 for(let i=0;i<tailPos.count;i++)tailPos.setZ(i,Math.sin(tailPos.getX(i)*2)*.13+Math.pow(tailPos.getY(i)/8,2)*.2);tailGeo.computeVertexNormals();
 const tails=[-1,1].map(side=>{const o=add(root,tailGeo,velvet,'giant-inertial-tailcoat-panel');o.position.set(side*5,6.4,-25);o.rotation.y=side*.28;return o;});
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
 const direction=new T.Vector3(),mid=new T.Vector3(),up=new T.Vector3(0,1,0),costumeColor=new T.Color(0x725080);let disposed=false;
 function link(mesh,a,b,r1,r2){direction.subVectors(b,a);mesh.position.copy(mid.copy(a).add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(up,direction.clone().normalize());mesh.scale.set(r1,direction.length(),r2);}
 function update(m,dt){
  if(disposed)return;
  const step=Math.max(0,Math.min(.05,dt));
  const beat=m.time*2*Math.PI*(m.bpm||136)/60,bow=m.finishProgress||0;
  const pose=actFiveChoreographyAt(m.time,m.songPerformance,{
   hitUntil:m.hitTargetUntil||0,raidAttack:m.raidAttack,bpm:m.bpm||136
  });
  const gesture=pose.gesture,weight=pose.weight;
  const bodyEase=1-Math.exp(-step*7.7),faceEase=1-Math.exp(-step*9.5);
  const aim=m.party?.find(a=>a.id===(m.raidAttack?.victim||m.turnActor));
  const focusX=aim?.x||0;
  const attackWind=pose.anticipation;
  const body=pose.torso,face=pose.head;
  // The entire giant performs the lyric rather than rotating a face texture
  // on a rigid statue. Small secondary breathing survives instrumental gaps.
  torso.position.y=T.MathUtils.lerp(torso.position.y,
   15.5+pose.bounce-Math.sin(bow*Math.PI)*1.7,bodyEase);
  torso.rotation.x=T.MathUtils.lerp(torso.rotation.x,
   body[0]+bow*.12,bodyEase);
  torso.rotation.y=T.MathUtils.lerp(torso.rotation.y,
   body[1]+Math.atan2(focusX,50)*.11,bodyEase);
  torso.rotation.z=T.MathUtils.lerp(torso.rotation.z,body[2],bodyEase);
  head.rotation.x=T.MathUtils.lerp(head.rotation.x,face[0],faceEase);
  head.rotation.y=T.MathUtils.lerp(head.rotation.y,
   face[1]+Math.atan2(focusX,40)*.22,faceEase);
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
  baton.visible=(pose.style==='conduct'||pose.style==='fanfare')&&weight>.2&&!m.finishing
    &&!m.enemies[1]?.destroyed;
  baton.rotation.z=Math.sin(m.time*5)*.14*weight;
  for(const arm of arms){
   arm.shoulder.set(arm.side*.64,.63,0).applyMatrix4(torso.matrixWorld);
   // Rendering follows the *simulation-controlled* target, including actual
   // enemy windup/travel/recovery. Decorative gestures never reassign hits.
   const enemy=m.enemies[arm.index],withdrawn=enemy.destroyed?1:0;
   arm.target.set(enemy.x+arm.side*withdrawn*7,
     enemy.y+withdrawn*2,enemy.z-withdrawn*12);
   const handEase=1-Math.exp(-step*(m.raidAttack?.part===arm.index?36:25));
   arm.hand.position.lerp(arm.target,handEase);
   arm.desiredHinge.copy(arm.shoulder).lerp(arm.hand.position,.49);
   arm.desiredHinge.x+=arm.side*(6+Math.abs(body[2])*3);
   arm.desiredHinge.y+=2+Math.max(0,pose.bounce)*.4+attackWind*1.25;
   if(!arm.hingeReady){arm.hinge.copy(arm.desiredHinge);arm.hingeReady=true;}
   else arm.hinge.lerp(arm.desiredHinge,1-Math.exp(-step*18));
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
    const target=-(effective*(1-k*.13)+withdrawn*.19)*(i===4?.64:1);
    j.rotation.x=T.MathUtils.lerp(j.rotation.x,target,1-Math.exp(-step*15));
   }));
   const roll=arm.side*(withdrawn*.28+Math.sin(beat*.5+arm.index)*.02)+p.roll*weight;
   const pitch=enemy.broken>0?.12:p.pitch*weight-attackWind*.16;
   arm.hand.rotation.z=T.MathUtils.lerp(arm.hand.rotation.z,roll,faceEase);
   arm.hand.rotation.x=T.MathUtils.lerp(arm.hand.rotation.x,pitch,faceEase);
   arm.hand.rotation.y=T.MathUtils.lerp(arm.hand.rotation.y,
    arm.side*(gesture==='choose'?.10:gesture==='doors'?.16:0)*weight,faceEase);
  }
  const e=m.enemies[3];
  mask.visible=e.active&&!e.destroyed;
  mask.position.set(e.x,e.y,e.z+2.8);
  mask.rotation.z=T.MathUtils.lerp(mask.rotation.z,
   Math.sin(m.time*.9)*.025+pose.flinch*.11,faceEase);
  cracks.forEach((c,i)=>c.visible=e.hp/e.maxHp<1-(i+1)/8);
 }
 return {root,head,arms,mask,update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of ownG)g.dispose();for(const m of ownM)m.dispose();}};
}
