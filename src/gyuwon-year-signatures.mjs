// Physical, readable once-per-year signature attacks for the D-day boss.
// All contacts are regular gyuwon.hazards, never independent FX damage clocks.
export const GYUWON_YEAR_SIGNATURES=Object.freeze({
 1:'ultimateBike',2:'ultimateScooter',3:'ultimateSmoke',4:'ultimateMarksman',
 5:'ultimateSewage',6:'ultimateShrine',7:'ultimateGacha',8:'ultimateOctopus',
 9:'ultimateMemory',10:'ultimateParadox',11:'nightmare365'
});
export const GYUWON_SIGNATURE_SPECS=Object.freeze({
 ultimateBike:[6.6,1.9],ultimateScooter:[6.7,2],
 ultimateSmoke:[7.0,2.1],ultimateMarksman:[7.6,2.2],
 ultimateSewage:[8.8,2.2],ultimateShrine:[8.2,2.2],
 ultimateGacha:[9.0,2.3],ultimateOctopus:[9.1,2.4],
 ultimateMemory:[9.8,2.6],ultimateParadox:[11.1,2.7],
 nightmare365:[17.8,3.2]
});
export const GYUWON_NIGHTMARE_BEATS=Object.freeze([
 'bike','scooter','smoke','marksman','sewage','shrine',
 'gacha','octopus','memory','paradox','finale'
]);
const PI=Math.PI;
const near=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const gyuwonWorldBreak=(year,failures=0)=>Math.min(1,
 Math.max(0,(Math.max(1,year)-1)/10*.86+Math.max(0,failures)*.025));
