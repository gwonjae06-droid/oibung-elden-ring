// Render-only elbow inertia. Hand/palm hitboxes and thrown object releases
// still use the instantaneous authoritative giantHandPose simulation.
import {springStep} from './secondary-physics.mjs';
const finite=(v,fall=0)=>Number.isFinite(v)?v:fall;
export function createGiantElbowFollow(frequency=11){
 let x=null,v=[0,0,0];
 function reset(){x=null;v=[0,0,0];}
 function step(target,dt){
  if(!Array.isArray(target)||target.length!==3||!target.every(Number.isFinite))throw new TypeError('Finite elbow point required');
  const h=Math.max(0,Math.min(.06,finite(dt))),dist=x?Math.hypot(...target.map((p,i)=>p-x[i])):0;
  if(!x||dist>48){x=[...target];v=[0,0,0];}
  else if(h>0){
   for(let i=0;i<3;i++){
    const next=springStep(x[i],v[i],target[i],h,frequency);
    x[i]=next.position;v[i]=next.velocity;
   }
  }
  return {x:x[0],y:x[1],z:x[2]};
 }
 return {step,reset};
}

// Keep the elbow inside the two-arm arc without touching the attackable palm.
// A teleporting or overbent elbow can otherwise cause the sleeve to reverse
// through the shoulder after a large hand slam or a quick palm recovery.
export function constrainGiantElbow(shoulder,palm,proposal){
 const arrays=[shoulder,palm,proposal];
 if(!arrays.every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))
  throw new TypeError('Finite arm joints required');
 const travel=palm.map((x,i)=>x-shoulder[i]),lengthSq=travel.reduce((a,x)=>a+x*x,0);
 if(lengthSq<1e-10)return [...shoulder];
 const delta=proposal.map((x,i)=>x-shoulder[i]),
  projectedRatio=delta.reduce((n,x,i)=>n+x*travel[i],0)/lengthSq,
  ratio=Math.max(.2,Math.min(.8,projectedRatio)),
  center=shoulder.map((x,i)=>x+travel[i]*ratio),
  // Remove the ORIGINAL longitudinal displacement, not just the clamped
  // portion: otherwise the residual can still pull the elbow past the wrist.
  originalProjection=shoulder.map((x,i)=>x+travel[i]*projectedRatio),
  off=proposal.map((x,i)=>x-originalProjection[i]),size=Math.hypot(...off),
  radialLimit=Math.sqrt(lengthSq)*.6,scale=size>radialLimit?radialLimit/size:1;
 return center.map((x,i)=>x+off[i]*scale);
}
