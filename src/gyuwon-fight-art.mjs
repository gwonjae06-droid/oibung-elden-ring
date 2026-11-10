import {drawGyuwonPerformer} from './gyuwon-performance-art.mjs';
import {gyuwonFightPoseAt} from './gyuwon-performance-poses.mjs';
import {gyuwonFightScene,gyuwonFightGroundScreen} from './gyuwon-fight-director.mjs';
import {round,bar,label} from './gyuwon-2d-art.mjs';
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const sx=x=>640+x*33;
function glow(c,x,y,r,color,alpha=.7){
 c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,2,x,y,r);
 g.addColorStop(0,color);g.addColorStop(1,'#11152200');c.fillStyle=g;
 c.fillRect(x-r,y-r,2*r,2*r);c.restore();
}
function backdrop(c,m,scene){
 const t=m.time,roof=scene.arena==='rooftop',mirror=['mirror','stars'].includes(scene.arena);
 const sky=c.createLinearGradient(0,0,0,720);
 const colors=roof?['#20243b','#456477','#a57e80']:mirror?['#0d1029','#303250','#735b65']:['#291b31','#66405c','#977a67'];
 colors.forEach((col,i)=>sky.addColorStop(i/2,col));
 c.fillStyle=sky;c.fillRect(0,0,1280,720);
 // Stage curtains become the ring's side ropes, while rooftop and mirrors
 // remain deliberately distinct silhouettes during the 3-minute song.
 if(!roof&&!mirror){
  for(const side of [-1,1]){
   const x=640+side*560;c.fillStyle='#63304d';
   c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-side*60,195,x+side*75,415,x-side*45,535);
   c.lineTo(x+side*165,720);c.lineTo(x+side*165,0);c.fill();
   c.strokeStyle='#d9b47b';c.lineWidth=7;c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-side*60,195,x+side*75,415,x-side*45,535);c.stroke();
  }
  for(let i=0;i<7;i++){const x=135+i*170;c.fillStyle='#a67d62';round(c,x,175,31,355,4,'#8c6170','#d3ad81',3);round(c,x-12,155,56,28,4,'#dfb98a');}

  for(let i=0;i<15;i++)glow(c,180+i*64,114+Math.sin(i*.65)*20,22,'#fff2bd',.5);
  glow(c,650,225,450,'#dbabc7',.28);
 }else if(roof){
  for(let i=0;i<15;i++){
   const x=i*111-85,h=130+(i*67)%175;
   c.fillStyle=i%3===0?'#283950':'#304356';round(c,x,420-h,105,h+130,0,c.fillStyle);
   c.fillStyle='#c4b6aa';for(let r=0;r<6;r++)for(let col=0;col<3;col++)if((r+col+i)%3!==0)c.fillRect(x+11+col*29,440-h+r*28,10,13);
   // Ghostly upside-down cities refer to the inversion lyric; no camera spin.
   c.save();c.globalAlpha=.15+.08*Math.sin(t*.12);c.translate(0,155);c.scale(1,-.47);
   c.fillStyle='#a4bacd';c.fillRect(x,0,105,h+80);c.restore();
  }
  for(let i=0;i<47;i++){const x=(i*113)%1280,y=45+(i*89)%270;
   c.fillStyle=i%4===0?'#fff9ca':'#cad7e9';c.globalAlpha=.35+(i%3)*.15;
   c.fillRect(x,y,2+(i%3),2+(i%3));}
  c.globalAlpha=1;glow(c,985,140,240,'#f3d4b2',.35);
  for(let i=0;i<4;i++){const x=180+i*290,y=330+Math.sin(t*.7+i)*19;
   round(c,x,y,135,13,4,'#c2b8c688','#edf5ff',2);}
 }else{
  for(let i=0;i<7;i++){
   const x=60+i*194,w=137,y=90+(i%3)*17;
   const glass=c.createLinearGradient(x,y,x+w,540);glass.addColorStop(0,'#b8c5df31');glass.addColorStop(.5,'#dfc8db66');glass.addColorStop(1,'#9383b01e');
   round(c,x,y,w,445,12,glass,'#d5b789',4);
   c.strokeStyle='#e4d6e0';c.lineWidth=2;c.beginPath();
   c.moveTo(x+10,y+90);c.lineTo(x+w*.6,y+160);c.lineTo(x+37,y+310);c.lineTo(x+w-10,y+386);c.stroke();
  }
  for(let i=0;i<60;i++){
   const a=i*2.399+radians(t)*.05,x=640+Math.cos(a)*(60+(i%9)*75),y=200+Math.sin(a)*(28+(i%11)*23);
   c.fillStyle=i%4===0?'#ffeabb':'#f0e2ff';c.globalAlpha=.28+(i%5)*.09;c.fillRect(x,y,1+(i%3),1+(i%3));
  }
  c.globalAlpha=1;
  if(scene.arena==='stars'){glow(c,640,310,510,'#d7d7f9',.48);}
 }
 // Introductory spotlight precisely turns the previous dancing stage into a ring.
 if(t<9){const q=clamp(t/9);glow(c,640,420,390-q*150,'#f8ddaf',.3);c.save();c.globalAlpha=(1-q)*.75;
  for(let i=0;i<4;i++){const x=345+i*190+(i<2?-1:1)*q*250;
   c.fillStyle='#f2d6bb';c.beginPath();c.ellipse(x,456-q*18,22,70,Math.sin(t*3+i)*.16,0,TAU);c.fill();}
  c.restore();
 }
 if(scene.kind==='final-chorus'){glow(c,640,290,590,'#ffe1a7',.46+.08*Math.sin(t*6));}
 if(scene.kind==='breather'){c.fillStyle='#05081e66';c.fillRect(0,110,1280,425);}
}
const radians=x=>x*Math.PI/180;
function floor(c,m,scene){
 const t=m.time;
 c.beginPath();c.moveTo(0,720);c.lineTo(0,gyuwonFightGroundScreen(t,-640/33));
 for(let x=16;x<=1280;x+=16)c.lineTo(x,gyuwonFightGroundScreen(t,(x-640)/33));
 c.lineTo(1280,720);c.closePath();
 const g=c.createLinearGradient(0,520,0,720);
 if(scene.arena==='rooftop'){g.addColorStop(0,'#84939d');g.addColorStop(.3,'#47535c');g.addColorStop(1,'#293342');}
 else if(scene.arena==='mirror'||scene.arena==='stars'){g.addColorStop(0,'#9d8c9d');g.addColorStop(.3,'#484557');g.addColorStop(1,'#212639');}
 else {g.addColorStop(0,'#b7a17f');g.addColorStop(.3,'#68505a');g.addColorStop(1,'#292739');}
 c.fillStyle=g;c.fill();
 c.strokeStyle=scene.arena==='theater'?'#d9bb87':'#d3d8e0';c.lineWidth=8;c.beginPath();
 c.moveTo(0,gyuwonFightGroundScreen(t,-640/33));
 for(let x=16;x<=1280;x+=16)c.lineTo(x,gyuwonFightGroundScreen(t,(x-640)/33));
 c.stroke();
 c.lineWidth=2;c.strokeStyle='#d3c6b04c';
 for(let i=0;i<25;i++){
  const x=i*58,y=gyuwonFightGroundScreen(t,(x-640)/33)+10;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-25,720);c.stroke();
 }
 // Decorative ring ropes are foreground set dressing and never fake hitboxes.
 c.strokeStyle='#c6a483';c.lineWidth=6;
 for(let i=0;i<3;i++){c.beginPath();c.moveTo(25,480+i*25);c.lineTo(125,488+i*25);c.moveTo(1144,488+i*25);c.lineTo(1255,480+i*25);c.stroke();}
}
function fightActor(c,f,i,m,scene,portrait){
 const x=sx(f.x),feetY=gyuwonFightGroundScreen(m.time,f.x)-45*f.y;
 const pose=gyuwonFightPoseAt(f,m.time,m.lyricAction);
 drawGyuwonPerformer(c,x,feetY,{scale:1.52,face:f.facing,pose,gyuwon:i===1,portrait,
  color:scene.role==='king'?'#a18b5c':scene.role==='clown'?'#98637c':'#655578',crouch:f.crouch,
  costume:i===1?scene.role:null});
 const a=f.action;
 if(a&&a.t>=a.wind&&a.t<a.wind+a.live&&a.kind!=='light'){
  // Narrow strokes follow the actual punching hand or sweeping boot. They
  // never depict a separate hitbox, ring, aura or off-body explosion.
  const progress=clamp((a.t-a.wind)/a.live),contact=x+f.facing*a.range*24;
  c.save();c.globalAlpha=(1-progress)*.55;c.lineWidth=a.kind==='super'?7:3;
  c.strokeStyle=i?'#dac4a1':'#bdcdd7';c.lineCap='round';
  for(let k=0;k<3;k++){c.beginPath();c.moveTo(contact-f.facing*(15+k*7),feetY-140+k*7);c.lineTo(contact-f.facing*(45+k*7),feetY-130+k*7);c.stroke();}
  c.restore();
 }
}
export function drawGyuwonFightWorld(c,g,m,{portrait}={}){
 const t=m.time,scene=m.fightWorld||gyuwonFightScene(t);
 backdrop(c,m,scene);

 floor(c,m,scene);
 for(const o of m.encoreOrbs||[]){
  if(o.collected)continue;const x=sx(o.x),y=gyuwonFightGroundScreen(t,o.x)-106+Math.sin(t*3)*12;
  round(c,x-13,y-18,26,36,3,'#d2b781','#574b43',2);c.fillStyle='#f1e5c3';c.fillRect(x-8,y-12,16,2);
 }
 for(let i=0;i<2;i++)fightActor(c,m.fighters[i],i,m,scene,portrait);
 for(const spark of m.hitSparks||[]){
  const x=sx(spark.x),y=gyuwonFightGroundScreen(t,spark.x)-spark.y*45-75,q=1-spark.age/.22;
  if(q<=0)continue;
  c.save();c.globalAlpha=q;c.strokeStyle=spark.blocked?'#aebfca':'#e5c491';c.lineWidth=spark.blocked?2:3;
  for(let k=0;k<5;k++){const a=-1.1+k*.55,d=(1-q)*23;c.beginPath();c.moveTo(x+Math.cos(a)*d,y+Math.sin(a)*d);c.lineTo(x+Math.cos(a)*(d+9*q),y+Math.sin(a)*(d+9*q));c.stroke();}c.restore();
 }
 const [p,b]=m.fighters;
 round(c,32,22,1216,103,20,'#16212cdb','#c6b28d',3);
 bar(c,128,40,427,23,p.hp,p.maxHp,'#e3b669','#634453');
 bar(c,725,40,427,23,b.hp,b.maxHp,'#da8b91','#563b50');
 label(c,'서약의 검사',132,91,22,'#fff2db');label(c,'최규원',1144,91,22,'#fff2db','right');
 c.fillStyle='#18212a';c.beginPath();c.arc(640,68,53,0,TAU);c.fill();
 c.strokeStyle='#e6bb86';c.lineWidth=5;c.stroke();
 label(c,Math.max(0,Math.ceil((m.clock?.duration||180)-t)),640,67,37,'#fff2cf','center');
 bar(c,88,649,320,14,p.meter,100,'#8fdaed');bar(c,872,649,320,14,b.meter,100,'#e3a5d7');
 label(c,'ROUND '+m.fightRound,640,140,17,'#fff0ca','center',3);
 label(c,Math.round(m.score).toLocaleString(),640,684,22,'#fbe5ad','center',3);
 if(m.fightReset>0){glow(c,640,295,200,'#ffdfba',.5);
  label(c,p.hp<=0?'DOWN':'K.O.',640,305,88,'#fff1cf','center',8);
 }
}
