import {ARSENAL_PATTERNS,ARSENAL_ROSTERS,spawnArsenal,tickArsenal} from './gyuwon-arsenal.mjs';
import {augmentAnnualCast,tickAnnualMechanics,tickMarksmanBarrage} from './gyuwon-nightmare-mechanics.mjs';
import {GYUWON_CALENDAR_SECONDS,syncAnnualHealth,annualFloor,annualFloorForYear,applyAnnualCarry,settleAnnualCarryBeforeGrade} from './gyuwon-annual-progress.mjs';
import {makeRide,ridePose,updateRideAim,rifleRay,rifleAimYaw} from './gyuwon-year-choreography.mjs';
import {drawPatternShuffle} from './pattern-shuffle.mjs';
import {hazardContains} from './gyuwon-data.mjs';
import {GYUWON_YEAR_SIGNATURES,GYUWON_SIGNATURE_SPECS,
 spawnGyuwonSignature,gyuwonWorldBreak} from './gyuwon-year-signatures.mjs';

// New live-battle rules. The pre-2026 phase patterns remain only as compatibility
// code for old tools/tests and are not selected by the published year-mode fight.
export const GYUWON_YEAR_SECONDS=GYUWON_CALENDAR_SECONDS;
export const GYUWON_EXAM_SUBJECTS=Object.freeze(['국어','수학','영어','한국사','탐구']);
export const GYUWON_SUBJECT_SECONDS=.9;
export const GYUWON_RESULT_SECONDS=3;
export const GYUWON_MIN_TELEGRAPH=1.05;
export const GYUWON_EXAM_MAX_REACH=6.2;
export const GYUWON_YEAR_PATTERNS=Object.freeze({
 bike:[3.4,1.3],scooter:[3.6,1.3],smoke:[3.2,1.3],
 workbook:[3.8,1.2],pencil:[3.5,1.2],
 letters:[4.65,1.2],bookfall:[4.1,1.45],
 sniper:[3.7,1.65],archery:[4.1,1.6],crossfire:[4.45,1.75],
 sewageThrow:[3.8,1.4],sewageWave:[7.4,2],sewageBomb:[4.4,1.6],
 figures:[5.2,1.5],photocard:[4.55,1.4],merch:[4.8,1.7],
 dance:[4.2,1.5],donation:[6.8,1.65],chatstorm:[4.3,1.4],
 octoStrike:[4.8,1.6],octoSweep:[5.1,1.7],octoInk:[4.5,1.5],
 recall:[5.9,1.8],recallMix:[7.0,2.0],recallAll:[8.6,2.2],
 ...GYUWON_SIGNATURE_SPECS,...ARSENAL_PATTERNS
});
const YEAR_ROSTERS=Object.freeze({
 1:['bike','scooter','smoke'],
 2:['workbook','pencil','scooter'],
 3:['letters','bookfall'],
 4:['sniper','archery','crossfire'],
 ...ARSENAL_ROSTERS,
 9:['recall'],10:['recallMix'],11:['recallAll']
});
export const gyuwonYearRoster=year=>YEAR_ROSTERS[Math.min(11,Math.max(1,year))];
export const gyuwonYearTitle=year=>year===1?'현역':year===2?'재수':year>11?'n수':year+'수';
export const gyuwonMapInterval=year=>Math.max(1.5,12/Math.pow(1.35,Math.max(0,year-9)));
export function createGyuwonYears(){
 return {mode:'combat',year:1,day:365,season:0,cast:null,castT:0,castCount:0,
  recover:1.8,subject:0,subjectT:0,grade:null,gradeT:0,gradeAt:-100,
  bannerUntil:2.8,subjectLabel:null,scoreFlash:0,from:null,aim:0,
  mapClock:0,mapIndex:0,chat:[],gachaResult:0,lastCast:null,dodge:null,
  signatureUsed:false,nightmareUsed:false,failures:0,worldBreak:0,wards:[],
  resultScene:null,nightmareStartedAt:-1,examCount:0,
  attackBuff:0,speedBuff:0,inquiry:null,rideTrack:[],rideKind:null,calendarDamage:0,damageBank:0,yearDamage:0,endingUnlocked:false,mapPending:false};
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function add(g,shape,opts={}){
 const h={id:g.nextId++,shape,x:g.boss.x,z:g.boss.z,r:2,warn:GYUWON_MIN_TELEGRAPH,
  life:.34,age:0,damage:22,hit:false,fired:false,...opts};
 g.gyuwon.hazards.push(h);return h;
}
const line=(g,x,z,yaw,warn,extra={})=>add(g,'lane',{
 x,z,yaw,width:1.3,length:36,warn,life:.37,damage:24,...extra});
const mark=(g,x,z,warn,r=2.6,damage=24,visual='year-target')=>
 add(g,'circle',{x,z,r,warn,life:.24,damage,visual});
function playerAim(g){return Math.atan2(g.player.x-g.boss.x,g.player.z-g.boss.z);}
const locations=['sword','circus','gamble','tsunami'];
function mapHazards(g,key,offset=0){
 const b=g.boss,p=g.player,a=playerAim(g);
 if(key==='sword'){
  line(g,p.x,p.z,a,1.25+offset,{width:1.55,length:43,damage:27,visual:'sword'});
  line(g,p.x,p.z,a+Math.PI/2,2.25+offset,{width:1.45,length:36,damage:25,visual:'sword'});
 }
 if(key==='circus'){
  for(let i=0;i<2;i++){
   const angle=a+(i?-.55:.55),dx=Math.sin(angle),dz=Math.cos(angle);
   add(g,'circle',{x:p.x-dx*34,z:p.z-dz*34,r:1.5,vx:dx*19,vz:dz*19,
    warn:1.6+offset+i*.65,life:2.6,damage:24,visual:'year-audience'});
  }
  for(let i=0;i<3;i++){const angle=a+i*.8-1;
   const dx=Math.sin(angle),dz=Math.cos(angle);
   add(g,'circle',{x:-dx*36,z:-dz*36,r:2.65,vx:dx*23,vz:dz*23,
    warn:1.15+offset+i*.62,life:2.35,damage:25,visual:'year-circus'});}
 }
 if(key==='gamble'){
  for(let i=0;i<3;i++)mark(g,p.x+Math.sin(i*2.05)*6,p.z+Math.cos(i*2.05)*6,1.3+offset+i*.55,2.65,27,'dice');
 }
 if(key==='tsunami'){
  const gap=clamp(p.x,-22,22);
  add(g,'wave',{x:0,z:-79,gap,opening:4.3,depth:2.05,speed:32,
   warn:1.15+offset,life:4.3,damage:36,visual:'year-water-wave'});
 }
}
function spawnExamSubject(g,index){
 const e=g.gyuwon.years;
 // The exam is a short peaceful interlude, with a desk and physical OMR.
 g.gyuwon.hazards.length=0;
 e.subject=index;e.subjectT=0;e.subjectLabel=GYUWON_EXAM_SUBJECTS[index];
 if(index===4){
  const benefit=drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-inquiry',['attack','heal','speed']);
  e.inquiry=benefit;
  if(benefit==='attack')e.attackBuff=5;
  else if(benefit==='speed')e.speedBuff=3;
  else g.boss.hp=Math.min(g.boss.maxHp,g.boss.hp+g.boss.maxHp*.01);
 }
 g.gyuwon.pattern='year-exam';g.gyuwon.t=0;g.gyuwon.motionBeats=[];
}
function beginExam(g,emit){
 const e=g.gyuwon.years;
 // The previous year's deferred hits are resolved BEFORE any subject reward
 // or Suneung grade. Never silently lower the HP after announcing recovery.
 settleAnnualCarryBeforeGrade(g);
 e.mode='exam';e.cast=null;e.subject=0;e.subjectT=0;e.day=0;
 g.boss.state='pattern';g.gyuwon.elevation=0;
 spawnExamSubject(g,0);
 emit('gyuwon-exam-bell',{year:e.year});
}
export function resolveGyuwonExamGrade(g,random=Math.random(),emit=()=>{}){
 const e=g.gyuwon.years;
 const r=clamp(Number.isFinite(random)?random:.5,0,1-Number.EPSILON);
 const result=r<.30?'great':r<.70?'normal':'failure';
 const max=g.boss.maxHp,delta=max*(result==='great'?.05:result==='normal'?.02:-.04);
 // Apply any earlier overflow before success/normal/failure adjustments.
 // The HP shown during the result cinematic must match the next-year HP.
 settleAnnualCarryBeforeGrade(g);
 // Failures can reduce HP into the *next* year's allowance. Never resurrect
 // an already-lower HP value or kill the boss before the last annual ultimate.
 const lower=delta<0?Math.min(g.boss.hp,annualFloorForYear(g,e.year+1)):0;
 g.boss.hp=clamp(g.boss.hp+delta,lower,max);
 e.grade=result;e.gradeT=0;e.gradeAt=g.time;e.scoreFlash=1;e.mode='result';e.subjectLabel=null;
 e.cast=null;g.gyuwon.pattern=null;g.gyuwon.hazards.length=0;
 e.examCount++;e.failures+=(result==='failure'?1:0);e.worldBreak=gyuwonWorldBreak(e.examCount+1,e.failures);
 e.resultScene={grade:result,fromYear:e.year,nextYear:e.year+1,duration:GYUWON_RESULT_SECONDS};
 e.wards=[];g.boss.state='recovery';
 emit('gyuwon-exam-grade',{result,delta,year:e.year});
 if(g.boss.hp<=0){g.status='won';g.boss.state='dead';emit('victory');}
 return {result,delta};
}
function pickMemoryMap(g){
 const e=g.gyuwon.years,s=g.gyuwon;
 if(e.year<9){s.stageMemory=null;g.boss.phase=1;return;}
 g.boss.phase=3;const pool=locations;
 s.stageMemory=drawPatternShuffle(s.patternDeck,'gyuwon-annual-map',pool,{avoid:s.stageMemory});s.stageTime=0;
 e.mapClock=0;e.mapPending=false;e.mapIndex++;
}
function startNextYear(g,emit){
 const e=g.gyuwon.years;
 e.year=e.year+1;e.day=365;e.season=0;e.mode='combat';e.cast=null;e.castT=0;
 e.grade=null;e.gradeT=0;e.recover=1.9;e.bannerUntil=g.time+2.65;e.dodge=null;
 e.mapClock=0;e.mapPending=false;e.chat=[];e.wards=[];applyAnnualCarry(g);e.yearStartHp=g.boss.hp;e.weaponPlan=null;
 e.signatureUsed=false;e.nightmareUsed=false;e.rideTrack=[];
 e.worldBreak=gyuwonWorldBreak(e.examCount+1,e.failures);e.resultScene=null;
 g.gyuwon.hazards.length=0;
 g.boss.state='recovery';g.gyuwon.pattern=null;g.gyuwon.space='white';
 pickMemoryMap(g);
 emit('gyuwon-year',{year:e.year});
}
function beginCast(g,id,emit){
 const e=g.gyuwon.years,b=g.boss,p=g.player,a=playerAim(g);
 e.cast=id;e.lastCast=id;e.castT=0;e.castCount++;e.from={x:b.x,z:b.z};e.dodge=null;
 e.aim=a;g.gyuwon.t=0;g.gyuwon.pattern='year-'+id;
 e.rideTrack=[];e.weaponPlan=null;
 if(GYUWON_YEAR_SIGNATURES[Math.min(11,e.year)]===id){e.signatureUsed=true;if(e.year>=11)e.nightmareUsed=true;}
 g.boss.state='pattern';b.yaw=a;g.gyuwon.hazards=g.gyuwon.hazards.filter(h=>(h.persistent||h.lingering)&&h.age<h.warn+h.life);
 const dx=Math.sin(a),dz=Math.cos(a);
 if(spawnArsenal(g,id,add)){
  // All weapon contacts were authored in the shared arsenal module.
 }else if(Object.values(GYUWON_YEAR_SIGNATURES).includes(id)||id.startsWith('ultimate')||id==='nightmare365'){
  spawnGyuwonSignature(g,id,{add,mark,line,mapHazards,playerAim,makeRide});
 }else if(id==='bike'||id==='scooter'){
  makeRide(g,{add,scooter:id==='scooter'});
 }else if(id==='smoke'){
  add(g,'cone',{x:b.x,z:b.z,yaw:a,r:12,arc:.55,innerR:1.5,
   warn:1.3,life:1.0,damage:18,visual:'year-smoke'});
 }else if(id==='workbook'||id==='pencil'){
  const count=id==='workbook'?3:5,base=id==='workbook'?21:26;
  for(let i=0;i<count;i++){
   const angle=a+(i-(count-1)/2)*.14,d=Math.sin(angle),z=Math.cos(angle);
   add(g,'circle',{x:b.x,z:b.z,r:id==='workbook'?1.4:.75,
    vx:d*base,vz:z*base,warn:1.1+i*.28,life:1.1,
    damage:id==='workbook'?23:16,visual:'year-'+id});
  }
 }else if(id==='letters'){
  // Letters are physical embossed projectiles rather than invisible 36m lanes.
  for(let i=0;i<4;i++){
   const angle=a+(i-1.5)*.14;
   add(g,'circle',{x:b.x,z:b.z,r:1.37,
    vx:Math.sin(angle)*24,vz:Math.cos(angle)*24,
    warn:1.05+i*.62,life:1.5,damage:22,visual:'year-letters'});
  }
 }else if(id==='bookfall'){
  for(let i=0;i<5;i++)mark(g,p.x+(i%3-1)*4,p.z+(Math.floor(i/3)-.5)*4,
   1.1+i*.52,2.5,24,'year-bookfall');
 }else if(id==='sniper'||id==='crossfire'){
  const shots=id==='sniper'?2:3;
  for(let i=0;i<shots;i++){
   // Rifle muzzle, aim line and damage all use the same fixed ray.
   const shotAngle=a+(i-(shots-1)/2)*.25;
   const distance=Math.max(30,Math.hypot(p.x-b.x,p.z-b.z)+5);
   add(g,'lane',{...rifleRay(g,shotAngle),warn:1.6+i*.88,
    width:.7,life:.22,damage:32,visual:'year-bullet',shotIndex:i});
  }
 }else if(id==='archery'){
  for(let i=0;i<4;i++){
   const angle=a+(i-1.5)*.12;
   add(g,'circle',{x:b.x,z:b.z,r:.78,vx:Math.sin(angle)*27,vz:Math.cos(angle)*27,
    warn:1.2+i*.47,life:1.55,damage:24,visual:'year-arrow'});
  }
 }else if(id==='sewageThrow'||id==='sewageBomb'){
  for(let i=0;i<(id==='sewageBomb'?4:3);i++)mark(g,
   p.x+Math.sin(i*2.3)*4,p.z+Math.cos(i*2.3)*4,
   1.2+i*.52,id==='sewageBomb'?3.3:2.3,27,'year-sludge');
 }else if(id==='sewageWave'){
  add(g,'wave',{x:0,z:-81,gap:clamp(p.x,-22,22),opening:4.4,
   depth:2.1,speed:32,warn:1.15,life:4.7,damage:45,visual:'year-sludge-wave'});
 }else if(id==='figures'){
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3;
   mark(g,Math.sin(angle)*14,Math.cos(angle)*14,1.05+i*.5,2.9,25,'year-figure');
  }
 }else if(id==='photocard'){
  for(let i=0;i<5;i++){
   const angle=a+(i-2)*.15;
   add(g,'circle',{x:b.x,z:b.z,r:.87,vx:Math.sin(angle)*25,vz:Math.cos(angle)*25,
    warn:1.1+i*.42,life:1.45,damage:21,visual:'year-photocard'});
  }
 }else if(id==='merch'){
  for(let i=0;i<4;i++)mark(g,p.x+(i-1.5)*4,p.z+Math.sin(i*2)*4,
   1.2+i*.77,2.5,27,'year-merch');
  }else if(id==='donation'){
   // Stream roulette snapshots its result once; physical prize capsules fall
   // after the visibly turning six-segment wheel has selected an outcome.
   e.gachaResult=drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-gacha',[0,1,2,3,4,5]);
   e.chat=['가챠 시작!', '수능 룰렛', '규원업!', '별풍선 대박'];
   const base=a+(e.gachaResult-2.5)*.17;
   for(let i=0;i<4;i++){
    const an=base+i*Math.PI/2+(e.gachaResult%2)*.23;
    const radius=5.4+(i%2)*2.3;
    mark(g,b.x+Math.sin(an)*radius,b.z+Math.cos(an)*radius,
     3.30+i*.58,2.35+(e.gachaResult===5?.48:0),27+(e.gachaResult===5?8:0),
     'year-gacha-prize');
   }
 }else if(id==='dance'||id==='chatstorm'){
   e.chat=['규원업!','오우 리액션','가즈아','수능 대박'];
   // Bass speaker punches and chat explosions manifest as physical pressure
   // beats, not a floating translucent triangular/cone attack panel.
   const count=id==='dance'?3:4;
   for(let i=0;i<count;i++){
    const an=a+i*Math.PI*2/count;
    const radius=4.3+(i%2)*1.2;
    add(g,'ring',{x:b.x,z:b.z,r:1.4,width:.8,grow:6,warn:1.2+i*.67,
     life:.62,damage:26,visual:'year-stream-pulse'});
   }
 }else if(id==='octoStrike'||id==='octoSweep'||id==='octoInk'){
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4+(id==='octoSweep'?.18:0);
   if(id==='octoInk')mark(g,b.x+Math.sin(angle)*13,b.z+Math.cos(angle)*13,
    1.2+i*.32,2.5,24,'year-ink');
   else line(g,b.x+Math.sin(angle)*7.5,b.z+Math.cos(angle)*7.5,angle,
    1.1+i*.40,{width:id==='octoSweep'?1.35:1.05,length:14.5,damage:25,
    visual:'year-tentacle',armIndex:i,originX:b.x,originZ:b.z,sweep:id==='octoSweep'?.62:0,
    life:id==='octoSweep'?.55:.37});
  }
 }else if(id.startsWith('recall')){
  const map=g.gyuwon.stageMemory||locations[0];
  if(id==='recall')mapHazards(g,map,0);
  else if(id==='recallMix')mapHazards(g,map,0),mapHazards(g,locations[(locations.indexOf(map)+1)%4],.6);
  else{
   // One family from each of the four real remembered battlefields, with
   // staggered telegraphs rather than impossible simultaneous full-screen hits.
   locations.forEach((key,i)=>mapHazards(g,key,i*.47));
  }
 }
 augmentAnnualCast(g,id,{add,mark,line,mapHazards,playerAim});
 e.castDuration=Math.max(e.castDuration||0,(e.rideTrack.at(-1)?.end||0)+.3);
 g.gyuwon.motionBeats=[...new Set(g.gyuwon.hazards.map(h=>h.warn))].sort((x,y)=>x-y);
 emit('gyuwon-warning',{pattern:'year-'+id});
}
export function startGyuwonYearCast(g,id,emit=()=>{}){
 if(!g?.gyuwon?.years||!Object.hasOwn(GYUWON_YEAR_PATTERNS,id)||g.status!=='playing')return false;
 beginCast(g,id,emit);return true;
}
function tickHazards(g,dt,hurt,emit){
 const s=g.gyuwon,e=s.years;
 for(const h of s.hazards){
  h.age+=dt;tickAnnualMechanics(g,h,dt,add,emit);
  if(!h.fired&&h.age>=h.warn){h.fired=true;emit('gyuwon-impact',{pattern:s.pattern});}
  if(!h.hit&&h.age>=h.warn&&h.age<=h.warn+h.life&&h.damage>0&&hazardContains(h,g.player))hurt(h);
  if(g.status!=='playing')return;
 }
 s.hazards=s.hazards.filter(h=>h.age<h.warn+h.life);

}
export function tickGyuwonYears(g,dt,{hurt,emit}){
 const b=g.boss,s=g.gyuwon,e=s.years;
 if(e.mode==='combat'){
  e.attackBuff=Math.max(0,e.attackBuff-dt);e.speedBuff=Math.max(0,e.speedBuff-dt);
 }
 s.elevation=0;s.slow=Math.max(0,s.slow-dt);s.stun=Math.max(0,s.stun-dt);
 if(g.status!=='playing')return;
 if(e.year>=9&&e.mode==='combat'){
  e.mapClock+=dt;s.stageTime+=dt;
  if(e.mapClock>=gyuwonMapInterval(e.year))e.mapPending=true;
  if(e.mapPending&&!e.cast){pickMemoryMap(g);emit('memory-stage',{memory:s.stageMemory});}
 }
 if(e.mode==='result'){
  e.gradeT+=dt;if(e.gradeT>=GYUWON_RESULT_SECONDS)startNextYear(g,emit);
  return;
 }
 if(e.mode==='exam'){
  e.subjectT+=dt;s.t=e.subjectT;
  tickHazards(g,dt,hurt,emit);
  if(g.status!=='playing')return;
  if(e.subjectT>=GYUWON_SUBJECT_SECONDS){
   if(e.subject===GYUWON_EXAM_SUBJECTS.length-1)resolveGyuwonExamGrade(g,Math.random(),emit);
   else spawnExamSubject(g,e.subject+1);
  }return;
 }
 syncAnnualHealth(g);
 if(s.stun>0)return;
 if(e.cast){
  e.castT+=dt;s.t=e.castT;
  if(e.cast==='ultimateMarksman')tickMarksmanBarrage(g,add);
  tickArsenal(g);updateRideAim(g);
  const mounted=ridePose(e);
  if(mounted){b.x=mounted.x;b.z=mounted.z;b.yaw=mounted.yaw;}
  tickHazards(g,dt,hurt,emit);
  if(g.status!=='playing')return;
  b.yaw=rifleAimYaw(s.hazards)??b.yaw;
  const spec=GYUWON_YEAR_PATTERNS[e.cast];
  if(e.castT>=Math.max(spec[0],e.castDuration||0)){
   if(e.cast==='nightmare365')e.endingUnlocked=true;
   e.cast=null;s.pattern=null;s.hazards=s.hazards.filter(h=>h.persistent&&h.age<h.warn+h.life);b.state='recovery';
   e.wards=[];e.recover=spec[1];
   if(e.year===4&&e.castCount%3===0){
    const side=e.castCount%2?-1:1;
    e.dodge={t:0,fromX:b.x,fromZ:b.z,toX:clamp(b.x+side*4.4,-26,26),
     toZ:clamp(b.z+(b.z>=0?-1:1)*1.5,-26,26)};
   }
   emit('gyuwon-land');
  }
  return;
 }
 b.state='recovery';e.recover-=dt;if(s.hazards.length)tickHazards(g,dt,hurt,emit);
 if(e.speedBuff>0&&!e.dodge){
  const dx=g.player.x-b.x,dz=g.player.z-b.z,d=Math.hypot(dx,dz);
  if(d>5){const step=Math.min(d-5,3*dt);b.x+=dx/d*step;b.z+=dz/d*step;}
 }

 // Every third ranged cast, roll sideways with a complete .72s travel arc.
 // Roll position and actor rig share one state; no invisible teleport.
 if(e.dodge){
  const d=e.dodge;d.t=Math.min(.72,d.t+dt);
  const q=d.t/.72,k=q*q*(3-2*q);
  b.x=d.fromX+(d.toX-d.fromX)*k;b.z=d.fromZ+(d.toZ-d.fromZ)*k;
  if(d.t>=.72)e.dodge=null;
 }
 if(e.day===0&&b.hp<=annualFloor(g)+1e-7){beginExam(g,emit);return;}
 if(e.recover>0)return;
 if(!e.signatureUsed&&e.season>=GYUWON_YEAR_SECONDS*.55){
  beginCast(g,GYUWON_YEAR_SIGNATURES[Math.min(11,e.year)],emit);return;
 }
 const choices=gyuwonYearRoster(e.year);
 const id=drawPatternShuffle(s.patternDeck,'gyuwon-year-'+e.year,choices,
  {avoid:e.lastCast});
 beginCast(g,id,emit);
}

