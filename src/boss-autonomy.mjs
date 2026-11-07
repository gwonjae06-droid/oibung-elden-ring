// Independent, non-damaging footwork for idle boss windows. These positions
// drive the same actor roots and hurtboxes as authored attacks; there are no
// invisible collision hazards. A seeded phase rotates natural flank direction
// across retries without uncontrolled frame-to-frame randomness.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const BOSS_AUTONOMY=Object.freeze({turnRate:8,farDistance:12,movementScale:.70});
export function createBossAutonomy(seed=1){
 const n=(Number.isFinite(seed)?seed:1)>>>0;
 return {clock:0,vx:0,vz:0,phase:(n%4096)/4096*Math.PI*2,moving:0};
}
export function stepBossAutonomy(s,b,p,dt,{speed=5.5,sideSpeed=3,spacing=7,arena=23,phase=1,farDistance=BOSS_AUTONOMY.farDistance}={}){
 if(s?.paused)return {dx:0,dz:0,moving:0};
 if(!s||!b||!p||!Number.isFinite(dt)||dt<=0||!Number.isFinite(b.x)||!Number.isFinite(b.z)||!Number.isFinite(p.x)||!Number.isFinite(p.z))return {dx:0,dz:0,moving:0};
 const h=Math.min(dt,1/30);s.clock+=h;
 const px=p.x-b.x,pz=p.z-b.z,dist=Math.hypot(px,pz),fx=dist>.001?px/dist:0,fz=dist>.001?pz/dist:1;
 // Close-range footwork yields only slightly; a boss should not endlessly kite melee.
 const radial=dist>farDistance?1:dist>spacing?clamp((dist-spacing)*.36,0,.8):-Math.min(.10,(spacing-dist)*.055);
 // An alternating winding walk: side steps while close, fast purposeful
 // pursuit if far away; a brief retreat if crowded rather than standing still.
 const lateralWave=Math.cos(s.clock*.63+s.phase+phase*.27);
 const side=sideSpeed*(.55+.45*Math.abs(lateralWave))*(lateralWave>=0?1:-1);
 const lateral=dist>farDistance?side*.27:side*(dist<spacing+1?.35:1);
 const desiredX=(fx*radial*speed+fz*lateral)*BOSS_AUTONOMY.movementScale,
  desiredZ=(fz*radial*speed-fx*lateral)*BOSS_AUTONOMY.movementScale;
 const smoothing=1-Math.exp(-BOSS_AUTONOMY.turnRate*h);
 if(s.clock<=h*1.001&&dist>farDistance){s.vx=desiredX;s.vz=desiredZ;}
 else{s.vx+=(desiredX-s.vx)*smoothing;s.vz+=(desiredZ-s.vz)*smoothing;}
 const x=b.x+s.vx*h,z=b.z+s.vz*h;
 const length=Math.hypot(x,z),ratio=length>arena?arena/length:1;
 const nx=x*ratio,nz=z*ratio;
 const dx=nx-b.x,dz=nz-b.z;
 b.x=nx;b.z=nz;
 s.moving=Math.hypot(dx,dz)/h;
 return {dx,dz,moving:s.moving,distance:Math.hypot(p.x-b.x,p.z-b.z)};
}
