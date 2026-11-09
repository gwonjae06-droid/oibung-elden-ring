// Stage-three-only attack choreography. All warning geometry and damage
// are authored as the SAME simulation hazards: no separate invisible hits.
// The previous 1P blood waves, 2P airborne dives and ritual attacks are
// deliberately absent from this playable six-spell phase-three rotation.
export const SERAPH_CANONICAL_PATTERNS=Object.freeze([
 'seraphSweep','seraphWingCross','seraphInwardPillars',
 'seraphFrenzy','seraphHaloProcession','seraphBloodRosette'
]);
export const SERAPH_EYE_ATTACKS=new Set(['seraphSweep','seraphFrenzy']);
export const SERAPH_WING_ATTACKS=new Set(['seraphWingCross','seraphBloodRosette']);
export const SERAPH_STAGE_RADIUS=32;
const TAU=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function seraphHazardTarget(h){
 const t=Math.max(0,(h.age||0)-(h.warn||0));
 if(h.seraphAngularSweep){
  const u=clamp(t/Math.max(.01,h.life),0,1);
  const yaw=h.yawStart+(h.yawEnd-h.yawStart)*u;
  return {x:h.x+Math.sin(yaw)*h.length*.5,
   z:h.z+Math.cos(yaw)*h.length*.5,yaw};
 }
 return {x:h.x+(h.vx||0)*t,z:h.z+(h.vz||0)*t,yaw:h.yaw};
}
export function seraphTelegraphRemaining(h,time=0){
 return Math.max(0,(h.warn||0)-(h.age??time));
}
export function spawnSeraphDoctrine(g,id,spawn){
 const b=g.boss,p=g.player;
 const aim=Math.atan2(p.x-b.x,p.z-b.z);
 // Full-arena concentric blood pillars; no single player-facing row.
 if(id==='seraphSweep'){
  // One long floor-to-ceiling beam: scans LEFT to RIGHT, with no instant
  // map-wide hit. The physical danger travels at precisely the beam rate.
  spawn('lane',{x:b.x,z:b.z,yaw:aim-1.45,
   yawStart:aim-1.45,yawEnd:aim+1.45,seraphAngularSweep:true,
   width:4.1,length:64,warn:2.1,life:3.25,
   damage:39,seraphCue:'sweep'});
 }
 if(id==='seraphWingCross')for(let i=0;i<4;i++){
  // A separate wing halo departs the arena. Three/Four straight passes
  // appear in the world as a spinning disc using the same live hazard.
  const sign=i%2?-1:1,z=[-11,8,-3,13][i];
  spawn('lane',{x:-sign*37,z,yaw:Math.PI/2,width:5.65,length:14.8,
   vx:sign*74/.88,vz:0,warn:2.05+i*1.32,life:.88,
   damage:34,seraphCue:'wing-pass',pass:i});
 }
 if(id==='seraphInwardPillars'){
  // Four 360-degree waves; the last inner edge stays clear of the caster.
  // Each annular hitbox is outlined by a circle of real 3D blood pillars.
  for(let rank=0;rank<4;rank++)spawn('ring',{
   x:b.x,z:b.z,r:27-rank*5.65,width:5.05,
   warn:1.75+rank*.96,life:.62,damage:34,
   seraphCue:'blood-pillar-ring',rank
  });
 }
 if(id==='seraphFrenzy'){
  // Frenzied but never unannounced: eleven FIXED rays radiate from
  // the real face, each with its own readable pre-fire warning.
  for(let i=0;i<11;i++){
   const offset=[0,.62,-.52,1.23,-1.14,2.05,-2.06,2.7,-2.77,.28,-.29][i],
    angle=aim+offset;
   spawn('lane',{x:b.x+Math.sin(angle)*17,z:b.z+Math.cos(angle)*17,
    yaw:angle,width:3.05,length:45.0,warn:1.8+i*.48,
    life:.31,damage:25,seraphCue:'frenzy',shot:i});
  }
 }
 if(id==='seraphHaloProcession')for(let i=0;i<4;i++){
  // Rolling 3D holy rings move on their own straight trajectories,
  // unlike the circular shockwaves of the first two phases.
  const side=i%2?-1:1,z=[-14,-4,10,18][i];
  spawn('ring',{x:-side*27,z,r:6.55,width:3.25,
   vx:side*18,vz:0,warn:1.85+i*.88,life:2.95,
   damage:33,seraphCue:'rolling-halo',pass:i});
 }
 if(id==='seraphBloodRosette')for(let i=0;i<6;i++){
  // Flower of six crimson judgement petals from the celestial crown.
  // Sequential thin fan-sectors with gaps, NOT a 1P fountain or 2P wave.
  spawn('cone',{x:b.x,z:b.z,yaw:aim+i*TAU/6,
   arc:.53,innerR:5.3,r:30,warn:1.85+i*.69,life:.53,
   damage:35,seraphCue:'rose-petal',petal:i});
 }
 return g.blood.hazards;
}
