// Physical escape corridors for simultaneous O Seulwoo troupe + director spells.
// Every candidate follows the player's conservative walking speed through REAL
// hit geometry at the REAL future impact timestamps. Never grant hidden i-frames,
// remove a boss signature, pause a performer or write any player input.
import {playerWalkSpeed} from './player-movement-rules.mjs';

const TAU=Math.PI*2;
const ARENA=23;
const HORIZON=3.2;
const REACTION=.15;
const PLAYER_MARGIN=.34;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const angle=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const eligible=z=>z&&z.state!=='burst'&&!z.feint&&(z.damage>0||z.waveKind||z.kind==='push');
const troupe=z=>z?.source==='troupe'||z?.source==='legacyEcho';
const round=(n)=>Math.round(n*1000)/1000;

export function clownThreatCovers(z,p,margin=PLAYER_MARGIN){
 if(!z||!p)return false;
 if(z.shape==='lane'){
  const dx=p.x-z.x,dz=p.z-z.z,forward=dx*Math.sin(z.yaw)+dz*Math.cos(z.y),
   lateral=dx*Math.cos(z.yaw)-dz*Math.sin(z.yaw);
  return forward>=-margin&&forward<=(z.len||0)+margin&&
   Math.abs(lateral)<=(z.w||0)/2+margin;
 }
 if(z.shape==='cone')
  return dist(z,p)<=(z.r||0)+margin&&
   Math.abs(delta(angle(z,p),z.yaw||0))<=(z.half||0)+.04;
 return z.shape==='circle'&&dist(z,p)<=(z.r||0)+margin;
}
function positionAt(g,candidate,relative){
 const from=g.player,d=dist(from,candidate);
 // Never assume sprinting or a perfectly timed dodge; preserve reaction time.
 const speed=clamp(playerWalkSpeed(g.player)*.86,2.7,5.1),
  progress=d<.001?1:clamp((relative-REACTION)*speed/d,0,1);
 return {x:from.x+(candidate.x-from.x)*progress,
  z:from.z+(candidate.z-from.z)*progress};
}
function imminentZones(g,additional=[]){
 const list=[];
 for(const z of [...(g?.clown?.zones||[]),...additional]){
  if(!eligible(z))continue;
  const remaining=z.warn-(z.age||0);
  if(remaining<-.04||remaining>HORIZON)continue;
  list.push({z,t:Math.max(0,remaining)});
 }
 return list;
}
function physicalMeleeSafe(g,candidate){
 const now=g.clown?.time||0;
 for(const m of g.clown?.troupe?.members||[]){
  if(m.down)continue;
  const attack=m.melee;
  if(attack?.impacts?.length){
   for(let k=0;k<attack.impacts.length;k++){
    if(attack.hit?.[k])continue;
    const t=attack.start+attack.impacts[k]-now;
    if(t<=0||t>HORIZON)continue;
    const p=positionAt(g,candidate,t),
     moved=clamp((attack.impacts[k]-attack.wind)/Math.max(.01,attack.travel),0,1),
     spot={x:attack.from.x+Math.sin(attack.yaw)*attack.stride*moved,
      z:attack.from.z+Math.cos(attack.yaw)*attack.stride*moved};
    if(dist(p,spot)<=(m.role==='strongman'?2.75:2.55)+PLAYER_MARGIN&&
      Math.abs(delta(angle(spot,p),attack.yaw))<=(m.role==='strongman'?1.08:1.22))
      return false;
   }
  }
  const roll=m.legacyAttack;
  if(roll?.kind==='roll'){
   const t=roll.start+roll.wind+.20-now;
   if(t>.05&&t<HORIZON){
    const p=positionAt(g,candidate,t);
    const to={x:roll.from.x+Math.sin(roll.yaw)*roll.len,
      z:roll.from.z+Math.cos(roll.yaw)*roll.len};
    const dx=to.x-roll.from.x,dz=to.z-roll.from.z;
    const part=clamp(((p.x-roll.from.x)*dx+(p.z-roll.from.z)*dz)/
     Math.max(.01,dx*dx+dz*dz),0,1);
    if(Math.hypot(p.x-roll.from.x-dx*part,p.z-roll.from.z-dz*part)<1.5)
     return false;
   }
  }
 }
 return true;
}
function wavesSafe(g,candidate){
 // Large rolling/clapping shockwaves use their existing radial motion,
 // rather than pretending their warning was a stationary danger circle.
 for(const wave of g.clown?.waves||[]){
  const speed=wave.speed||24;
  if(!(speed>0))continue;
  const hitFrom=(dist(wave,g.player)-(wave.r||0))/speed;
  for(const t of [hitFrom-.14,hitFrom,hitFrom+.14]){
   if(t<.05||t>HORIZON)continue;
   const p=positionAt(g,candidate,t),r=(wave.r||0)+speed*t;
   if(r>(wave.range||0)+.2)continue;
   const gap=Math.abs(dist(wave,p)-r);
   if(gap<(wave.width||1.2)+PLAYER_MARGIN&&
    Math.abs(delta(angle(wave,p),wave.yaw||0))<=(wave.half||Math.PI)+.05)
    return false;
  }
 }
 return true;
}
export function clownEscapeRoutes(g,{additional=[],exclude=null,maxRoutes=Infinity}={}){
 if(!g?.player||!g?.clown)return [];
 const timed=imminentZones(g,additional).filter(({z})=>z!==exclude);
 // Deterministic small search; NO pathfinder running on the render loop.
 // Three radii and 24 directions cover short and long sidesteps.
 const origin=g.player,base=angle(origin,g.boss||{x:0,z:0});
 const routes=[];
 for(const radius of [3.2,4.4,5.6,7]){
  for(let i=0;i<24;i++){
   const theta=base+i*TAU/24;
   const point={x:origin.x+Math.sin(theta)*radius,z:origin.z+Math.cos(theta)*radius};
   if(Math.hypot(point.x,point.z)>ARENA)continue;
   // Reject an escape that walks into the ringmaster's solid torso.
   if(g.boss&&dist(point,g.boss)<3.15)continue;
   if(!physicalMeleeSafe(g,point)||!wavesSafe(g,point))continue;
   let clear=true;
   for(const {z,t} of timed)if(clownThreatCovers(z,positionAt(g,point,t))){
    clear=false;break;
   }
   if(clear){
    routes.push({x:round(point.x),z:round(point.z),angle:theta,radius});
    if(routes.length>=maxRoutes)return routes;
   }
  }
 }
 return routes;
}
function cloneZone(z){return {...z};}
function variants(g,z){
 const results=[];
 if(z.shape==='lane'||z.shape==='cone'){
  for(const offset of [-.15,.15,-.30,.30,-.48,.48,-.68,.68,-.86,.86]){
   const next=cloneZone(z);next.yaw=(z.yaw||0)+offset;
   results.push(next);
  }
 }else if(z.shape==='circle'){
  const p=g.player,radial=angle(p,z),a=Number.isFinite(radial)?radial:0;
  for(const move of [1.2,2.1,3.15,4.4]){
   for(const offset of [-Math.PI/2,Math.PI/2,Math.PI,0]){
    const next=cloneZone(z),theta=a+offset;
    next.x=z.x+Math.sin(theta)*move;
    next.z=z.z+Math.cos(theta)*move;
    if(Math.hypot(next.x,next.z)<=ARENA-.3)results.push(next);
   }
  }
 }
 return results;
}
function feint(z){
 // Last-resort physically honest feint: the performer still completes the
 // same attack animation/cadence, but creates no invisible damage when there
 // was mathematically no reachable exit. The director is NEVER converted.
 return {...z,damage:0,visual:true,blast:false,feint:true};
}
export function balanceClownTroupeWarning(g,zone){
 if(!eligible(zone)||!troupe(zone))return zone;
 if(clownEscapeRoutes(g,{additional:[zone],maxRoutes:1}).length)return zone;
 for(const proposal of variants(g,zone)){
  if(clownEscapeRoutes(g,{additional:[proposal],maxRoutes:1}).length)
   return {...proposal,escapeAdjusted:true};
 }
 return feint(zone);
}
// A real blade/club is not a zone: validate its future SWEPT BODY hits too.
// Move the winding-up actor's aim, never the already-telegraphed hitbox.
export function balanceClownMeleeOpening(g,member,proposal){
 const before=member.melee;
 member.melee=proposal;
 if(clownEscapeRoutes(g,{maxRoutes:1}).length){
  member.melee=before;return proposal;
 }
 for(const offset of [-.18,.18,-.32,.32,-.48,.48,-.70,.70]){
  const changed={...proposal,yaw:proposal.yaw+offset};
  member.melee=changed;
  if(clownEscapeRoutes(g,{maxRoutes:1}).length){
   member.melee=before;
   return {...changed,escapeAdjusted:true};
  }
 }
 member.melee=before;
 // The limb may still physically swing but cannot deliver an unfair
 // extra hit through a route blocked by the director's warnings.
 return {...proposal,feint:true};
}
export function protectClownEscapeFromDirector(g,bossZone){
 if(!g?.clown||!eligible(bossZone)||troupe(bossZone))return false;
 // Most of the director's authored hazards have no concurrent cast warning.
 // Skip the costly route graph entirely in this overwhelmingly common case.
 const candidates=(g.clown.zones||[]).filter(z=>
  troupe(z)&&eligible(z)&&z.state==='warn'&&z.warn-z.age>.48);
 if(!candidates.length)return false;
 if(clownEscapeRoutes(g,{additional:[bossZone],maxRoutes:1}).length)return false;
 // Boss hitboxes never move. Only new troupe warnings may re-aim;
 // existing visible warnings become harmless instead of teleporting.
 candidates.sort((a,b)=>(a.age||0)-(b.age||0));
 for(const z of candidates){
  if((z.age||0)<.16){
   const original={...z};
   for(const proposal of variants(g,z)){
    Object.assign(z,proposal);
    if(clownEscapeRoutes(g,{additional:[bossZone],maxRoutes:1}).length){
     z.escapeAdjusted=true;return true;
    }
   }
   Object.assign(z,original);
  }
  Object.assign(z,feint(z));
  if(clownEscapeRoutes(g,{additional:[bossZone],maxRoutes:1}).length)return true;
 }
 return false;
}
