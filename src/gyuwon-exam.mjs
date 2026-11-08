// The six "suneung" attempts are an independent, deterministic encounter layer.
// They interrupt only normal recovery, never a cast, phase cut, or the white proof recorder.
export const GYUWON_EXAM_IDS=Object.freeze(['exam-first','exam-retake','exam-third','exam-shooter','exam-sewage','exam-figurines']);
export const GYUWON_EXAM_INTERVAL=24;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const circle=(add,x,z,warn,r=2.45,damage=22)=>add('circle',{x,z,r,warn,life:.38,damage,visual:'exam-paper'});
export const isGyuwonExamId=id=>GYUWON_EXAM_IDS.includes(id);

export function createGyuwonExam(){
 return {level:0,clock:0,nextAt:GYUWON_EXAM_INTERVAL,due:false,trail:[],sample:0,
  lastSheet:[],gunGap:0,active:null,choice:null,choiceOrigin:null,choiceLocked:false,attempts:0};
}
export function tickGyuwonExamClock(g,dt){
 const e=g.gyuwon.exam;
 if(g.boss.state==='transition'||g.boss.state==='dead')return;
 e.clock+=dt;e.sample+=dt;
 if(e.sample>=.28){
  e.sample=0;e.trail.push({x:g.player.x,z:g.player.z});
  if(e.trail.length>18)e.trail.shift();
 }
 if(e.clock>=e.nextAt)e.due=true;
}
export function dueGyuwonExam(g){
 const e=g.gyuwon.exam;
 if(!e.due||g.status!=='playing'||g.boss.state==='transition')return null;
 // White space never contains a new damaging cast: its recorded proof must remain trustworthy.
 if(g.boss.phase===2&&g.gyuwon.space==='white')return null;
 return GYUWON_EXAM_IDS[Math.min(e.level,GYUWON_EXAM_IDS.length-1)];
}
export function buildGyuwonExam(g,id,add){
 const s=g.gyuwon,e=s.exam,p=g.player,b=g.boss,index=GYUWON_EXAM_IDS.indexOf(id);
 if(index<0)return false;
 e.active=index;e.choice=null;e.choiceLocked=false;e.choiceOrigin={x:p.x,z:p.z};
 e.attempts++;e.level=Math.min(6,e.level+1);e.due=false;e.nextAt=e.clock+GYUWON_EXAM_INTERVAL;
 if(index===0){
  // The player's own last few seconds of footwork become marked answer locations.
  const route=e.trail.length>=5?e.trail:[{x:p.x,z:p.z},{x:p.x+3,z:p.z},{x:p.x-3,z:p.z},{x:p.x,z:p.z+3},{x:p.x,z:p.z-3}];
  e.lastSheet=[0,1,2,3,4].map(i=>route[Math.min(route.length-1,Math.floor(i*(route.length-1)/4))]);
  e.lastSheet.forEach((at,i)=>circle(add,at.x,at.z,1.35+i*.51,2.2,21));
 }else if(index===1){
  const places=e.lastSheet.length?e.lastSheet.slice().reverse():[e.choiceOrigin];
  places.forEach((at,i)=>circle(add,at.x,at.z,1.3+i*.48,2.4,23));
  add('ring',{x:b.x,z:b.z,r:3.2,width:.8,grow:5.3,warn:3.7,life:1.2,damage:24,visual:'exam-rewrite'});
 }else if(index===2){
  // Three real selectable answers: movement in the first two seconds locks the next test.
  // The actual shapes are emitted AFTER the choice, with a fresh >=1.2 s windup.
  e.choiceOrigin={x:p.x,z:p.z};
 }else if(index===3){
  const aim=Math.atan2(p.x-b.x,p.z-b.z),dx=Math.sin(aim),dz=Math.cos(aim);
  const acrossX=Math.cos(aim),acrossZ=-Math.sin(aim);
  e.gunGap=clamp(p.x,-18,18);
  for(let i=0;i<4;i++){
   const offset=(i-1.5)*1.9,x=b.x+acrossX*offset,z=b.z+acrossZ*offset;
   add('lane',{x,z,yaw:aim,width:.65,length:2.6,warn:1.55+i*.65,
    life:1.35,vx:dx*31,vz:dz*31,damage:24,visual:'exam-bullet',gun:i});
  }
 }else if(index===4){
  // The preceding firing line determines which way the sewage drainage corridor bends.
  // Bound the displacement so it remains reachable with the common 4.7 m/s walk speed.
  const gap=clamp(p.x+clamp(e.gunGap-p.x,-4,4),-20,20);
  add('wave',{x:0,z:-155,gap,opening:4.25,depth:2.2,speed:43,
   warn:1.65,life:6.25,damage:43,visual:'exam-sewage'});
 }else if(index===5){
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3,fx=Math.sin(angle)*15,fz=Math.cos(angle)*15;
   circle(add,fx,fz,1.65+i*.48,2.55,23);
   // Each porcelain blade travels along a physically consistent lane with its own cue.
   const dx=p.x-fx,dz=p.z-fz,dist=Math.hypot(dx,dz),aim=Math.atan2(dx,dz);
   add('lane',{x:(fx+p.x)/2,z:(fz+p.z)/2,yaw:aim,width:1.05,length:dist+5.5,
    warn:4.75+i*.43,life:.34,damage:26,visual:'exam-figurine-blade'});
  }
 }
 return true;
}
export function updateGyuwonExamPattern(g,add){
 const s=g.gyuwon,e=s.exam;
 if(s.pattern!=='exam-third'||g.boss.state!=='pattern'||e.choiceLocked||s.t<2)return;
 const x=g.player.x-e.choiceOrigin.x;
 const choice=x< -1.6?0:x>1.6?2:1;
 e.choice=choice;e.choiceLocked=true;
 const px=g.player.x,pz=g.player.z;
 if(choice===0){
  add('ring',{x:e.choiceOrigin.x,z:e.choiceOrigin.z,r:3.1,width:.95,grow:7,
   warn:1.4,life:1.25,damage:25,visual:'exam-left'});
  add('ring',{x:e.choiceOrigin.x,z:e.choiceOrigin.z,r:3,width:.95,grow:5,
   warn:2.8,life:1.1,damage:24,visual:'exam-left'});
 }else if(choice===1){
  add('lane',{x:px,z:pz,yaw:Math.PI*.25,width:1.45,length:32,warn:1.45,life:.37,damage:25,visual:'exam-middle'});
  add('lane',{x:px,z:pz,yaw:-Math.PI*.25,width:1.45,length:32,warn:2.45,life:.37,damage:25,visual:'exam-middle'});
 }else{
  for(let i=0;i<4;i++)circle(add,px+(i%2?3.5:-3.5),pz+(i<2?-3.5:3.5),1.4+i*.53,2.25,24);
 }
 s.motionBeats=[...new Set(s.hazards.map(h=>h.warn+(s.t||0)))].sort((a,b)=>a-b);
}
