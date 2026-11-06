import {runThreeStartup} from './runtime/three-startup.mjs';
import * as THREE from 'three';
import {createClownHead} from './clown-head.mjs';
import {headPose} from './clown-morph.mjs';
import {headFrame} from './clown-visual-data.mjs';
import {cartoonPose} from './clown-cartoon.mjs';
import {clownSpectaclePose} from './clown-spectacle-pose.mjs';
import {createClownArmRig} from './clown-arm-rig.mjs';
import {createClownCollapse} from './clown-collapse.mjs';
import {createSpringBank} from './secondary-physics.mjs';
import {createRecoilBank} from './animation-recoil.mjs';
import {clownWeightAccent} from './boss-performance.mjs';
import {createClownGait} from './clown-gait.mjs';
export {disposeScene} from './runtime/scene-resources.mjs';
export function createClownActor(){
 return runThreeStartup(THREE,(THREE,own)=>{
 const root=new THREE.Group(),body=new THREE.Group();body.position.y=5.2;root.add(body);
 const red=new THREE.MeshStandardMaterial({color:0x981d38,roughness:.7}),white=new THREE.MeshStandardMaterial({color:0xe8d5ad,roughness:.8}),black=new THREE.MeshStandardMaterial({color:0x16101a});
 const gold=new THREE.MeshStandardMaterial({color:0xe5b64d,metalness:.5,roughness:.4}),purple=new THREE.MeshStandardMaterial({color:0x54256c,roughness:.65});
 const reduced=false,collapse=createClownCollapse(),gait=createClownGait(),balance=createSpringBank(),recoil=createRecoilBank();
 let lastGame=null,lastClock=-Infinity;
 const mesh=(geo,mat,x,y,z,parent=body)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');for(let i=0;i<16;i++){ctx.fillStyle=i%2?'#dfcfad':'#a61c33';ctx.fillRect(i*16,0,16,128);}ctx.fillStyle='#d4a83b';ctx.fillRect(0,56,256,16);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 const ball=mesh(new THREE.SphereGeometry(2.6,40,28),new THREE.MeshStandardMaterial({map:tex,roughness:.6,transparent:true}),0,2.6,0,root);
 const torso=mesh(new THREE.SphereGeometry(1,20,16),red,0,2.25,0);torso.scale.set(1,1.2,.72);mesh(new THREE.SphereGeometry(.65,16,12),red,0,1.1,0).scale.y=.7;
 const tube=mat=>mesh(new THREE.CylinderGeometry(.18,.22,1,10),mat,0,0,0),joint=(r,mat)=>mesh(new THREE.SphereGeometry(r,12,10),mat,0,0,0);
 const limbs=[-1,1].map(s=>({s,upper:tube(s<0?red:white),lower:tube(s<0?white:red),elbow:joint(.25,white),glove:joint(.4,white),thigh:tube(s<0?white:red),shin:tube(s<0?white:red),knee:joint(.25,red),shoe:joint(.4,black)}));
 const neck=tube(white),head=createClownHead(),mount=createClownHead();body.add(head.group);root.add(mount.group);mount.group.visible=false;
 const collar=mesh(new THREE.TorusGeometry(.67,.16,8,24),white,0,3.4,0);collar.rotation.x=Math.PI/2;
 const beadGeo=new THREE.SphereGeometry(.14,10,8),ruffGeo=new THREE.ConeGeometry(.32,.65,4),patchGeo=new THREE.BoxGeometry(.26,.36,.04),cuffGeo=new THREE.TorusGeometry(.28,.08,6,16),puffGeo=new THREE.SphereGeometry(.38,12,10);
 for(let i=0;i<3;i++)mesh(beadGeo,gold,0,1.7+i*.55,.72);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,r=mesh(ruffGeo,i%2?purple:white,Math.cos(a)*.68,3.45,Math.sin(a)*.68);r.rotation.z=Math.PI;r.rotation.x=Math.sin(a)*.4;r.rotation.z+=Math.cos(a)*.4;}
 for(const s of[-1,1])for(let i=0;i<2;i++){const p=mesh(patchGeo,s<0?white:purple,s*.48,2+i*.6,.68);p.rotation.z=Math.PI/4;}
 const smearGeo=new THREE.SphereGeometry(.4,10,8),smearMat=new THREE.MeshBasicMaterial({color:0xffe9bc,transparent:true,opacity:.16,depthWrite:false});
 for(const L of limbs){L.puff=mesh(puffGeo,L.s<0?purple:white,L.s*.95,3,0);mesh(puffGeo,red,0,0,.4,L.shoe).scale.set(.7,.8,1.4);for(let i=0;i<3;i++)mesh(beadGeo,white,(i-1)*.17,0,.34,L.glove).scale.set(1,1.3,1);L.cuff=mesh(cuffGeo,gold,0,0,0);L.cuff.rotation.x=Math.PI/2;L.smear=mesh(smearGeo,smearMat,0,0,0);L.smear.visible=false;}
 for(const L of limbs)L.arm=createClownArmRig(THREE,body,L);
 const up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),h=new THREE.Vector3(),target=new THREE.Vector3();
 function link(m,A,B){a.set(...A);b.set(...B);m.position.copy(a).add(b).multiplyScalar(.5);const d=b.sub(a);m.scale.set(1,Math.max(.01,d.length()),1);m.quaternion.setFromUnitVectors(up,d.normalize());}
 function update(g,dt=1/60){
  const death=collapse.update(g,dt,Boolean(globalThis.document?.hidden));
  const boss=g.boss,c=g.clown,v=c.vis,F=headFrame(g),M=F.mount,p={...headPose(F.pose,F.k)},time=c.time+(boss.state==='transition'?boss.t:0);if(F.inflate!==null)p.inflate=F.inflate;
  const A=clownSpectaclePose(g,cartoonPose(c.name,c.pt,boss.phase,c.state==='pattern'&&boss.state!=='transition'&&g.status==='playing'));
  const footMotion=gait.update(g,dt),weightAccent=clownWeightAccent(g,A);
  if(lastGame!==g||time<lastClock){balance.reset();recoil.reset();lastGame=g;}lastClock=time;
  if(reduced){A.lift*=.25;A.twist*=.25;A.smear=0;}
  p.inflate=(p.inflate||1)*A.headScale;p.stretch=(p.stretch||0)+(A.bodyY-1)*.2;
  const size=p.inflate||1,crouch=v.crouch||0,elongation=M?M.elongation:0,rise=M?2.6*M.scale*(A.headScale-1):0;for(const m of[red,white,black,gold,purple])m.emissive.setHex(c.flash>0?0x5a2518:0);
  root.position.set(boss.x,v.jump*1.1,boss.z);root.rotation.y=A.facingYaw??c.yaw;body.position.y=(M?M.bodyY+M.lift:5.2)+rise+A.lift+footMotion.bob-(death?.bodyDrop||0);body.scale.set(A.bodyX,A.bodyY,A.bodyZ);body.rotation.y=A.twist;body.rotation.z=death?death.roll:v.tilt*.13+footMotion.roll+weightAccent.roll;body.rotation.x=(death?death.pitch:(M&&v.neck>0?v.neck*.3:0))+A.lean+footMotion.lean+weightAccent.pitch+(death?0:recoil.step('spine:impact',(A.clapClose??0)*1.1+(v.stomp||0)*.7-(v.jump||0)*.5,dt,{strength:1.5,frequency:18,limit:.065}));torso.position.y=2.25-crouch*.25;
  // Compress the decorative chest during claps and heavy throws, then relax
  // behind the arm motion; palm endpoints and damage volumes never move.
  const compression=balance.step('spine:compress',Math.min(1,Math.max(0,A.clapClose??0,(v.glove||0)*.65,(A.smear||0)*.15)),dt,15);
  torso.scale.set(1-compression*.038,1.2+elongation*.18-compression*.065-weightAccent.compression,.72+compression*.045);
  // The planted-shoe gait owns foot contacts. This offsets only the decorative
  // torso and leaves glove targets and gameplay hitboxes unchanged.
  torso.rotation.y=balance.step('spine:y',-A.twist*.12+weightAccent.counterYaw,dt,12);
  torso.rotation.z=balance.step('spine:z',v.tilt*-.018+A.lean*.035,dt,10);
  torso.rotation.x=balance.step('spine:x',-compression*.09+A.lean*.05,dt,13);
  ball.visible=!M||M.ball>0;ball.material.opacity=M?M.ball:1;ball.position.z=(M?M.ballZ:0)+(death?.ballShift||0);ball.rotation.z=-c.odo/2.6;ball.rotation.x=v.shake*Math.sin(time*24)*.025+(death?.ballShift||0)/2.6;
  mount.group.visible=Boolean(M?.visible);
  if(M?.visible){mount.group.position.set(0,M.y+rise-(death?.mountDrop||0),M.z+(death?.ballShift||0));mount.group.rotation.z=boss.state==='transition'?0:-c.odo/(2.6*M.scale);const reach=v.neckTarget?Math.hypot(v.neckTarget.x-boss.x,v.neckTarget.z-boss.z):0;mount.group.rotation.y=v.neckTarget?Math.atan2(v.neckTarget.x-boss.x,v.neckTarget.z-boss.z)-c.yaw:0;mount.group.scale.set(M.scale,M.scale,M.scale*(1+v.neck*reach/2.28));mount.setMorph({inflate:2.6*A.headScale,stretch:-.04,jaw:.16+Math.sin(time*2)*.08,bulge:.2,wobble:.06},time);}
  head.group.visible=F.bodyHead;h.set(0,4.7+(size-1)*.8-crouch*.25,0);body.updateWorldMatrix(true,false);
  if(F.bodyHead&&v.neckTarget&&v.neck>0){target.set(v.neckTarget.x,1.2+Math.max(0,A.headScale-1)*1.1,v.neckTarget.z);body.worldToLocal(target);h.lerp(target,v.neck);}
  if(F.bodyHead){head.group.position.copy(h);head.group.rotation.x=v.neck*Math.PI;head.setMorph(p,time);}
  link(neck,[0,3.45+elongation*.15-crouch*.25,0],F.bodyHead?[h.x,h.y-Math.min(.8,size*.8)*Math.cos(v.neck*Math.PI),h.z]:[0,3.72+elongation*.15-crouch*.25,0]);neck.scale.x=neck.scale.z=A.neckWidth;
  for(const L of limbs){const s=L.s,grip=A.cameraGrip||(F.bodyHead&&['inflate','hold'].includes(F.pose)),gloveCue=A.clapClose??v.glove,pulse=Math.max(0,...c.bombs.map(q=>q.kind!=='ball'&&q.t<.3?Math.sin(q.t/.3*Math.PI):0));let hand=[s*1.9,2.1+Math.sin(time*3+s)*.08,.45];
   if(grip)hand=[s*size*.7,h.y-.25,Math.max(.4,size*.45)];if(pulse>0)hand=[s*(1.9-pulse),2.8,1+pulse*3];if(gloveCue>0)hand=[s*1.9*(1-gloveCue),2.5,1+gloveCue*1.9];if(v.juggle)hand=[s*1.8,2.7+Math.sin(time*9+s)*.8,.8];if(v.neck>0)hand=[s*.7,.2,.7];
   if(M&&boss.state==='transition'&&boss.t>=1.6&&boss.t<3.2)hand=[s*1.7,M.y-body.position.y+.1,M.z+1];
   if(!grip&&boss.state!=='transition'){hand[0]=hand[0]*A.arms+s*A.armSpread;hand[2]+=(A.arms-1)*.65;}
   if(A.clapClose!==null){const palm=.4*(1+gloveCue*1.7)*A.glove;hand=[s*(palm+(1-gloveCue)*A.armSpread),2.5,3.2+(A.arms-1)*.25];}
   if(A.cameraGrip)hand=[s*1.7,2.5,2.9];
   const shoulder=[s*.9,3-crouch*.25,0],locked=Boolean(A.cameraGrip||A.clapClose!==null&&A.clapClose>.97||grip&&F.pose==='hold'||boss.state==='transition'),arm=L.arm.pose(shoulder,hand,dt,locked,g);hand=arm.hand;
   L.glove.scale.set((1+gloveCue*1.7)*A.glove,(1+gloveCue)*A.glove,(1+gloveCue*1.4)*A.glove);L.puff.position.set(...shoulder);L.cuff.scale.setScalar(Math.sqrt(A.glove));L.smear.visible=A.smear>.1;L.smear.position.set(...hand);L.smear.position.z-=.8;L.smear.scale.set(1,A.smear+1,1+A.smear*5);
   const {hip,knee,foot}=footMotion.legs[s<0?0:1];link(L.thigh,hip,knee);link(L.shin,knee,foot);L.knee.position.set(...knee);L.shoe.position.set(...foot);L.shoe.rotation.x=footMotion.legs[s<0?0:1].anklePitch;L.shoe.scale.set(1.3*A.shoe,.55,1.7*A.shoe);
  }
 }
 return {root,update,head};
 });
}
