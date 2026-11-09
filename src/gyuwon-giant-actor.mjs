import * as T from 'three';
import {gyuwonSubtitleAt} from './gyuwon-subtitles.mjs';
// Shares Gyuwon's sculpted likeness and photo material with the existing boss.
// The sleeves, elbows, palms and three-joint digits are connected 3D meshes.
export function createGiantGyuwon(parent,source,{coarse=false}={}){
 const root=new T.Group();root.name='gyuwon-giant-musical-host';parent.add(root);
 const ownM=new Set(),ownG=new Set(),mat=(...args)=>{const m=new T.MeshStandardMaterial(...args);ownM.add(m);return m;},geo=g=>(ownG.add(g),g);
 const skin=source.getObjectByName('gyuwon-palm')?.material||mat({color:0xd3ae96,roughness:.75});
 const velvet=mat({color:0x191b2b,roughness:.88,metalness:.08}),silk=mat({color:0xf4ead7,roughness:.53}),gold=mat({color:0xc8a26a,metalness:.76,roughness:.3}),dark=mat({color:0x241118,roughness:.92});
 const torso=source.getObjectByName('gyuwon-tailored-torso').clone(true);root.add(torso);torso.scale.setScalar(10.5);torso.position.set(0,15.5,-25);torso.rotation.y=0;
 torso.traverse(o=>{
  if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))o.visible=false;
  if(o.material&&/torso|jacket|lapel/.test(o.name))o.material=o.name.includes('lapel')?silk:velvet;
 });
 // Strip retired annual costumes from the borrowed likeness entirely. Their
 // source model owns them; this host wears only his tuxedo, never all years.
 const retired=[];torso.traverse(o=>{if(/^gyuwon-year-\d+-rig-gear$/.test(o.name)||/accumulated-nightmare|shoulder-rig/.test(o.name))retired.push(o);});
 for(const o of retired)o.removeFromParent();
 const head=torso.getObjectByName('gyuwon-head'),jaw=head.getObjectByName('gyuwon-jaw'),brows=[],eyes=[],lids=[];head.traverse(o=>{if(o.name==='gyuwon-brow')brows.push(o);if(o.name==='gyuwon-eye-socket')eyes.push(o);if(o.name==='gyuwon-lid-bone')lids.push(o);});
 const sphere=geo(new T.SphereGeometry(1,coarse?20:36,coarse?14:26)),cylinder=geo(new T.CylinderGeometry(1,1,1,coarse?14:24)),digitGeo=geo(new T.CapsuleGeometry(.19,.65,4,10));
 const add=(p,g,m,name)=>{const o=new T.Mesh(g,m);o.name=name;o.castShadow=!coarse;o.receiveShadow=true;p.add(o);return o;};
 const mouth=add(head,sphere,dark,'giant-singing-mouth');mouth.position.set(0,-.273,.462);mouth.scale.set(.10,.018,.018);
 const tooth=add(mouth,sphere,silk,'giant-upper-teeth');tooth.position.y=.55;tooth.scale.set(.84,.18,.6);
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
  const shoulder=new T.Vector3(side*6.8,21,-25),target=new T.Vector3(side*13,2.7,-3),hinge=new T.Vector3();
  return {side,index,sleeve,elbow,forearm,hand,digits,shoulder,target,hinge};
 });
 const mask=new T.Group();mask.name='giant-breakable-theater-mask';root.add(mask);
 const shellGeo=geo(new T.SphereGeometry(5.9,coarse?24:48,coarse?18:32,0,Math.PI*2,0,Math.PI));
 const maskMat=mat({color:0xd7bb7c,roughness:.33,metalness:.64,side:T.DoubleSide});
 const shell=add(mask,shellGeo,maskMat,'giant-gold-half-mask');shell.scale.set(.77,.82,.31);shell.position.z=.7;
 for(const side of [-1,1]){const socket=add(mask,sphere,dark,'theater-mask-eye');socket.position.set(side*1.8,.4,2.35);socket.scale.set(.95,.5,.12);}
 const cracks=[];for(let i=0;i<6;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(-2+i*.8,2,2.15),new T.Vector3(-2.2+i*.8,.2,2.6),new T.Vector3(-1.6+i*.8,-2.3,2.3)]);const c=add(mask,geo(new T.TubeGeometry(curve,8,.035,5,false)),dark,'mask-physical-crack');cracks.push(c);}
 const direction=new T.Vector3(),mid=new T.Vector3(),up=new T.Vector3(0,1,0);let disposed=false;
 function link(mesh,a,b,r1,r2){direction.subVectors(b,a);mesh.position.copy(mid.copy(a).add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(up,direction.clone().normalize());mesh.scale.set(r1,direction.length(),r2);}
 function update(m,dt){
  const beat=m.time*2*Math.PI*(m.bpm||136)/60,breath=Math.sin(m.time*1.45)*.15,bow=m.finishProgress||0;
  const focus=m.party.find(p=>p.id===(m.raidAttack?.victim||m.turnActor));
  torso.position.y=15.5+breath-Math.sin(bow*Math.PI)*1.4;torso.rotation.x=Math.sin(m.time*.8)*.012+bow*.07;head.rotation.y=Math.atan2(focus?.x||0,40)*.3+Math.sin(m.time*.35)*.015;head.rotation.z=Math.sin(beat*.5)*.015;
  tails.forEach((o,i)=>{o.rotation.x=Math.sin(m.time*1.35+i)*.045+bow*.12;o.rotation.z=Math.sin(m.time*.8+i)*.025;});
  const singing=!!gyuwonSubtitleAt(5,m.time);mouth.scale.y=singing?.018+Math.abs(Math.sin(m.time*11.5))* .065:.018;jaw.position.y=-.30-(singing?Math.abs(Math.sin(m.time*11.5))*.018:0);
  brows.forEach((b,i)=>b.rotation.z=(i?1:-1)*(.04+Math.sin(m.time*1.8)*.035));eyes.forEach((e,i)=>{const blink=Math.sin(m.time*.61)> .992;e.scale.y=blink?.1:.65;});
  lids.forEach(l=>{const blink=Math.sin(m.time*.61)>.992;l.scale.y=blink?.92:.12;});
  for(const arm of arms){
   const e=m.enemies[arm.index];const withdrawn=e.destroyed?1:0;
   arm.target.set(e.x+arm.side*withdrawn*7,e.y+withdrawn*2,e.z-withdrawn*12);
   arm.hand.position.lerp(arm.target,1-Math.exp(-Math.max(.001,dt)*25));
   // A coherent pole keeps elbow bend outside the face and the attack path.
   arm.hinge.copy(arm.shoulder).lerp(arm.hand.position,.49);arm.hinge.x+=arm.side*6;arm.hinge.y+=2;
   link(arm.sleeve,arm.shoulder,arm.hinge,1.8,1.5);link(arm.forearm,arm.hinge,arm.hand.position,1.35,1.1);arm.elbow.position.copy(arm.hinge);arm.elbow.scale.set(1.8,1.8,1.6);
   const attack=m.raidAttack?.part===arm.index?m.raidAttack:null;const curl=attack&&attack.age<attack.wind?Math.sin(attack.age/attack.wind*Math.PI)*.65:e.broken>0?0:.05+Math.sin(beat*.5+arm.index)*.025;
   arm.digits.forEach((joints,i)=>joints.forEach((j,k)=>j.rotation.x=-(curl*(1-k*.16)+withdrawn*.25)*(i===4?.65:1)));
   arm.hand.rotation.z=arm.side*(withdrawn*.3+Math.sin(m.time*.8)*.025);arm.hand.rotation.x=e.broken>0?.12:0;
  }
  const e=m.enemies[3];mask.visible=e.active&&!e.destroyed;mask.position.set(e.x,e.y,e.z+2.8);mask.rotation.z=Math.sin(m.time*.9)*.035;cracks.forEach((c,i)=>c.visible=e.hp/e.maxHp<1-(i+1)/8);
 }
 return {root,head,arms,mask,update,dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const g of ownG)g.dispose();for(const m of ownM)m.dispose();}};
}
