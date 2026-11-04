// Simulation time, rather than wall time: pause and restart cannot skip an environmental beat.
export function createChapterClock(){
 let last=-1,previousPhase=1,phaseAt=0,deathAt=null,deathElapsed=0;
 return {update(time=0,phase=1,dead=false,dt){
  const t=Number.isFinite(time)?Math.max(0,time):0;
  if(t<last||phase<previousPhase){phaseAt=0;deathAt=null;deathElapsed=0;previousPhase=1;}
  if(phase!==previousPhase)phaseAt=t;
  if(dead&&deathAt===null)deathAt=t;if(!dead){deathAt=null;deathElapsed=0;}else deathElapsed+=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):Math.max(0,t-Math.max(0,last));
  previousPhase=phase;last=t;
  const age=Math.max(0,t-phaseAt),silence=deathAt===null?0:Math.min(1,deathElapsed/1.8);
  return {age,second:phase===2,collapse:phase===2?Math.min(1,age/2.8):0,silence,dead,
   hush:dead||(phase===2&&age<.8),motion:dead?1-silence:1};
 }};
}
