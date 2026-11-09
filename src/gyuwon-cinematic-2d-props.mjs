// Cinematic Canvas 2D props for 6/8/9: layered painterly lighting,
// articulated set hardware and hand-attached costumes. No simulated
// hitbox is added by artwork; hazards are still owned by the rules engine.
import {gyuwonCinematicMotionAt} from './gyuwon-cinematic-motion-score.mjs';
const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
const grad=(c,x,y,r,fill,alpha=.55)=>{
 const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,fill);g.addColorStop(1,'rgba(4,8,22,0)');
 c.save();c.globalAlpha*=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();
};
const seg=(c,coords,color,width=3)=>{
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';
 c.beginPath();coords.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
};
const oval=(c,x,y,rx,ry,fill)=>{c.fillStyle=fill;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fill();};
function ornateDoor(c,x,y,s,open=0){
 c.save();c.translate(x,y);c.scale(s,s);
 const wood=c.createLinearGradient(-50,0,65,0);wood.addColorStop(0,'#674e4a');wood.addColorStop(.52,'#bd8664');wood.addColorStop(1,'#4e3d47');
 c.fillStyle='#edcfa8';c.fillRect(-57,-154,114,160);
 c.fillStyle='#30263c';c.fillRect(-49,-146,98,151);
 c.strokeStyle='#f4ddb4';c.lineWidth=6;c.strokeRect(-57,-154,114,160);
 c.fillStyle='#d8af72';c.beginPath();c.arc(0,-154,57,Math.PI,0);c.fill();
 c.fillStyle='#352743';c.beginPath();c.arc(0,-154,47,Math.PI,0);c.fill();
 c.fillStyle=wood;c.save();c.translate(-48,0);c.transform(Math.cos(open),0,Math.sin(open)*.27,1,0,0);
 c.fillRect(0,-146,96,149);c.strokeStyle='#deb683';c.lineWidth=3;c.strokeRect(6,-139,84,134);
 for(let i=0;i<3;i++){c.strokeRect(14,-127+i*42,69,29);}
 oval(c,76,-70,5,6,'#ffe0a6');c.restore();c.restore();
}
function trumpet(c,x,y,s,angle=0){
 c.save();c.translate(x,y);c.rotate(angle);c.scale(s,s);
 const metal=c.createLinearGradient(-5,-16,85,22);metal.addColorStop(0,'#e9bc68');metal.addColorStop(.47,'#fff1b2');metal.addColorStop(1,'#946240');
 c.fillStyle=metal;c.beginPath();c.moveTo(-8,-9);c.lineTo(51,-9);c.lineTo(93,-30);
 c.lineTo(93,30);c.lineTo(51,9);c.lineTo(-8,9);c.closePath();c.fill();c.strokeStyle='#5c3c37';c.lineWidth=2;c.stroke();
 c.strokeStyle='#faf2d5';c.lineWidth=4;c.beginPath();c.arc(90,0,30,-Math.PI/2,Math.PI/2);c.stroke();
 for(let i=0;i<3;i++){c.fillStyle='#fff1cf';c.fillRect(15+i*13,-22,7,17);c.fillStyle='#98684b';c.fillRect(17+i*13,-29,3,10);}
 c.restore();
}
function stageCurtain(c,side,progress,time,at=0){
 const x=side<0?0:1280,w=150-70*ease(progress),s=side<0?1:-1;
 c.save();c.translate(x,0);c.scale(s,1);
 const cloth=c.createLinearGradient(0,0,w,0);cloth.addColorStop(0,'#3a1b3b');cloth.addColorStop(.45,'#8c395a');cloth.addColorStop(.75,'#bd6883');cloth.addColorStop(1,'#4e264b');
 c.fillStyle=cloth;c.beginPath();c.moveTo(0,0);c.lineTo(w,0);c.bezierCurveTo(w-16,145,w+Math.sin(time*2+at)*11,380,w+18,615);c.lineTo(0,640);c.closePath();c.fill();
 for(let i=0;i<6;i++){const cx=i*w/6+13;c.strokeStyle=i%2?'#df9f9d65':'#321a3899';c.lineWidth=i%2?5:12;
  c.beginPath();c.moveTo(cx,0);c.bezierCurveTo(cx+Math.sin(time*.9+i)*5,170,cx-18,420,cx+17,605);c.stroke();}
 seg(c,[[w,0],[w+10,100],[w+17,190],[w+2,300],[w+18,615]],'#f2d7a58e',5);
 c.restore();
}
function star(c,x,y,size,time,alpha=.85){
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(time*.1);
 c.fillStyle='#f9edbb';c.beginPath();for(let i=0;i<10;i++){
  const a=-Math.PI/2+i*Math.PI/5,r=i%2?size*.42:size;
  c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();
 c.restore();
}
function mirror(c,x,y,w,h,t,style=0){
 const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#cad3e0c2');g.addColorStop(.35,'#6d83a97b');g.addColorStop(1,'#e6bcb9a8');
 c.save();c.fillStyle='#ab7a5d';c.fillRect(x-8,y-9,w+16,h+18);
 c.fillStyle='#f5dfb7';c.fillRect(x-4,y-5,w+8,h+10);
 c.fillStyle=g;c.fillRect(x,y,w,h);
 // Silhouette in the mirror is a reflection motif, never a duplicate boss hitbox.
 c.globalAlpha=.35;c.fillStyle=style%2?'#44345d':'#384967';
 c.beginPath();c.ellipse(x+w/2+Math.sin(t+style)*7,y+h*.36,15,19,0,0,TAU);c.fill();
 c.fillRect(x+w/2-17,y+h*.45,34,h*.41);c.globalAlpha=1;
 seg(c,[[x+4,y+h*.22],[x+w*.65,y+h*.43],[x+18,y+h*.7]],'#fff4e1ba',2);
 c.restore();
}
function scatter(c,t,kind,n=30){
 for(let i=0;i<n;i++){
  const x=(i*149+t*(kind==='rain'?70:12))%1390-55,y=(i*97+t*(kind==='rain'?170:12))%600;
  if(kind==='rain'){seg(c,[[x,y],[x-13,y+29]],'#bfe1f5a9',1.5);}
  else if(kind==='confetti'){const color=['#f5cba1','#d9b9eb','#b8d7ed'][i%3];c.fillStyle=color+'b1';c.save();c.translate(x,y);c.rotate(t*.8+i);
   c.fillRect(-3,-7,6,13);c.restore();}
  else star(c,x,y,2+(i%4)*.9,t,.46);
 }
}
export function drawGyuwonCinematic2dSet(c,m){
 const a=m?.lyricAction;if(!a||![6,8,9].includes(Number(a.year)))return;
 const p=a.phase,t=m.time,w=clamp(Math.min(ease(p/.18),.68+.32*(1-ease((p-.86)/.14)))*1.3);
 const action=a.actionId,kind=a.visual,year=Number(a.year);
 c.save();c.globalAlpha*=.15+.63*w;
 // Two layers of foreground architecture create depth rather than flat FX.
 if(['doors','mirror','windows','home','question','clones'].includes(kind)){
  if(kind==='home'){grad(c,1030,340,300,'#fff0b4',.55);
   c.fillStyle='#b59786';c.fillRect(870,335,235,185);
   c.fillStyle='#7d5060';c.beginPath();c.moveTo(846,343);c.lineTo(989,240);c.lineTo(1130,343);c.fill();
   c.fillStyle='#fff3c4';c.fillRect(947,418,46,100);
   for(const x of [901,1035]){c.fillStyle='#ffe6ad';c.fillRect(x,380,31,48);
    c.strokeStyle='#653849';c.lineWidth=3;c.strokeRect(x,380,31,48);}
  }else if(kind==='question'){
   for(let i=0;i<6;i++){const x=170+i*190,y=250+Math.sin(t*.7+i)*35;
    c.strokeStyle='#f8d9aebc';c.lineWidth=8;c.beginPath();c.arc(x,y,24,Math.PI*1.1,Math.PI*2.35);c.stroke();
    oval(c,x+8,y+43,5,5,'#ffdbb5');}
  }else if(kind==='mirror'||kind==='clones'){
   for(let i=0;i<6;i++)mirror(c,90+i*197,130+(i%2)*25,140,390,t,i);
  }else for(let i=0;i<5;i++)ornateDoor(c,200+i*208,485,.9,i%2?ease(p):0);
 }
 if(kind==='city'){
  // Real painted city masses swing around the skyline while ground remains flat.
  c.save();c.translate(640,200);c.rotate((action==='upsideWorld'?-1:1)*ease(p)*.09);
  for(let i=0;i<13;i++){
   const x=-670+i*110,h=90+(i*59)%205;
   const g=c.createLinearGradient(x,0,x+80,h);g.addColorStop(0,'#8ca5c6');g.addColorStop(1,'#263a56');
   c.fillStyle=g;c.fillRect(x,120-h,84,h);
   c.save();c.translate(x+42,-120);c.scale(1,-1);c.globalAlpha=.42;c.fillRect(-42,0,84,h);c.restore();
   for(let j=0;j<4;j++)c.fillRect(x+8+j*18,130-h+12,6,8);
  }
  c.restore();
 }
 if(kind==='mountain'){
  c.fillStyle='#90a5b0a8';c.beginPath();c.moveTo(0,530);
  for(let i=0;i<8;i++){let x=70+i*180;
   c.lineTo(x-52,470);c.lineTo(x+18,240+(i%3)*47);c.lineTo(x+122,472);}
  c.lineTo(1280,540);c.closePath();c.fill();
 }
 if(kind==='rain'||kind==='elements'||kind==='sea'){
  if(kind==='rain'||kind==='elements')scatter(c,t,'rain',45);
  if(kind==='sea'){const sea=c.createLinearGradient(0,420,0,620);sea.addColorStop(0,'#a6dff3a2');sea.addColorStop(1,'#347fa071');
   c.fillStyle=sea;c.beginPath();c.moveTo(0,460);
   for(let x=0;x<=1300;x+=14)c.lineTo(x,460+Math.sin(x*.018+t*2.8)*16);
   c.lineTo(1280,620);c.lineTo(0,620);c.closePath();c.fill();}
 }
 if(['stage','spotlight','dancers','ensemble','choir','ribbons','pulse','ring','arc'].includes(kind)){
  grad(c,640,350,410,'#ffe0b8',.3+.25*w);
  if(kind==='ensemble'||kind==='choir'||kind==='dancers'){
   for(let i=0;i<7;i++){const x=180+i*150,y=420+Math.sin(t*2+i)*7;
    oval(c,x,y-65,13,17,'#f3deb9a6');c.fillStyle='#654569a8';c.fillRect(x-18,y-47,36,72);}
  }
  if(kind==='ribbons'||kind==='ring'||kind==='pulse'){
   c.strokeStyle='#fbe4b8b9';c.lineWidth=3;
   for(let i=0;i<5;i++){c.beginPath();c.ellipse(640,420,100+i*63,38+i*20,Math.sin(t*.31+i)*.08,0,TAU);c.stroke();}
  }
 }
 if(['stars','sun','sky','moon','wings'].includes(kind)){
  scatter(c,t,'stars',32);
  grad(c,990,185,230,kind==='sun'?'#fff1bc':'#d1d9fa',.44);
  if(kind==='wings'){
   for(const side of [-1,1])for(let i=0;i<9;i++){const x=640+side*(50+i*27),y=310-i*9+Math.sin(t*2+i)*7;
    c.strokeStyle='#deeff6bd';c.lineWidth=13-i;c.beginPath();c.moveTo(640,350);c.quadraticCurveTo(x-side*23,180,x,y);c.stroke();}
  }
 }
 if(kind==='curtain'){stageCurtain(c,-1,p,t);stageCurtain(c,1,p,t);}
 if(kind==='trumpet'){for(let i=0;i<4;i++)trumpet(c,210+i*255,280,1.1,Math.sin(t*.7+i)*.12);}
 if(kind==='sword'){seg(c,[[640,420],[660,210]],'#e2e9f1',16);seg(c,[[615,390],[690,397]],'#f1dbaf',12);}
 if(kind==='crown'){
  c.fillStyle='#ffdfa1bc';c.beginPath();c.moveTo(490,265);c.lineTo(530,165);c.lineTo(584,227);
  c.lineTo(640,130);c.lineTo(695,226);c.lineTo(750,165);c.lineTo(789,265);c.closePath();c.fill();
 }
 if(kind==='world'){for(let i=0;i<6;i++)ornateDoor(c,120+i*206,498,.45,0);}
 if(kind==='heart'){grad(c,640,265,270,'#f8b5be',.65);}
 if(kind==='dark'){c.fillStyle='#090d21a1';c.fillRect(0,0,1280,455);}
 if(action==='clapAndReach'||action==='clapEncore')scatter(c,t,'confetti',18);
 c.restore();
}
function crown(c,s=1){
 c.save();c.scale(s,s);c.fillStyle='#dfba79';c.strokeStyle='#fff3c7';c.lineWidth=2.2;
 c.beginPath();c.moveTo(-33,0);c.lineTo(-27,-30);c.lineTo(-10,-13);c.lineTo(0,-42);
 c.lineTo(12,-13);c.lineTo(29,-30);c.lineTo(34,0);c.closePath();c.fill();c.stroke();
 c.fillStyle='#c36e81';for(let i=-1;i<=1;i++)oval(c,i*19,-4,4.3,5,'#b76c83');
 c.restore();
}
function blade(c,s=1){
 c.save();c.scale(s,s);const g=c.createLinearGradient(-10,0,15,0);g.addColorStop(0,'#889bb3');g.addColorStop(.48,'#fcfcff');g.addColorStop(1,'#768ba5');
 c.fillStyle=g;c.beginPath();c.moveTo(-10,12);c.lineTo(-9,-100);c.lineTo(0,-126);
 c.lineTo(9,-100);c.lineTo(10,12);c.closePath();c.fill();
 seg(c,[[-25,13],[25,13]],'#e9c38c',9);seg(c,[[0,13],[0,47]],'#69435a',10);
 oval(c,0,49,7,7,'#e6c182');c.restore();
}
function mask(c,t,s=1){
 c.save();c.scale(s,s);c.fillStyle='#e8d4ba';c.beginPath();c.ellipse(0,0,27,37,0,0,TAU);c.fill();
 c.fillStyle='#45304c';for(const side of [-1,1]){oval(c,side*12,-7,7,10,'#372b43');}
 c.strokeStyle='#a85678';c.lineWidth=3;c.beginPath();c.arc(0,9,14,-.2,Math.PI+.3);c.stroke();
 for(let i=0;i<4;i++){const x=(i-1.5)*18;seg(c,[[x,-33],[x+Math.sin(t*2+i)*7,-48]],'#e0ab76',3);}
 c.restore();
}
export function drawGyuwonCinematicActorProp(c,m,{x=640,y=500,scale=1,lyric=null,face=1}={}){
 const a=lyric||m?.lyricAction;if(!a)return;
 const score=gyuwonCinematicMotionAt(a.year,m.time),pose=score?.pose||{},p=a.phase;
 const act=a.actionId,visual=a.visual;
 const xOffset=(pose.turn||0)*7,raised=(pose.rightArm||0)*21;
 c.save();c.translate(x+xOffset,y);c.scale(scale*face,scale);
 if(['kingTomorrow','everyCrown','kingClown','thousandParts'].includes(act)||visual==='crown'){
  c.save();c.translate(0,-153+Math.sin(p*Math.PI)*-8);crown(c,.65);c.restore();
 }
 if(['savingKnight','heroDancerStar','roundEcho3','runAndFight'].includes(act)||visual==='sword'){
  c.save();c.translate(58,-77+raised);c.rotate(.2+Math.sin(p*Math.PI)*-.45);blade(c,.5);c.restore();
 }
 if(act==='trumpetFanfare'||visual==='trumpet'){
  trumpet(c,51,-100,1,.07+Math.sin(p*Math.PI)*.18);
 }
 if(['kingClown','showBack','becomeAnyone'].includes(act)){
  c.save();c.translate(0,-120);mask(c,m.time,.64);c.restore();
 }
 if(['hearMusic','musicFades','whatDream','whereEnding'].includes(act)){
  grad(c,0,-120,82,'#eedbbb',.34);
 }
 if(['tapStars','starsEncore','leftStep','rightStep','leftRightFoot'].includes(act)){
  for(let i=0;i<5;i++){const x=(i-2)*23+Math.sin(m.time*5+i)*3;
   star(c,x,7+Math.cos(m.time*3+i)*3,4+i%2,m.time,.7);}
 }
 if(['rainDance','tomorrowRain'].includes(act)){
  for(let i=0;i<11;i++){const xx=-88+i*17,yy=-115+(i%3)*10;
   seg(c,[[xx,yy],[xx-8,yy+18]],'#d5ebff8e',1.8);}
 }
 if(act==='danceAgain'||act==='danceTogether'||act==='fallRise'){
  const sweep=Math.sin(p*Math.PI);
  c.strokeStyle='#ffe5c49c';c.lineWidth=4;
  c.beginPath();c.ellipse(0,-66,80+50*sweep,28+13*sweep,Math.sin(m.time*.8)*.2,0,TAU);c.stroke();
 }
 c.restore();
}
export function gyuwonCinematic2dPropTypes(){
 return Object.freeze(['doors','trumpet','sword','crown','mirror','home','city','rain','sea','stars','wings','curtain','ensemble','stage']);
}
