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
 let x,z,yaw,bank=0,wheelie=0;
 if(segment.orbit){
  const progress=segment.cruise?q:segment.brake?(2*q-q*q):u;
  const a=segment.a+(segment.b-segment.a)*progress;
  x=Math.sin(a)*segment.radius;z=Math.cos(a)*segment.radius;
  yaw=a+(segment.b>segment.a?Math.PI/2:-Math.PI/2);
  if(segment.cruise||segment.brake)bank=.22*(segment.b>segment.a?1:-1)*(segment.brake?1-u:1);
 }else if(segment.curve){
  const [a,b]=segment.curve,v=1-q;
  x=v*v*v*segment.from.x+3*v*v*q*a.x+3*v*q*q*b.x+q*q*q*segment.to.x;
  z=v*v*v*segment.from.z+3*v*v*q*a.z+3*v*q*q*b.z+q*q*q*segment.to.z;
  const dx=3*v*v*(a.x-segment.from.x)+6*v*q*(b.x-a.x)+3*q*q*(segment.to.x-b.x);
  const dz=3*v*v*(a.z-segment.from.z)+6*v*q*(b.z-a.z)+3*q*q*(segment.to.z-b.z);
  yaw=Math.atan2(dx,dz);bank=.22*smooth(q/.3);
 }else{
  x=segment.from.x+(segment.to.x-segment.from.x)*u;
  z=segment.from.z+(segment.to.z-segment.from.z)*u;
  yaw=Math.atan2(segment.to.x-segment.from.x,segment.to.z-segment.from.z);
 }
 if(segment.stage==='windup'){
  const turn=Math.atan2(Math.sin((segment.aimYaw??yaw)-yaw),Math.cos((segment.aimYaw??yaw)-yaw));
  yaw+=turn*smooth((q-.25)/.75);wheelie=segment.lift*smooth((q-.2)/.8);
 }
 if(segment.stage==='rush')wheelie=segment.lift*(1-smooth((q-.45)/.55));
 return {x,z,yaw,y:segment.jump?Math.sin(Math.PI*q)*4.2:0,r:segment.r||1.85,bank,wheelie,stage:segment.stage};
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
// Rotate actor and vehicle about the same rear axle; planted shoes and hands
// remain attached while the front wheel lifts. No separate FX movement clock.
export function rideFrame(pose){
 const pitch=pose.wheelie||0,rear=pose.ride==='scooter'?1.1:1.35,axle=pose.ride==='scooter'?.35:.77;
 const forward=rear*(Math.cos(pitch)-1)+axle*Math.sin(pitch);
 return {x:pose.x+Math.sin(pose.yaw)*forward,z:pose.z+Math.cos(pose.yaw)*forward,
  y:(pose.y||0)+axle*(1-Math.cos(pitch))+rear*Math.sin(pitch),pitch:-pitch,bank:pose.bank||0,yaw:pose.yaw};
}
function lockRideTarget(prep,target){
 const rush=prep.rush,escape=prep.escape,from=rush.from;
 const yaw=Math.atan2(target.x-from.x,target.z-from.z),dx=Math.sin(yaw),dz=Math.cos(yaw),dot=from.x*dx+from.z*dz;
 const distance=Math.max(0,-dot+Math.sqrt(Math.max(0,dot*dot+28*28-from.x*from.x-from.z*from.z)));
 rush.to={x:from.x+dx*distance,z:from.z+dz*distance};prep.aimYaw=yaw;
 escape.from={...rush.to};escape.curve[0]={...rush.to};
 prep.target={x:target.x,z:target.z};
}
export function updateRideAim(g){
 const e=g.gyuwon.years;
 for(const segment of e.rideTrack||[]){
  if(segment.stage==='windup'&&!segment.locked&&e.castT>=segment.start){
   lockRideTarget(segment,g.player);segment.locked=true;
  }
 }
}
export function makeRide(g,{add,ultimate=false,scooter=false}={}){
 const e=g.gyuwon.years,b=g.boss,track=[],radius=25,r=scooter?1.42:1.85;
 const angular=scooter?2.15:1.95,lift=scooter?.50:.62;
 let pos={x:b.x,z:b.z},time=0,angle=Math.atan2(pos.x,pos.z);
 const point=a=>({x:Math.sin(a)*radius,z:Math.cos(a)*radius});
 const tangent=(a,scale)=>({x:Math.cos(a)*scale,z:-Math.sin(a)*scale});
 const push=(segment,duration)=>{Object.assign(segment,{start:time,end:time+duration,r});track.push(segment);time+=duration;pos=sampleRide(segment,time);return segment;};
 const curveTo=(to,a,duration)=>{const v=tangent(a,6);return push({from:{...pos},to:{...to},curve:[{...pos},{x:to.x-v.x,z:to.z-v.z}],stage:'return'},duration);};
 const orbit=(sweep,brake=false)=>{const segment=push({orbit:true,cruise:!brake,brake,radius,a:angle,b:angle+sweep,stage:brake?'windup':'orbit',lift:brake?lift:0},brake?.78:sweep/angular);angle+=sweep;return segment;};
 // Fast continuous perimeter travel, with a complete lap before the first rush.
 curveTo(point(angle),angle,.95);
 const count=ultimate?(scooter?5:4):1;
 for(let i=0;i<count;i++){
  orbit(i===0?Math.PI*2:2.65);
  const prep=orbit(angular*.78/2,true);
  const rush=push({from:{...pos},to:point(angle+Math.PI),stage:'rush',lift},.98);
  const rejoin=angle+Math.PI+.65,escape=curveTo(point(rejoin),rejoin,.72);
  angle=rejoin;Object.assign(prep,{rush,escape,locked:false});lockRideTarget(prep,g.player);
  add(g,'circle',{x:rush.from.x,z:rush.from.z,r,warn:rush.start,life:rush.end-rush.start,
   visual:'year-vehicle',damage:scooter?25:32,ride:scooter?'scooter':'bike',rideSegment:rush});
 }
 orbit(2.35);
 // Settle both wheels and bleed speed before dismounting; the cast owns this tail.
 push({orbit:true,brake:true,radius,a:angle,b:angle+.4,stage:'brake'},.48);
 e.rideTrack=track;e.rideKind=scooter?'scooter':'bike';e.rideInitialYaw=b.yaw;
 return {end:time,position:{x:pos.x,z:pos.z}};
}
export function gyuwonWeaponPose(e,hazards=[]){
 const id=e?.mode==='combat'?e.cast:null,t=e?.castT||0;
 const rifle=id==='sniper'||id==='crossfire'&&t<3.65||id==='ultimateMarksman'||id==='nightmare365'&&t>=4.25&&t<5.9;
 const dual=id==='ultimateMarksman';
 const bow=dual||e?.year===7&&e?.mode==='combat'||id==='archery'||id==='crossfire'&&t>=3.65;
 const cigarette=id==='smoke';
 const bulletShots=hazards.filter(h=>h.visual==='year-bullet');
 const arrowShots=hazards.filter(h=>h.visual==='year-arrow'||h.visual==='arsenal-arrow'||h.visual==='arsenal-falling-arrow');
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
 return {rifle,bow,dual,cigarette,recoil,draw,arsenal:e?.mode==='combat'?({5:'hammer',6:'sword',7:'bow',8:'cards'})[e?.year]:undefined,
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

