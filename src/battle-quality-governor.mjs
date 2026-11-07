// Lightweight per-encounter adaptive render resolution. Only drawing pixels
// are scaled; the battle's fixed 16:9 layout and simulation remain untouched.
export function createBattleQualityGovernor({initial=1,min=.65,max=1,interval=2.5,onChange=()=>{}}={}){
 const clamp=(n)=>Math.max(min,Math.min(max,n));
 let scale=clamp(initial),time=0,frames=0,recovery=0;
 function sample(dt,active=true){
  if(!active||!Number.isFinite(dt)||dt<=0){time=0;frames=0;recovery=0;return scale;}
  // Physics dt is capped elsewhere; quality control measures actual frame latency.
  // Keep genuine hitches, while bounding pathological long foreground wakeups.
  time+=Math.min(.5,dt);frames++;
  if(time<interval)return scale;
  const fps=frames/time;time=0;frames=0;
  if(fps<48){recovery=0;setScale(Math.max(min,scale-.15));}
  else if(fps>=57){if(++recovery>=3){recovery=0;setScale(Math.min(max,scale+.1));}}
  else recovery=0;
  return scale;
 }
 function setScale(value){const next=Math.round(clamp(value)*100)/100;
  if(next!==scale){scale=next;onChange(scale);}return scale;
 }
 return {sample,setScale,get scale(){return scale;}};
}

// Shared GPU-only render scaling. Retain full-resolution models, effects, HUD and simulation.
export function createEncounterQuality({coarse=false,onChange=()=>{}}={}){
 return createBattleQualityGovernor({initial:coarse?.95:1,min:coarse?.65:.7,max:1,interval:2,onChange});
}
