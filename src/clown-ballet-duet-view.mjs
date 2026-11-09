import * as THREE from 'three';
import {balletPartnerFrame} from './clown-ballet-score.mjs';
import {solveFixedLimb} from './clown-performance-rig.mjs';
import {balletSculptPose,blendBalletPose} from './clown-ballet-choreography.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {createBalletTorsoGeometry,createBalletMuscleLimbGeometry} from './clown-ballet-anatomy.mjs';

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
 const ivory=new THREE.MeshPhysicalMaterial({color:0xcfa78c,roughness:.66,clearcoat:.18,clearcoatRoughness:.78});
 const wood=new THREE.MeshPhysicalMaterial({color:0x80543a,roughness:.72,clearcoat:.23,clearcoatRoughness:.65});
 const birch=new THREE.MeshPhysicalMaterial({color:0xe1bfa8,roughness:.53,clearcoat:.24,clearcoatRoughness:.59});
 const hairWood=new THREE.MeshPhysicalMaterial({color:0x4b322c,roughness:.59,clearcoat:.17});
 const ebony=new THREE.MeshPhysicalMaterial({color:0x17171b,roughness:.88,clearcoat:.035});
 const satin=new THREE.MeshPhysicalMaterial({color:0xf2eee9,roughness:.50,sheen:.36,sheenColor:0xf9f6f1,side:THREE.DoubleSide});
 const wine=new THREE.MeshPhysicalMaterial({color:0x321f29,roughness:.74,sheen:.26,side:THREE.DoubleSide});
 const gold=new THREE.MeshStandardMaterial({color:0xad8757,metalness:.54,roughness:.48});
 const limbGeos=Object.fromEntries(['upperArm','forearm','thigh','calf'].map(kind=>
  [kind,createBalletMuscleLimbGeometry(THREE,{kind,coarse})]));
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
 const rod=(parent,mat,name,kind)=>{const m=new THREE.Mesh(limbGeos[kind],mat);m.name=name;m.castShadow=!coarse;parent.add(m);return m};
 function dancer(isLead){
  const group=new THREE.Group();group.name=isLead?'o-seulwoo-male-ballet-dancer':'his-faceless-wood-carved-ballerina-spouse';
  root.add(group);
  const body=new THREE.Group();group.add(body);
  const skin=isLead?ivory:birch,costume=isLead?ebony:satin;
  // Photo-inspired morphology: continuous muscle and ribcage in the
  // airborne male, narrow waist with an uninterrupted white leotard in the
  // wooden ballerina. Skin/garment are distinct surface groups in one loft.
  const shape=createBalletTorsoGeometry(THREE,{lead:isLead,coarse});
  const trunk=new THREE.Mesh(shape,[skin,costume]);
  trunk.name='anatomical-dancer-waist-ribcage-and-shoulders';
  trunk.castShadow=!coarse;body.add(trunk);
  trunk.userData.reference=isLead?'bare-male-sculpted-thorax-and-black-tights':'white-sleeveless-ballet-leotard-and-carved-wood';
  const hip=blob(body,costume,'carved-pelvis',0,1.59,0,isLead?.47:.48,.25,isLead?.33:.35);
  if(isLead){
   // Relieved pectoral, sternum and abdominal planes. These are shallow
   // pieces of sculpture, not floating armour or a flat body texture.
   for(const side of[-1,1]){
    const chest=blob(body,skin,'sculpted-male-pectoral',side*.32,3.17,.355,.33,.21,.105);
    chest.rotation.z=-side*.12;
    blob(body,skin,'relief-serratus-muscle',side*.52,2.74,.29,.115,.27,.095);
    for(let i=0;i<3;i++){
     const abdominal=blob(body,skin,'sculpted-abdominal-muscle',side*.16,2.38+i*.21,.30,.15,.105,.055);
     abdominal.rotation.z=side*.085;
    }
    blob(body,skin,'sculpted-collarbone',side*.38,3.52,.24,.36,.06,.075).rotation.z=-side*.13;
   }
   blob(body,skin,'soft-relief-sternum',0,3.10,.41,.07,.32,.075);
  }else{
   // No tutu: the reference is a short, clean sleeveless leotard, open
   // through the hips with leg lines fully visible.
   const trim=blob(body,satin,'reference-white-ballet-leotard',0,2.06,.01,.32,.18,.275);
   trim.scale.set(.98,.45,.98);
   const seam=new THREE.Mesh(new THREE.TorusGeometry(.33,.017,8,coarse?24:48),satin);
   seam.name='minimal-leotard-hip-edge';seam.rotation.x=Math.PI/2;seam.scale.set(1.42,1.11,1);
   seam.position.y=1.77;body.add(seam);
  }
  blob(body,skin,'long-ballet-neck',0,4.04,0,isLead?.19:.155,.37,isLead?.19:.15);
  if(isLead){const collar=new THREE.Mesh(new THREE.TorusGeometry(.28,.038,8,24),gold);
   collar.rotation.x=Math.PI/2;collar.position.set(0,3.83,0);body.add(collar);}
  const head=new THREE.Group();head.name='sculpted-wood-and-porcelain-head';head.position.set(0,4.56,.07);body.add(head);
  blob(head,skin,'solid-cranial-sculpture',0,0,0,isLead?.61:.54,isLead?.85:.75,isLead?.57:.49);
  blob(head,skin,isLead?'solid-front-mask':'unmarked-smooth-wooden-face',0,-.07,.23,isLead?.53:.47,isLead?.69:.62,isLead?.34:.25);
  if(isLead&&originalPortrait){
   const copy=new THREE.Mesh(originalPortrait.geometry.clone(),originalPortrait.material.clone());
   copy.name='original-o-seulwoo-photo-wrapped-on-ballet-face';
   copy.position.copy(originalPortrait.position);copy.position.z+=.07;
   copy.scale.copy(originalPortrait.scale).multiplyScalar(.83);
   copy.visible=false;head.add(copy);
   group.userData.portrait=copy;
  }else if(!isLead){
   // The partner is a faceless female wooden statue. No carved eyes, nose,
   // lips, tears or faux skin makeup: beauty comes from the polished outline.
   blob(head,hairWood,'sculpted-classical-ballet-bun',0,.45,-.46,.36,.33,.35);
   const cap=blob(head,hairWood,'swept-carved-hair-cap',0,.58,-.12,.47,.26,.42);
   cap.rotation.x=-.12;
   for(let i=0;i<(coarse?5:9);i++){
    const a=(i/((coarse?5:9)-1)-.5)*2.25;
    const curl=blob(head,hairWood,'radial-bun-woodgrain',Math.sin(a)*.29,.49,-.70+Math.cos(a)*.08,
     .035,.19,.045);curl.rotation.z=-a*.22;
   }
  }
  if(isLead){
   const forehead=new THREE.Mesh(new THREE.TorusGeometry(.53,.026,6,40,Math.PI),ivory);
   forehead.position.y=.49;forehead.rotation.z=Math.PI;head.add(forehead);
  }
  for(const side of[-1,1]){
   const shoulder=blob(body,skin,isLead?'sculpted-shoulder-deltoid':'rounded-wood-shoulder',side*(isLead?.72:.55),3.53,0,isLead?.235:.16,.24,.205);
   shoulder.rotation.z=side*.17;
   for(let i=0;i<(coarse?5:9);i++){
    const y=1.84+i*.2;
    blob(body,i%3===0?gold:skin,'raised-wood-grain-seam',side*(.35+.035*Math.sin(i)),y,.29,.012,.05,.010);
   }
  }
  // Ballet tights, shaped ankle shoes and a narrow male dancer silhouette.
  for(const side of[-1,1]){
   if(isLead)blob(body,ebony,'fitted-hip-seam',side*.28,1.39,.16,.15,.12,.22);
  }
  const arms=[],legs=[];
  for(const side of[-1,1]){
   const upper=rod(body,skin,'rigged-upper-arm','upperArm'),lower=rod(body,skin,'rigged-forearm','forearm');
   const elbow=blob(body,skin,'elbow-joint',side*.85,2.96,.06,isLead?.18:.145,.17,.16);
   const hand=blob(body,skin,isLead?'sculpted-male-ballet-hand':'sculpted-ballerina-palm',side*1.38,2.55,.3,isLead?.16:.13,.25,.115);
   const fingers=[];
   for(let j=0;j<4;j++)fingers.push(blob(hand,skin,'separated-ballet-finger',(j-1.5)*.30,-.87,.07,.085,.51,.23));
   const wrist=blob(body,skin,'articulated-ballet-wrist',side*1.33,2.6,.28,.105,.125,.115);
   arms.push({side,upper,lower,elbow,wrist,hand,fingers,previous:null});
   const thigh=rod(body,isLead?ebony:skin,'articulated-ballet-thigh','thigh');
   const shin=rod(body,isLead?ebony:skin,'articulated-ballet-calf','calf');
   const knee=blob(body,isLead?ebony:skin,'knee-patella',side*.3,.82,.05,isLead?.17:.14,.18,.16);
   const ankleJoint=blob(body,skin,'ballet-ankle-hinge',side*.32,.19,.13,.11,.14,.12);
   const foot=blob(body,isLead?ebony:satin,'pointed-ballet-slipper',side*.32,.14,.13,isLead?.18:.13,.12,isLead?.38:.35);
   const toe=blob(foot,isLead?ebony:satin,'carved-extended-pointe-tip',0,-.21,.83,.74,.45,.30);
   legs.push({side,thigh,shin,knee,ankleJoint,foot,toe,previous:null});
  }
  // A pair of actual fabric coattails, not billboard wings.
  const veils=[];
  for(const side of[-1,1]){
   const scarf=new THREE.Mesh(new THREE.PlaneGeometry(isLead?.23:.27,isLead?.86:1.05,1,9),isLead?ebony:satin);
   scarf.name='joint-carried-ritual-silk';scarf.position.set(side*.41,1.60,-.36);scarf.visible=false;
   scarf.rotation.x=.19;body.add(scarf);veils.push({mesh:scarf,side});
  }
  let smoothedPose=null;
  function update(position,time,{phase=false,intro=1,lead=false,pattern='',beat=0,dt=1/60}={}){
   group.visible=intro>.001;
   group.position.set(position.x,0,position.z);
   group.scale.setScalar(1.25*(.82+.18*intro));
   // Root yaw is driven by the same simulation frame as the hurtboxes.
   // Only local joint poses are damped, never the attack position itself.
   group.rotation.y=position.yaw;
   const target=balletSculptPose({time,beat,active:phase,pulse:position.pulse||0,
    lead,pattern,reduced,showcase:phase?0:intro});
   smoothedPose=blendBalletPose(smoothedPose,target,dt,isLead?9.6:8.4);
   const p=smoothedPose;
   body.position.y=p.bodyLift;
   body.rotation.set(p.chestPitch,p.chestYaw,p.chestRoll+position.bow);
   hip.rotation.y=p.pelvisYaw;
   head.rotation.set(p.headPitch,p.headYaw-p.chestYaw*.4,p.headRoll-body.rotation.z*.52);
   if(group.userData.portrait){
    const m=group.userData.portrait;
    m.visible=Boolean(originalPortrait?.visible);
    if(m.material.map!==originalPortrait?.material?.map){
     m.material.map=originalPortrait?.material?.map||null;m.material.needsUpdate=true;
    }
   }
   for(const x of arms){
    const side=x.side,left=side<0;
    const shoulder=[side*(isLead?.72:.55),3.49,.02];
    const wrist=[side*(left?p.leftReach:p.rightReach),
     left?p.leftArmY:p.rightArmY,left?p.leftArmZ:p.rightArmZ];
    const ik=solveFixedLimb(shoulder,wrist,{
     upper:isLead?1.08:1.11,lower:isLead?1.10:1.12,
     pole:[side*.8,.07,.35],previous:x.previous
    });
    x.previous=ik.joint;
    segment(x.upper,ik.start,ik.joint,isLead?.195:.135);
    segment(x.lower,ik.joint,ik.end,isLead?.147:.102);
    x.elbow.position.set(...ik.joint);x.hand.position.set(...ik.end);
    x.wrist.position.set(...ik.end);
    x.hand.rotation.z=left?p.leftWrist:p.rightWrist;
    x.hand.rotation.x=.06*Math.sin(time*1.35+side);
    for(let j=0;j<x.fingers.length;j++){
     x.fingers[j].rotation.z=side*.04+(j-1.5)*.035+
      .025*Math.sin(time*1.1+j*.4);
    }
   }
   for(const l of legs){
    const side=l.side,left=side<0;
    const rise=left?p.leftLegLift:p.rightLegLift;
    const trail=left?p.leftLegTrail:p.rightLegTrail;
    const pointe=left?p.leftPointe:p.rightPointe;
    const groundPointe=.24*Math.sin(Math.max(0,pointe))*Math.max(0,1-rise*1.2);
    const ankle=[side*(.32+rise*.13)+(left?p.leftAnkleX:p.rightAnkleX||0),
     .15+rise+groundPointe,.11+trail];
    const ik=solveFixedLimb([side*.31,1.51,0],ankle,{
     upper:.83,lower:.83,pole:[side*(.44+(left?p.leftKneeOut:p.rightKneeOut||0)),
      (left?p.leftKneeUp:p.rightKneeUp||0),.36],previous:l.previous
    });
    l.previous=ik.joint;
    segment(l.thigh,ik.start,ik.joint,isLead?.25:.185);
    segment(l.shin,ik.joint,ik.end,isLead?.164:.122);
    l.knee.position.set(...ik.joint);
    l.ankleJoint.position.set(...ik.end);
    l.foot.position.set(...ik.end);
    // Positive X bends the forward-oriented slipper down onto the toe box.
    l.foot.rotation.x=pointe;
    l.foot.rotation.y=side*(.23+rise*.23);
    l.foot.rotation.z=side*rise*.15;
   }
   for(const tail of veils){
    tail.mesh.visible=phase&&p.silkFloat>.06;
    tail.mesh.rotation.x=.15+p.silkFloat*Math.sin(time*1.5+tail.side);
    tail.mesh.rotation.z=tail.side*(.15+p.silkFloat);
   }
  }
  function resetPose(){smoothedPose=null;
   for(const arm of arms)arm.previous=null;
   for(const leg of legs)leg.previous=null;
  }
  return {group,update,resetPose};
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
 function reset(){root.visible=false;lead.resetPose();partner.resetPose();
  for(const o of ribbons.values()){stage.remove(o);disposeScene(o);}ribbons.clear();}
 function update(g,dt=1/60){
  if(disposed)return;
  const f=balletPartnerFrame(g);root.visible=f.active;
  if(!f.active){if(ribbons.size)reset();return;}
  const t=f.transition?Math.max(0,g.boss.t||0):g.clown.time||0;
  lead.update(f.lead,t,{phase:!f.transition,intro:f.transition?smooth((t-1.1)/2.3):1,
   lead:true,pattern:f.pattern,beat:f.time,dt});
  partner.update(f.partner,t,{phase:!f.transition,intro:f.transition?smooth((t-.3)/3.1):1,
   lead:false,pattern:f.pattern,beat:f.time,dt});
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
 return {root,update,reset,dispose,
  prepareGpuWarmup:()=>{root.visible=true;lead.group.visible=true;partner.group.visible=true;},
  finishGpuWarmup:()=>{root.visible=false;}};
}
