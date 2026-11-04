import {disposeScene} from './runtime/scene-resources.mjs';
import * as T from 'three';
import {giantHandPose,giantHazards} from './dice-giant.mjs';
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
  const arm=mesh(cylinder,suit.clone(),root,[5,1,5]);arm.material.transparent=true;arm.material.depthWrite=false;return {group,arm,fingers};});
 const ray=new T.Raycaster(),focus=new T.Vector3(),sight=new T.Vector3();
 const up=new T.Vector3(0,1,0),delta=new T.Vector3(),anchor=new T.Vector3();
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
 let last=null,death=0,disposed=false;
 return {root,occlude(camera,player){if(!root.visible)return;root.updateWorldMatrix(true,true);focus.set(player.x,1.2,player.z);sight.copy(focus).sub(camera.position);ray.far=sight.length();ray.set(camera.position,sight.normalize());for(const {arm} of hands)arm.material.opacity=ray.intersectObject(arm,false).length?.12:1;},dispose(){if(disposed)return;disposed=true;root.parent?.remove(root);return disposeScene(root,{extras:[circle,rect,ring,warnMat,activeMat,...Object.values(propGeo),...Object.values(propMats)]});},update(g,dt){if(disposed)return;if(last!==g){last=g;death=0;}const s=g.dice.giant;root.visible=!!s;if(!s)return;
  if(s.state==='dead')death+=Math.max(0,dt);s.deathVisual=death;
  const rise=s.state==='transition'?sat((s.t-4.35)/(POSSESSION.riseEnd-4.35)):1,fall=s.state==='dead'?Math.min(1,death/2):0;
  const lean=s.state==='stagger'?Math.min(1,s.t/.8):s.state==='recovery'&&s.lifting?1-Math.min(1,s.t/.8):0;
  body.visible=s.state!=='transition'||s.t>=4.35;body.position.set(0,23-23*(1-rise)-34*fall,-133+25*lean);
  const feral=s.temperament==='feral',rage=s.rageBeat||0;
  const breath=feral?Math.sin((g.time||0)*9)*.04:Math.sin((g.time||0)*1.4)*.015;
  body.rotation.x=fall*.35+lean*.6+(feral?.13:0)+breath+rage*.18;body.rotation.z=feral?Math.sin((g.time||0)*5)*.035:0;
  oldHead.visible=s.state==='transition'&&s.t>=POSSESSION.launchEnd&&s.t<4.65;
  const fly=sat((s.t-POSSESSION.launchEnd)/.8);oldHead.position.set(48*fly,43+25*Math.sin(fly*Math.PI),-127-8*fly);oldHead.rotation.z=fly*7;
  neck.visible=s.state!=='dead'&&(s.state!=='transition'||s.t>=4.5);anchor.set(0,45-25*lean,-119+25*lean);delta.set(g.dice.pose.x,g.dice.pose.y-4,g.dice.pose.z).sub(anchor);neck.position.copy(anchor).addScaledVector(delta,.5);neck.scale.set(5,delta.length(),5);neck.quaternion.setFromUnitVectors(up,delta.normalize());
  hands.forEach(({group,arm,fingers},i)=>{const h=giantHandPose(g,i);group.visible=arm.visible=s.state!=='transition'||s.t>=4.7;group.position.set(h.x,h.y-12*fall,h.z);group.rotation.z=(i?1:-1)*fall*.6+(feral?Math.sin((g.time||0)*11+i)*.07:Math.sin((g.time||0)*1.5+i)*.016);
   fingers.forEach((finger,j)=>{finger.rotation.x=(feral?.18:.045)*Math.sin((g.time||0)*(feral?12:2)+j*.9+i*2);});
   anchor.set(i?22:-22,40-20*fall-20*lean,-126+25*lean);delta.copy(group.position).sub(anchor);arm.position.copy(anchor).addScaledVector(delta,.5);arm.scale.set(5,delta.length(),5);arm.quaternion.setFromUnitVectors(up,delta.normalize());});
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
