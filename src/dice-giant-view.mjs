import {createCameraVisibility} from './camera-visibility.mjs';
import {createSpringBank} from './secondary-physics.mjs';
import {createGiantElbowFollow} from './giant-arm-inertia.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import * as T from 'three';
import {HAND_REST,GIANT,giantHandPose,giantHazards,giantPosture,giantPropType} from './dice-giant.mjs';
import {POSSESSION} from './dice-giant-cinematic-data.mjs';
import {buildGentlemanTorso,buildGentlemanHand} from './dice-giant-model.mjs';
import {giantHandGesture,giantHeadImpactPulse,giantThrowTimeline,giantThrowGesture,giantThrownPropPose} from './dice-giant-motion.mjs';
import {diceEnvironmentCue} from './environmental-telegraphs.mjs';
const sat=v=>Math.max(0,Math.min(1,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=v=>{const t=sat(v);return t*t*(3-2*t);};
// Geometry is decorative; all damage and warning bounds come from the simulation above.
export function buildDiceGiant(scene){
 const root=new T.Group();root.name='sungwon-usurped-patron';scene.add(root);
 const suit=new T.MeshStandardMaterial({color:0x191522,roughness:.75}),skin=new T.MeshStandardMaterial({color:0x8e7466,roughness:.7}),ivory=new T.MeshStandardMaterial({color:0xdfd3b3,roughness:.8}),gold=new T.MeshStandardMaterial({color:0xc6a256,metalness:.7,roughness:.36});
 const shirt=new T.MeshStandardMaterial({color:0xf1ead8,roughness:.6}),satin=new T.MeshStandardMaterial({color:0x0d0a12,roughness:.3,metalness:.15,side:T.DoubleSide}),tie=new T.MeshStandardMaterial({color:0x7a1a2a,roughness:.4});
 const sphere=new T.SphereGeometry(1,24,16),cylinder=new T.CylinderGeometry(1,1,1,24),armGeo=new T.CylinderGeometry(.82,1,1,24),neckGeo=new T.CylinderGeometry(1,1.12,1,24),box=new T.BoxGeometry(1,1,1);
 const mesh=(geo,mat,parent,scale)=>{const o=new T.Mesh(geo,mat);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const body=new T.Group();root.add(body);body.add(buildGentlemanTorso(T,{suit,satin,shirt,tie,gold,ivory}).group);
 const neck=mesh(neckGeo,skin,root,[6,10,6]),oldHead=mesh(sphere,skin,root,[10,12,9]);
 const hands=[0,1].map(i=>{
  const model=buildGentlemanHand(T,{suit,skin,shirt,gold},i?1:-1),group=model.group;root.add(group);
  const upper=mesh(armGeo,suit.clone(),root,[5,1,5]),forearm=mesh(armGeo,suit.clone(),root,[4,1,4]),joint=mesh(sphere,suit.clone(),root,[5.3,5.3,5.3]);
  for(const bone of [upper,forearm,joint]){bone.material.transparent=true;bone.material.depthWrite=false;}
  for(const part of [group,upper,forearm,joint])part.name='sungwon-hand-'+i+'-'+(part===group?'palm':part===upper?'upper':part===forearm?'forearm':'elbow');
  return {group,upper,forearm,joint,fingers:model.fingers,thumb:model.thumb};});
 // Hand-crumble shards: only the hand breaks apart, the arm stays attached to the body.
 const shards=[0,1].map(()=>Array.from({length:28},(_,j)=>{const m=mesh(box,j%3?skin:ivory,root,[1,1,1]);m.visible=false;const a=j*2.399963229728653,r=Math.sqrt((j+.5)/28);return {mesh:m,vx:Math.cos(a)*(5+14*r),vy:6+12*((j*13)%7)/7,vz:Math.sin(a)*(4+10*r)+4,size:.5+1.4*((j*37)%11)/11,spin:j+1};}));
 // Floating hand-health bars (billboarded in occlude()); they live above each hand and follow it.
 const barGeo=new T.PlaneGeometry(1,1),fillGeo=new T.PlaneGeometry(1,1).translate(.5,0,0),barMats=[];
 const barMat=(color,opacity)=>{const m=new T.MeshBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false});barMats.push(m);return m;};
 const bars=[0,1].map(()=>{const grp=new T.Group();grp.visible=false;root.add(grp);
  const frame=new T.Mesh(barGeo,barMat(0xf4dfac,.9));frame.scale.set(17.6,3,1);frame.renderOrder=30;
  const back=new T.Mesh(barGeo,barMat(0x120c10,.88));back.scale.set(16.8,2.2,1);back.position.z=.01;back.renderOrder=31;
  const fillMat=barMat(0xd0ad65,1),fill=new T.Mesh(fillGeo,fillMat);fill.position.set(-8.2,0,.02);fill.scale.set(16.4,1.6,1);fill.renderOrder=32;
  grp.add(frame,back,fill);return {group:grp,fill,fillMat,flash:0,prev:GIANT.handHp};});
 const elbow=new T.Vector3(),shoulder=new T.Vector3(),headPoint=new T.Vector3(),headDirection=new T.Vector3();
 const up=new T.Vector3(0,1,0),delta=new T.Vector3(),anchor=new T.Vector3(),propGrip=new T.Vector3(),propSpin=new T.Quaternion(),propEuler=new T.Euler();
 const boneBetween=(part,a,b,r)=>{delta.copy(b).sub(a);part.position.copy(a).addScaledVector(delta,.5);part.scale.set(r,Math.max(.1,delta.length()),r);part.quaternion.setFromUnitVectors(up,delta.normalize());};
 const warnMat=new T.MeshBasicMaterial({color:0x100c13,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide}),fillWarnMat=new T.MeshBasicMaterial({color:0xd9b579,transparent:true,opacity:.16,depthWrite:false,side:T.DoubleSide});
 const circle=new T.CircleGeometry(1,48).rotateX(-Math.PI/2),auraGeo=new T.RingGeometry(.75,1,32).rotateX(-Math.PI/2);
 const warnings=Array.from({length:20},()=>{const m=new T.Mesh(circle,warnMat);m.position.y=.14;m.renderOrder=5;m.visible=false;root.add(m);return m;});
 // Inner fill grows to the full telegraph size exactly when the hit lands, so the timing is readable.
 const fills=Array.from({length:20},()=>{const m=new T.Mesh(auraGeo,fillWarnMat);m.position.y=.16;m.renderOrder=6;m.visible=false;root.add(m);return m;});
 // Shared prop geometry reacts to the authoritative hazard timeline.
 const propGeo={chip:new T.CylinderGeometry(3.4,3.4,.9,20),coin:new T.CylinderGeometry(4,4,.45,24),chess:new T.ConeGeometry(3.2,11,8),chessRook:new T.CylinderGeometry(3,3.6,9,8),chessKnight:new T.BoxGeometry(6,8,8),dice:new T.BoxGeometry(6,6,6)};
 const propMats={gold:new T.MeshStandardMaterial({color:0xe3b85e,metalness:.7,roughness:.3}),black:new T.MeshStandardMaterial({color:0x28202b,metalness:.35,roughness:.45})};
 const props=Array.from({length:20},(_,i)=>{const m=new T.Mesh(propGeo.chip,i%2?propMats.gold:propMats.black);m.name='sungwon-thrown-prop-'+i;m.castShadow=true;root.add(m);m.visible=false;return m;});
 // Cream-white fantasy fluid burst sprays behind the struck patron's head.
 const sprayGeo=new T.SphereGeometry(1,6,5),sprayMat=new T.MeshStandardMaterial({color:0xf8f2e5,emissive:0xd8e2e8,emissiveIntensity:.18,transparent:true,opacity:.9,roughness:.26});
 // Small pooled meshes make the rage transformation readable without allocations per frame.
 const rageGeo=new T.SphereGeometry(.75,7,5),rageMat=new T.MeshBasicMaterial({color:0xf45243,transparent:true,opacity:.75,depthWrite:false});
 const rageSparks=Array.from({length:20},(_,i)=>{const m=mesh(rageGeo,rageMat,root,[1,1,1]);m.visible=false;return {mesh:m,angle:i*2.399963229728653};});
 const ringGeo=new T.RingGeometry(.86,1,48).rotateX(-Math.PI/2),ringMat=new T.MeshBasicMaterial({color:0xff7045,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide});
 const impactRings=Array.from({length:8},(_,i)=>{const m=mesh(ringGeo,ringMat.clone(),root,[1,1,1]);m.name='sungwon-head-impact-'+i;m.castShadow=m.receiveShadow=false;m.visible=false;m.renderOrder=7;return m;});
 // Dust rises in three dimensions from the actual head strike, not from the warning marker.
 const impactDustGeo=new T.SphereGeometry(1,7,5),impactDustMat=new T.MeshBasicMaterial({color:0xff9463,transparent:true,opacity:.65,depthWrite:false});
 const impactDust=Array.from({length:18},(_,i)=>{const m=mesh(impactDustGeo,impactDustMat,root,[1,1,1]);m.name='sungwon-impact-dust-'+i;m.castShadow=m.receiveShadow=false;m.visible=false;return {mesh:m,angle:i*2.399963229728653,offset:.5+(i%5)*.16};});
 const phaseRings=Array.from({length:2},(_,i)=>{const m=mesh(ringGeo,ringMat.clone(),root,[1,1,1]);m.castShadow=m.receiveShadow=false;m.name='sungwon-feral-reveal-'+i;m.visible=false;m.renderOrder=8;return m;});
 const handImpactRings=[0,1].map(i=>{const m=mesh(ringGeo,ringMat.clone(),root,[1,1,1]);m.castShadow=m.receiveShadow=false;m.name='sungwon-palm-impact-'+i;m.visible=false;m.renderOrder=8;return m;});
 const spray=Array.from({length:64},(_,i)=>{const m=new T.Mesh(sprayGeo,sprayMat);m.visible=false;root.add(m);const a=i*2.399963229728653,rad=Math.sqrt((i+.5)/64);return {mesh:m,vx:Math.cos(a)*(6+32*rad),vy:Math.sin(a)*(12+22*rad),vz:-(16+28*rad),size:.22+.7*((i*37)%29)/29};});
 let last=null,death=0,disposed=false,handPrev=[GIANT.handHp,GIANT.handHp],handPulse=[0,0],releaseOrigins=new WeakMap();
 const wristSprings=createSpringBank();
 const elbowFollow=[createGiantElbowFollow(),createGiantElbowFollow()];
 let trackedPlayer=null;
 const handParts=hands.flatMap(h=>[h.group,h.upper,h.forearm,h.joint]);
 const visibility=createCameraVisibility(scene,{roots:()=>root.visible?handParts:[],targets:()=>trackedPlayer?[{x:trackedPlayer.x,y:1.4,z:trackedPlayer.z,radius:2.6}]:[]});
 const barView=new T.Vector3();
 return {root,occlude(camera,player){
  trackedPlayer=player;if(!root.visible)return;camera.updateMatrixWorld();
  for(const b of bars){
   b.group.quaternion.copy(camera.quaternion);
   const depth=Math.max(1,-barView.copy(b.group.position).applyMatrix4(camera.matrixWorldInverse).z);
   b.group.scale.setScalar(Math.min(1,2*depth*Math.tan(camera.fov*Math.PI/360)*camera.aspect*.16/17.6));
  }
 },dispose(){if(disposed)return;disposed=true;visibility.dispose();root.parent?.remove(root);return disposeScene(root,{extras:[circle,auraGeo,warnMat,fillWarnMat,sprayGeo,sprayMat,barGeo,fillGeo,sphere,cylinder,armGeo,neckGeo,box,shirt,satin,tie,rageGeo,rageMat,ringGeo,ringMat,impactDustGeo,impactDustMat,...barMats,...Object.values(propGeo),...Object.values(propMats)]});},update(g,dt){if(disposed)return;if(last!==g){last=g;death=0;handPrev=[GIANT.handHp,GIANT.handHp];handPulse=[0,0];releaseOrigins=new WeakMap();wristSprings.reset();elbowFollow.forEach(f=>f.reset());for(const b of bars){b.prev=GIANT.handHp;b.flash=0;}}const s=g.dice.giant;root.visible=!!s;if(!s)return;
  if(s.state==='dead')death+=Math.max(0,dt);s.deathVisual=death;
  const time=g.time||0,rise=s.state==='transition'?sat((s.t-4.35)/(POSSESSION.riseEnd-4.35)):1,fall=s.state==='dead'?sat(death/2):0;
  const posture=giantPosture(g),lean=posture.lean,feral=s.temperament==='feral',rage=s.rageBeat||0;
  body.visible=s.state!=='transition'||s.t>=4.35;
  const weight=posture.weight||0;
  body.position.set(posture.bodyX*rise,23-11*lean-weight*7-23*(1-rise)-34*fall,-133+61*lean+weight*7);
  body.scale.set(1+weight*.025,1-weight*.055,1+weight*.07);
  const breath=feral?Math.sin(time*9)*.035:Math.sin(time*1.4)*.012;
  body.rotation.x=1.05*lean+weight*.13+fall*.35+(feral?.1:0)+breath+rage*.14;
  body.rotation.z=feral?Math.sin(time*5)*.027+Math.sin(time*39)*rage*.015:0;
  body.rotation.y=(feral?Math.sin(time*17)*rage*.045:0)+(posture.throwTwist||0);
  body.updateWorldMatrix(true,false);
  oldHead.visible=s.state==='transition'&&s.t>=POSSESSION.launchEnd&&s.t<4.7;
  const fly=sat((s.t-POSSESSION.launchEnd)/.85);
  oldHead.position.set(50*fly,43+30*Math.sin(fly*Math.PI),-127-25*fly);oldHead.rotation.z=fly*9;
  neck.visible=s.state!=='dead'&&body.visible&&(s.state!=='transition'||s.t>=4.5);
  anchor.set(0,21,14);body.localToWorld(anchor);
  headPoint.set(g.dice.pose.x,g.dice.pose.y-6,g.dice.pose.z);
  headDirection.copy(headPoint).sub(anchor);const len=Math.min(18,Math.max(3,headDirection.length()));
  headDirection.normalize();neck.position.copy(headPoint).addScaledVector(headDirection,-len*.5);neck.scale.set(5,len,5);neck.quaternion.setFromUnitVectors(up,headDirection);
  const armsVisible=s.state!=='transition'||s.t>=4.7;
  hands.forEach(({group,upper,forearm,joint,fingers,thumb},i)=>{
   const h=giantHandPose(g,i),
     throwing=s.state==='attack'?(s.hazards||[]).find(q=>{
      if(q.handIndex!==i||q.cancelled||!giantPropType(s,q))return false;
      const t=giantThrowTimeline(s,q);return t&&s.t>=t.ready&&s.t<t.release+.12;
     }):null,
     gesture=throwing?giantThrowGesture(s,throwing):giantHandGesture(s,i),destroyed=!!s.destroyed?.[i],crumble=destroyed?(s.crumble?.[i]||0):0,revive=s.revive?.[i]||0;
   const hp=Math.max(0,Number(s.hands?.[i])||0);if(hp<handPrev[i])handPulse[i]=1;handPrev[i]=hp;handPulse[i]=Math.max(0,handPulse[i]-Math.max(0,dt)*5);
   // The arm always stays; only the hand shakes, shrinks and bursts into shards.
   upper.visible=forearm.visible=joint.visible=armsVisible;
   group.visible=armsVisible&&(!destroyed||crumble<.35);
   const live=armsVisible&&destroyed&&crumble<GIANT.crumble;
   shards[i].forEach(q=>{q.mesh.visible=live;if(!live)return;q.mesh.position.set(h.x+q.vx*crumble,Math.max(.4,h.y+2+q.vy*crumble-24*crumble*crumble),h.z+q.vz*crumble);q.mesh.rotation.set(crumble*q.spin*3,crumble*q.spin*2,0);q.mesh.scale.setScalar(Math.max(.001,q.size*(1-sat((crumble-.3)/.85))));});
   if(!armsVisible)return;
   const shake=destroyed&&crumble<.35?Math.sin(crumble*90)*.6:0;
   group.position.set(h.x+shake+(i?1:-1)*handPulse[i]*.8,h.y-12*fall-handPulse[i]*.28,h.z+handPulse[i]*.5);
   group.scale.setScalar(destroyed?Math.max(.05,1-crumble/.35*.5):revive>0?.3+.7*(1-revive/GIANT.handRecover):1);
   // The attackable palm stays at its authoritative position. Only the wrist
   // attitude has a small secondary settling movement after each heavy gesture.
   group.rotation.set(wristSprings.step('pitch:'+i,gesture.wristPitch,dt,28),
    wristSprings.step('yaw:'+i,gesture.wristYaw,dt,27),
    wristSprings.step('roll:'+i,(i?1:-1)*(fall*.6+handPulse[i]*.22)+gesture.wristRoll+(feral?Math.sin(time*11+i)*.07:Math.sin(time*1.5+i)*.016),24));
   // Fingers curl sequentially in the wind-up, clench on contact and open during recovery.
   const curl=sat(h.fist*.62+gesture.curl)*1.25,open=1-sat(curl/1.7);
   fingers.forEach((joints,j)=>joints.forEach((jt,k)=>{
    jt.rotation.x=curl*[.85,1.12,.94][k]+(feral?.12:.035)*Math.sin(time*(feral?12:2)+j*.9+i*2)+(k===0?.09:.12)*open;
    jt.rotation.y=(j-1.5)*.075*open;
   }));
   thumb.forEach((jt,k)=>{jt.rotation.x=curl*.42*(k+1);jt.rotation.z=(i?1:-1)*.1*open;});
   shoulder.set(i?20:-20,18,7);body.localToWorld(shoulder);
   elbow.copy(shoulder).lerp(group.position,.53);
   elbow.x+=(i?1:-1)*(9+gesture.elbowOut);elbow.y+=7+gesture.elbowLift;elbow.z-=6+gesture.anticipation*2;
   // Simulated palm/hit geometry stays authoritative; joint inertia
   // only changes the two limb segments attached to that same palm.
   const softened=elbowFollow[i].step([elbow.x,elbow.y,elbow.z],dt);
   elbow.set(softened.x,softened.y,softened.z);
   joint.position.copy(elbow);
   boneBetween(upper,shoulder,elbow,5.5);boneBetween(forearm,elbow,group.position,4.7);
  });
  bars.forEach((b,i)=>{
   const hp=s.hands[i],lost=s.destroyed?.[i];
   if(hp<b.prev)b.flash=.18;b.prev=hp;b.flash=Math.max(0,b.flash-Math.max(0,dt));
   const show=s.state!=='dead'&&(s.state!=='transition'||s.t>=5.7);b.group.visible=show;if(!show)return;
   const ratio=lost?1-sat((s.disabledFor?.[i]||0)/(feral?5:GIANT.handDisable)):sat(hp/GIANT.handHp),pose=giantHandPose(g,i);
   b.fill.scale.x=Math.max(.001,16.4*ratio);b.fillMat.color.setHex(lost?0xff7060:b.flash>0?0xffffff:ratio<.3?0xe0453a:0xd0ad65);
   b.group.position.set(pose.x,pose.y+11,pose.z);
  });
  const sprayAge=s.state==='transition'?s.t-POSSESSION.launchEnd:-1;
  const bursting=sprayAge>=0&&sprayAge<1.25;
  sprayMat.opacity=bursting?.9*(1-sat((sprayAge-.5)/.75)):0;
  for(const q of spray){
   q.mesh.visible=bursting;if(!bursting)continue;
   const t=sprayAge;q.mesh.position.set(q.vx*t,44+q.vy*t-25*t*t,-139+q.vz*t);
   const scale=q.size*(.7+.7*sat(t/.2))*(1-.65*sat((t-.65)/.6));q.mesh.scale.setScalar(scale);
  }
  propMats.gold.emissive?.setHex?.(feral?0x4a1007:0x251008);
   suit.emissive.setHex(feral?0x220408:0x000000);suit.emissiveIntensity=feral?.32+.3*Math.sin(time*8)**2:0;
   skin.emissive.setHex(feral?0x230509:0x000000);skin.emissiveIntensity=feral?.3:0;
   const raging=feral&&(rage>.001||s.state==='attack'&&s.hazards.some(h=>h.headSlam));
   rageMat.opacity=.5+.3*Math.sin(time*12)**2;
   rageSparks.forEach((q,i)=>{q.mesh.visible=raging;if(!raging)return;
    const a=q.angle+time*(1.7+i%3*.27),r=6+i%5*2.4,head=g.dice.pose;
    q.mesh.position.set(head.x+Math.cos(a)*r,head.y+Math.sin(time*3+i)*7,head.z+Math.sin(a)*r);
    q.mesh.scale.setScalar(.5+.8*Math.sin(time*6+i)**2);
   });
  // The feral reveal runs for one rageBeat; it never creates a collision.
  phaseRings.forEach((ring,i)=>{const progress=1-sat(rage/GIANT.rageBeat),visible=feral&&rage>0;
   ring.visible=visible;if(!visible)return;
   ring.position.set(g.dice.pose.x,1.2+i*.22,g.dice.pose.z);
   ring.scale.setScalar(8+progress*(24+i*17));ring.material.opacity=(1-progress)*(.65-i*.18);
  });
  warnMat.opacity=.14+.04*Math.sin(time*9);
  const hazards=giantHazards(g);
  const slams=hazards.filter(h=>h.headSlam&&h.live&&giantHeadImpactPulse(h)>0);
  impactRings.forEach((ring,i)=>{const h=slams[i%Math.max(1,slams.length)],pulse=giantHeadImpactPulse(h);
   ring.visible=Boolean(h)&&i<slams.length*2;if(!ring.visible)return;
   const u=1-pulse,layer=i%2;ring.position.set(h.x,.21+layer*.03,h.z);
   ring.scale.setScalar(Math.max(.01,h.r*(.45+u*(1.05+layer*.45))));
   ring.material.opacity=pulse*(layer?.35:.62);
  });
  const mainSlam=slams[0],pulse=giantHeadImpactPulse(mainSlam);
  impactDustMat.opacity=.68*pulse;
  impactDust.forEach((q,i)=>{q.mesh.visible=Boolean(mainSlam)&&pulse>0;if(!q.mesh.visible)return;
   const u=1-pulse,r=mainSlam.r*(.2+u*q.offset),a=q.angle+u*.55;
   q.mesh.position.set(mainSlam.x+Math.cos(a)*r,.65+u*(2+i%4*1.6),mainSlam.z+Math.sin(a)*r);
   q.mesh.scale.setScalar((.55+i%3*.22)*(1-u*.7));
  });
  handImpactRings.forEach((ring,i)=>{
   const h=hazards.find(h=>h.handIndex===i&&h.live&&h.age-h.warn<.3);
   ring.visible=Boolean(h);if(!h)return;
   const u=sat((h.age-h.warn)/.3);
   ring.position.set(h.x,.23,h.z);ring.scale.setScalar((h.r||9)*(.45+u*.6));
   ring.material.opacity=.5*(1-u);
  });
  warnings.forEach((m,i)=>{
   const h=hazards[i],f=fills[i],cue=diceEnvironmentCue(h,s),prop=h?giantPropType(s,h):null;
   // Small falling shadows never outline the real circle/rectangle hitbox.
   m.visible=Boolean(h&&!h.live&&cue==='falling-shadow'&&!prop);
   f.visible=Boolean(h&&!h.live&&(s.slot===6||s.temperament==='feral'&&[4,6,8].includes(s.slot)));
   if(!h)return;
   const charge=ease(h.age/Math.max(.1,h.warn));
   m.position.set(h.x,.13,h.z);m.rotation.y=(i%3)*.32;
   m.scale.setScalar((h.headSlam?3.8:2.2)*(1+.3*charge));
   if(f.visible){f.position.set(h.x,.16,h.z);f.rotation.y=(time*.12+i)*.35;
    f.scale.setScalar(2.1+charge*2.3);
    fillWarnMat.opacity=.09+.08*charge;
   }
  });
  props.forEach((m,i)=>{
   // Prop visibility starts on the tabletop; its grip and launch point come from
   // the exact palm mesh. It cannot materialize midway through a flight.
   const h=s.state==='attack'?s.hazards?.[i]:null,type=h?giantPropType(s,h):null;
   const handIndex=h?.handIndex??(h?.id??i)%2;
   const hand=hands[handIndex],timing=type?giantThrowTimeline(s,h):null;
   m.visible=Boolean(type&&timing&&!h.cancelled&&!s.destroyed?.[handIndex]&&s.t>=timing.ready&&s.t<timing.impact);
   if(!m.visible)return;
   hand.group.updateWorldMatrix(true,false);
   hand.group.localToWorld(propGrip.set(0,1.8,11));
   // Once released, do not chase the hand: its origin is fixed in world space.
   if(s.t>=timing.release&&!releaseOrigins.has(h))
    releaseOrigins.set(h,{x:propGrip.x,y:propGrip.y,z:propGrip.z,qx:hand.group.quaternion.x,qy:hand.group.quaternion.y,qz:hand.group.quaternion.z,qw:hand.group.quaternion.w});
   const p=giantThrownPropPose(s,h,type,propGrip,releaseOrigins.get(h));
   if(!p?.visible){m.visible=false;return;}
   m.geometry=type==='chess'?(s.chessPiece==='rook'?propGeo.chessRook:s.chessPiece==='knight'?propGeo.chessKnight:propGeo.chess):propGeo[type];
   m.material=i%2?propMats.gold:propMats.black;
   m.scale.setScalar(type==='coin'?1.48:type==='chess'?1.38:1.6);
   m.position.set(p.x,p.y,p.z);
   if(p.phase==='grip')m.quaternion.copy(hand.group.quaternion);
   else if(p.phase==='pickup'){
    m.rotation.set(0,.2+i*.4,0);
    m.quaternion.slerp(hand.group.quaternion,p.blend);
   }else{
    // Never snap rotation at release: inherit the gripping wrist's exact orientation.
    const origin=releaseOrigins.get(h);
    m.quaternion.set(origin.qx,origin.qy,origin.qz,origin.qw);
    propEuler.set(type==='coin'?p.spin:type==='dice'?p.spin*.72:p.spin*.22,
     type==='chess'?p.spin*.4:p.spin*.6,type==='chip'?p.spin*.84:p.spin*.37);
    m.quaternion.multiply(propSpin.setFromEuler(propEuler));
   }
  });
 }};
}
