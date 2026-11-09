// Act VIII: two-action theatrical choreography, staged on the ORIGINAL media clock.
// Time anchors are production cues; the full master lyric/beat transcription needs listening QA.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const TAU=Math.PI*2;
export const GYUWON_DANCE_STAGES=Object.freeze([
 {at:0,key:'handoff',sky:'#8f79b3',horizon:'#d8afd0',floor:'#7a5e85',light:'#e6c0db'},
 {at:10,key:'invitation',sky:'#292449',horizon:'#7e5b9a',floor:'#74516f',light:'#d6b9f1'},
 {at:28.5,key:'footsteps',sky:'#39244f',horizon:'#aa748d',floor:'#a37e9a',light:'#ffe5bb'},
 {at:39.5,key:'stars',sky:'#0c1b42',horizon:'#4266aa',floor:'#497a9c',light:'#b7e5ff'},
 {at:47.6,key:'ensemble',sky:'#42255e',horizon:'#d68f99',floor:'#ac7d9b',light:'#ffdec2'},
 {at:73,key:'grand',sky:'#261a49',horizon:'#9e6cad',floor:'#875f96',light:'#ffe2b2'},
 {at:94,key:'silence',sky:'#090f24',horizon:'#283453',floor:'#303856',light:'#a2a7d6'},
 {at:112,key:'rain',sky:'#1b385b',horizon:'#638bab',floor:'#547b9b',light:'#c4eaff'},
 {at:130,key:'reunion',sky:'#423e70',horizon:'#bf91ab',floor:'#987e9c',light:'#fff1c7'},
 {at:158,key:'sunrise',sky:'#b66f92',horizon:'#ffcd9e',floor:'#d4a47e',light:'#fff2b2'},
 {at:174.5,key:'bow',sky:'#b36a78',horizon:'#ffdfb0',floor:'#a07975',light:'#fff0c4'}
].map(Object.freeze));
function mix(a,b,t){
 t=clamp(t);const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16);
 const ch=(shift)=>Math.round(((aa>>shift)&255)*(1-t)+((bb>>shift)&255)*t);
 return 'rgb('+ch(16)+','+ch(8)+','+ch(0)+')';
}
export function gyuwonDanceScene(time=0){
 const t=clamp(time,0,180);let idx=0;
 for(let i=1;i<GYUWON_DANCE_STAGES.length;i++)if(t>=GYUWON_DANCE_STAGES[i].at)idx=i;
 const now=GYUWON_DANCE_STAGES[idx],old=GYUWON_DANCE_STAGES[Math.max(0,idx-1)];
 const fade=idx===0?1:clamp((t-now.at)/3.2);
 return {key:now.key,time:t,fade,sky:mix(old.sky,now.sky,fade),
  horizon:mix(old.horizon,now.horizon,fade),floor:mix(old.floor,now.floor,fade),
  light:mix(old.light,now.light,fade),quiet:t>=94&&t<112,
  rain:t>=112&&t<130,stars:t>=39.5&&t<94,
  crowd:clamp((t-47.6)/42),dawn:clamp((t-150)/24),
  handoff:1-clamp(t/9),ring:clamp((t-174.5)/5.5)};
}
export const gyuwonDanceAction=kind=>kind==='turn'?'skill':'light';
export function gyuwonDanceTelegraph(pattern,time,period=.5){
 if(!pattern)return null;
 let index=-1;
 for(let i=0;i<pattern.count;i++)if(!pattern.done[i]&&!pattern.misses[i]){index=i;break;}
 if(index<0)return null;
 const at=pattern.first+index*pattern.spacing*period;
 const start=index===0?pattern.cue:at-Math.max(1.1,period*2.4);
 return {kind:pattern.kind,action:gyuwonDanceAction(pattern.kind),
  at,lead:clamp((time-start)/Math.max(.01,at-start)),remaining:at-time,
  active:time>=start&&time<=at+.18,index,count:pattern.count};
}
function oval(c,x,y,rx,ry,fill){c.fillStyle=fill;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function beam(c,x,target,color,alpha){
 c.save();c.globalAlpha=clamp(alpha);c.fillStyle=color;c.beginPath();
 c.moveTo(x,15);c.lineTo(target-90,545);c.lineTo(target+90,545);c.closePath();c.fill();c.restore();
}
export function drawGyuwonDanceWorld(c,m,{stagePerson,paperUnit,portrait}){
 const s=gyuwonDanceScene(m.time),t=s.time;
 const sky=c.createLinearGradient(0,0,0,615);
 sky.addColorStop(0,s.sky);sky.addColorStop(.85,s.horizon);
 c.fillStyle=sky;c.fillRect(0,0,1280,720);
 // Star ceiling, rising dawn, and distant architecture: visual changes are music-led.
 if(s.stars||s.quiet){
  for(let i=0;i<58;i++){const x=(i*197+36)%1280,y=30+(i*71)%350;
   oval(c,x,y,1.1+(i%4)*.52,1.2+(i%3)*.35,'rgba(246,243,222,'+(.35+.2*Math.sin(t*.8+i))+')');}
 }
 if(s.dawn>0){const sun=c.createRadialGradient(1035,170,6,1035,170,220);
  sun.addColorStop(0,'rgba(255,247,201,'+s.dawn+')');sun.addColorStop(1,'rgba(255,233,180,0)');
  c.fillStyle=sun;c.fillRect(750,0,530,440);
  oval(c,1035,178,45*s.dawn,45*s.dawn,'rgba(255,245,212,'+s.dawn+')');
 }
 if(['invitation','footsteps','ensemble','grand','reunion','sunrise'].includes(s.key)){
  for(let i=0;i<16;i++){const x=i*96-30-(t*.25)%95,top=280-(i%4)*30;
   c.fillStyle=i%3===0?'#423c60':'#55516e';c.globalAlpha=.36;
   c.fillRect(x,top,70,292);c.globalAlpha=1;
   for(let w=0;w<3;w++)oval(c,x+12+w*19,top+35,4,11,'#e8bda186');
  }
 }
 if(s.rain){
  for(let i=0;i<95;i++){const x=(i*127+t*42)%1320-20,y=(i*97+t*190)%560;
   c.strokeStyle='#ceeaff99';c.lineWidth=1.8;c.beginPath();c.moveTo(x,y);c.lineTo(x-8,y+27);c.stroke();}
 }
 // No hidden new collision: this floor is a theatrical surface reacting to actual dance beats.
 c.fillStyle=s.floor;c.beginPath();c.moveTo(160,500);c.lineTo(1120,500);
 c.lineTo(1280,720);c.lineTo(0,720);c.closePath();c.fill();
 c.strokeStyle=s.light;c.lineWidth=2;c.globalAlpha=.25;
 for(let i=0;i<15;i++){c.beginPath();c.moveTo(640+(i-7)*42,500);
 c.lineTo(640+(i-7)*94,720);c.stroke();}
 for(let i=0;i<5;i++){const y=510+i*i*12;c.beginPath();c.moveTo(100-i*28,y);c.lineTo(1180+i*28,y);c.stroke();}
 c.globalAlpha=1;
 // Curtain material from Act VII remains visible at the opening.
 const curtains=s.handoff>0?.88:s.quiet?.3:.54;
 for(const side of [-1,1]){
  const x=side<0?0:1175;
  for(let i=0;i<5;i++){c.fillStyle=i%2?'#4b305d':'#62406f';c.globalAlpha=curtains;
   c.beginPath();c.moveTo(x+side*i*9,0);c.bezierCurveTo(x+side*(i*16-30),180,
    x+side*(i*16+25),400,x+side*i*14,615);c.lineTo(x+side*(i+1)*23,615);
   c.lineTo(x+side*(i+1)*18,0);c.fill();}
 }
 c.globalAlpha=1;
 // Stage beams have no telegraph privilege: the actual cue below owns the timing.
 for(let i=0;i<5;i++){
  const x=240+i*190+Math.sin(t*.45+i)*21;
  beam(c,x,x+Math.sin(t*.7+i)*60,s.light,.11+(m.combo%12)*.008);
 }
 if(s.key==='stars'||s.key==='grand'){
  for(let i=0;i<13;i++){const x=215+i*69,y=492+Math.sin(t*1.4+i)*9;
   oval(c,x,y,23+(i%3)*5,8,'#b7e8ff6a');
   if(s.key==='stars')oval(c,x,345+(i%4)*19,3,3,'#fff6cd');}
 }
 if(s.key==='rain'){
  for(let i=0;i<22;i++)oval(c,80+i*54,555+(i%3)*43,16+Math.sin(t*5+i)*3,3,'#c7e6fd6b');
 }
 // Act VII soldiers become the dancers, keeping the camera and stage continuity.
 if(s.handoff>0){
  c.save();c.globalAlpha=clamp(s.handoff*.8);
  const count=Math.max(3,Math.min(6,m.danceHandoff?.count||4));
  for(let i=0;i<count;i++){
   const x=230+i*165,parade=clamp(t/6);
   paperUnit(c,x,555,{type:i%6,team:1,t:t+i,wind:0,hp:50,maxHp:50,
    scale:1.05+parade*.18,portrait});
   c.strokeStyle='#edca9e';c.lineWidth=3;c.beginPath();c.moveTo(x-25,518);c.lineTo(x-25,456);c.stroke();
  }
  c.restore();
 }
 // Arrivals and shadows become more numerous in later choruses, without extra CPU simulations.
 const crowd=s.quiet?2:3+Math.round(s.crowd*10)+Math.round(s.dawn*5);
 for(let i=0;i<crowd;i++){
  const x=38+i*(1200/Math.max(1,crowd-1));
  oval(c,x,467+(i%3)*6,14+(i%2)*4,23,'#1c243b95');
  c.fillStyle='#252c4877';c.fillRect(x-9,470,18,40);
 }
 const pat=m.danceCurrent,tele=gyuwonDanceTelegraph(pat,t,m.dancePeriod||.5);
 const nowAction=pat?.kind==='turn'?'turn':pat?.kind==='quick'?'quick':'dance';
 const guidePose=s.quiet?'idle':tele?.active?nowAction:'dance';
 const activePose=m.dancePose>0?(m.dancePoseKind||'dance'):'idle';
 const response=m.judgementUntil>t&&m.judgement==='PERFECT';
 const introAlpha=clamp((t-2.1)/5.5);
 c.save();c.globalAlpha=introAlpha;
 // Articulated boss, player and shadow rivals. The boss demonstrates before contact.
 oval(c,315,549,51,13,'#140e3155');oval(c,670,549,59,14,'#140e3155');
 oval(c,1050,549,49,12,'#140e3155');
 stagePerson(c,315,530,{scale:1.70,t:t+.12,pose:guidePose,
  face:tele?.action==='skill'?-1:1,color:'#aa77c2',gyuwon:true,portrait});
 stagePerson(c,670,530,{scale:1.68,t,pose:activePose,face:m.danceFacing||1,
  color:'#c8ddef',miss:m.danceError>0});
 if(!s.quiet)stagePerson(c,1050,530,{scale:1.50,t:t+.28,
  pose:tele?.active?nowAction:'dance',face:-1,color:'#60446d'});
 for(let i=0;i<2+Math.round(s.crowd*3);i++){
  const x=430+i*(145),y=508+(i%2)*9;
  if(x>900)break;
  stagePerson(c,x,y,{scale:.68,t:t+i*.18,
   pose:s.quiet?'idle':tele?.active?nowAction:'dance',face:i%2?1:-1,color:i%2?'#836e9c':'#b9a6ba'});
 }
 c.restore();
 // Preview BOTH actions as choreography, never as a textual pattern instruction.
 // Step/quick: clearly alternating illuminated feet. Turn: wind-up + rotating trail.
 if(tele?.active&&!s.quiet){
  const lead=tele.lead;
  beam(c,315,670,s.light,.09+.14*lead);
  if(tele.action==='light'){
   for(let i=0;i<2;i++){
    const x=625+i*91,y=553+Math.sin(t*3+i)*3;
    c.save();c.translate(x,y);c.rotate((i?1:-1)*.12);
    c.strokeStyle=s.light;c.lineWidth=4+lead*3;c.globalAlpha=.35+.6*lead;
    c.beginPath();c.ellipse(0,0,18,32,0,0,TAU);c.stroke();c.restore();
   }
   oval(c,315+Math.sin(t*9)*17,556,30+lead*22,7,'#f8e3b16d');
  }else{
   c.save();c.translate(670,463);c.rotate(t*.7);
   c.strokeStyle=s.light;c.lineWidth=3+lead*4;c.globalAlpha=.4+.5*lead;
   c.beginPath();c.ellipse(0,0,72+lead*9,34+lead*8,-.18,Math.PI*.16,Math.PI*1.85);c.stroke();
   c.restore();
   // The leader lifts the turning arm, then player takes the same motion.
   oval(c,315,420,19+lead*13,5,'#f3d8b3a1');
  }
  const beatPulse=clamp(1-Math.abs(tele.remaining)/.3);
  if(beatPulse>0){oval(c,670,542,37+beatPulse*34,9,'rgba(255,240,190,'+(.15+beatPulse*.6)+')');}
 }
 if(response){
  for(let i=0;i<15;i++){const a=i*TAU/15+t*.22;
   oval(c,670+Math.cos(a)*115,432+Math.sin(a)*70,3+(m.combo%4),3,s.light);}
 }
 if(s.quiet){
  c.fillStyle='#080c1b60';c.fillRect(0,0,1280,400);
  beam(c,315,315,'#b2afd9',.21);
  for(let i=0;i<6;i++)oval(c,535+i*43,580+Math.sin(i+t)*3,4,4,'#d4d9ff99');
 }
 // An unbroken last bow hands its circular spotlight to Act IX's fighting arena.
 if(s.ring>0){
  c.strokeStyle='rgba(250,227,183,'+s.ring+')';c.lineWidth=8*s.ring;
  c.beginPath();c.ellipse(670,556,290,55,0,0,TAU);c.stroke();
  for(let i=0;i<3;i++){c.strokeStyle='rgba(240,198,162,'+(.45*s.ring)+')';
   c.lineWidth=3;c.beginPath();c.moveTo(240,495-i*31);c.lineTo(1110,495-i*31);c.stroke();}
 }
 return {scene:s,telegraph:tele};
}
