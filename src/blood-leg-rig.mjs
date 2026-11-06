import * as THREE from 'three';
import {bloodFootTargets} from './blood-footwork.mjs';
import {createWeightedJoint} from './joint-skinning.mjs';
const down=new THREE.Vector3(0,-1,0),axis=new THREE.Vector3(),bend=new THREE.Vector3(),elbow=new THREE.Vector3(),target=new THREE.Vector3(),upper=new THREE.Vector3(),lower=new THREE.Vector3();
const hipQ=new THREE.Quaternion(),shinQ=new THREE.Quaternion(),worldQ=new THREE.Quaternion(),bootQ=new THREE.Quaternion();
const hint=new THREE.Vector3(0,0,1),up=new THREE.Vector3(0,1,0),L=.73;
export function createBloodLegRig(actor,{dark,metal,edge,coarse=false}){
 const mesh=(parent,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 const legs=[-1,1].map(side=>{
  const hip=new THREE.Group();hip.name='blood-hip-'+side;hip.position.set(side*.46,1.48,.10);actor.add(hip);
  mesh(hip,new THREE.CylinderGeometry(.19,.15,L,10),dark,0,-L/2,0);
  const knee=new THREE.Group();knee.position.y=-L;hip.add(knee);
  mesh(knee,new THREE.SphereGeometry(.19,10,8),metal,0,0,.035);
  mesh(knee,new THREE.CylinderGeometry(.17,.21,.58,10),metal,0,-.34,.015);
  mesh(knee,new THREE.TorusGeometry(.185,.025,5,12),edge,0,-.13,.02).rotation.x=Math.PI/2;
  const ankle=new THREE.Group();ankle.name='blood-boot-'+side;ankle.position.y=-L;knee.add(ankle);
  mesh(ankle,new THREE.SphereGeometry(1,12,8),dark,0,-.07,.21).scale.set(.23,.14,.44);
  mesh(ankle,new THREE.BoxGeometry(.44,.06,.78),dark,0,-.19,.20);
  mesh(ankle,new THREE.SphereGeometry(1,10,6),metal,0,-.035,.39).scale.set(.23,.105,.23);
  // Underlayers bend across knee and boot hinges while the analytic IK
  // remains responsible for foot planting and the unchanged combat position.
  const skins=[
   createWeightedJoint(THREE,hip,knee,dark,{name:'blood-skinned-knee-'+side,radius:.175,length:.30,sides:coarse?8:10}),
   createWeightedJoint(THREE,knee,ankle,dark,{name:'blood-skinned-ankle-'+side,radius:.155,length:.26,sides:coarse?8:10})
  ];
  return {hip,knee,ankle,skins};
 });
 function update(g,scale=1.25){
  if(g.status==='won')return;
  actor.updateWorldMatrix(true,false);const feet=bloodFootTargets(g,scale),air=Math.min(1,g.blood.elevation/3);
  bootQ.setFromAxisAngle(up,g.boss.yaw);
  for(let i=0;i<2;i++){
   const {hip,knee,ankle}=legs[i],foot=feet[i];target.set(foot.x,foot.y+air*.42*scale,foot.z-air*.3*scale);actor.worldToLocal(target);
   axis.copy(target).sub(hip.position);const d=Math.max(.04,Math.min(2*L-.0001,axis.length()));axis.normalize();
   // Keep the knee bend pole valid even when the foot briefly lines up with it.
   // Degenerate targets must not produce undefined quaternions during a phase change.
   if(axis.lengthSq()<.5)axis.set(0,-1,0);
   bend.copy(hint).addScaledVector(axis,-hint.dot(axis));
   if(bend.lengthSq()<1e-7){bend.set(1,0,0).addScaledVector(axis,-axis.x);}
   bend.normalize();
   elbow.copy(hip.position).addScaledVector(axis,d/2).addScaledVector(bend,Math.sqrt(Math.max(0,L*L-d*d/4)));
   upper.copy(elbow).sub(hip.position).normalize();lower.copy(hip.position).addScaledVector(axis,d).sub(elbow).normalize();
   hipQ.setFromUnitVectors(down,upper);shinQ.setFromUnitVectors(down,lower);
   hip.quaternion.copy(hipQ);knee.quaternion.copy(hipQ).invert().multiply(shinQ);
   knee.getWorldQuaternion(worldQ);ankle.quaternion.copy(worldQ).invert().multiply(bootQ);
  }
 }
 return {legs,update};
}
