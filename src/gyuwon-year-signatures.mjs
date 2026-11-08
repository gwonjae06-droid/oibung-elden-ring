import {rifleRay} from './gyuwon-year-choreography.mjs';
import {drawPatternShuffle} from './pattern-shuffle.mjs';
// Physical, readable once-per-year signature attacks for the D-day boss.
// All contacts are regular gyuwon.hazards, never independent FX damage clocks.
export const GYUWON_YEAR_SIGNATURES=Object.freeze({
 1:'ultimateBike',2:'ultimateScooter',3:'ultimateSmoke',4:'ultimateMarksman',
 5:'ultimateSewage',6:'ultimateShrine',7:'ultimateGacha',8:'ultimateOctopus',
 9:'ultimateMemory',10:'ultimateParadox',11:'nightmare365'
});
export const GYUWON_SIGNATURE_SPECS=Object.freeze({
 ultimateBike:[13.4,1.9],ultimateScooter:[9.8,2],
 ultimateSmoke:[8.5,2.1],ultimateMarksman:[22.2,2.5],
 ultimateSewage:[9.8,2.2],ultimateShrine:[18.8,2.2],
 ultimateGacha:[9.0,2.3],ultimateOctopus:[9.1,2.4],
 ultimateMemory:[9.8,2.6],ultimateParadox:[11.1,2.7],
 nightmare365:[23.5,5.5]
});
export const GYUWON_NIGHTMARE_BEATS=Object.freeze([
 'bike','scooter','bookfall','marksman','sewage','shrine',
 'gacha','octopus','memory','paradox','finale'
]);
const PI=Math.PI;
const near=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const gyuwonWorldBreak=(year,failures=0)=>Math.min(1,
 Math.max(0,(Math.max(1,year)-1)/10*.86+Math.max(0,failures)*.025));
