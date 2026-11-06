// Presentation only. Never drive gameplay timers, damage, physics or hit volumes.
export const poseAlpha=(rate,dt)=>1-Math.exp(-Math.max(0,Number.isFinite(rate)?rate:0)*Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0)));
export function createPoseContinuity(){
 let previous=null,owner=null,lastTime=null;
 function reset(){previous=null;owner=null;lastTime=null;}
 function step(target,dt,{owner:nextOwner=null,time=null,rate=14}={}){
  const clock=Number.isFinite(time)?time:null;
  if(nextOwner!==owner||(clock!==null&&lastTime!==null&&clock<lastTime-1e-5))reset();
  owner=nextOwner;
  const elapsed=clock!==null&&lastTime!==null&&clock===lastTime?0:dt;
  if(clock!==null)lastTime=clock;
  if(!target)return previous?{...previous}:{};
  if(!previous){previous={...target};return {...previous};}
  const a=poseAlpha(rate,elapsed),out={...target};
  for(const [key,value] of Object.entries(target))
   if(Number.isFinite(value)&&Number.isFinite(previous[key]))
    out[key]=previous[key]+(value-previous[key])*a;
  previous=out;return {...out};
 }
 return {step,reset};
}
