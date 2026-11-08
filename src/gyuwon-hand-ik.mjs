import * as THREE from 'three';
import {smooth} from './gyuwon-year-choreography.mjs';
// Two anatomical links, never a detached palm translated onto a prop.
// The shoulders, elbows and cuffs retain their existing connected hierarchy.
export function createGyuwonHandIk({arms,forearms,wrists,torso}){
 const down=new THREE.Vector3(0,-1,0),dir=new THREE.Vector3(),bend=new THREE.Vector3(),
  elbow=new THREE.Vector3(),upper=new THREE.Vector3(),lower=new THREE.Vector3(),
  target=new THREE.Vector3(),base=new THREE.Vector3(),jointAxis=new THREE.Vector3(),
  shoulderQ=new THREE.Quaternion(),elbowQ=new THREE.Quaternion(),wristQ=new THREE.Quaternion(),
  inverse=new THREE.Quaternion(),desired=new THREE.Quaternion();
 function solve(index,point,blend){
  const arm=arms[index],forearm=forearms[index],wrist=wrists[index],side=index?1:-1;
  base.copy(arm.position);target.set(...point);
  dir.subVectors(target,base);const d=Math.max(.01,Math.min(1.285,dir.length()));dir.normalize();
  const a=.67067,b=.62,along=(a*a+d*d-b*b)/(2*d);
  bend.set(side*.55,-1,-.15).addScaledVector(dir,-bend.dot(dir)).normalize();
  elbow.copy(base).addScaledVector(dir,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
  upper.subVectors(elbow,base).normalize();lower.subVectors(target,elbow).normalize();
  jointAxis.copy(forearm.position).normalize();shoulderQ.setFromUnitVectors(jointAxis,upper);
  elbowQ.setFromUnitVectors(down,lower);
  inverse.copy(shoulderQ).invert();elbowQ.premultiply(inverse);
  // Keep the weapon's +Z axis horizontal in the actor's frame, cancelling
  // chest lean and elbow bend without changing a single joint's position.
  desired.copy(torso.quaternion).invert();
  inverse.copy(shoulderQ).multiply(elbowQ).invert();wristQ.copy(inverse).multiply(desired);
  arm.quaternion.slerp(shoulderQ,blend);forearm.quaternion.slerp(elbowQ,blend);wrist.quaternion.slerp(wristQ,blend);
 }
 return {update(e,weapon,mounted){
  const blend=smooth((e?.castT||0)/.75);
  if(weapon.rifle){solve(1,[.35,.40,.55],blend);solve(0,[.10,.38,1.0],blend);}
  else if(weapon.bow){solve(0,[-.22,.40,1.03],blend);solve(1,[-.12,.42,.48-weapon.draw*.20],blend);}
  else if(mounted){
   const bike=mounted.ride==='bike';
   solve(0,[-.55,bike?-.25:.3,bike?.85:1.05],blend);
   solve(1,[.55,bike?-.25:.3,bike?.85:1.05],blend);
  }
 }};
}

