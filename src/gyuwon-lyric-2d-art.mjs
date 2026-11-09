// Lightweight reusable 2D stagecraft for all 82 source-aligned 6/8/9 lyrics.
// Draws only physical visual set dressing; gameplay hitboxes live in the rules.
import {gyuwonLyricActionAt} from './gyuwon-lyric-actions.mjs';
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const x=clamp(v);return x*x*(3-2*x);};
const glow=(c,x,y,r,color,alpha=.5)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#1c1d3600');c.save();c.globalAlpha=alpha;c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);c.restore();};
const line=(c,pts,color,width=3)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,Math.max(1,r),0,TAU);c.fill();};
const star=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.48:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();};
function doors(c,t,q,count=6){
 for(let i=0;i<count;i++){
  const x=118+(i+.5)*103+(i%2)*17,y=330+(i%3)*15,s=.6+Math.sin(t*.5+i)*.05;
  c.save();c.translate(x,y);c.scale(s,s);
  c.fillStyle='#f1d9a756';c.strokeStyle='#fff0c8a8';c.lineWidth=4;
  c.fillRect(-32,-96,64,142);c.strokeRect(-32,-96,64,142);
  c.fillStyle='#16223d'+(q>.5?'aa':'55');c.fillRect(-24,-88,48,126);
  circle(c,15,-8,3,'#fff1be');c.restore();
 }
}
function mountain(c,t){
 c.fillStyle='#d5dad1b9';c.beginPath();c.moveTo(120,495);
 for(let i=0;i<6;i++){const x=125+i*185,y=260+(i%3)*56;c.lineTo(x,y+200);c.lineTo(x+90,y);c.lineTo(x+170,y+200);}
 c.lineTo(1250,510);c.closePath();c.fill();c.strokeStyle='#7d96a5ba';c.lineWidth=5;c.stroke();
 for(let i=0;i<6;i++){const x=215+i*185,y=260+(i%3)*56;c.fillStyle='#ffffffb2';c.beginPath();c.moveTo(x,y);c.lineTo(x-23,y+54);c.lineTo(x,y+40);c.lineTo(x+22,y+54);c.closePath();c.fill();}
}
function water(c,t){
 const wave=c.createLinearGradient(0,440,0,650);wave.addColorStop(0,'#b7dff5a1');wave.addColorStop(1,'#3d6f9d2e');
 c.fillStyle=wave;c.beginPath();c.moveTo(0,465);
 for(let x=0;x<=1300;x+=20)c.lineTo(x,465+Math.sin(x*.014+t*2.3)*16);
 c.lineTo(1280,645);c.lineTo(0,645);c.closePath();c.fill();
 c.strokeStyle='#fff6e6be';c.lineWidth=3;
 for(let i=0;i<8;i++){const x=70+i*170;c.beginPath();c.arc(x,485+Math.sin(t*2+i)*9,36,Math.PI*.14,Math.PI*.86);c.stroke();}
}
function curtains(c,q){
 for(const side of [-1,1]){
  const x=side<0?0:1280,curl=130*(1-q);
  c.fillStyle='#713d65bd';c.beginPath();c.moveTo(x,0);c.lineTo(x-side*curl,0);
  c.bezierCurveTo(x-side*(90+curl),155,x-side*(35+curl),340,x-side*155,570);
  c.lineTo(x,570);c.fill();
  c.strokeStyle='#f5dcb2cc';c.lineWidth=6;c.beginPath();c.moveTo(x-side*curl,0);c.bezierCurveTo(x-side*(90+curl),155,x-side*(35+curl),340,x-side*155,570);c.stroke();
 }
}
function silhouettes(c,t,n=4){
 for(let i=0;i<n;i++){
  const x=250+i*(820/Math.max(1,n-1)),y=460+Math.sin(t*4+i)*4;
  c.fillStyle='#372d64ac';c.beginPath();c.ellipse(x,y-87,17,20,0,0,TAU);c.fill();
  c.fillRect(x-13,y-70,26,60);line(c,[[x-7,y-15],[x-20,y+12],[x-26,y+30]],'#443754',8);
  line(c,[[x+7,y-15],[x+20,y+12],[x+26,y+30]],'#443754',8);
  line(c,[[x-9,y-59],[x-30,y-65-Math.sin(t*3+i)*12]],'#443754',7);
  line(c,[[x+9,y-59],[x+30,y-65+Math.sin(t*3+i)*12]],'#443754',7);
 }
}
export function drawGyuwonLyricBackdrop(c,m){
 const year=m?.finishing?'ending':m?.year,a=m?.lyricAction||gyuwonLyricActionAt(year,m?.time);
 if(!a||!['6','8','9'].includes(String(year)))return;
 const q=ease(a.phase),w=clamp(a.weight*1.7),t=m.time,v=a.visual;
 c.save();c.globalAlpha=.38+.32*w;
 if(['doors','home','windows','mirror','question','clones'].includes(v)){
  if(v==='home'){glow(c,960,325,300,'#fff1ab',.76);c.fillStyle='#b79279';c.fillRect(850,345,220,175);
   c.fillStyle='#704967';c.beginPath();c.moveTo(830,348);c.lineTo(960,256);c.lineTo(1090,348);c.fill();
   c.fillStyle='#ffefb8';c.fillRect(948,433,47,87);
  }else if(v==='mirror'){doors(c,t,q,5);for(let i=0;i<5;i++)glow(c,280+i*168,350,60,'#d9e2fa',.5);}
  else if(v==='question'){for(let i=0;i<7;i++){const x=200+i*145,y=245+Math.sin(t*.8+i)*32;
    c.strokeStyle='#e3c89cb9';c.lineWidth=7;c.beginPath();c.arc(x,y,24,Math.PI*1.1,Math.PI*2.35);c.stroke();circle(c,x+9,y+44,5,'#e3c89c');}}
  else{doors(c,t,q,v==='clones'?4:7);if(v==='clones')silhouettes(c,t,4);}
 }else if(v==='mountain')mountain(c,t);
 else if(v==='sea')water(c,t);
 else if(v==='city'){for(let i=0;i<13;i++){const x=i*110-30,h=80+(i*37)%200;
   c.fillStyle='#d0c6cc80';c.fillRect(x,380-h,88,h);c.save();c.translate(x+44,175);c.scale(1,-.65);
   c.fillRect(-44,0,88,h);c.restore();}}
 else if(v==='curtain')curtains(c,q);
 else if(['stars','star','sky','moon','sun','elements'].includes(v)){
  glow(c,880,225,290,v==='sun'?'#ffecad':'#c3c3f8',.65);
  for(let i=0;i<25;i++){const x=(i*129+t*9)%1280,y=110+(i*73)%360;
    star(c,x,y,3+(i%4)*3,i%3?'#ffefc2a9':'#dcf2ffd0');}
  if(v==='elements'){for(let i=0;i<34;i++){const x=60+i*39,y=250+(i%7)*23;
    line(c,[[x,y],[x-12,y+20]],i%2?'#96c5f9b7':'#fd9c79a9',2);}}
 }else if(v==='rain'||v==='fog'){
  for(let i=0;i<55;i++){const x=(i*113+t*80)%1320-20,y=(i*97+t*180)%475;
   line(c,[[x,y],[x-15,y+30]],v==='rain'?'#a8d8f2c4':'#e1ccdf68',2);}
 }else if(['dancers','choir','ensemble','masks'].includes(v))silhouettes(c,t,v==='ensemble'?6:4);
 else if(v==='world'){for(let i=0;i<6;i++)glow(c,155+i*195,360+Math.sin(t+i)*40,90,i%2?'#e3a9d9':'#b9ead0',.65);}
 else if(v==='road'||v==='roads'||v==='steps'){c.strokeStyle='#f8e4b9a9';c.lineWidth=4;
  for(let i=0;i<10;i++){const y=460+i*17;c.beginPath();c.moveTo(640-(i*47),y);c.lineTo(640+i*47,y);c.stroke();}}
 else if(v==='shield'||v==='ring'||v==='arc'){c.strokeStyle='#ffe4b6c4';c.lineWidth=7;
  c.beginPath();c.ellipse(640,405,260+Math.sin(t*3)*12,75,0,0,TAU);c.stroke();}
 else if(v==='dark'){c.fillStyle='#101028a9';c.fillRect(0,0,1280,410);}
 else if(v==='heart'){glow(c,640,265,190,'#ffb9bc',.72);}
 else if(v==='crown'){c.fillStyle='#fce0a9ad';c.beginPath();c.moveTo(510,310);c.lineTo(540,230);c.lineTo(590,285);c.lineTo(640,190);c.lineTo(690,285);c.lineTo(745,230);c.lineTo(775,310);c.fill();}
 else if(v==='wings'){for(const side of [-1,1]){c.strokeStyle='#d2e5f7cf';c.lineWidth=12;
  c.beginPath();c.moveTo(640,300);c.quadraticCurveTo(640+side*155,90,640+side*320,220);c.stroke();}}
 else if(v==='flower'){for(let i=0;i<17;i++){const x=155+i*58,y=480+Math.sin(t*2+i)*10;star(c,x,y,12,'#f9dbb9');}}
 else if(v==='spotlight'){glow(c,640,310,400,'#fff2bd',.7);}
 else if(v==='ribbons'||v==='pulse'||v==='rings'){
  for(let i=0;i<6;i++){c.strokeStyle=i%2?'#f6c5dc9e':'#e4defdb2';c.lineWidth=5;
   c.beginPath();c.ellipse(640,370,120+i*33+Math.sin(t*2+i)*11,35+i*13,Math.sin(t*.7+i)*.1,0,TAU);c.stroke();}
 }
 c.restore();
}
export function drawGyuwonLyricGesture(c,m,{x=640,y=515,scale=1}={}){
 const year=m?.finishing?'ending':m?.year,a=m?.lyricAction||gyuwonLyricActionAt(year,m?.time);
 if(!a||!['6','8','9'].includes(String(year)))return;
 const q=ease(a.phase),t=m.time,g=a.gesture;
 c.save();c.globalAlpha=clamp(a.weight*1.5);c.translate(x,y);c.scale(scale,scale);
 if(g==='stepleft'||g==='stepright'||g==='tap'||g==='stamp'||g==='run'||g==='dance'){
  for(let i=0;i<4;i++){const px=(g==='stepleft'?-1:g==='stepright'?1:i%2?1:-1)*(30+i*19),py=18+Math.sin(t*8+i)*5;
   c.fillStyle=i%2?'#fff6c5a8':'#d5ebffc8';c.beginPath();c.ellipse(px,py,13+q*4,6,0,0,TAU);c.fill();}
 }
 if(g==='clap'||g==='snap'||g==='conduct'||g==='raise'){
  for(let i=0;i<3;i++){c.strokeStyle='#ffe2c5';c.lineWidth=4-i;
   c.beginPath();c.arc(0,-105,24+i*22+Math.sin(t*5)*5,Math.PI*.8,Math.PI*2.1);c.stroke();}
 }
 if(g==='spin'||g==='bow'||g==='transform'){c.strokeStyle='#eecbffbd';c.lineWidth=6;
  c.beginPath();c.ellipse(0,-74,80+30*q,32,Math.sin(t*.7)*.12,0,TAU);c.stroke();}
 if(g==='jump'||g==='fly'||g==='reach'){glow(c,0,-120,125,'#f9e9ad',.68);}
 if(g==='still'||g==='ponder'||g==='fade'){glow(c,0,-105,100,'#b4b6df',.32);}
 c.restore();
}
