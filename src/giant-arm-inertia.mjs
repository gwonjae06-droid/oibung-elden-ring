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
