// Additional annual mechanics retain every named attack; all damage still uses
// the common hazard stream. No renderer owns a second collision clock.
import {drawPatternShuffle} from './pattern-shuffle.mjs';
import {hazardPosition} from './gyuwon-data.mjs';
import {rifleRay} from './gyuwon-year-choreography.mjs';
// 210 actual bullets: 30 seven-shot volleys. The rifle snapshots the
// target at the start of each volley, with readable, real-world preparation.
export const MARKSMAN_VOLLEYS=30;
export const MARKSMAN_BURST_ROUNDS=7;
export function tickMarksmanBarrage(g,add){
 const e=g?.gyuwon?.years;if(e?.cast!=='ultimateMarksman')return;
 e.marksmanVolleys??=1;
 while(e.marksmanVolleys<MARKSMAN_VOLLEYS&&e.castT>=e.marksmanVolleys*.62){
  const burst=e.marksmanVolleys++,b=g.boss,p=g.player;
  const aim=Math.atan2(p.x-b.x,p.z-b.z)+Math.sin(burst*1.47)*.09;
  for(let i=0;i<MARKSMAN_BURST_ROUNDS;i++){
   const angle=aim+(i-3)*.105;
   add(g,'lane',{...rifleRay(g,angle),warn:1.05+i*.075,
    width:.7,life:.22,damage:45,visual:'year-bullet',
    signature:'ultimateMarksman',marksmanVolley:burst});
  }
 }
}
export function augmentAnnualCast(g,id,{add,mark,line,mapHazards,playerAim}){
 const e=g.gyuwon.years,b=g.boss,p=g.player,a=playerAim(g);e.castDuration=0;e.cover=[];
 if(id==='ultimateMarksman'){
  // Staggered physical school barricades force a zigzag escape.
  const positions=[[10,0],[14,-6.5],[14,6.5],[19,-4.7],[19,4.7]];
  e.cover=positions.map(([forward,side],index)=>{
   const c={x:b.x+Math.sin(a)*forward+Math.cos(a)*side,
    z:b.z+Math.cos(a)*forward-Math.sin(a)*side,
    hp:675,maxHp:675,index,hitAt:-1000,brokenAt:null};
   const r=Math.hypot(c.x,c.z);if(r>25){c.x*=25/r;c.z*=25/r;}
   if(Math.hypot(c.x-p.x,c.z-p.z)<2.9){c.x-=Math.sin(a)*3;c.z-=Math.cos(a)*3;}
   return c;
  });
  e.marksmanVolleys=1;
  for(const h of g.gyuwon.hazards)if(h.visual==='year-bullet'){h.damage=45;h.marksmanVolley=0;}
 }
 if(id==='crossfire')for(let i=0;i<2;i++){const angle=a+(i?-.42:.42);add(g,'circle',{x:b.x,z:b.z,r:.78,vx:Math.sin(angle)*27,vz:Math.cos(angle)*27,warn:4.35+i*.5,life:1.55,damage:24,visual:'year-arrow'});}
 if(id==='archery')for(const h of g.gyuwon.hazards){const angle=a+drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-arrow-spread',[-.3,-.15,0,.15,.3]);h.vx=Math.sin(angle)*27;h.vz=Math.cos(angle)*27;}
 if(id==='letters')g.gyuwon.hazards.forEach((h,i)=>{h.sentenceIndex=i;h.warn=1.9+i*.18;});
 if(id==='ultimateSewage')for(const h of g.gyuwon.hazards.filter(h=>h.visual==='year-radial-sludge')){const index=Math.round(h.yaw/(Math.PI/4)),speed=5+index%3*1.6;h.vx=Math.sin(h.yaw)*speed;h.vz=Math.cos(h.yaw)*speed;h.warn+=index*.18;h.waveHeight=2.3+index%3*.55;}
 if(id==='sewageWave'&&e.castCount%2===0){g.gyuwon.hazards[0].z=81;g.gyuwon.hazards[0].speed=-32;}
 if(id==='ultimateShrine'){
  for(const ward of e.wards){ward.kind=ward.index;ward.hp=ward.maxHp=52;}
  // Each destroyed shrine cancels only its own distinct attack family.
  for(const h of g.gyuwon.hazards)if(h.wardIndex!==undefined){
   const k=h.wardIndex;
   if(h.visual==='year-photocard'){
    if(k===0){h.r=.95;h.vx*=1.2;h.vz*=1.2;}
    if(k===1){h.shape='ring';h.r=1.5;h.width=.45;h.grow=6;h.life=1.15;h.vx=h.vz=0;h.visual='year-stream-pulse';}
    if(k===2){h.r=1.5;h.vx*=.65;h.vz*=.65;h.life=2;}
    if(k===3){h.vx=-h.vx;h.vz=-h.vz;}
    if(k===4){h.visual='year-letters';h.damage=25;}
    if(k===5){h.visual='year-ink';h.r=2.4;h.vx=h.vz=0;h.warn+=.5;}
   }
  }
 }
 if(id==='donation'||id==='ultimateGacha'){
  const outcome=e.gachaResult;g.gyuwon.hazards=g.gyuwon.hazards.filter(h=>h.visual!=='year-gacha-prize'&&h.visual!=='year-stream-pulse');
  const put=(x,z,warn,r,damage)=>add(g,'circle',{x,z,warn,r,damage,life:.5,visual:'year-gacha-prize',prizeOutcome:outcome});
  if(outcome===0){put(p.x,p.z,3.4,5,42);add(g,'ring',{x:p.x,z:p.z,r:3,width:.7,grow:8,warn:4.3,life:1.5,damage:27,visual:'year-stream-pulse'});}
  if(outcome===1)for(let i=0;i<6;i++)put(p.x+Math.sin(i*2.4)*6,p.z+Math.cos(i*2.4)*6,3.3+i*.5,1.9,21);
  if(outcome===2){
   const end={x:p.x,z:p.z},from={x:b.x,z:b.z};e.rideTrack=[{from,to:from,start:0,end:3.4,ride:'body'},{from,to:end,start:3.4,end:5.3,ride:'body'}];e.rideInitialYaw=b.yaw;
   add(g,'circle',{x:b.x,z:b.z,r:2,rideSegment:e.rideTrack[1],warn:3.4,life:1.9,damage:36,visual:'year-vehicle',ride:'body'});
  }
  if(outcome===3)for(let i=-1;i<=1;i++){
   const yaw=a+i*.25,vx=Math.sin(yaw)*14,vz=Math.cos(yaw)*14;
   add(g,'circle',{x:b.x,z:b.z,r:1.4,vx,vz,warn:3.3,life:1.7,damage:24,visual:'year-gacha-prize'});
   add(g,'circle',{x:b.x+vx*1.7,z:b.z+vz*1.7,r:1.4,vx:-vx,vz:-vz,warn:5.4,life:1.7,damage:24,visual:'year-gacha-prize',reversed:true});
  }
  if(outcome===4)for(let i=0;i<6;i++)add(g,'ring',{x:b.x,z:b.z,r:1.5,width:.6,grow:11,warn:3.3+i*.65,life:1.5,damage:25,visual:'year-stream-pulse'});
  if(outcome===5)for(let i=0;i<8;i++){const yaw=i*Math.PI/4;put(b.x+Math.sin(yaw)*9,b.z+Math.cos(yaw)*9,3.3+i*.48,3.5,30);}
 }
 if(id==='recallMix'||id==='ultimateParadox'){
  // The sword visibly creates the passage before the moving sea arrives.
  const wave=g.gyuwon.hazards.find(h=>h.shape==='wave');
  if(wave){const target=wave.gap,cutAt=Math.max(1.2,wave.warn-.4);wave.gapTarget=target;wave.gap=Math.max(-22,Math.min(22,target+(target>=0?-5:5)));wave.shiftAt=cutAt;wave.shiftSpeed=8;line(g,target,0,0,cutAt,{width:1.5,length:130,life:.3,damage:22,visual:'sword',opensWave:true});}
  const die=g.gyuwon.hazards.find(h=>h.visual==='dice'),crowd=g.gyuwon.hazards.filter(h=>h.visual==='year-audience');
  if(die&&crowd.length)for(const h of g.gyuwon.hazards.filter(h=>h.visual==='dice')){h.stageRedirect=true;h.dropFromX=h.x+(e.year%2?7:-7);h.dropFromZ=h.z-6;}
  if(die)for(const h of crowd){h.redirectAt=die.warn+.3;h.redirectYaw=Math.atan2(h.vx,h.vz)+(e.year%2?.45:-.45);h.redirectCue=die.id;}
 }
 if(id==='nightmare365'){
  const x=b.x+Math.sin(a)*7,z=b.z+Math.cos(a)*7;
  add(g,'topple',{x,z,yaw:a,width:7,length:24,r:7,warn:19.5,life:.6,damage:43,visual:'year-final-omr',signature:id});
  e.castDuration=23.5;
 }
 if(e.year>=12){
  // Endless years vary order and space, not an unlimited damage multiplier.
  const shift=(e.year-11)%4;
  for(const h of g.gyuwon.hazards){if(!h.rideSegment&&h.muzzleX===undefined&&h.shape!=='wave'&&h.visual!=='year-final-omr'){const angle=shift*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle),x=h.x-b.x,z=h.z-b.z;h.x=b.x+x*c-z*s;h.z=b.z+x*s+z*c;if(h.vx!==undefined){const vx=h.vx,vz=h.vz;h.vx=vx*c-vz*s;h.vz=vx*s+vz*c;}if(h.originX!==undefined){const x=h.originX-b.x,z=h.originZ-b.z;h.originX=b.x+x*c-z*s;h.originZ=b.z+x*s+z*c;}h.yaw=(h.yaw||0)-angle;}}
  if(id.startsWith('ultimate')&&id!=='ultimateMarksman'){const remembered=drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-endless-recollection',['sword','circus','gamble','tsunami'],{avoid:g.gyuwon.stageMemory});mapHazards(g,remembered,1.8);}
 }
 if(id.startsWith('ultimate')||id==='nightmare365')for(const h of g.gyuwon.hazards)h.signature??=id;
 e.castDuration=Math.max(e.castDuration,...g.gyuwon.hazards.map(h=>h.warn+h.life+.3));
}
export function resolveAnnualProjectileCover(g,h,emit){
 const e=g.gyuwon.years;if(h.visual!=='year-bullet'||!e.cover?.length)return;
 const sx=h.muzzleX,sz=h.muzzleZ,dx=Math.sin(h.yaw),dz=Math.cos(h.yaw);let hit=null,near=Infinity;
 for(const c of e.cover){const x=c.x-sx,z=c.z-sz,along=x*dx+z*dz,across=Math.abs(x*dz-z*dx);if(c.hp>0&&along>0&&along<h.length&&across<2.1&&along<near){near=along;hit=c;}}
 if(hit){hit.hp=Math.max(0,hit.hp-h.damage);hit.hitAt=g.time;
  if(hit.hp===0&&hit.brokenAt===null)hit.brokenAt=g.time;
  h.length=near;h.x=sx+dx*near/2;h.z=sz+dz*near/2;
  emit('gyuwon-cover-hit',{x:hit.x,z:hit.z,broken:hit.hp===0});}
}
export function tickAnnualMechanics(g,h,dt,add,emit){
 if(h.gapTarget!==undefined&&h.age>=h.shiftAt){const delta=h.gapTarget-h.gap;h.gap+=Math.sign(delta)*Math.min(Math.abs(delta),h.shiftSpeed*dt);}
 if(h.redirectAt&&!h.redirected&&h.age>=h.redirectAt){const p=hazardPosition(h);h.x=p.x;h.z=p.z;const speed=Math.hypot(h.vx,h.vz);h.vx=Math.sin(h.redirectYaw)*speed;h.vz=Math.cos(h.redirectYaw)*speed;h.life=Math.max(.5,h.warn+h.life-h.age);h.warn=h.age;h.redirected=true;}
 if(h.persistent&&h.age>=h.warn&&(h.nextTick||0)<=h.age){h.hit=false;h.nextTick=h.age+1;}
 if(h.visual==='year-workbook'&&!h.opened&&h.age>=h.warn+h.life-.04){h.opened=true;const p=hazardPosition(h);add(g,'ring',{x:p.x,z:p.z,r:.8,width:.5,grow:4,warn:1.05,life:1.2,damage:14,visual:'year-open-workbook',lingering:true});}
 if(!h.fired&&h.age>=h.warn){
  resolveAnnualProjectileCover(g,h,emit);
  if(h.visual==='year-sludge'&&!h.persistent&&g.gyuwon.hazards.filter(x=>x.persistent).length<12)add(g,'circle',{x:h.x,z:h.z,r:h.r,damage:5,warn:.8,life:7,visual:'year-sludge',persistent:true,puddle:true});
 }
}

export function pushOutAnnualCover(g){for(const c of g.gyuwon.years?.cover||[]){if(c.hp<=0)continue;const dx=g.player.x-c.x,dz=g.player.z-c.z,d=Math.hypot(dx,dz);if(d<2.15){const a=d>1e-6?Math.atan2(dx,dz):0;g.player.x=c.x+Math.sin(a)*2.15;g.player.z=c.z+Math.cos(a)*2.15;}}}
