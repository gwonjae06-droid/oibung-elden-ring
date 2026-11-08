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
import {createClownNightmareAnatomy} from './clown-nightmare-anatomy.mjs';
import {clownBeastPose,clownBeastPaw} from './clown-beast-pose.mjs';
import {clownDismountPose,clownBallWorldPose,clownContactFrame,CLOWN_VISUAL_SCALE} from './clown-grounded-physics.mjs';
import {createPoseContinuity} from './boss-animation-continuity.mjs';
export {disposeScene} from './runtime/scene-resources.mjs';
export function createClownActor({coarse=false}={}){
 return runThreeStartup(THREE,(THREE,own)=>{
 const root=new THREE.Group(),body=new THREE.Group();body.position.y=5.2;root.add(body);
 const red=new THREE.MeshPhysicalMaterial({color:0x981d38,roughness:.85,sheen:.42,sheenRoughness:.9}),white=new THREE.MeshPhysicalMaterial({color:0xe8d5ad,roughness:.88,sheen:.34}),black=new THREE.MeshStandardMaterial({color:0x16101a,roughness:.7});
 const gold=new THREE.MeshStandardMaterial({color:0xe5b64d,metalness:.75,roughness:.32}),purple=new THREE.MeshPhysicalMaterial({color:0x54256c,roughness:.86,sheen:.38});
 const reduced=false,collapse=createClownCollapse(),gait=createClownGait(),balance=createSpringBank(),recoil=createRecoilBank(),gestureBlend=createPoseContinuity();
 let lastGame=null,lastClock=-Infinity;
 const mesh=(geo,mat,x,y,z,parent=body)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 // Worn woven velvet with stitched panels, patina and muted satin trim.
 const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');
 for(let i=0;i<16;i++){
  const x=i*32;ctx.fillStyle=i%2?'#c3ab83':'#842b35';ctx.fillRect(x,0,32,256);
  ctx.fillStyle='rgba(20,10,15,.23)';ctx.fillRect(x+30,0,2,256);
  for(let y=4;y<255;y+=13){ctx.fillStyle='rgba(240,210,171,.39)';ctx.fillRect(x+29,y,2,5);}
 }
 for(let y=0;y<256;y+=4){ctx.fillStyle=y%3?'rgba(36,19,22,.045)':'rgba(245,228,202,.04)';ctx.fillRect(0,y,512,1);}
 ctx.fillStyle='#987746';ctx.fillRect(0,119,512,19);
 ctx.fillStyle='rgba(33,20,13,.32)';ctx.fillRect(0,136,512,2);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.anisotropy=coarse?2:8;
 const ball=mesh(new THREE.SphereGeometry(2.6,coarse?32:72,coarse?24:48),new THREE.MeshPhysicalMaterial({map:tex,roughness:.87,sheen:.38,transparent:true}),0,2.6,0,root);
 ball.name='actual-legacy-circus-ball';
 const sculpt=points=>new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),coarse?28:64);
 const torso=mesh(sculpt([[0,-1],[.56,-.98],[.78,-.78],[.81,-.45],[.67,-.18],[.79,.22],[.94,.57],[.73,.83],[.3,1],[0,1.03]]),red,0,2.25,0);torso.scale.set(1,1.2,.72);
 const lowerCoat=mesh(sculpt([[0,-.5],[.48,-.48],[.67,-.38],[.73,-.12],[.60,.28],[.3,.39],[0,.4]]),red,0,1.1,0);lowerCoat.scale.y=.7;
 const tube=mat=>mesh(sculpt([[.12,-.5],[.18,-.45],[.22,-.17],[.20,.1],[.24,.37],[.16,.5]]),mat,0,0,0),joint=(r,mat)=>mesh(new THREE.SphereGeometry(r,coarse?16:32,coarse?12:20),mat,0,0,0);
 const limbs=[-1,1].map(s=>({s,upper:tube(s<0?red:white),lower:tube(s<0?white:red),elbow:joint(.25,white),glove:joint(.4,white),thigh:tube(s<0?white:red),shin:tube(s<0?white:red),knee:joint(.25,red),shoe:joint(.4,black)}));
 const neck=tube(white),head=createClownHead(),mount=createClownHead();body.add(head.group);root.add(mount.group);mount.group.visible=false;
 const nightmare=createClownNightmareAnatomy(THREE,{body,head,mount});
 const collar=mesh(new THREE.TorusGeometry(.67,.16,coarse?8:14,coarse?24:56),white,0,3.4,0);collar.rotation.x=Math.PI/2;
 const beadGeo=new THREE.SphereGeometry(.14,coarse?12:24,coarse?8:16),ruffGeo=new THREE.ConeGeometry(.32,.65,coarse?8:18),patchGeo=new THREE.BoxGeometry(.26,.36,.04),cuffGeo=new THREE.TorusGeometry(.28,.08,coarse?8:12,coarse?16:32),puffGeo=new THREE.SphereGeometry(.38,coarse?16:32,coarse?12:20);
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
  const horror=c.horrorStage||1,Q=clownBeastPose(g);
  red.color.setHex(horror===3?0x471728:horror===2?0x741e36:0x981d38);
  white.color.setHex(horror===3?0xc5b5a5:horror===2?0xd8c4af:0xe8d5ad);
  const A=clownSpectaclePose(g,cartoonPose(c.name,c.pt,boss.phase,c.state==='pattern'&&boss.state!=='transition'&&g.status==='playing'));
  const contact=clownContactFrame(g,A,Q),groundBase=contact.base;
  const airborne=boss.state==='transition'||(v.jump||0)>.02||(A.lift||0)>.25;
  const footMotion=gait.update(g,dt,{bodyHeight:contact.height,pitch:contact.pitch,
   supportY:airborne?contact.height:boss.phase===2?0:5.2}),weightAccent=clownWeightAccent(g,A);
  if(lastGame!==g||time<lastClock){balance.reset();recoil.reset();gestureBlend.reset();lastGame=g;}lastClock=time;
  if(reduced){A.lift*=.25;A.twist*=.25;A.smear=0;}
  p.inflate=(p.inflate||1)*A.headScale;p.stretch=(p.stretch||0)+(A.bodyY-1)*.2;
  if(g.status==='playing'){p.jaw=(p.jaw||0)+(Q.active?(horror===3?.88:.54):.03);p.wobble=(p.wobble||0)+(!reduced&&(horror>=2)? .18:0);p.stretch=(p.stretch||0)+(Q.active?.22:0);}
  const soft=gestureBlend.step({lean:A.lean||0,twist:A.twist||0,
   tilt:v.tilt||0,headRoll:Q.active?Math.sin(time*2.1)*.16*(Q.third?1.4:1):0},
   dt,{owner:g,time:g.time,rate:c.state==='pattern'?25:13});
  const size=p.inflate||1,crouch=v.crouch||0,elongation=M?M.elongation:0,rise=M?2.6*M.scale*(A.headScale-1):0;for(const m of[red,white,black,gold,purple])m.emissive.setHex(c.flash>0?0x5a2518:0);
  root.position.set(boss.x,Math.max(0,v.jump*1.1),boss.z);
  root.rotation.y=A.facingYaw??c.yaw;
  body.position.y=Math.max(0,contact.height+footMotion.bob*(Q.active?.25:1)-(death?.bodyDrop||0));
  body.scale.set(A.bodyX,A.bodyY,A.bodyZ);
  body.rotation.y=soft.twist;
  body.rotation.z=death?death.roll:soft.tilt*.13+footMotion.roll+weightAccent.roll+Q.bodyRoll;
  const ordinaryPitch=(death?death.pitch:(v.neck>0?v.neck*.3:0))+soft.lean+footMotion.lean+weightAccent.pitch;
  // Large cartoon lean angles used to pull the feet through the ground.
  // Use a smaller supported hip rotation once dismounted.
  body.rotation.x=boss.phase===2&&!death?contact.pitch:
   ordinaryPitch+(death?0:recoil.step('spine:impact',
    (A.clapClose??0)*1.1+(v.stomp||0)*.7-(v.jump||0)*.5,dt,
    {strength:1.5,frequency:18,limit:.065}));
  torso.position.y=2.25-crouch*.25;
  // Compress the decorative chest during claps and heavy throws, then relax
  // behind the arm motion; palm endpoints and damage volumes never move.
  const compression=balance.step('spine:compress',Math.min(1,Math.max(0,A.clapClose??0,(v.glove||0)*.65,(A.smear||0)*.15)),dt,15);
  torso.scale.set(1-compression*.038,1.2+elongation*.18-compression*.065-weightAccent.compression,.72+compression*.045);
  // The planted-shoe gait owns foot contacts. This offsets only the decorative
  // torso and leaves glove targets and gameplay hitboxes unchanged.
  torso.rotation.y=balance.step('spine:y',-A.twist*.12+weightAccent.counterYaw,dt,12);
  torso.rotation.z=balance.step('spine:z',v.tilt*-.018+A.lean*.035,dt,10);
  torso.rotation.x=balance.step('spine:x',-compression*.09+A.lean*.05,dt,13);
  // The same physical sphere that supported act one swells, rolls across
  // the floor and remains at the arena edge throughout act two.
  const ballPose=clownBallWorldPose(g),localX=(ballPose.x-boss.x)/CLOWN_VISUAL_SCALE,
   localZ=(ballPose.z-boss.z)/CLOWN_VISUAL_SCALE,cy=Math.cos(root.rotation.y),sy=Math.sin(root.rotation.y);
  ball.visible=true;ball.material.opacity=1;
  ball.scale.setScalar(ballPose.scale);
  ball.position.set(localX*cy-localZ*sy,2.6*ballPose.scale,localX*sy+localZ*cy);
  ball.rotation.z=boss.phase===2?-(ballPose.roll||0):-c.odo/2.6;
  ball.rotation.x=v.shake*Math.sin(time*24)*.025;
  // There is no second ghost head to vanish at the cutscene boundary.
  mount.group.visible=false;
    head.group.visible=F.bodyHead;h.set(0,4.7+(size-1)*.8-crouch*.25,0);body.updateWorldMatrix(true,false);
  if(F.bodyHead&&v.neckTarget&&v.neck>0){target.set(v.neckTarget.x,1.2+Math.max(0,A.headScale-1)*1.1,v.neckTarget.z);body.worldToLocal(target);h.lerp(target,v.neck);}
  if(F.bodyHead){head.group.position.copy(h);head.group.rotation.x=Q.active?Q.headCounter+v.neck*.20:v.neck*Math.PI;
    head.group.rotation.y=Q.active?Math.sin(time*3.8+v.tilt*3)*.12+v.tilt*.78:0;
    head.group.rotation.z=soft.headRoll;head.setMorph(p,time);}
  link(neck,[0,3.45+elongation*.15-crouch*.25,0],F.bodyHead?[h.x,h.y-Math.min(.8,size*.8)*Math.cos(v.neck*Math.PI),h.z]:[0,3.72+elongation*.15-crouch*.25,0]);neck.scale.x=neck.scale.z=A.neckWidth;
  for(const L of limbs){const s=L.s,grip=A.cameraGrip||(F.bodyHead&&['inflate','hold'].includes(F.pose)),gloveCue=A.clapClose??v.glove,pulse=Math.max(0,...c.bombs.map(q=>q.kind!=='ball'&&q.t<.3?Math.sin(q.t/.3*Math.PI):0));let hand=[s*1.9,2.1+Math.sin(time*3+s)*.08,.45];
   if(grip)hand=[s*size*.7,h.y-.25,Math.max(.4,size*.45)];if(pulse>0)hand=[s*(1.9-pulse),2.8,1+pulse*3];if(gloveCue>0)hand=[s*1.9*(1-gloveCue),2.5,1+gloveCue*1.9];if(v.juggle)hand=[s*1.8,2.7+Math.sin(time*9+s)*.8,.8];if(v.neck>0)hand=[s*.7,.2,.7];
   if(M&&boss.state==='transition'&&boss.t>=1.6&&boss.t<3.2)hand=[s*1.7,M.y-body.position.y+.1,M.z+1];
   if(!grip&&boss.state!=='transition'){hand[0]=hand[0]*A.arms+s*A.armSpread;hand[2]+=(A.arms-1)*.65;}
   if(A.clapClose!==null){const palm=.4*(1+gloveCue*1.7)*A.glove;hand=[s*(palm+(1-gloveCue)*A.armSpread),2.5,3.2+(A.arms-1)*.25];}
   if(A.cameraGrip)hand=[s*1.7,2.5,2.9];
   if(Q.active){
    const paw=clownBeastPaw(Q,s,footMotion.activity);
    // Diagonal planted palms stay low as the boss actually travels; the
    // authored clap can lift them without making him stand upright.
    const perform=['unhingedClap','clap','invertedApplause','juggle'].includes(c.name);
    const blend=(perform?.35:1)*Q.entry;
    hand=hand.map((v,i)=>v*(1-blend)+paw[i]*blend);
   }
   if(Q.active){
    const palm=body.localToWorld(new THREE.Vector3(...hand));
    const sole=Math.max(.65,.52*CLOWN_VISUAL_SCALE*(1+Math.max(0,gloveCue)));
    if(palm.y<sole){palm.y=sole;hand=body.worldToLocal(palm).toArray();}
   }
   const shoulder=[s*.9,3-crouch*.25,0],locked=Boolean(A.cameraGrip||A.clapClose!==null&&A.clapClose>.97||grip&&F.pose==='hold'||boss.state==='transition'),arm=L.arm.pose(shoulder,hand,dt,locked,g);hand=arm.hand;
   L.glove.scale.set((1+gloveCue*1.7)*A.glove,(1+gloveCue)*A.glove,(1+gloveCue*1.4)*A.glove);L.puff.position.set(...shoulder);L.cuff.scale.setScalar(Math.sqrt(A.glove));L.smear.visible=A.smear>.1;L.smear.position.set(...hand);L.smear.position.z-=.8;L.smear.scale.set(1,A.smear+1,1+A.smear*5);
   const {hip,knee,foot}=footMotion.legs[s<0?0:1];
   let planted=foot,hinge=knee;
   if(boss.phase===2&&boss.state!=='transition'&&(v.jump||0)<.02&&(A.lift||0)<.25){
    const sole=body.localToWorld(new THREE.Vector3(...foot));
    const minY=.55*CLOWN_VISUAL_SCALE*Math.max(.8,Math.abs(A.bodyY));
    if(sole.y<minY){sole.y=minY;planted=body.worldToLocal(sole).toArray();
     hinge=knee.map((q,i)=>q+(planted[i]-foot[i])*.45);}
   }
   link(L.thigh,hip,hinge);link(L.shin,hinge,planted);L.knee.position.set(...hinge);L.shoe.position.set(...planted);L.shoe.rotation.x=footMotion.legs[s<0?0:1].anklePitch;L.shoe.scale.set(1.3*A.shoe,.55,1.7*A.shoe);
  }
  nightmare.update(g,time,reduced);
 }
 // Old balance-ball physique is reused by tiny summoned versions. Expose
 // its actual torso anchor so the original suit can sit ABOVE the ball.
 return {root,body,update,head};
 });
}