const cycle=(g,angle,d=8)=>({x:g.boss.x+Math.sin(angle)*d,z:g.boss.z+Math.cos(angle)*d});
export function spawnGyuwonSignature(g,id,{add,mark,line,mapHazards,playerAim}){
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
   {width,length:14.5,life:.45,damage,visual,signature:id,armIndex});
 const bullet=(angle,warn,damage=32)=>{
  const distance=Math.max(31,Math.hypot(p.x-b.x,p.z-b.z)+7);
  line(g,b.x+Math.sin(angle)*distance*.5,b.z+Math.cos(angle)*distance*.5,
   angle,warn,{width:.72,length:distance,life:.23,damage,
    visual:'year-bullet',muzzleX:b.x,muzzleZ:b.z,signature:id});
 };
 const smoke=(angle,warn,r=12)=>
  add(g,'cone',{x:b.x,z:b.z,yaw:angle,r,arc:.42,innerR:1.5,
   warn,life:.58,damage:20,visual:'year-smoke',signature:id});
 const ring=(warn,damage=30,visual='year-fire',radius=3,velocity=9)=>
  add(g,'ring',{x:b.x,z:b.z,r:radius,width:1.05,grow:velocity,
   warn,life:.70,damage,visual,signature:id});
 if(id==='ultimateBike'){
  for(let i=0;i<4;i++){
   const angle=a+(i-1.5)*.38,point=dir(angle,Math.min(13,3+i*2));
   add(g,'circle',{x:point.x,z:point.z,r:1.85,
    vx:Math.sin(angle)*18,vz:Math.cos(angle)*18,
    warn:1.15+i*.91,life:.74,damage:27+i*2,visual:'year-vehicle',signature:id,ride:'bike'});
  }
  ring(5.1,33,'year-fire',3,10);
 }else if(id==='ultimateScooter'){
  for(let i=0;i<5;i++){
   const angle=a+(i%2?-.43:.43),point=dir(angle,1.7+i*1.9);
   add(g,'circle',{x:point.x,z:point.z,r:1.42,
    vx:Math.sin(angle)*14,vz:Math.cos(angle)*14,warn:1.2+i*.75,
    life:.52,damage:24,visual:'year-vehicle',signature:id,ride:'scooter'});
  }
  put(p.x,p.z,5.25,2.5,30,'year-stream-pulse');
 }else if(id==='ultimateSmoke'){
  smoke(a-.24,1.45,12);smoke(a+.24,2.35,12);
  for(let i=0;i<3;i++){const pt=dir(a+(i-1)*.32,7);
   put(pt.x,pt.z,3.3+i*.7,2.2,29,'year-sludge');}
  ring(5.35,32,'year-fire',2.2,9.5);
 }else if(id==='ultimateMarksman'){
  bullet(a-.13,1.75,35);bullet(a+.16,3.0,35);
  for(let i=0;i<4;i++)missile(a+(i-1.5)*.19,4.0+i*.62,'year-arrow',29,25);
 }else if(id==='ultimateSewage'){
  for(let i=0;i<5;i++)put(p.x+Math.sin(i*2.3)*6,p.z+Math.cos(i*2.3)*5,
   1.15+i*.46,2.65,29,'year-sludge');
  add(g,'wave',{x:0,z:-81,gap:near(p.x,-22,22),opening:4.7,
   depth:2.1,speed:32,warn:2.05,life:4.7,damage:42,
   visual:'year-sludge-wave',signature:id});
  ring(7.15,30,'year-fire',3,8.5);
 }else if(id==='ultimateShrine'){
  e.wards=Array.from({length:6},(_,i)=>({...cycle(g,i*PI/3,12),hp:42,index:i}));
  for(let i=0;i<6;i++){
   const point=e.wards[i];
   put(point.x,point.z,1.25+i*.51,2.7,23,'year-figure',{wardIndex:i});
  }
  for(let i=0;i<4;i++)missile(a+(i-1.5)*.19,3.65+i*.69,'year-photocard',24,22);
  put(p.x,p.z,6.6,3.0,33,'year-merch');
 }else if(id==='ultimateGacha'){
  e.gachaResult=(e.castCount*7+Math.floor(g.time*.73))%6;
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
  mapHazards(g,'sword',0);
  mapHazards(g,'gamble',3.6);
 }else if(id==='ultimateParadox'){
  mapHazards(g,'sword',0);mapHazards(g,'circus',2.5);
  mapHazards(g,'gamble',5.15);
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
  for(let i=0;i<beats.length;i++){
   const angle=a+(i%2?-.30:.30),point=cycle(g,angle,6.4+(i%3)*1.4);
   if(i===0||i===1)make(i,'circle',{x:point.x,z:point.z,r:2.1,
    vx:Math.sin(angle)*8,vz:Math.cos(angle)*8,life:.65,
    visual:'year-vehicle',ride:i?'scooter':'bike'});
   else if(i===2)make(i,'cone',{x:b.x,z:b.z,yaw:angle,r:10.4,arc:.4,innerR:1.5,
    life:.61,damage:20,visual:'year-smoke'});
   else if(i===3){
    const distance=32;
    make(i,'lane',{x:b.x+Math.sin(angle)*distance*.5,
     z:b.z+Math.cos(angle)*distance*.5,yaw:angle,width:.78,length:distance,
     life:.25,damage:33,visual:'year-bullet',muzzleX:b.x,muzzleZ:b.z});
   }else if(i===4)make(i,'circle',{x:point.x,z:point.z,r:2.8,visual:'year-sludge'});
   else if(i===5)make(i,'circle',{x:point.x,z:point.z,r:2.35,visual:'year-merch'});
   else if(i===6)make(i,'circle',{x:point.x,z:point.z,r:2.6,visual:'year-gacha-prize'});
   else if(i===7)make(i,'lane',{x:b.x+Math.sin(angle)*7.25,
    z:b.z+Math.cos(angle)*7.25,yaw:angle,width:1.2,length:14.5,
    visual:'year-tentacle',armIndex:i%8});
   else if(i===8||i===9)make(i,'circle',{x:point.x,z:point.z,r:2.8,
    visual:i===8?'year-circus':'year-stream-pulse'});
   else make(i,'ring',{x:b.x,z:b.z,r:3.2,width:1.1,grow:8.8,
    life:.72,damage:39,visual:'year-fire'});
  }
  e.nightmareStartedAt=g.time;
 }
 // In all signature families, attacks materialize only during their own
 // readable anticipation, even when future beats were scheduled at cast start.
 for(const h of g.gyuwon.hazards)h.signature??=id;
}
