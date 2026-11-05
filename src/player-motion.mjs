import * as THREE from 'three';
const down=new THREE.Vector3(0,-1,0),axis=new THREE.Vector3(),bend=new THREE.Vector3(),elbow=new THREE.Vector3(),upper=new THREE.Vector3(),lower=new THREE.Vector3(),target=new THREE.Vector3();
const armQ=new THREE.Quaternion(),lowerQ=new THREE.Quaternion(),bodyQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),desired=new THREE.Quaternion(),angles=new THREE.Euler();
const gripQ=new THREE.Quaternion(),handOffset=new THREE.Vector3();
const baseArm=new THREE.Quaternion(),baseElbow=new THREE.Quaternion();
const relativeQ=new THREE.Quaternion();
const sole=new THREE.Vector3();
// Two-bone analytic IK: hands really meet the bowstring/haft. No iterative
// solver, physics, constraints or allocations are added to the render loop.
function reach(parts,index,point,hint,weight=1){
 const arm=parts.arms[index],joint=parts.elbows[index],a=.40,b=.39;
 baseArm.copy(arm.quaternion);baseElbow.copy(joint.quaternion);
 axis.copy(point).sub(arm.position);const distance=Math.max(.035,Math.min(a+b-.003,axis.length()));axis.normalize();
 const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
 bend.copy(hint).addScaledVector(axis,-hint.dot(axis)).normalize();
 elbow.copy(arm.position).addScaledVector(axis,along).addScaledVector(bend,height);
 upper.copy(elbow).sub(arm.position).normalize();lower.copy(arm.position).addScaledVector(axis,distance).sub(elbow).normalize();
 armQ.setFromUnitVectors(down,upper);lowerQ.setFromUnitVectors(down,lower);
 relativeQ.copy(armQ).invert().multiply(lowerQ);
 arm.quaternion.copy(baseArm).slerp(armQ,weight);joint.quaternion.copy(baseElbow).slerp(relativeQ,weight);
}
function alignGrip(parts,pose,weapon){
 const hand=parts.hands[weapon==='bow'?0:1];
 if(parts.pivot.parent!==hand){hand.add(parts.pivot);parts.pivot.position.set(0,-.105,.07);}
 parts.body.updateWorldMatrix(true,false);parts.body.getWorldQuaternion(bodyQ);hand.getWorldQuaternion(parentQ);
 desired.setFromEuler(angles.set(pose.pivotX,pose.pivotY,pose.pivotZ,'YXZ'));
 parts.pivot.quaternion.copy(parentQ).invert().multiply(bodyQ).multiply(desired);
}
const leftHint=new THREE.Vector3(-1,-.15,-.45),rightHint=new THREE.Vector3(1,-.05,-.65);
const clothTimes=new WeakMap();
export function applyPlayerMotion(parts,p,weapon,time=0,speed=0){
 const body=parts.body;body.position.set(p.strideX,1+p.bob+p.lift,p.strideZ);body.rotation.set(p.spin||p.lean,p.twist,p.sway);
 for(let i=0;i<2;i++){
  const key=i?'R':'L';parts.legs[i].rotation.set(p['leg'+key],0,p['legZ'+key]||0);parts.knees[i].rotation.set(p['knee'+key],0,0);parts.ankles[i].rotation.set(p['ankle'+key]||0,0,0);
  parts.arms[i].rotation.set(p['arm'+key],0,p['armZ'+key]);parts.elbows[i].rotation.set(p['elbow'+key],0,0);parts.hands[i].rotation.set(0,0,0);
 }
 parts.head.rotation.set(p.headX,p.headY,0);
 if(p.grounded){
  let lowest=Infinity;
  for(const ankle of parts.ankles)for(const z of [-.10,.26]){sole.set(0,-.10,z);ankle.localToWorld(sole);lowest=Math.min(lowest,sole.y);}
  if(Number.isFinite(lowest))body.position.y+=.012-lowest;
 }
 if(parts.shadow){parts.shadow.scale.setScalar(1+Math.max(0,p.lift)*.12);parts.shadow.material.opacity=p.grounded?1:.65;}
 if(weapon==='bow'&&p.grip>.01){
  reach(parts,0,target.set(-.15,.63,.63),leftHint,p.grip);
 }else if(p.heal>.01){reach(parts,0,target.set(-.12,.86,.34),leftHint,p.heal);parts.hands[0].rotation.x=-p.heal*.70;}
 if(weapon==='hammer'||p.support>.01)reach(parts,1,target.set(p.handX,p.handY,p.handZ),rightHint,weapon==='hammer'?1:p.support);
 alignGrip(parts,p,weapon);
 if(weapon==='bow'&&p.grip>.01){
  parts.weapons.bow.getWorldQuaternion(gripQ);handOffset.set(0,-.10,.07).applyQuaternion(gripQ);
  target.set(0,0,parts.weaponDetails.bow.tips[0][2]-p.draw*.46);parts.weapons.bow.localToWorld(target);target.sub(handOffset);parts.body.worldToLocal(target);reach(parts,1,target,rightHint,p.grip);
  parts.elbows[1].getWorldQuaternion(parentQ);relativeQ.copy(parentQ).invert().multiply(gripQ);parts.hands[1].quaternion.identity().slerp(relativeQ,p.grip);
 }
 if((weapon==='hammer'||p.support>.01)&&p.heal<.01){
  parts.pivot.getWorldQuaternion(gripQ);handOffset.set(0,-.10,.07).applyQuaternion(gripQ);
  target.set(0,0,weapon==='hammer'?.28:.04);parts.pivot.localToWorld(target);target.sub(handOffset);parts.body.worldToLocal(target);reach(parts,0,target,leftHint,weapon==='hammer'?1:p.support);
  parts.elbows[0].getWorldQuaternion(parentQ);relativeQ.copy(parentQ).invert().multiply(gripQ);parts.hands[0].quaternion.identity().slerp(relativeQ,weapon==='hammer'?1:p.support);
 }
 for(const[key,rig]of Object.entries(parts.weapons))rig.visible=key===weapon&&!(weapon==='bow'&&p.heal>.08);
 const bow=parts.weaponDetails.bow,{stringArray,tips,arrow}=bow;
 stringArray.set([tips[0][0],tips[0][1],tips[0][2],0,0,tips[0][2]-p.pull*.46,tips[1][0],tips[1][1],tips[1][2]]);bow.string.geometry.attributes.position.needsUpdate=true;
 arrow.visible=weapon==='bow'&&p.pull>.02;arrow.position.z=-p.pull*.46;
 parts.weaponDetails.cards.fan.forEach((card,i)=>{card.rotation.y=(i-2)*(.23+p.grip*.055);});
 parts.flask.visible=p.heal>.06;parts.flask.rotation.x=-p.heal*.35;
 parts.cape.rotation.set(.03+Math.min(speed,8)*.012,-p.twist*.12,p.sway*.6);
 if(clothTimes.get(parts)===time)return;clothTimes.set(parts,time);
 const attr=parts.capeMesh.geometry.attributes.position,rest=parts.capeRest;
 for(let i=0;i<attr.count;i++){
  const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],v=-y/1.4;
  const swing=Math.sin(time*4.2+v*3+x*3)*(.012+Math.min(speed,8)*.006)*v;
  attr.setXYZ(i,x+swing*.4,y+Math.sin(time*3+v*5)*.012*v,z-v*v*(Math.min(speed,8)*.035+p.grip*.045)+swing);
 }
 attr.needsUpdate=true;parts.capeMesh.geometry.computeVertexNormals();
}
