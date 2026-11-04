import {disposeScene} from './runtime/scene-resources.mjs';
import * as T from 'three';
import {HAND_REST,GIANT,giantHandPose,giantHazards,giantPosture,giantPropType} from './dice-giant.mjs';
import {POSSESSION} from './dice-giant-cinematic-data.mjs';
import {buildGentlemanTorso,buildGentlemanHand} from './dice-giant-model.mjs';
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
 const ray=new T.Raycaster(),focus=new T.Vector3(),sight=new T.Vector3(),elbow=new T.Vector3(),shoulder=new T.Vector3();
 const up=new T.Vector3(0,1,0),delta=new T.Vector3(),anchor=new T.Vector3();
 const boneBetween=(part,a,b,r)=>{delta.copy(b).sub(a);part.position.copy(a).addScaledVector(delta,.5);part.scale.set(r,Math.max(.1,delta.length()),r);part.quaternion.setFromUnitVectors(up,delta.normalize());};
 const warnMat=new T.MeshBasicMaterial({color:0xf4bd65,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide}),activeMat=new T.MeshBasicMaterial({color:0xf13a3a,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide}),fillWarnMat=new T.MeshBasicMaterial({color:0xff7a2e,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide});
 const circle=new T.CircleGeometry(1,48).rotateX(-Math.PI/2),rect=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const warnings=Array.from({length:20},()=>{const m=new T.Mesh(circle,warnMat);m.position.y=.14;m.renderOrder=5;m.visible=false;root.add(m);return m;});
 // Inner fill grows to the full telegraph size exactly when the hit lands, so the timing is readable.
 const fills=Array.from({length:20},()=>{const m=new T.Mesh(circle,fillWarnMat);m.position.y=.16;m.renderOrder=6;m.visible=false;root.add(m);return m;});
 // Shared prop geometry reacts to the authoritative hazard timeline.
 const propGeo={chip:new T.CylinderGeometry(3.4,3.4,.9,20),coin:new T.CylinderGeometry(4,4,.45,24),chess:new T.ConeGeometry(3.2,11,8),chessRook:new T.CylinderGeometry(3,3.6,9,8),chessKnight:new T.BoxGeometry(6,8,8),dice:new T.BoxGeometry(6,6,6)};
 const propMats={gold:new T.MeshStandardMaterial({color:0xe3b85e,metalness:.7,roughness:.3}),black:new T.MeshStandardMaterial({color:0x28202b,metalness:.35,roughness:.45})};
 const props=Array.from({length:20},(_,i)=>{const m=new T.Mesh(propGeo.chip,i%2?propMats.gold:propMats.black);m.castShadow=true;root.add(m);m.visible=false;return m;});
 // Cream-white fantasy fluid burst sprays behind the struck patron's head.
 const sprayGeo=new T.SphereGeometry(1,6,5),sprayMat=new T.MeshStandardMaterial({color:0xf8f2e5,emissive:0xd8e2e8,emissiveIntensity:.18,transparent:true,opacity:.9,roughness:.26});
 const spray=Array.from({length:64},(_,i)=>{const m=new T.Mesh(sprayGeo,sprayMat);m.visible=false;root.add(m);const a=i*2.399963229728653,rad=Math.sqrt((i+.5)/64);return {mesh:m,vx:Math.cos(a)*(6+32*rad),vy:Math.sin(a)*(12+22*rad),vz:-(16+28*rad),size:.22+.7*((i*37)%29)/29};});
 let last=null,death=0,disposed=false;
 return {root,occlude(camera,player){if(!root.visible)return;for(const b of bars)b.group.quaternion.copy(camera.quaternion);root.updateWorldMatrix(true,true);focus.set(player.x,1.2,player.z);sight.copy(focus).sub(camera.position);ray.far=sight.length();ray.set(camera.position,sight.normalize());for(const {upper,forearm,joint} of hands)for(const bone of [upper,forearm,joint])bone.material.opacity=ray.intersectObject(bone,false).length?.12:1;},dispose(){if(disposed)return;disposed=true;root.parent?.remove(root);return disposeScene(root,{extras:[circle,rect,warnMat,activeMat,fillWarnMat,sprayGeo,sprayMat,barGeo,fillGeo,sphere,cylinder,armGeo,neckGeo,box,shirt,satin,tie,...barMats,...Object.values(propGeo),...Object.values(propMats)]});},update(g,dt){if(disposed)return;if(last!==g){last=g;death=0;for(const b of bars){b.prev=GIANT.handHp;b.flash=0;}}const s=g.dice.giant;root.visible=!!s;if(!s)return;
  if(s.state==='dead')death+=Math.max(0,dt);s.deathVisual=death;
  const time=g.time||0,rise=s.state==='transition'?sat((s.t-4.35)/(POSSESSION.riseEnd-4.35)):1,fall=s.state==='dead'?sat(death/2):0;
  const posture=giantPosture(g),lean=posture.lean,feral=s.temperament==='feral',rage=s.rageBeat||0;
  body.visible=s.state!=='transition'||s.t>=4.35;
  body.position.set(posture.bodyX*rise,23-11*lean-23*(1-rise)-34*fall,-133+61*lean);
  const breath=feral?Math.sin(time*9)*.035:Math.sin(time*1.4)*.012;
  body.rotation.x=1.05*lean+fall*.35+(feral?.1:0)+breath+rage*.14;
  body.rotation.z=feral?Math.sin(time*5)*.027:0;
  body.updateWorldMatrix(true,false);
  oldHead.visible=s.state==='transition'&&s.t>=POSSESSION.launchEnd&&s.t<4.7;
  const fly=sat((s.t-POSSESSION.launchEnd)/.85);
  oldHead.position.set(50*fly,43+30*Math.sin(fly*Math.PI),-127-25*fly);oldHead.rotation.z=fly*9;
  neck.visible=s.state!=='dead'&&body.visible&&(s.state!=='transition'||s.t>=4.5);
  anchor.set(0,21,14);body.localToWorld(anchor);
  const head=new T.Vector3(g.dice.pose.x,g.dice.pose.y-6,g.dice.pose.z);
  const direction=head.clone().sub(anchor),len=Math.min(18,Math.max(3,direction.length()));
  direction.normalize();neck.position.copy(head).addScaledVector(direction,-len*.5);neck.scale.set(5,len,5);neck.quaternion.setFromUnitVectors(up,direction);
  const armsVisible=s.state!=='transition'||s.t>=4.7;
  hands.forEach(({group,upper,forearm,joint,fingers,thumb},i)=>{
   const h=giantHandPose(g,i),destroyed=!!s.destroyed?.[i],crumble=destroyed?(s.crumble?.[i]||0):0;
   // The arm always stays; only the hand shakes, shrinks and bursts into shards.
   upper.visible=forearm.visible=joint.visible=armsVisible;
   group.visible=armsVisible&&(!destroyed||crumble<.35);
   const live=armsVisible&&destroyed&&crumble<GIANT.crumble;
   shards[i].forEach(q=>{q.mesh.visible=live;if(!live)return;q.mesh.position.set(h.x+q.vx*crumble,Math.max(.4,h.y+2+q.vy*crumble-24*crumble*crumble),h.z+q.vz*crumble);q.mesh.rotation.set(crumble*q.spin*3,crumble*q.spin*2,0);q.mesh.scale.setScalar(Math.max(.001,q.size*(1-sat((crumble-.3)/.85))));});
   if(!armsVisible)return;
   const shake=destroyed&&crumble<.35?Math.sin(crumble*90)*.6:0;
   group.position.set(h.x+shake,h.y-12*fall,h.z);
   group.scale.setScalar(destroyed?Math.max(.05,1-crumble/.35*.5):1);
   group.rotation.z=(i?1:-1)*fall*.6+(feral?Math.sin(time*11+i)*.07:Math.sin(time*1.5+i)*.016);
   // Each finger bends joint by joint: a relaxed hand when polite, a clenched fist when enraged.
   const curl=h.fist*1.15;
   fingers.forEach((joints,j)=>joints.forEach((jt,k)=>{jt.rotation.x=curl*[1,1.15,.9][k]+(feral?.18:.05)*Math.sin(time*(feral?12:2)+j*.9+i*2)+(k===0?.12:.18)*(1-h.fist);}));
   thumb.forEach((jt,k)=>{jt.rotation.x=h.fist*.55*(k+1)*.7;});
   shoulder.set(i?20:-20,18,7);body.localToWorld(shoulder);
   elbow.copy(shoulder).lerp(group.position,.53);
   elbow.x+=(i?1:-1)*9;elbow.y+=7;elbow.z-=6;
   joint.position.copy(elbow);
   boneBetween(upper,shoulder,elbow,5.5);boneBetween(forearm,elbow,group.position,4.7);
  });
  bars.forEach((b,i)=>{
   const hp=s.hands[i],lost=s.destroyed?.[i];
   if(hp<b.prev)b.flash=.18;b.prev=hp;b.flash=Math.max(0,b.flash-Math.max(0,dt));
   const show=!lost&&s.state!=='dead'&&(s.state!=='transition'||s.t>=5.7);b.group.visible=show;if(!show)return;
   const ratio=sat(hp/GIANT.handHp),pose=giantHandPose(g,i);
   b.fill.scale.x=Math.max(.001,16.4*ratio);b.fillMat.color.setHex(b.flash>0?0xffffff:ratio<.3?0xe0453a:0xd0ad65);
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
  warnMat.opacity=.22+.1*Math.sin(time*12);
  const hazards=giantHazards(g);
  warnings.forEach((m,i)=>{const h=hazards[i],f=fills[i];m.visible=!!h;f.visible=!!h&&!h.live;if(!h)return;m.material=h.live?activeMat:warnMat;m.position.set(h.x,.14,h.z);const boxy=['rect','rotated-rect'].includes(h.shape);m.geometry=boxy?rect:circle;m.rotation.y=h.yaw||0;
   if(boxy)m.scale.set(h.w,1,h.h);else m.scale.set(h.r,1,h.r);
   if(f.visible){const u=ease(h.age/h.warn);f.geometry=boxy?rect:circle;f.position.set(h.x,.16,h.z);f.rotation.y=h.yaw||0;if(boxy)f.scale.set(h.w*u,1,h.h*u);else f.scale.set(h.r*u,1,h.r*u);}
  });
  const alive=[0,1].filter(k=>!s.destroyed?.[k]);
  props.forEach((m,i)=>{
   const h=hazards[i],type=h?giantPropType(s,h):null;
   m.visible=Boolean(type&&!h.live);if(!m.visible)return;
   const hand=HAND_REST[alive.length===1?alive[0]:h.id%2],u=sat(h.age/h.warn);
   m.geometry=type==='chess'?(s.chessPiece==='rook'?propGeo.chessRook:s.chessPiece==='knight'?propGeo.chessKnight:propGeo.chess):propGeo[type];
   m.material=i%2?propMats.gold:propMats.black;m.scale.setScalar(1.6);
   // Each object has its own motion: chips slide and spin, coins flip, dice tumble, chess pieces are set down.
   if(type==='chess'){m.position.set(h.x,2+14*(1-u*u),h.z);m.rotation.set(0,i,feral?h.age*5:0);return;}
   const arc={chip:3,coin:14,dice:22}[type],run=feral?Math.sqrt(u):u;
   m.position.set(lerp(hand.x,h.x,run),lerp(10,2,u)+arc*Math.sin(Math.PI*u),lerp(hand.z+5,h.z,run));
   if(type==='coin')m.rotation.set(u*Math.PI*6+(s.coinFace==='tails'?Math.PI:0),0,0);
   else if(type==='dice')m.rotation.set((1-u)*9+i,(1-u)*7,(1-u)*5);
   else m.rotation.set(0,u*14+i,0);
  });
 }};
}
