// One script drives the far-horizon shot, storm camera, visible wall and
// authoritative collision flanks. It introduces NO fluid-physics solver.
// World +Z denotes the attack's forward direction before yaw is applied.
export const BLOOD_TSUNAMI=Object.freeze({
 horizonDistance:510,
 startDistance:240,
 speed:56,
 rowLag:.72,
 rowOffset:22,
 safeHalfWidth:4.65,
 flankHalfWidth:32,
 margin:.55,
 halfDepth:3.55,
 primaryHeight:30,
 impactLife:6.6,
 warning:2.0,
 damage:37
});
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
const smooth=v=>{const a=clamp(v);return a*a*(3-2*a);};

// A full-width, 30m-high disaster is cut into two physical flanks, with an
// unmistakable 9.3m sanctuary through the boss's locked casting position.
// The actual padded player-centre collision starts OUTSIDE safeHalfWidth.
export function bloodTsunamiFlanks({x=0,z=0,yaw=0}={}){
 const f={x:Math.sin(yaw),z:Math.cos(yaw)};
 const side={x:Math.cos(yaw),z:-Math.sin(yaw)};
 const offset=BLOOD_TSUNAMI.safeHalfWidth+BLOOD_TSUNAMI.flankHalfWidth+BLOOD_TSUNAMI.margin;
 const result=[];
 for(let row=0;row<2;row++)for(const sign of [-1,1]){
  const d=BLOOD_TSUNAMI.startDistance+row*BLOOD_TSUNAMI.rowOffset;
  result.push({
   tsunami:true,row,side:sign,
   x:x-f.x*d+side.x*offset*sign,
   z:z-f.z*d+side.z*offset*sign,
   yaw,width:BLOOD_TSUNAMI.flankHalfWidth,length:7.2,
   vx:f.x*BLOOD_TSUNAMI.speed,vz:f.z*BLOOD_TSUNAMI.speed,
   warn:BLOOD_TSUNAMI.warning+row*BLOOD_TSUNAMI.rowLag,
   life:BLOOD_TSUNAMI.impactLife,damage:BLOOD_TSUNAMI.damage-(row?6:0)
  });
 }
 return result;
}

// The warning shot is a continuation of the real attacking wave, not a
// separate non-interacting backdrop. Before hazard activation it approaches
// from the horizon to precisely the hazard's initial physical coordinates.
export function bloodTsunamiWave(game,row=0){
 const s=game?.blood,b=game?.boss;
 if(!s||b?.state!=='pattern'||s.pattern!=='requiem')return null;
 const hazard=s.hazards?.find(h=>h.tsunami&&h.row===row&&h.side===-1);
 const recorded=s.tsunami?.rows?.[row];
 const timing=hazard||recorded;
 if(!timing)return null;
 const yaw=hazard?.yaw??s.tsunami?.yaw??0,forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw);
 const anchor=s.tsunami?.origin||s.origin||b;
 const initial=BLOOD_TSUNAMI.startDistance+row*BLOOD_TSUNAMI.rowOffset;
 const distant=BLOOD_TSUNAMI.horizonDistance+row*BLOOD_TSUNAMI.rowOffset;
 const time=Math.max(0,s.t||0),warn=Math.max(.01,timing.warn);
 const distance=time<warn?
  distant-(distant-initial)*smooth(time/warn):
  initial-BLOOD_TSUNAMI.speed*(time-warn);
 const sideX=Math.cos(yaw),sideZ=-Math.sin(yaw);
 const x=anchor.x-forwardX*distance,z=anchor.z-forwardZ*distance;
 return {x,z,yaw,row,forwardX,forwardZ,sideX,sideZ,distance,active:time>=warn,
  time,warning:warn,remaining:warn+timing.life-time,
  visible:time<timing.warn+timing.life};
}
export function bloodTsunamiApproach(game){
 const waves=[bloodTsunamiWave(game,0),bloodTsunamiWave(game,1)].filter(w=>w?.visible);
 if(!waves.length)return {active:false,intensity:0,distance:Infinity};
 const p=game.player||game.boss;
 let selected=null,distance=Infinity;
 for(const w of waves){
  const d=Math.abs((p.x-w.x)*w.forwardX+(p.z-w.z)*w.forwardZ);
  if(d<distance){selected=w;distance=d;}
 }
 // The storm grows as the nearest physical crest approaches. It stays loud
 // through the follower rather than vanishing with the leading hazard.
 const proximity=smooth((95-distance)/77);
 const attack=selected.time>=selected.warning?1:
  .26+.74*smooth(selected.time/selected.warning);
 return {active:true,intensity:proximity*attack,distance,wave:selected};
}
