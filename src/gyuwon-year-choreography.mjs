// Simulation and presentation share these tracks. No renderer owns movement,
// damage, random outcomes or a second animation clock.
export const unit=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=unit(x);return x*x*(3-2*x);};
export const GYUWON_RIFLE_SOCKET=Object.freeze({side:.365,forward:1.655,height:2.486});
export function rifleRay(g,angle,length=64){
 const {side,forward}=GYUWON_RIFLE_SOCKET;
 const muzzleX=g.boss.x+Math.cos(angle)*side+Math.sin(angle)*forward;
 const muzzleZ=g.boss.z-Math.sin(angle)*side+Math.cos(angle)*forward;
 return {x:muzzleX+Math.sin(angle)*length/2,z:muzzleZ+Math.cos(angle)*length/2,
  yaw:angle,length,muzzleX,muzzleZ};
}
// Mirrored wrist origin for the independent repeating bow. The two arms
// share the same yaw clock while keeping separate physical muzzle positions.
export const GYUWON_BOW_SOCKET=Object.freeze({side:-.365,forward:1.38,height:2.38});
export function bowMuzzle(g,angle){
 const {side,forward}=GYUWON_BOW_SOCKET;
 return {x:g.boss.x+Math.cos(angle)*side+Math.sin(angle)*forward,
  z:g.boss.z-Math.sin(angle)*side+Math.cos(angle)*forward};
}
export function rifleAimYaw(hazards){
 const shots=hazards.filter(h=>h.visual==='year-bullet');
 const next=shots.find(h=>h.age<h.warn),previous=shots.findLast(h=>h.age>=h.warn);
 if(!next)return previous?.yaw;
 if(!previous)return next.yaw;
 const delta=Math.atan2(Math.sin(next.yaw-previous.yaw),Math.cos(next.yaw-previous.yaw));
 return previous.yaw+delta*smooth((.45-(next.warn-next.age))/.30);
}
export function sampleRide(segment,time){
 const q=unit((time-segment.start)/(segment.end-segment.start)),u=smooth(q);
 let x,z,yaw;
 if(segment.orbit){
  const a=segment.a+(segment.b-segment.a)*u;
  x=Math.sin(a)*segment.radius;z=Math.cos(a)*segment.radius;
  yaw=a+(segment.b>segment.a?Math.PI/2:-Math.PI/2);
 }else{
  x=segment.from.x+(segment.to.x-segment.from.x)*u;
  z=segment.from.z+(segment.to.z-segment.from.z)*u;
  yaw=Math.atan2(segment.to.x-segment.from.x,segment.to.z-segment.from.z);
 }
 return {x,z,yaw,y:segment.jump?Math.sin(Math.PI*q)*4.2:0,r:segment.r||1.85};
}
export function ridePose(e){
 if(!e?.rideTrack?.length||!e.cast||e.mode!=='combat')return null;
 if(e.castT>e.rideTrack.at(-1).end+.18)return null;
 const index=e.rideTrack.findIndex(s=>e.castT<=s.end),i=index<0?e.rideTrack.length-1:index;
 const segment=e.rideTrack[i],pose=sampleRide(segment,e.castT);
 const previous=i?sampleRide(e.rideTrack[i-1],segment.start).yaw:e.rideInitialYaw??pose.yaw;
 const delta=Math.atan2(Math.sin(pose.yaw-previous),Math.cos(pose.yaw-previous));
 pose.yaw=previous+delta*smooth((e.castT-segment.start)/.28);
 return {...pose,ride:segment.ride||e.rideKind};
}
export function makeRide(g,{add,ultimate=false,scooter=false}={}){
 const e=g.gyuwon.years,b=g.boss,p=g.player,track=[];
 const r=scooter?1.42:1.85;
 let pos={x:b.x,z:b.z},time=0;
 const move=(to,duration,damaging=false,jump=false)=>{
  const segment={from:{...pos},to:{...to},start:time,end:time+duration,jump,r};
  track.push(segment);
  if(damaging)add(g,'circle',{x:pos.x,z:pos.z,r,warn:time,life:duration,
   visual:'year-vehicle',damage:scooter?25:32,ride:scooter?'scooter':'bike',rideSegment:segment});
  time+=duration;pos={...to};return segment;
 };
 if(!ultimate){
  // Mount and brake before moving; the route ends inside the round arena.
  move(pos,1.08);
  const a=Math.atan2(p.x-pos.x,p.z-pos.z),distance=scooter?14:20;
  let to={x:pos.x+Math.sin(a)*distance,z:pos.z+Math.cos(a)*distance};
  const d=Math.hypot(to.x,to.z);if(d>27){to.x*=27/d;to.z*=27/d;}
  move(to,1.12,true);
 }else if(scooter){
  move(pos,1.2);
  for(let i=0;i<5;i++){
   const to={x:i%2?18:-18,z:Math.max(-19,Math.min(19,p.z+(i-2)*3))};
   if(i)move(pos,.65); // visible brake, reverse and coil before the next rush
   move(to,.85,true);
  }
 }else{
  const radius=26,initial=Math.atan2(pos.x,pos.z);
  move({x:Math.sin(initial)*radius,z:Math.cos(initial)*radius},1.5);
  let angle=initial;
  for(let i=0;i<4;i++){
   const next=angle+.70;
   const orbit={orbit:true,radius,a:angle,b:next,start:time,end:time+1.05,r};
   track.push(orbit);time=orbit.end;pos=sampleRide(orbit,time);angle=next;
   const aim=Math.atan2(p.x-pos.x,p.z-pos.z),dx=Math.sin(aim),dz=Math.cos(aim);
   // Intersect the ray through the snapshotted target with the far arena edge.
   const dot=pos.x*dx+pos.z*dz;
   const distance=-dot+Math.sqrt(Math.max(0,dot*dot+radius*radius-pos.x*pos.x-pos.z*pos.z));
   move({x:pos.x+dx*distance,z:pos.z+dz*distance},1.1,true);
   angle=Math.atan2(pos.x,pos.z);
  }
  move({...p},1.25,false,true);
 }
 e.rideTrack=track;e.rideKind=scooter?'scooter':'bike';e.rideInitialYaw=b.yaw;
 return {end:time,position:pos};
}
export function gyuwonWeaponPose(e,hazards=[]){
 const id=e?.mode==='combat'?e.cast:null,t=e?.castT||0;
 const rifle=id==='sniper'||id==='crossfire'&&t<3.65||id==='ultimateMarksman'||id==='nightmare365'&&t>=4.25&&t<5.9;
 const dual=id==='ultimateMarksman';
 const bow=dual||id==='archery'||id==='crossfire'&&t>=3.65;
 const cigarette=id==='smoke';
 const bulletShots=hazards.filter(h=>h.visual==='year-bullet');
 const arrowShots=hazards.filter(h=>h.visual==='year-arrow');
 const latestRifle=bulletShots.findLast(h=>h.age>=h.warn);
 const nextArrow=arrowShots.find(h=>h.age<h.warn);
 const latestArrow=arrowShots.findLast(h=>h.age>=h.warn);
 const sinceRifle=latestRifle?latestRifle.age-latestRifle.warn:Infinity;
 const sinceArrow=latestArrow?latestArrow.age-latestArrow.warn:Infinity;
 // Independent beats allow continuous right-hand rifle recoil and
 // left-hand bow draw. Dual mode uses a self-nocking mechanical bow:
 // the rifle hand does not teleport across to its string.
 const recoil=sinceRifle>=0&&sinceRifle<.24?Math.sin(Math.PI*sinceRifle/.24):0;
 const draw=bow&&nextArrow?smooth(1-(nextArrow.warn-nextArrow.age)/.38):0;
 return {rifle,bow,dual,cigarette,recoil,draw,
  nocked:bow&&!dual&&!!nextArrow&&sinceArrow>.10,
  autoNocked:dual&&!!nextArrow};
}
export function ownAnticipation(h,lead=1.05){
 return unit(1-(h.warn-h.age)/Math.min(lead,h.warn));
}
export function tentacleYaw(h){
 if(!h.sweep)return h.yaw;
 return h.yaw+h.sweep*(smooth((h.age-h.warn)/h.life)-.5);
}

