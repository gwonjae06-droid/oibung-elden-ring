import * as THREE from 'three';
import {balletPartnerFrame} from './clown-ballet-score.mjs';
import {solveFixedLimb} from './clown-performance-rig.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

// One continuous, two-character ballet rig. Both statues are authored from
// sculpted silhouettes and articulated arms/legs; the real O Seulwoo portrait
// stays curved over the lead dancer's carved skull, never a flat photo plane.
export function createClownBalletDuet(scene,{coarse=false,reduced=false,originalPortrait=null}={}){
 const root=new THREE.Group();root.name='seulwoo-and-wooden-spouse-pas-de-deux';
 root.userData.decorativeOnly=true;root.visible=false;scene.add(root);
 const stage=new THREE.Group();stage.name='last-ballet-stage';root.add(stage);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(21.75,coarse?64:128),
  new THREE.MeshPhysicalMaterial({color:0x302128,metalness:.14,roughness:.42,clearcoat:.21,clearcoatRoughness:.4}));
 floor.rotation.x=-Math.PI/2;floor.position.y=.025;floor.receiveShadow=!coarse;stage.add(floor);
 for(let i=0;i<3;i++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(8.8+i*5.6,.018,5,coarse?48:96),
   new THREE.MeshStandardMaterial({color:i%2?0x9c6f63:0xa99386,roughness:.48,metalness:.36}));
  ring.rotation.x=Math.PI/2;ring.position.y=.035;stage.add(ring);
 }
 const light=new THREE.PointLight(0xffd5bc,1.12,27,2);light.position.set(0,13,0);stage.add(light);
 const ivory=new THREE.MeshPhysicalMaterial({color:0xd5b9a0,roughness:.65,clearcoat:.18,clearcoatRoughness:.78});
 const wood=new THREE.MeshPhysicalMaterial({color:0x80543a,roughness:.72,clearcoat:.23,clearcoatRoughness:.65});
 const ebony=new THREE.MeshPhysicalMaterial({color:0x211a20,roughness:.67,clearcoat:.17});
 const satin=new THREE.MeshPhysicalMaterial({color:0xe1c8bd,roughness:.63,sheen:.6,sheenColor:0xf4e2cd,side:THREE.DoubleSide});
 const wine=new THREE.MeshPhysicalMaterial({color:0x602838,roughness:.71,sheen:.55,sheenColor:0xad727a,side:THREE.DoubleSide});
 const gold=new THREE.MeshStandardMaterial({color:0xad8757,metalness:.54,roughness:.48});
 const tubeGeo=new THREE.CylinderGeometry(1,1,1,coarse?10:20);
 const sphere=new THREE.SphereGeometry(1,coarse?14:30,coarse?10:20);
 const up=new THREE.Vector3(0,1,0),A=new THREE.Vector3(),B=new THREE.Vector3(),V=new THREE.Vector3();
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
 const smooth=t=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
 const blob=(parent,material,name,x,y,z,sx,sy,sz)=>{
  const m=new THREE.Mesh(sphere,material);m.name=name;m.position.set(x,y,z);m.scale.set(sx,sy,sz);
  m.castShadow=!coarse;parent.add(m);return m;
 };
 function segment(mesh,a,b,r=.15){A.set(...a);B.set(...b);V.copy(B).sub(A);
  mesh.position.copy(A).add(B).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(up,V.clone().normalize());
  mesh.scale.set(r,Math.max(.01,V.length()),r);
 }
 const rod=(parent,mat,name)=>{const m=new THREE.Mesh(tubeGeo,mat);m.name=name;m.castShadow=!coarse;parent.add(m);return m};
 function dancer(isLead){
  const group=new THREE.Group();group.name=isLead?'o-seulwoo-male-ballet-dancer':'his-wood-carved-ballerino-spouse';
  root.add(group);
  const body=new THREE.Group();group.add(body);
  const skin=isLead?ivory:wood,costume=isLead?wine:satin;
  const shape=new THREE.LatheGeometry([
   [0,1.48],[.34,1.51],[.43,1.69],[.34,1.93],[.43,2.24],
   [.55,2.66],[.61,3.07],[.74,3.41],[.66,3.61],[.26,3.84],[0,3.88]
  ].map(([r,y])=>new THREE.Vector2(r,y)),coarse?22:48);
  const trunk=new THREE.Mesh(shape,costume);trunk.name='anatomical-dancer-waist-ribcage-and-shoulders';
  trunk.scale.z=.77;trunk.castShadow=!coarse;body.add(trunk);
  const hip=blob(body,costume,'carved-pelvis',0,1.61,0,.46,.28,.36);
  blob(body,skin,'long-ballet-neck',0,4.04,0,.19,.35,.19);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(.28,.038,8,24),gold);
  collar.rotation.x=Math.PI/2;collar.position.set(0,3.83,0);body.add(collar);
  const head=new THREE.Group();head.name='sculpted-wood-and-porcelain-head';head.position.set(0,4.56,.07);body.add(head);
  blob(head,skin,'solid-cranial-sculpture',0,0,0,.61,.85,.57);
  blob(head,isLead?ivory:wood,'solid-front-mask',0,-.07,.24,.53,.69,.34);
  if(isLead&&originalPortrait){
   const copy=new THREE.Mesh(originalPortrait.geometry.clone(),originalPortrait.material.clone());
   copy.name='original-o-seulwoo-photo-wrapped-on-ballet-face';
   copy.position.copy(originalPortrait.position);copy.position.z+=.07;
   copy.scale.copy(originalPortrait.scale).multiplyScalar(.83);
   copy.visible=false;head.add(copy);
   group.userData.portrait=copy;
  }else{
   for(const side of[-1,1]){
    blob(head,ebony,'carved-eyes',side*.23,.17,.53,.095,.072,.04);
    const groove=blob(head,gold,'gold-tear-grain',side*.31,-.21,.48,.019,.27,.025);
    groove.rotation.z=side*.16;
   }
   blob(head,ebony,'mournful-lips',0,-.40,.51,.31,.04,.04);
   for(let i=0;i<12;i++){
    const a=i*Math.PI*2/12;
    const strand=blob(head,wood,'wood-carved-ripple-hair',Math.sin(a)*.49,.53,Math.cos(a)*.38,
     .10,.35,.11);strand.rotation.z=Math.sin(a)*.22;
   }
  }
  const forehead=new THREE.Mesh(new THREE.TorusGeometry(.53,.026,6,40,Math.PI),gold);
  forehead.position.y=.49;forehead.rotation.z=Math.PI;head.add(forehead);
  for(const side of[-1,1]){
   const shoulder=blob(body,skin,'deltoid-carving',side*.7,3.53,0,.22,.26,.23);
   shoulder.rotation.z=side*.17;
   for(let i=0;i<9;i++){
    const y=1.84+i*.2;
    blob(body,i%3===0?gold:skin,'raised-wood-grain-seam',side*(.40+.035*Math.sin(i)),y,.38,.018,.055,.012);
   }
  }
  // Ballet tights, shaped ankle shoes and a narrow male dancer silhouette.
  for(const side of[-1,1]){
   blob(body,ebony,'fitted-hip-seam',side*.28,1.39,.16,.15,.12,.22);
  }
  const arms=[],legs=[];
  for(const side of[-1,1]){
   const upper=rod(body,skin,'rigged-upper-arm'),lower=rod(body,skin,'rigged-forearm');
   const elbow=blob(body,skin,'elbow-joint',side*.85,2.96,.06,.18,.18,.18);
   const hand=blob(body,skin,'sculpted-male-ballet-hand',side*1.38,2.55,.3,.16,.26,.13);
   const fingers=[];
   for(let j=0;j<4;j++)fingers.push(blob(hand,skin,'separated-ballet-finger',(j-1.5)*.31,-.86,.06,.095,.54,.26));
   arms.push({side,upper,lower,elbow,hand,previous:null});
   const thigh=rod(body,isLead?ebony:skin,'articulated-ballet-thigh');
   const shin=rod(body,isLead?ebony:skin,'articulated-ballet-calf');
   const knee=blob(body,isLead?ebony:skin,'knee-patella',side*.3,.82,.05,.17,.18,.18);
   const foot=blob(body,isLead?satin:skin,'pointed-ballet-slipper',side*.32,.14,.13,.18,.14,.36);
   legs.push({side,thigh,shin,knee,foot});
  }
  // A pair of actual fabric coattails, not billboard wings.
  const veils=[];
  for(const side of[-1,1]){
   const scarf=new THREE.Mesh(new THREE.PlaneGeometry(.43,1.66,1,9),isLead?wine:satin);
   scarf.name='joint-carried-ritual-silk';scarf.position.set(side*.41,1.60,-.36);
   scarf.rotation.x=.19;body.add(scarf);veils.push({mesh:scarf,side});
  }
  function update(position,time,{phase=false,intro=1,lead=false}={}){
   group.visible=intro>.001;
   group.position.set(position.x,0,position.z);
   group.scale.setScalar(1.25*(.82+.18*intro));
   group.rotation.y=position.yaw;
   const beat=Math.max(0,time),expression=phase?1:0;
   const balletKick=expression*Math.sin(beat*3.9+(lead?0:Math.PI));
   const lifted=Math.max(0,balletKick)*.23;
   body.position.y=lifted+(phase?Math.sin(beat*2.2)*.06:0);
   body.rotation.set(-.04-.12*expression*Math.sin(beat*2.5),0,
    Math.sin(beat*1.8+(lead?0:Math.PI))*.13*expression+position.bow);
   head.rotation.y=Math.sin(beat*1.27+(lead?0:Math.PI))*.18*expression;
   head.rotation.z=-body.rotation.z*.68;
   if(group.userData.portrait){
    const m=group.userData.portrait;
    m.visible=Boolean(originalPortrait?.visible);
    if(m.material.map!==originalPortrait?.material?.map){
     m.material.map=originalPortrait?.material?.map||null;m.material.needsUpdate=true;
    }
   }
   for(const x of arms){
    const side=x.side;
    const shoulder=[side*.70,3.49,.02];
    const beatArm=Math.sin(beat*2.35+(lead?0:Math.PI))*.26*expression;
    const wrist=[side*(1.51+expression*.35),2.84+expression*(.58+beatArm)*.86,
     .26+expression*.25];
    const ik=solveFixedLimb(shoulder,wrist,{upper:1.08,lower:1.10,pole:[side*.8,.07,.35],previous:x.previous});
    x.previous=ik.joint;
    segment(x.upper,ik.start,ik.joint,.17);segment(x.lower,ik.joint,ik.end,.13);
    x.elbow.position.set(...ik.joint);x.hand.position.set(...ik.end);
    x.hand.rotation.z=-side*(.16+expression*.16);
   }
   for(const l of legs){
    const side=l.side;
    const legBeat=Math.sin(beat*2.25+(side>0?Math.PI:0)+(lead?0:Math.PI));
    const rise=expression*Math.max(0,legBeat)*.32;
    const ankle=[side*(.32+expression*.12),.15+rise,(expression*.22)*legBeat+.11];
    const ik=solveFixedLimb([side*.31,1.51,0],ankle,
      {upper:.83,lower:.83,pole:[side*.44,.06,.36]});
    segment(l.thigh,ik.start,ik.joint,.23);segment(l.shin,ik.joint,ik.end,.14);
    l.knee.position.set(...ik.joint);l.foot.position.set(...ik.end);
    l.foot.rotation.x=-.22-expression*.35*Math.max(0,legBeat);
    l.foot.rotation.y=side*(.24+expression*.12);
   }
   for(const tail of veils){
    tail.mesh.rotation.x=.15+Math.sin(beat*1.5+tail.side)*.14*expression;
    tail.mesh.rotation.z=tail.side*(.15+.12*expression);
   }
  }
  return {group,update};
 }
 const lead=dancer(true),partner=dancer(false),ribbons=new Map();
 function makeRibbon(z){
  const g=new THREE.Group();g.name='physical-woven-silk-warning-'+z.id;
  const mat=new THREE.MeshPhysicalMaterial({color:z.shape==='lane'?0xbfa99e:0xb47a86,
   side:THREE.DoubleSide,roughness:.56,transparent:true,opacity:.34,depthWrite:false});
  if(z.shape==='lane'){
   const mesh=new THREE.Mesh(new THREE.PlaneGeometry(z.w,Math.max(.1,z.len),1,5),mat);
   mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-z.yaw;
   mesh.position.set(z.x+Math.sin(z.yaw)*z.len/2,.115,z.z+Math.cos(z.yaw)*z.len/2);
   g.add(mesh);
  }else{
   const hoop=new THREE.Mesh(new THREE.TorusGeometry(z.r,.065,8,coarse?36:72),mat);
   hoop.rotation.x=Math.PI/2;hoop.position.set(z.x,.14,z.z);g.add(hoop);
  }
  stage.add(g);return g;
 }
 let disposed=false;
 function reset(){root.visible=false;for(const o of ribbons.values()){stage.remove(o);disposeScene(o);}ribbons.clear();}
 function update(g,dt=1/60){
  if(disposed)return;
  const f=balletPartnerFrame(g);root.visible=f.active;
  if(!f.active){if(ribbons.size)reset();return;}
  const t=f.transition?Math.max(0,g.boss.t||0):g.clown.time||0;
  lead.update(f.lead,t,{phase:!f.transition,intro:f.transition?smooth((t-1.1)/2.3):1,lead:true});
  partner.update(f.partner,t,{phase:!f.transition,intro:f.transition?smooth((t-.3)/3.1):1,lead:false});
  light.intensity=1.10+(reduced?0:.15*Math.sin(t*1.4));
  const seen=new Set();
  for(const z of g.clown.zones||[]){
   if(z.state!=='warn'||!/^ballet/.test(z.sound||''))continue;
   seen.add(z.id);
   let v=ribbons.get(z.id);if(!v){v=makeRibbon(z);ribbons.set(z.id,v);}
   const progress=clamp(z.age/Math.max(.1,z.warn),0,1);
   v.scale.y=1;
   for(const m of v.children)m.material.opacity=.16+.38*progress;
  }
  for(const [id,v] of ribbons)if(!seen.has(id)){stage.remove(v);disposeScene(v);ribbons.delete(id);}
 }
 function dispose(){if(disposed)return;disposed=true;reset();root.parent?.remove(root);disposeScene(root);}
 return {root,update,reset,dispose};
}
