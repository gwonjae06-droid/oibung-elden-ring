import * as THREE from 'three';
import {CIRCUS_ROLES} from './clown-troupe.mjs';
import {solveFixedLimb,stageFootTarget,circusFootPhasing,smoothYaw} from './clown-performance-rig.mjs';
import {createSpringBank} from './secondary-physics.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
import {createClownTheatreCues} from './clown-theatre-cues.mjs';
// PBR geometry, articulating legs, role-specific apparatus, frame-independent
// movement and real theatrical cues. The troupe exists in the combat state;
// this view can never manufacture a damaging hitbox.
export function createCircusTroupeView(scene,{coarse=false,reduced=false,onActorCreated=null}={}){
 const root=new THREE.Group();root.name='seulwoo-living-circus-troupe';scene.add(root);
 const live=new Map(),hoops=new Map();
 const theatreCues=createClownTheatreCues(root,{coarse,reduced});
 const direction=new THREE.Vector3(),from=new THREE.Vector3(),to=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 function bone(mesh,a,b){from.set(...a);to.set(...b);direction.copy(to).sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.y=Math.max(.001,direction.length());
  mesh.quaternion.setFromUnitVectors(up,direction.normalize());}
 const geo=new THREE.SphereGeometry(1,coarse?12:22,coarse?8:16),
  cylinder=new THREE.CylinderGeometry(1,1,1,coarse?8:15);
 const mat={
  velvet:new THREE.MeshPhysicalMaterial({color:0x381621,roughness:.94,sheen:.47,sheenColor:0x73384a}),
  crimson:new THREE.MeshPhysicalMaterial({color:0x763044,roughness:.86,sheen:.36,sheenColor:0xa35d61}),
  ivory:new THREE.MeshPhysicalMaterial({color:0xcbbfb2,roughness:.79,clearcoat:.14,clearcoatRoughness:.81}),
  black:new THREE.MeshStandardMaterial({color:0x100e16,roughness:.52}),
  gilt:new THREE.MeshStandardMaterial({color:0x8e7759,metalness:.73,roughness:.43}),
  cyan:new THREE.MeshStandardMaterial({color:0x70a9a4,roughness:.67,emissive:0x12362e}),
  ember:new THREE.MeshStandardMaterial({color:0xe18a51,roughness:.54,emissive:0x9d3118,emissiveIntensity:.78})
 };
 const add=(parent,g,m,name,x=0,y=0,z=0)=>{
  const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);
   o.castShadow=!coarse&&/costume|mask-shadow-back|stage-shoe|ragged-velvet-coat-hem/.test(name);
   parent.add(o);return o;
 };
 const oval=(parent,m,name,x,y,z,rx,ry,rz)=>{const o=add(parent,geo,m,name,x,y,z);o.scale.set(rx,ry,rz);return o;};
 const tube=(parent,m,name,x,y,z,radius,length)=>{const o=add(parent,cylinder,m,name,x,y,z);o.scale.set(radius,length,radius);return o;};
 function actor(role){
  const group=new THREE.Group();group.name='circus-member-'+role;root.add(group);
  const body=new THREE.Group();group.add(body);let mask,shoulders=[],legs=[],fire=[],strings=[],head,jaw;
  const clothes=role==='acrobat'?mat.cyan:role==='firekeeper'?mat.crimson:mat.velvet;
  oval(body,clothes,'volumetric-theatre-costume',0,1.42,0,.56,.9,.36);
  const skirt=add(body,new THREE.ConeGeometry(.73,1.14,coarse?10:22,1,true),clothes,'ragged-velvet-coat-hem',0,.7,0);
  skirt.rotation.y=.21;
  const springs=createSpringBank();
  for(const s of [-1,1]){
   // Each troupe member has real, fixed-length thigh, knee, calf and shoe.
   // The old one-piece swinging trouser sent shoes through the stage.
   const thigh=tube(body,mat.black,'articulated-troupe-thigh',0,0,0,.16,1);
   const shin=tube(body,clothes,'articulated-troupe-shin',0,0,0,.14,1);
   const knee=oval(body,clothes,'constrained-troupe-knee',0,0,0,.19,.21,.2);
   const shoe=oval(body,mat.black,'solid-stage-shoe',0,0,0,.23,.15,.39);
   legs.push({side:s,thigh,shin,knee,shoe});
   const arm=new THREE.Group();arm.position.set(s*.52,1.94,0);body.add(arm);shoulders.push(arm);
   tube(arm,clothes,'articulated-performer-arm',s*.10,-.33,0,.16,.79);
   oval(arm,mat.ivory,'separate-gloved-hand',s*.17,-.75,.09,.17,.19,.20);
  }
  head=new THREE.Group();head.position.set(0,2.46,0);body.add(head);
  oval(head,mat.black,'mask-shadow-back',0,-.02,-.06,.43,.51,.39);
  mask=oval(head,mat.ivory,'hand-carved-rigid-performance-mask',0,0,.22,.40,.49,.25);
  for(const s of [-1,1]){
   oval(head,mat.black,'unlit-eye-socket',s*.17,.12,.42,.11,.15,.048);
   oval(head,mat.gilt,'thin-hairline-crack',s*.25,-.13,.424,.017,.20,.008);
  }
  jaw=oval(head,mat.black,'singing-mask-mouth',0,-.20,.438,.24,.08,.037);
  oval(head,mat.ivory,'chin-porcelain',[0][0],-.38,.27,.26,.11,.14);
  if(role==='chorister'){
   const hood=add(head,new THREE.ConeGeometry(.55,.95,coarse?12:22),clothes,'open-hood-and-choir-veil',0,.30,-.13);
   hood.rotation.x=-.11;
   for(let i=0;i<3;i++){const ring=add(head,new THREE.TorusGeometry(.30+i*.11,.017,6,coarse?14:36),mat.gilt,'harmonic-voice-ring',0,.03,.51+i*.05);ring.visible=true;}
  }
  if(role==='puppeteer'){
   for(const s of [-1,1]){
    const line=add(body,new THREE.CylinderGeometry(.008,.008,1.8,4),mat.gilt,'puppet-control-string',s*.8,.18,.50);strings.push(line);
    const puppet=oval(body,mat.ivory,'hanging-doll-face',s*.8,-.66,.50,.22,.28,.15);strings.push(puppet);
   }
  }
  if(role==='firekeeper'){
   for(const s of [-1,1]){
    const torch=add(body,new THREE.CylinderGeometry(.08,.12,1.2,10),mat.gilt,'burning-circus-torch',s*.79,1.62,.25);
    const flame=add(body,new THREE.ConeGeometry(.27,.9,coarse?8:16),mat.ember,'actual-visible-fire-cue',s*.79,2.62,.25);
    fire.push(flame);
   }
  }
  if(role==='acrobat'){
   const wreath=add(body,new THREE.TorusGeometry(1.06,.06,8,coarse?24:52),mat.gilt,'rear-acrobat-hoop',0,1.55,-.33);
   wreath.rotation.y=.3;
   oval(body,mat.crimson,'harlequin-shoulder-pennant',-.72,1.75,-.12,.23,.25,.40);
  }
  if(role==='mimic'){
   const hat=add(head,new THREE.CylinderGeometry(.29,.43,.75,coarse?12:24),mat.black,'false-ringmaster-tall-hat',0,.88,-.1);
   hat.rotation.z=-.1;
   add(head,new THREE.CylinderGeometry(.66,.66,.045,coarse?15:28),mat.gilt,'false-ringmaster-hat-brim',0,.53,-.1);
   const wing=add(body,new THREE.ConeGeometry(.62,1.4,coarse?8:15,1,true),mat.crimson,'false-ringmaster-short-coat',0,.63,-.35);
   wing.rotation.x=-.18;
  }
  // Newly summoned performers receive the same prefiltered PBR maps and
  // physically based environment shading as the boss, once at entrance.
  if(typeof onActorCreated==='function')onActorCreated(group);
  return {group,body,head,jaw,mask,shoulders,legs,fire,strings,skirt,springs,yaw:null,role};
 }
 function createHoop(z){
  const group=new THREE.Group();group.name='real-infernal-hoop-performance-cue';root.add(group);
  const material=new THREE.MeshBasicMaterial({color:0xf08145,transparent:true,opacity:.64,side:THREE.DoubleSide,depthWrite:false});
  const ring=add(group,new THREE.TorusGeometry(1,.10,8,coarse?28:54),material,'vertical-flame-arc');ring.rotation.y=.28;
  const core=add(group,new THREE.TorusGeometry(.89,.035,6,coarse?26:52),new THREE.MeshBasicMaterial({
   color:0xffdf8b,transparent:true,opacity:.72,depthWrite:false}),'bright-hot-hoop-interior');
  // Low-drawcall flaring flames: only a single instanced render batch.
  const count=coarse?12:22,flameGeo=new THREE.ConeGeometry(.11,.54,5),
   flameMat=new THREE.MeshBasicMaterial({color:0xffa45d,transparent:true,
    opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,
    side:THREE.DoubleSide,toneMapped:false}),
   tongues=new THREE.InstancedMesh(flameGeo,flameMat,count);
  tongues.name='individually-flaring-circus-fire-tongues';
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),direction=new THREE.Vector3(),
   quat=new THREE.Quaternion(),scale=new THREE.Vector3(),upAxis=new THREE.Vector3(0,1,0);
  for(let i=0;i<count;i++){
   const a=i*Math.PI*2/count,r=1.02+(i%3)*.038;
   point.set(Math.cos(a)*r,Math.sin(a)*r,0);
   direction.set(Math.cos(a),Math.sin(a),0);
   quat.setFromUnitVectors(upAxis,direction);
   scale.set(.76+(i%3)*.15,.86+(i%4)*.12,1);
   matrix.compose(point,quat,scale);tongues.setMatrixAt(i,matrix);
  }
  tongues.instanceMatrix.needsUpdate=true;
  tongues.frustumCulled=false;tongues.renderOrder=5;group.add(tongues);
  return {group,ring,core,tongues};
 }
 function update(g,dt=1/60){
  const troupe=g?.clown?.troupe,alive=troupe?.members||[],seen=new Set(),time=g?.time||0,
   h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  for(const m of alive){
   seen.add(m.id);let v=live.get(m.id);if(!v){v=actor(m.role);live.set(m.id,v);}
   const sway=(reduced?0:Math.sin(time*2.5+m.id*.9))*.06;
   v.group.position.set(m.x,Math.max(0,(m.down?-.22*Math.min(1,m.death/.6):0)),m.z);
   // Curtains reveal newly summoned actors over several frames instead of
   // snapping fully formed NPCs into existence on top of the player.
   v.group.scale.setScalar(Math.min(1,Math.max(.025,m.age/.45))*(m.down?1-.25*Math.min(1,m.death):1));
   v.yaw=v.yaw===null?m.yaw:smoothYaw(v.yaw,m.yaw,h,m.cast>0?25:14);
   v.group.rotation.y=v.yaw;
   v.group.visible=!m.down||m.death<1.45;
   const moving=Math.min(1,Math.hypot(m.vx,m.vz)/Math.max(1,CIRCUS_ROLES[m.role].speed));
   v.body.position.y=v.springs.step('pelvis-rise',m.down?-Math.min(1,m.death*2)*.35:sway+moving*.035,h,14);
   v.body.rotation.set(
    v.springs.step('pitch',m.down?Math.min(1.2,m.death*3):m.cast>0?-.13:0,h,15),0,
    v.springs.step('roll',m.down?Math.min(.8,m.death*1.2):sway*.4,h,12));
   v.skirt.rotation.x=v.springs.step('skirt',-.05+moving*.2+m.cast*.024,h,9);
   for(let i=0;i<2;i++){
    const side=i?1:-1,L=v.legs[i],phase=circusFootPhasing(m.step*3.0,moving,side),
      hip=[side*.30,.92,0];
    // Do not rely on a long capsule as a fake leg. Plant the actual shoe
    // after all parent transforms; swing toes leave the floor voluntarily.
    v.body.updateWorldMatrix(true,false);
    const target=stageFootTarget([side*.31,.16+phase.lift,phase.travel],
      point=>v.body.localToWorld(new THREE.Vector3(...point)).toArray(),
      point=>v.body.worldToLocal(new THREE.Vector3(...point)).toArray(),
      {floor:0,soleRadius:.15,worldScale:v.group.scale.y,plant:phase.support&&!m.down});
    const rig=solveFixedLimb(hip,target,{
      upper:.53,lower:.51,pole:[side*.34,.03,.36]});
    bone(L.thigh,rig.start,rig.joint);bone(L.shin,rig.joint,rig.end);
    L.knee.position.set(...rig.joint);L.shoe.position.set(...rig.end);
    // Keep the toe more horizontal on stage and tilt during the airborne step.
    L.shoe.rotation.x=v.springs.step('toe-'+side,phase.lift>0?-.21*phase.lift/Math.max(.02,.23):0,h,16)-v.body.rotation.x;
    const arm=v.shoulders[i];
    arm.rotation.z=v.springs.step('arm-spread-'+side,
      side*(m.cast>0?-.56:Math.sin(time*1.8+side)*.14),h,14);
    arm.rotation.x=v.springs.step('arm-reach-'+side,
      m.cast>0?-.65:Math.sin(m.step*3.0+side*Math.PI)*.16*moving,h,15);
   }
   v.head.rotation.x=v.springs.step('mask-head',m.cast>0?-.17:Math.sin(time*.8+m.id)*.055,h,12);
   // The mouth geometry's authored Y radius is .08, not 1. The old
   // assignment inflated singers' mouths into a giant slab on every note.
   v.jaw.scale.y=.08*(1+(m.role==='chorister'&&m.cast>0?1.4:0));
   for(const f of v.fire)f.scale.y=1+(reduced?0:Math.sin(time*8+m.id)*.10);
   if(m.flash>0)v.mask.material=mat.ember;else v.mask.material=mat.ivory;
   for(const s of v.strings)s.rotation.z=Math.sin(time*3+m.id)*.03;
  }
  for(const [id,v] of live)if(!seen.has(id)){root.remove(v.group); // Shared mesh geometry/material survive; private parts are reclaimed.
   v.group.traverse(o=>{if(o.geometry&&o.geometry!==geo&&o.geometry!==cylinder)o.geometry.dispose();});
   live.delete(id);
  }
  const hoopSet=new Set();
  for(const z of g?.clown?.zones||[]){
   if(z.sound!=='infernalHoops'||z.state!=='warn')continue;
   hoopSet.add(z.id);let v=hoops.get(z.id);if(!v){v=createHoop(z);hoops.set(z.id,v);}
   const progress=Math.min(1,z.age/Math.max(.1,z.warn));
   v.group.position.set(z.x,2.0+Math.sin(progress*Math.PI)*1.0,z.z);
   v.group.rotation.y=time*.55;v.group.scale.setScalar(Math.min(2.0,(z.r||2.0)*.43));
   v.ring.material.opacity=.30+.52*progress;
   v.group.rotation.z=Math.sin(time*1.35+z.id)*.055;
   v.tongues.material.opacity=(reduced?.55:.72)*(.55+.45*progress);
  }
  for(const [id,v] of hoops)if(!hoopSet.has(id)){
   root.remove(v.group);disposeScene(v.group);hoops.delete(id);
  }
  theatreCues.update(g,h);
 }
 function dispose(){for(const v of live.values())v.group.traverse(o=>{if(o.geometry&&o.geometry!==geo&&o.geometry!==cylinder)o.geometry.dispose();});
  live.clear();hoops.clear();theatreCues.dispose();root.parent?.remove(root);disposeScene(root);
  geo.dispose();cylinder.dispose();for(const x of Object.values(mat))x.dispose();}
 return {root,update,dispose,stats:()=>({performers:live.size,hoops:hoops.size,airCues:theatreCues.stats().active})};
}
