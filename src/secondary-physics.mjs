// Fixed-cost, visual-only critically damped springs. Authoritative hitboxes,
// combat timers and simulation state must never depend on these values.
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export function springStep(position,velocity,target,dt,frequency=12){
 const dest=finite(target),x=finite(position,dest)-dest,v=finite(velocity);
 const h=Math.max(0,Math.min(.05,finite(dt))),w=Math.max(.1,finite(frequency,12));
 const decay=Math.exp(-w*h),temp=(v+w*x)*h;
 return {position:dest+(x+temp)*decay,velocity:(v-w*temp)*decay};
}
export function createSpringBank(){
 const states=new Map();
 return {
  step(key,target,dt,frequency=12){
   const goal=finite(target),prev=states.get(key);
   if(!prev){states.set(key,{position:goal,velocity:0});return goal;}
   if(!(dt>0))return prev.position;
   const next=springStep(prev.position,prev.velocity,goal,dt,frequency);
   prev.position=next.position;prev.velocity=next.velocity;
   return prev.position;
  },
  reset(){states.clear();},
  get size(){return states.size;}
 };
}