const cycle=(g,angle,d=8)=>({x:g.boss.x+Math.sin(angle)*d,z:g.boss.z+Math.cos(angle)*d});
export function spawnGyuwonSignature(g,id,{add,mark,line,mapHazards,playerAim,makeRide}){
 const e=g.gyuwon.years,b=g.boss,p=g.player,a=playerAim(g);
 const dir=(angle,t,r)=>({x:b.x+Math.sin(angle)*t,z:b.z+Math.cos(angle)*t,r});
 const put=(x,z,warn,r=2.3,damage=25,visual='year-sludge',rest={})=>
  add(g,'circle',{x,z,r,warn,life:.48,damage,visual,signature:id,...rest});
 const missile=(angle,warn,visual='year-photocard',speed=23,damage=24)=>
  add(g,'circle',{x:b.x,z:b.z,r:visual==='year-arrow'?.78:1.08,
   vx:Math.sin(angle)*speed,vz:Math.cos(angle)*speed,
   warn,life:1.25,damage,visual,signature:id});
 const slash=(angle,warn,width=1.25,damage=28,visual='year-tentacle',armIndex)=>
  line(g,b.x+Math.sin(angle)*7.5,b.z+Math.cos(angle)*7.5,angle,warn,
   {width,length:14.5,life:.45,damage,visual,signature:id,armIndex,originX:b.x,originZ:b.z});
 const bullet=(angle,warn,damage=32)=>{
  add(g,'lane',{...rifleRay(g,angle),warn,width:.72,life:.23,damage,
    visual:'year-bullet',signature:id});
 };
 const smoke=(angle,warn,r=12)=>
  add(g,'cone',{x:b.x,z:b.z,yaw:angle,r,arc:.42,innerR:1.5,
   warn,life:.58,damage:20,visual:'year-smoke',signature:id});
 const ring=(warn,damage=30,visual='year-fire',radius=3,velocity=9)=>
  add(g,'ring',{x:b.x,z:b.z,r:radius,width:1.05,grow:velocity,
   warn,life:.70,damage,visual,signature:id});
 if(id==='ultimateBike'){
  const ride=makeRide(g,{add,ultimate:true});
  add(g,'ring',{...ride.position,r:2.6,width:1.05,grow:9,
   warn:ride.end,life:.8,damage:33,visual:'year-fire',signature:id});
 }else if(id==='ultimateScooter'){
  const ride=makeRide(g,{add,ultimate:true,scooter:true});
  add(g,'ring',{...ride.position,r:2,width:1,grow:8,warn:ride.end+.65,
   life:.7,damage:30,visual:'year-stream-pulse',signature:id});
 }else if(id==='ultimateSmoke'){
  // Keep the historical ID for saved tooling, but this is the third-year
  // falling textbook signature. Volumes stand up, lean, then hit the floor.
  for(let i=0;i<4;i++){
   const yaw=a+(i-1.5)*.34,c=cycle(g,yaw,9+i%2*4);
   add(g,'topple',{...c,yaw,width:2.25,length:15,r:2.25,warn:2.1+i*1.35,
    life:.35,damage:34,visual:'year-toppling-book',topple:true,signature:id});
  }
 }else if(id==='ultimateMarksman'){
  // Seven first rounds; 203 additional rounds are streamed by the live
  // combat clock to prevent enormous simultaneous FX allocations.
  for(let i=0;i<7;i++)bullet(a+(i-3)*.105,1.05+i*.075,45);
 }else if(id==='ultimateSewage'){
  for(let i=0;i<5;i++)put(p.x+Math.sin(i*2.3)*6,p.z+Math.cos(i*2.3)*5,
   1.15+i*.46,2.65,29,'year-sludge');
  // Eight separate rolling crests, with walkable gaps between directions.
  for(let i=0;i<8;i++){
   const yaw=i*PI/4;
   add(g,'radialWave',{x:b.x+Math.sin(yaw)*3,z:b.z+Math.cos(yaw)*3,
    yaw,r:2.4,width:2.1,depth:1.6,vx:Math.sin(yaw)*6,vz:Math.cos(yaw)*6,
    warn:4.4,life:2.3,damage:32,visual:'year-radial-sludge',signature:id});
  }
  ring(8.0,30,'year-fire',3,8.5);
 }else if(id==='ultimateShrine'){
  e.wards=Array.from({length:6},(_,i)=>({...cycle(g,i*PI/3,5),hp:42,maxHp:42,index:i}));
  for(let i=0;i<6;i++){
   const point=e.wards[i];
   put(point.x,point.z,1.25+i*.51,2.7,23,'year-figure',{wardIndex:i});
  }
  for(const ward of e.wards)for(let shot=0;shot<3;shot++){
   const angle=Math.atan2(p.x-ward.x,p.z-ward.z)+(shot-1)*.13;
   add(g,'circle',{x:ward.x,z:ward.z,r:.87,vx:Math.sin(angle)*15,vz:Math.cos(angle)*15,
    warn:4.7+shot*1.05,life:1.4,damage:22,visual:'year-photocard',wardIndex:ward.index,signature:id});
  }
  for(const ward of e.wards)put(ward.x,ward.z,16.8,2.7,33,'year-merch',{wardIndex:ward.index});
 }else if(id==='ultimateGacha'){
  e.gachaResult=drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-gacha',[0,1,2,3,4,5]);
  e.chat=['수능 가챠 대폭주!','규원업!', '후원 결과 공개!'];
  const outcome=e.gachaResult;
  const count=[5,3,2,4,4,6][outcome];
  for(let i=0;i<count;i++){
   const angle=a+(i-count/2)*2*PI/Math.max(4,count)+outcome*.21;
   const focus=outcome===3||outcome===4;
   const cx=focus?p.x:b.x,cz=focus?p.z:b.z;
   put(cx+Math.sin(angle)*(5+(i%2)*2.2),cz+Math.cos(angle)*(5+(i%2)*2.2),
    3.55+i*.55,2.3+(outcome===5?.45:0),26+(outcome===5?9:0),
    'year-gacha-prize',{prizeOutcome:outcome});
  }
  if(outcome===0||outcome===5)ring(6.85,31,'year-stream-pulse',2,8);
 }else if(id==='ultimateOctopus'){
  for(let i=0;i<8;i++)slash(i*PI/4,1.25+i*.69,1.26,28,'year-tentacle',i);
  for(let i=0;i<4;i++){const pt=cycle(g,a+i*PI/2,12.5);
   put(pt.x,pt.z,5.45+i*.73,2.7,27,'year-ink');}
 }else if(id==='ultimateMemory'){
  const maps=['sword','circus','gamble','tsunami'];
  const first=maps.indexOf(g.gyuwon.stageMemory||'sword');
  mapHazards(g,maps[Math.max(0,first)],0);
  const other=drawPatternShuffle(g.gyuwon.patternDeck,'gyuwon-memory-signature',maps.filter((_,i)=>i!==Math.max(0,first)));
  mapHazards(g,other,3.2);
 }else if(id==='ultimateParadox'){
  const maps=['sword','circus','gamble','tsunami'];
  const first=Math.max(0,maps.indexOf(g.gyuwon.stageMemory));
  for(let i=0;i<3;i++)mapHazards(g,maps[(first+i)%4],i*2.6);
 }else if(id==='nightmare365'){
  // The ten earlier lives return one at a time, not ten unfair simultaneous hits.
  // A beat's collision age is exactly its authored impact and no frame drives
  // invisible scripted damage. The finale leaves a generous ring-shaped escape.
  const beats=GYUWON_NIGHTMARE_BEATS;
  const W=[1.28,2.60,3.90,5.20,6.50,7.8,9.1,10.4,11.8,13.1,15.1];
  const make=(index,shape,opts)=>{
   add(g,shape,{warn:W[index],life:.48,damage:25,
    nightmareBeat:index,signature:id,...opts});
  };
  let rideFrom={x:b.x,z:b.z};e.rideTrack=[];
  for(let i=0;i<beats.length;i++){
   const angle=a+(i%2?-.30:.30),point=cycle(g,angle,6.4+(i%3)*1.4);
   if(i===0||i===1){
    const ride=i?'scooter':'bike',to={x:point.x,z:point.z};
    const previous=i===0?0:W[0]+.65;
    e.rideTrack.push({from:{...rideFrom},to:{...rideFrom},start:previous,end:W[i],ride});
    const segment={from:{...rideFrom},to,start:W[i],end:W[i]+.65,r:2.1,ride};
    e.rideTrack.push(segment);rideFrom=to;
    make(i,'circle',{x:segment.from.x,z:segment.from.z,r:2.1,rideSegment:segment,
     life:.65,visual:'year-vehicle',ride});
   }
   else if(i===2)make(i,'circle',{x:point.x,z:point.z,r:2.5,
    life:.35,damage:28,visual:'year-bookfall'});
   else if(i===3){
    make(i,'lane',{...rifleRay(g,angle),width:.78,
     life:.25,damage:33,visual:'year-bullet'});
   }else if(i===4)make(i,'circle',{x:point.x,z:point.z,r:2.8,visual:'year-sludge'});
   else if(i===5)make(i,'circle',{x:point.x,z:point.z,r:2.35,visual:'year-merch'});
   else if(i===6)make(i,'circle',{x:point.x,z:point.z,r:2.6,visual:'year-gacha-prize'});
   else if(i===7)make(i,'lane',{x:b.x+Math.sin(angle)*7.25,
    z:b.z+Math.cos(angle)*7.25,yaw:angle,width:1.2,length:14.5,
    visual:'year-tentacle',armIndex:i%8,originX:b.x,originZ:b.z});
   else if(i===8||i===9)make(i,'circle',{x:point.x,z:point.z,r:2.8,
    visual:i===8?'year-circus':'year-stream-pulse'});
   else make(i,'ring',{x:b.x,z:b.z,r:3.2,width:1.1,grow:13,
    life:1.8,damage:39,visual:'year-fire'});
  }
  e.rideTrack.push({from:{...rideFrom},to:{x:b.x,z:b.z},start:3.25,end:3.75,ride:'scooter'});
  e.rideInitialYaw=b.yaw;
  e.nightmareStartedAt=g.time;
 }
 // In all signature families, attacks materialize only during their own
 // readable anticipation, even when future beats were scheduled at cast start.
 for(const h of g.gyuwon.hazards)h.signature??=id;
}

