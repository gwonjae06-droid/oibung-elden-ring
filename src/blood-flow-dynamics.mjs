// Fixed-cost, deterministic visual hydrodynamics for the Blood encounter.
// These routines NEVER feed boss damage, projectiles, collision or phase logic.
// Closed-form air drag keeps blood trajectories stable across 30/60/120 fps.
import {springStep} from './secondary-physics.mjs';

export const BLOOD_FLOW=Object.freeze({
  gravity:9,
  drag:1.05,
  ground:.08,
  puddleLife:6,
  puddleRadiusCap:2.4,
  surfaceTension:2.9,
  puddleDrag:4.8,
  pullDrag:2.6,
  puddleSpeed:.85,
  pullSpeed:1.25,
  retractSpeed:3.8
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));

export function advanceBloodDrop(p,dt){
 const h=clamp(dt,0,.2);
 if(!h)return p;
 const drag=clamp(p.drag??BLOOD_FLOW.drag,.2,4),decay=Math.exp(-drag*h),
   kernel=-Math.expm1(-drag*h)/drag,
   accel=-BLOOD_FLOW.gravity*(Number.isFinite(p.g)?p.g:1),
   verticalAccel=accel/drag,
   dy=p.vy*kernel+verticalAccel*(h-kernel);
 p.x+=p.vx*kernel;p.z+=p.vz*kernel;p.y+=dy;
 p.vx*=decay;p.vz*=decay;
 p.vy=p.vy*decay+verticalAccel*(1-decay);
 return p;
}
export function bloodContactFraction(before,after,ground=BLOOD_FLOW.ground){
 if(before<=ground)return 0;
 if(after>=ground)return 1;
 return clamp((before-ground)/Math.max(1e-7,before-after),0,1);
}
// Area-weighted merge conserves pool centre and horizontal momentum. The
// footprint is intentionally capped to avoid many giant visual decals.
export function mixBloodPuddle(p,x,z,r,impulse=null){
 const area=p.r*p.r,added=Math.max(.001,r*r),total=area+added;
 p.x=(p.x*area+x*added)/total;p.z=(p.z*area+z*added)/total;
 p.vx=(p.vx*area+(impulse?.x||0)*added*.18)/total;
 p.vz=(p.vz*area+(impulse?.z||0)*added*.18)/total;
 p.r=Math.min(BLOOD_FLOW.puddleRadiusCap,Math.sqrt(total));
 p.vr=clamp((p.vr||0)+Math.sqrt(added)*.34,0,1.6);
 return p;
}
export function advanceBloodPuddle(p,dt,{pull=null,retract=null}={}){
 const h=clamp(dt,0,.05);
 if(!h)return p;
 const radius=springStep(p.cur,p.vr||0,p.r,h,BLOOD_FLOW.surfaceTension);
 p.cur=clamp(radius.position,0,p.r*1.15);p.vr=radius.velocity;
 const attractor=retract||pull;
 if(attractor){
   const dx=attractor.x-p.x,dz=attractor.z-p.z,d=Math.hypot(dx,dz)||1,
     acceleration=retract?18:4.4;
   p.vx+=dx/d*acceleration*h;p.vz+=dz/d*acceleration*h;
 }
 const damp=Math.exp(-h*(retract?BLOOD_FLOW.pullDrag:BLOOD_FLOW.puddleDrag));
 p.vx*=damp;p.vz*=damp;
 const cap=retract?BLOOD_FLOW.retractSpeed:pull?BLOOD_FLOW.pullSpeed:BLOOD_FLOW.puddleSpeed,
   speed=Math.hypot(p.vx,p.vz);
 if(speed>cap){p.vx*=cap/speed;p.vz*=cap/speed;}
 p.x+=p.vx*h;p.z+=p.vz*h;
 if(retract){p.r*=Math.exp(-h*.55);p.cur=Math.min(p.cur,p.r);}
 return p;
}
