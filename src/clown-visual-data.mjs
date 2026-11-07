import {ROLL} from './clown-pressure.mjs';
export const sat=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=sat(t);return t*t*(3-2*t);};
// Phase two: the clown rides his own head. It is twice the volume of the phase-one head, then grown another 1.5x in size.
export const PHASE_TWO_VOLUME=2,MOUNT_GROWTH=1.5,PHASE_TWO_SCALE=Math.cbrt(PHASE_TWO_VOLUME)*MOUNT_GROWTH;
export const BODY_OFFSET=5.096*(PHASE_TWO_SCALE-1);
export function mountPose(time,transition=false){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 if(!transition)return {bodyHead:false,visible:true,inflate:2.6,scale:PHASE_TWO_SCALE,bodyY:5.2+BODY_OFFSET,y:2.6*PHASE_TWO_SCALE,z:0,ball:0,ballZ:-8,lift:0,elongation:1};
 const u=smooth((t-1.6)/2.6),v=1-u,scale=1+(PHASE_TWO_SCALE-1)*u,drop=3*v*v*u*10+3*v*u*u*2.6+u*u*u*2.6+v*v*v*11.18;
 return {bodyHead:t<1.6,visible:t>=1.6,inflate:1+1.6*smooth(t/1.6),scale,bodyY:5.2+BODY_OFFSET*smooth((t-3.2)/1),y:drop+2.6*(scale-1)*u,z:13.5*u*(1-u),ball:1-smooth((t-2.2)/1.2),ballZ:-8*smooth((t-2.2)/1.2),lift:1.4*Math.sin(Math.PI*sat((t-2.1)/2.1)),elongation:smooth((t-3.8)/1.4)};
}
export function bombPose(q,phase=1){
 const travel=q.travel||ROLL.travel,windup=q.kind==='roll'?q.windup||0:0,rollAge=Math.max(0,q.t-windup);
 const k=q.kind==='roll'?sat(rollAge/travel):sat(q.t/q.fly),land=q.kind==='roll'||q.t>=q.fly;
 const final=q.kind==='roll'?sat((rollAge-travel)/Math.max(.01,q.warn-windup-travel)):sat((q.t-q.fly)/Math.max(.01,q.warn-q.fly));
 const startY=phase===2?4.6:q.from.y+(q.kind==='head'?1.92:0);
 return {x:q.kind==='roll'?q.px:q.from.x+(q.x-q.from.x)*k,z:q.kind==='roll'?q.pz:q.from.z+(q.z-q.from.z)*k,y:q.kind==='roll'?2.1:startY*(1-k)+2.1*k+Math.sin(Math.PI*k)*4,land,final,inflate:q.kind==='ball'?.45:land?3.1+final*.6:3.1,stretch:q.kind==='roll'&&q.t<windup?-.28*sat(q.t/Math.max(.01,windup)):land?-.25*(1-final):.2,spin:q.kind==='roll'?Math.hypot(q.x-q.from.x,q.z-q.from.z)*k/2.1:k*2};
}
export function headFrame(g){
 const v=g.clown?.vis||{};
 // Head stays physically attached. The cutscene sphere is the existing
 // balance ball, never a detached clone that disappears after the cutscene.
 return {pose:v.pose||'idle',k:v.k||0,inflate:null,stretch:0,
  burst:false,bodyHead:true,mount:null};
}
export function selectedWeapon(weapon){return ['sword','hammer','bow','cards'].includes(weapon)?weapon:'sword';}
