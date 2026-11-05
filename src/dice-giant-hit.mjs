import {giantHandPose,giantHeadExposed,handCanAttack} from './dice-giant.mjs';
import {giantHandGesture} from './dice-giant-motion.mjs';
import {diceSegmentImpact} from './dice-hit.mjs';
import {kwonProjectileContact} from './kwon-hurtbox.mjs';

// These groups mirror buildGentlemanHand's palm, knuckle, fingers and cuff.
// The older 16x5x20 box allowed hits in empty rectangular corners.
export const GIANT_HAND_PARTS=Object.freeze([
 {id:'palm',x:0,y:0,z:1,rx:7.8,ry:2.5,rz:8.6},
 {id:'knuckles',x:0,y:.5,z:7.4,rx:7.2,ry:2.2,rz:2.2},
 {id:'cuff',x:0,y:0,z:-11,rx:7.1,ry:3.1,rz:4.8}
]);
function inverseEuler(p,{wristPitch:x=0,wristYaw:y=0,wristRoll:z=0}={}){
 // Three.js rotation order XYZ; inverse of Rx*Ry*Rz.
 let u=p.x,v=p.y,w=p.z;
 let c=Math.cos(x),s=Math.sin(x);[v,w]=[v*c+w*s,-v*s+w*c];
 c=Math.cos(y);s=Math.sin(y);[u,w]=[u*c-w*s,u*s+w*c];
 c=Math.cos(z);s=Math.sin(z);[u,v]=[u*c+v*s,-u*s+v*c];
 return {x:u,y:v,z:w};
}
export function giantHandImpact(g,a,b,index){
 const h=giantHandPose(g,index),state=g.dice.giant;
 const pose=giantHandGesture(state,index),revive=Math.max(0,state?.revive?.[index]||0);
 if(!h||revive>0||state?.destroyed?.[index])return null;
 const local=p=>inverseEuler({x:p.x-h.x,y:(Number.isFinite(p.y)?p.y:1.2)-h.y,z:p.z-h.z},pose);
 const from=local(a),to=local(b);
 const curl=pose.curl||0;
 const parts=[...GIANT_HAND_PARTS,...[-1.5,-.5,.5,1.5].map((j,i)=>{
  const shortened=Math.max(2,6.8-curl*3.6);
  return {id:'finger-'+i,x:j*3.7,y:-curl*1.25,z:8.2+shortened*.65,rx:1.5,ry:1.6,rz:shortened};
 })];
 const shapes=parts.map(v=>({...v,yaw:0}));
 const impact=kwonProjectileContact(shapes,from,to,{padding:.18});
 if(!impact)return null;
 // Convert the local-space strike to the real world by reconstructing its
 // swept segment parameter; keep the original impact point for audiovisual FX.
 const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z,denom=dx*dx+dy*dy+dz*dz;
 const t=denom?Math.max(0,Math.min(1,((impact.x-from.x)*dx+(impact.y-from.y)*dy+(impact.z-from.z)*dz)/denom)):0;
 return {t,part:'hand',subpart:impact.part,index,face:0,
  point:{x:a.x+(b.x-a.x)*t,y:(a.y??1.2)+((b.y??1.2)-(a.y??1.2))*t,z:a.z+(b.z-a.z)*t}};
}
export function giantImpact(g,a,b){
 const s=g.dice.giant;if(!s||['transition','dead'].includes(s.state))return null;
 if(giantHeadExposed(g)){
  const hit=diceSegmentImpact(a,b,g.dice.pose,.18);
  return hit?{...hit,part:'head'}:null;
 }
 return [0,1].filter(index=>handCanAttack(s,index)).map(index=>giantHandImpact(g,a,b,index))
  .filter(Boolean).sort((a,b)=>a.t-b.t)[0]||null;
}
