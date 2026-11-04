import {disposeScene} from './runtime/scene-resources.mjs';
import * as T from 'three';
import {giantHandPose,giantHazards,giantPosture} from './dice-giant.mjs';
import {POSSESSION} from './dice-giant-cinematic-data.mjs';
// Geometry is decorative; all damage and warning bounds come from the simulation above.
export function buildDiceGiant(scene){
 const root=new T.Group();root.name='sungwon-usurped-patron';scene.add(root);
 const suit=new T.MeshStandardMaterial({color:0x191522,roughness:.8}),skin=new T.MeshStandardMaterial({color:0x8e7466,roughness:.8}),ivory=new T.MeshStandardMaterial({color:0xdfd3b3,roughness:.8}),gold=new T.MeshStandardMaterial({color:0xc6a256,metalness:.7,roughness:.36});
 const sphere=new T.SphereGeometry(1,16,12),cylinder=new T.CylinderGeometry(1,1,1,12),box=new T.BoxGeometry(1,1,1);
 const mesh=(geo,mat,parent,scale)=>{const o=new T.Mesh(geo,mat);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const body=new T.Group();root.add(body);const chest=mesh(sphere,suit,body,[25,29,15]);chest.position.set(0,23,-133);
 for(const side of [-1,1]){const lapel=mesh(box,ivory,body,[7,20,1]);lapel.position.set(side*7,34,-118);lapel.rotation.z=side*.3;}
 const tie=mesh(box,gold,body,[3,15,2]);tie.position.set(0,28,-116);
 body.children.forEach(child=>{child.position.y-=23;child.position.z+=133;});
 const neck=mesh(cylinder,skin,root,[6,10,6]),oldHead=mesh(sphere,skin,root,[10,12,9]);
 const hands=[0,1].map(i=>{const group=new T.Group();root.add(group);mesh(box,skin,group,[16,4,20]);
  const fingers=[];for(let j=0;j<4;j++){const f=mesh(sphere,skin,group,[1.7,2,7]);f.position.set((j-1.5)*3.6,0,8);fingers.push(f);}
  const thumb=mesh(sphere,skin,group,[3,2,6]);thumb.position.set(i?9:-9,0,0);thumb.rotation.y=i?.6:-.6;
  const mark=mesh(new T.TorusGeometry(5,.18,6,24).rotateX(Math.PI/2),gold,group,[1,1,1]);mark.position.y=2.15;
  const cuff=mesh(box,ivory,group,[18,5,4]);cuff.position.z=-9;
  const upper=mesh(cylinder,suit.clone(),root,[5,1,5]),forearm=mesh(cylinder,suit.clone(),root,[4,1,4]);
  for(const bone of [upper,forearm]){bone.material.transparent=true;bone.material.depthWrite=false;}
  return {group,upper,forearm,fingers};});
 const ray=new T.Raycaster(),focus=new T.Vector3(),sight=new T.Vector3(),elbow=new T.Vector3(),shoulder=new T.Vector3();
 const up=new T.Vector3(0,1,0),delta=new T.Vector3(),anchor=new T.Vector3();
 const boneBetween=(part,a,b,r)=>{delta.copy(b).sub(a);part.position.copy(a).addScaledVector(delta,.5);part.scale.set(r,Math.max(.1,delta.length()),r);part.quaternion.setFromUnitVectors(up,delta.normalize());};
 const warnMat=new T.MeshBasicMaterial({color:0xf4bd65,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide}),activeMat=new T.MeshBasicMaterial({color:0xf13a3a,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide});
 const circle=new T.CircleGeometry(1,48).rotateX(-Math.PI/2),rect=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),ring=new T.RingGeometry(.9,1,64).rotateX(-Math.PI/2);
 const warnings=Array.from({length:20},()=>{const m=new T.Mesh(circle,warnMat);m.position.y=.14;m.renderOrder=5;m.visible=false;root.add(m);return m;});
 const chips=Array.from({length:8},()=>{const m=mesh(new T.CylinderGeometry(4,4,1,20),gold,root,[1,1,1]);m.visible=false;return m;});
 const landmark=mesh(new T.TorusGeometry(8,.3,6,48).rotateX(Math.PI/2),new T.MeshBasicMaterial({color:0xa3f6c2}),root,[1,1,1]);landmark.position.set(0,.18,-8);landmark.visible=false;
 // Shared prop geometry reacts to the authoritative hazard timeline.
 const propGeo={chip:new T.CylinderGeometry(3.4,3.4,.9,20),coin:new T.CylinderGeometry(4,4,.45,24),chess:new T.ConeGeometry(3.2,11,8),chessRook:new T.CylinderGeometry(3,3.6,9,8),chessKnight:new T.BoxGeometry(6,8,8),dice:new T.BoxGeometry(6,6,6)};
 const propMats={gold:new T.MeshStandardMaterial({color:0xe3b85e,metalness:.7,roughness:.3}),black:new T.MeshStandardMaterial({color:0x28202b,metalness:.35,roughness:.45})};
 const props=Array.from({length:20},(_,i)=>{const m=new T.Mesh(propGeo.chip,i%2?propMats.gold:propMats.black);m.castShadow=true;root.add(m);m.visible=false;return m;});
 const sat=v=>Math.max(0,Math.min(1,v));
 // Cream-white fantasy fluid burst sprays behind the struck patron's head.
 const sprayGeo=new T.SphereGeometry(1,6,5),sprayMat=new T.MeshStandardMaterial({color:0xf8f2e5,emissive:0xd8e2e8,emissiveIntensity:.18,transparent:true,opacity:.9,roughness:.26});
 const spray=Array.from({length:64},(_,i)=>{const m=new T.Mesh(sprayGeo,sprayMat);m.visible=false;root.add(m);const a=i*2.399963229728653,rad=Math.sqrt((i+.5)/64);return {mesh:m,vx:Math.cos(a)*(6+32*rad),vy:Math.sin(a)*(12+22*rad),vz:-(16+28*rad),size:.22+.7*((i*37)%29)/29};});
 let last=null,death=0,disposed=false;
 return {root,occlude(camera,player){if(!root.visible)return;root.updateWorldMatrix(true,true);focus.set(player.x,1.2,player.z);sight.copy(focus).sub(camera.position);ray.far=sight.length();ray.set(camera.position,sight.normalize());for(const {upper,forearm} of hands)for(const bone of [upper,forearm])bone.material.opacity=ray.intersectObject(bone,false).length?.12:1;},dispose(){if(disposed)return;disposed=true;root.parent?.remove(root);return disposeScene(root,{extras:[circle,rect,ring,warnMat,activeMat,sprayGeo,sprayMat,...Object.values(propGeo),...Object.values(propMats)]});},update(g,dt){if(disposed)return;if(last!==g){last=g;death=0;}const s=g.dice.giant;root.visible=!!s;if(!s)return;
  if(s.state==='dead')death+=Math.max(0,dt);s.deathVisual=death;
  const rise=s.state==='transition'?sat((s.t-4.35)/(POSSESSION.riseEnd-4.35)):1,fall=s.state==='dead'?sat(death/2):0;
  const posture=giantPosture(g),lean=posture.lean,feral=s.temperament==='feral',rage=s.rageBeat||0;
  body.visible=s.state!=='transition'||s.t>=4.35;
  body.position.set(posture.bodyX*rise,23-11*lean-23*(1-rise)-34*fall,-133+61*lean);
  const breath=feral?Math.sin((g.time||0)*9)*.035:Math.sin((g.time||0)*1.4)*.012;
  body.rotation.x=1.05*lean+fall*.35+(feral?.1:0)+breath+rage*.14;
  body.rotation.z=feral?Math.sin((g.time||0)*5)*.027:0;
  body.updateWorldMatrix(true,false);
  oldHead.visible=s.state==='transition'&&s.t>=POSSESSION.launchEnd&&s.t<4.7;
  const fly=sat((s.t-POSSESSION.launchEnd)/.85);
  oldHead.position.set(50*fly,43+30*Math.sin(fly*Math.PI),-127-25*fly);oldHead.rotation.z=fly*9;
  neck.visible=s.state!=='dead'&&body.visible&&(s.state!=='transition'||s.t>=4.5);
  anchor.set(0,21,14);body.localToWorld(anchor);
  const head=new T.Vector3(g.dice.pose.x,g.dice.pose.y-6,g.dice.pose.z);
  const direction=head.clone().sub(anchor),len=Math.min(18,Math.max(3,direction.length()));
  direction.normalize();neck.position.copy(head).addScaledVector(direction,-len*.5);neck.scale.set(5,len,5);neck.quaternion.setFromUnitVectors(up,direction);
  hands.forEach(({group,upper,forearm,fingers},i)=>{
   const h=giantHandPose(g,i),destroyed=!!s.destroyed?.[i];
   const departing=destroyed&&s.state==='wounded'&&s.woundedHand===i&&s.t<1.2;
   const visible=(!destroyed||departing)&&(s.state!=='transition'||s.t>=4.7);
   group.visible=upper.visible=forearm.visible=visible;if(!visible)return;
   const lost=departing?sat(s.t/1.2):0;
   group.position.set(h.x+(i?1:-1)*lost*12,h.y-35*lost-12*fall,h.z-12*lost);
   group.rotation.z=(i?1:-1)*(fall*.6+lost*.75)+(feral?Math.sin((g.time||0)*11+i)*.07:Math.sin((g.time||0)*1.5+i)*.016);
   fingers.forEach((finger,j)=>{finger.rotation.x=(feral?.18:.045)*Math.sin((g.time||0)*(feral?12:2)+j*.9+i*2);});
   shoulder.set(i?20:-20,18,7);body.localToWorld(shoulder);
   elbow.copy(shoulder).lerp(group.position,.53);
   elbow.x+=(i?1:-1)*9;elbow.y+=7;elbow.z-=6;
   boneBetween(upper,shoulder,elbow,5.5);boneBetween(forearm,elbow,group.position,4.7);
  });
  const sprayAge=s.state==='transition'?s.t-POSSESSION.launchEnd:-1;
  const bursting=sprayAge>=0&&sprayAge<1.25;
  sprayMat.opacity=bursting?.9*(1-sat((sprayAge-.5)/.75)):0;
  for(const q of spray){
   q.mesh.visible=bursting;if(!bursting)continue;
   const t=sprayAge;q.mesh.position.set(q.vx*t,44+q.vy*t-25*t*t,-139+q.vz*t);
   const scale=q.size*(.7+.7*sat(t/.2))*(1-.65*sat((t-.65)/.6));q.mesh.scale.setScalar(scale);
  }
  landmark.visible=s.state==='stagger';propMats.gold.emissive?.setHex?.(feral?0x4a1007:0x251008);
  const hazards=giantHazards(g);warnings.forEach((m,i)=>{const h=hazards[i];m.visible=!!h;if(!h)return;m.material=h.live?activeMat:warnMat;m.position.set(h.x,.14,h.z);m.geometry=['rect','rotated-rect'].includes(h.shape)?rect:h.shape==='ring'?ring:circle;m.rotation.y=h.yaw||0;
   if(h.shape==='rect'||h.shape==='rotated-rect')m.scale.set(h.w,1,h.h);else if(h.shape==='ring'){const r=Math.max(.1,h.r);m.scale.set(r+3,1,r+3);/* matched annulus uses a per-frame inner radius */m.geometry=ring;const pos=ring.attributes.position;for(let k=0;k<pos.count;k++){const a=k%65/64*Math.PI*2,v=k<65?Math.max(0,r-3):r+3;pos.setXYZ(k,Math.cos(a)*v/(r+3),0,Math.sin(a)*v/(r+3));}pos.needsUpdate=true;}else m.scale.set(h.r,1,h.r);
  });
  const falling=hazards.filter(h=>(s.slot===2||s.slot===6&&h.start>=2.7&&h.start<5.1)&&h.shape==='circle');chips.forEach((m,i)=>{const h=falling[i];m.visible=!!h&&s.temperament==='controlled';if(!m.visible)return;m.position.set(h.x,h.live?.7:1+45*(1-sat(h.age/h.warn)),h.z);m.rotation.z=h.live?0:h.age*2;});
  props.forEach((m,i)=>{
   const h=hazards[i],type=feral?(s.slot===4?'chess':s.slot===1||s.slot===6?'chip':null):({1:'chip',2:'dice',3:'coin',4:'chess',6:'coin'})[s.slot];
   m.visible=Boolean(type&&h&&!h.live);if(!m.visible)return;
   m.geometry=type==='chess'?(s.chessPiece==='rook'?propGeo.chessRook:s.chessPiece==='knight'?propGeo.chessKnight:propGeo.chess):propGeo[type];m.material=i%2?propMats.gold:propMats.black;
   m.position.set(h.x,2+12*(1-sat(h.age/h.warn)),h.z);
   m.rotation.set(type==='coin'?Math.PI/2+h.age*9:0,h.age*2+i,feral?h.age*5:0);
  });
 }};
}
