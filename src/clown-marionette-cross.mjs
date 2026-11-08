import * as THREE from 'three';
import {clownPhase2Beat} from './clown-phase2-score.mjs';

// Phase-two identity: Seulwoo IS the marionette. The wooden X never performs
// damage. Every filament follows an actual world-transformed face, wrist,
// shoulder, hip or shoe joint on his articulated Three.js model.
export function createClownMarionetteCross({root,body,head,arms,legs,coarse=false}){
 const puppet=new THREE.Group();
 puppet.name='seulwoo-act-two-X-shaped-wooden-marionette-controller';
 puppet.userData.decorativeOnly=true;puppet.visible=false;root.add(puppet);
 const brown=new THREE.MeshStandardMaterial({color:0x75452b,roughness:.88,metalness:.02}),
  grain=new THREE.MeshStandardMaterial({color:0x3a241e,roughness:1}),
  rim=new THREE.MeshStandardMaterial({color:0xb39b76,roughness:.49,metalness:.62}),
  silk=new THREE.MeshPhysicalMaterial({color:0xd4c8c1,emissive:0x75615f,
   emissiveIntensity:.15,roughness:.63,transparent:true,opacity:.85,depthWrite:false});
 const material=[brown,grain,rim,silk];
 const beamGeo=new THREE.BoxGeometry(1,1,1),ropeGeo=new THREE.CylinderGeometry(.014,.019,1,coarse?5:8,1),
  knotGeo=new THREE.TorusGeometry(.085,.016,coarse?5:8,coarse?10:16),
  hubGeo=new THREE.CylinderGeometry(.30,.3,.22,coarse?8:18),
  screwGeo=new THREE.SphereGeometry(.064,coarse?6:10,coarse?4:7);
 const geometries=[beamGeo,ropeGeo,knotGeo,hubGeo,screwGeo];
 const upper=new THREE.Group();upper.name='aged-marionette-X-crossboard';upper.position.set(0,8.25,-1.92);
 puppet.add(upper);
 function wood(a,b,index){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dir=to.clone().sub(from);
  const plank=new THREE.Mesh(beamGeo,brown);
  plank.name='genuine-crossed-wooden-puppet-plank-'+index;
  plank.position.copy(from).add(to).multiplyScalar(.5);
  plank.scale.set(.33,dir.length(),.28);
  plank.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());
  upper.add(plank);
  const scratch=new THREE.Mesh(beamGeo,grain);
  scratch.name='engraved-old-wood-grain';
  scratch.scale.set(.14,.88,.06);
  scratch.position.set(0,0,.54);plank.add(scratch);
 }
 wood([-2.72,-1.02,0],[2.72,1.02,0],0);
 wood([-2.72,1.02,0],[2.72,-1.02,0],1);
 const hub=new THREE.Mesh(hubGeo,rim);
 hub.name='marionette-iron-control-central-pivot';hub.rotation.x=Math.PI/2;
 upper.add(hub);
 for(const [i,x,y] of [[0,-2.72,-1.02],[1,2.72,1.02],[2,-2.72,1.02],[3,2.72,-1.02]]){
  const hook=new THREE.Mesh(screwGeo,rim);
  hook.name='wooden-X-rope-fastening-hook-'+i;hook.position.set(x,y,.23);upper.add(hook);
 }
 const Y=new THREE.Vector3(0,1,0),origin=new THREE.Vector3(),
  dest=new THREE.Vector3(),vec=new THREE.Vector3(),attach=new THREE.Vector3();
 const bindings=[
  {anchor:[0,0,.14],joint:[0,4.73,-.20],name:'back-of-head'},
  {anchor:[-1.1,.54,.08],joint:[-.89,3.52,-.34],name:'left-shoulder'},
  {anchor:[1.1,.54,.08],joint:[.89,3.52,-.34],name:'right-shoulder'},
  {anchor:[-2.6,-.97,.08],joint:null,arm:0,name:'left-wrist'},
  {anchor:[2.6,.97,.08],joint:null,arm:1,name:'right-wrist'},
  {anchor:[-1.62,-.44,.13],joint:[-.55,1.24,-.37],name:'left-hip'},
  {anchor:[1.62,.44,.13],joint:[.55,1.24,-.37],name:'right-hip'},
  {anchor:[-2.3,.68,.07],joint:null,leg:0,name:'left-ankle'},
  {anchor:[2.3,-.68,.07],joint:null,leg:1,name:'right-ankle'},
  {anchor:[0,-.04,.12],joint:[0,2.7,-.45],name:'spine'}
 ];
 const strings=bindings.map((binding,i)=>{
  const rope=new THREE.Mesh(ropeGeo,silk);
  rope.name='real-marionette-string-'+binding.name;puppet.add(rope);
  const knot=new THREE.Mesh(knotGeo,rim);
  knot.name='tied-knot-'+binding.name;knot.rotation.x=Math.PI/2;puppet.add(knot);
  return {binding,rope,knot,i};
 });
 let previous=null,disposed=false;
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
 function update(g){
  if(disposed)return;
  const phase=g?.boss?.phase===2&&g?.status==='playing';
  puppet.visible=phase;
  if(!phase)return;
  const beat=clownPhase2Beat(g),time=g?.clown?.time||0;
  const progress=g.boss.state==='transition'?smooth(((g.boss.t||0)-.72)/1.5):1;
  // The complete crossed apparatus lowers behind the actor during the
  // unskippable transition, and stays attached to all limbs afterwards.
  upper.position.y=8.25+2.7*(1-progress);
  upper.rotation.z=.045*Math.sin(time*.71);
  upper.rotation.x=-.065+.035*Math.sin(time*.82);
  silk.opacity=(.08+.76*progress)*(g.boss.state==='transition'?1:.97);
  root.updateWorldMatrix(true,true);
  body.updateWorldMatrix(true,true);
  upper.updateWorldMatrix(true,true);
  for(const {binding,rope,knot,i} of strings){
   origin.set(...binding.anchor);upper.localToWorld(origin);puppet.worldToLocal(origin);
   if(binding.arm!==undefined){
    attach.copy(arms[binding.arm].hand.position);
    // Individual hand joints are children of the animated torso group.
   }else if(binding.leg!==undefined){
    attach.copy(legs[binding.leg].shoe.position);
   }else if(binding.name==='back-of-head')attach.copy(head.position);
   else attach.set(...binding.joint);
   body.localToWorld(attach);puppet.worldToLocal(attach);
   // Fasten on the back of the clothing, not directly through the face.
   attach.z-=binding.name==='spine'?.38:.23;
   const sag=(1-progress)*.24;
   vec.copy(attach).sub(origin);
   rope.position.copy(origin).add(attach).multiplyScalar(.5);
   rope.position.x+=Math.sin(time*2.7+i*1.8)*.022*progress;
   rope.position.z-=sag;
   const length=Math.max(.02,vec.length());
   rope.quaternion.setFromUnitVectors(Y,vec.multiplyScalar(1/length));
   rope.scale.set(1,length,1);
   knot.position.copy(attach);knot.scale.setScalar(.68+.08*Math.sin(time*3+i));
  }
  previous=g;
 }
 function dispose(){if(disposed)return;disposed=true;puppet.removeFromParent();
  for(const m of material)m.dispose();for(const x of geometries)x.dispose();}
 return {root:puppet,update,dispose,stats:()=>({woodenPlanks:2,strings:strings.length,phase2Visible:puppet.visible})};
}
