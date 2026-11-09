import {usesReference2d} from './gyuwon-reference-rules.mjs';
import {label,round,bar,flower,jelly,stagePerson,paperUnit,tank,burst} from './gyuwon-2d-art.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
export function createGyuwon2dView(doc,shell,{onPointer=()=>{},focus=()=>{}}={}){
 const canvas=doc.createElement('canvas');canvas.className='gy-reference-canvas';canvas.setAttribute('aria-label','최규원 2D 미니게임');canvas.tabIndex=0;canvas.hidden=true;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:12;touch-action:none;background:#080c12';shell.appendChild(canvas);
 const c=canvas.getContext('2d',{alpha:false}),state={g:null,width:1280,height:720,scale:1,left:0,top:0,active:false},report={mode:'canvas2d',drawMs:0,sprites:0,width:0,height:0};
 let pointer=null;
 const worldX=(x,w=1280)=>w/2+x*w/44;
 function pointerAt(e){if(!state.g||state.g.gyuwon.years.musical.year!==10)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left-state.left)/state.scale,y=(e.clientY-r.top-state.top)/state.scale;onPointer({x:clamp((x/540-.5)*26,-11,11),z:clamp((y-120)/760*44-22,-8,16)});}
 canvas.addEventListener('pointerdown',e=>{focus();canvas.focus({preventScroll:true});if(state.g?.gyuwon.years?.musical?.year===10){e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);pointerAt(e);}});
 canvas.addEventListener('pointermove',e=>{if(pointer===e.pointerId)pointerAt(e);});
 const release=()=>{if(pointer!==null){try{canvas.releasePointerCapture(pointer);}catch{}pointer=null;onPointer(null);}};
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 function standardHeader(g,m,{color='#6dd9e6',dark=false}={}){
  const fg=dark?'#162d37':'#fff5db';
  round(c,22,18,330,59,15,dark?'#ffffffb8':'#142332de','#b7d9d8',2);
  label(c,m.year+'수',43,45,21,color);label(c,Math.round(m.score).toLocaleString(),325,45,31,fg,'right',dark?0:3);
  bar(c,392,26,490,10,g.boss.hp,g.boss.maxHp,'#ba394e',dark?'#6c755b':'#23151c');
  bar(c,392,51,490,7,m.time,m.clock?.duration||48,color,dark?'#76886a':'#152c3b');
  label(c,Math.round(g.boss.hp)+' / '+g.boss.maxHp,900,31,18,fg,'left',dark?0:2);
  label(c,'COMBO '+m.combo,900,58,17,fg,'left',dark?0:2);
 }
 function runner(g,m){
  const bg=c.createLinearGradient(0,0,0,720);bg.addColorStop(0,'#b9e8ab');bg.addColorStop(.55,'#e6f49b');bg.addColorStop(1,'#cadf74');c.fillStyle=bg;c.fillRect(0,0,1280,720);
  c.fillStyle='#a7cc80';c.beginPath();c.moveTo(0,300);for(let x=0;x<=1340;x+=50)c.lineTo(x,245+Math.sin((x+m.runnerDistance*3)/200)*70);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.fillStyle='#d9ef9a';c.beginPath();c.moveTo(0,390);for(let x=0;x<=1340;x+=45)c.lineTo(x,355+Math.sin((x+m.runnerDistance*6)/160)*85);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  for(let i=0;i<22;i++){const x=((i*133-m.runnerDistance*9)%1400+1400)%1400-60,y=160+(i*89)%360;flower(c,x,y,.5+(i%3)*.3,i%4?'#fff9d4':'#f9f5af');}
  const sx=x=>1280/2+x*(1280/44),ground=555,sy=y=>ground-y*52;
  for(const a of m.platforms){const x=sx(a.x),w=(a.end-a.x)*1280/44;
   round(c,x,ground,w,190,5,'#8c592e','#3c4721',4);round(c,x,ground,w,24,5,'#7fbd4d','#274b24',4);
   c.save();c.beginPath();c.rect(x,ground+3,w,18);c.clip();for(let k=Math.floor(x/34);k<x/34+w/34+1;k++)flower(c,k*34+12,ground+9,.29,'#b7dc73');c.restore();
   c.strokeStyle='#be8d49';c.lineWidth=3;for(let k=x+5;k<x+w;k+=42){c.beginPath();c.moveTo(k,ground+40);c.lineTo(k+15,ground+58);c.lineTo(k+7,ground+80);c.stroke();}
  }
  for(const o of m.obstacles){const x=sx(o.x);if(o.kind==='low'){
   c.strokeStyle='#59451f';c.lineWidth=9;c.beginPath();c.moveTo(x,230);c.quadraticCurveTo(x+30,280,x,sy(3.5));c.stroke();
   for(let i=0;i<3;i++){round(c,x-27,sy(3.9)+i*29,54,40,12,'#e9b638','#463716',4);pathHive(c,x,sy(3.5)+i*29);}
   flower(c,x+23,sy(4.1),.4,'#b7d667');
  }else{
   round(c,x-25,ground-13,50,15,6,'#e8d779','#463d24',3);
   c.fillStyle='#79af40';c.strokeStyle='#253728';c.lineWidth=4;c.beginPath();c.moveTo(x-18,ground-14);c.quadraticCurveTo(x-36,ground-74,x-5,ground-77);c.lineTo(x-8,ground-48);c.lineTo(x+14,ground-72);c.quadraticCurveTo(x+39,ground-38,x+18,ground-14);c.closePath();c.fill();c.stroke();
   c.fillStyle='#bd5360';c.beginPath();c.moveTo(x-3,ground-19);c.lineTo(x+15,ground-57);c.lineTo(x+23,ground-45);c.lineTo(x+13,ground-18);c.fill();
  }}
  for(const j of m.jellies)jelly(c,sx(j.x),sy(j.y),j.kind,m.time);
  stagePerson(c,sx(g.player.x),sy(m.jumpY),{scale:1.1,t:m.time,pose:m.slide>0?'slide':m.jumpY>.1?'jump':'run',gyuwon:true,color:m.bonus>0?'#e3b04f':'#ad78b7'});
  if(m.bonus>0){for(let i=0;i<7;i++)flower(c,sx(g.player.x)-35-i*18,sy(m.jumpY+1)+Math.sin(i+m.time*12)*20,.18,'#fff6b8');label(c,'BONUS!',640,132,43,'#fff3a3','center',5);}
  standardHeader(g,m,{dark:true,color:'#2b94ab'});
  round(c,25,89,327,42,17,'#fffbd6bb','#637c46');bar(c,83,101,250,17,m.energy,100,'#f18d66','#8d985b');label(c,'♥',49,111,28,'#db5d64','center');
  label(c,Math.floor(m.runnerDistance)+' m',1090,99,25,'#fff8dc','right',4);label(c,'● '+m.pickups,48,159,27,'#fff8dc','left',4);
 }
 function pathHive(c,x,y){c.fillStyle='#8a5c1d';c.beginPath();for(let i=0;i<6;i++){const a=i*TAU/6;c.lineTo(x+Math.cos(a)*14,y+Math.sin(a)*11);}c.closePath();c.fill();}
 function castle(x,enemy=false,hp=1,max=1){
  const y=540;c.save();c.translate(x,y);c.strokeStyle='#20272b';c.lineWidth=4;c.fillStyle=enemy?'#dfd3c6':'#fbfae7';
  round(c,-49,-181,98,185,5,c.fillStyle,'#24282b',4);
  for(const side of [-1,1]){round(c,side*44-16,-220,32,224,4,enemy?'#d6cbc1':'#f8f8e9','#20272b',4);for(let i=0;i<3;i++)round(c,side*44-17+i*10,-232,9,25,1,'#ede9d8','#20272b',2);}
  round(c,-25,-56,50,60,24,'#383839','#20272b',3);
  for(let row=0;row<4;row++){c.beginPath();c.moveTo(-43,-175+row*32);c.lineTo(43,-175+row*32);c.stroke();}
  label(c,enemy?'?':'誓',0,-144,42,enemy?'#914f65':'#415562','center');
  c.restore();bar(c,x-66,275,132,12,hp,max,enemy?'#df8079':'#6ac9c2');label(c,Math.ceil(hp)+'/'+max,x,254,16,'#fff','center',4);
 }
 function army(g,m){
  const bg=c.createLinearGradient(0,0,0,600);bg.addColorStop(0,'#8bd8ef');bg.addColorStop(.75,'#e9f5ea');bg.addColorStop(1,'#b9d576');c.fillStyle=bg;c.fillRect(0,0,1280,720);
  for(let i=0;i<7;i++){const x=(i*263-m.time*3)%1500;c.fillStyle='#ffffffc9';c.beginPath();c.ellipse(x,140+(i%3)*39,100,22,0,0,TAU);c.fill();}
  c.fillStyle='#a6c66b';c.beginPath();c.moveTo(0,467);for(let x=0;x<=1280;x+=32)c.lineTo(x,438+Math.sin(x/113)*14);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.fillStyle='#9e794b';c.fillRect(0,548,1280,172);c.fillStyle='#bdd586';c.fillRect(0,529,1280,22);
  const sx=x=>640+x*29;
  castle(sx(-18),false,m.baseHp,m.baseMaxHp);castle(sx(18),true,m.enemyBaseHp,m.enemyBaseMaxHp);
  const sorted=[...m.units].sort((a,b)=>a.team-b.team||a.x-b.x);
  for(const u of sorted)paperUnit(c,sx(u.x),546,{type:u.type,team:u.team,t:m.time+u.id,wind:u.wind,hp:u.hp,maxHp:u.maxHp,scale:u.type===5?1.55:1.05});
  if(m.cannonShot){const a=m.cannonShot;if(a.age<.65)burst(c,sx(-18),473,14+a.age*36,a.age,'#c6f9ff');else{c.strokeStyle='#bcfaff';c.lineWidth=9;c.beginPath();c.moveTo(sx(-18),470);c.lineTo(sx(Math.min(18,a.x)),470);c.stroke();burst(c,sx(Math.min(18,a.x)),470,38,a.age);}}
  standardHeader(g,m,{dark:true,color:'#126d83'});label(c,Math.floor(m.money)+' / '+m.moneyCap+' 원',1210,112,31,'#ffdc6c','right',5);
  bar(c,1008,151,200,13,m.cannon,100,'#c9eaff');label(c,'LEVEL '+m.workerLevel,36,599,21,'#fff8d8','left',4);
 }
 function dance(g,m){
  c.fillStyle='#151437';c.fillRect(0,0,1280,720);
  const glow=c.createRadialGradient(640,230,50,640,230,650);glow.addColorStop(0,'#665698');glow.addColorStop(1,'#17142e');c.fillStyle=glow;c.fillRect(0,0,1280,590);
  for(let side of [-1,1]){const x=640+side*550;for(let i=0;i<6;i++){c.fillStyle=i%2?'#412750':'#5c3865';c.beginPath();c.moveTo(x+side*i*23,0);c.bezierCurveTo(x+side*(i*21-15),200,x+side*(i*24+20),400,x+side*i*18,620);c.lineTo(x+side*(i+1)*21,620);c.lineTo(x+side*(i+1)*22,0);c.fill();}}
  c.fillStyle='#c5a579';c.beginPath();c.moveTo(180,510);c.lineTo(1100,510);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.strokeStyle='#6b4b55';c.lineWidth=3;for(let i=0;i<16;i++){c.beginPath();c.moveTo(640+(i-8)*42,510);c.lineTo((i-2)*110,720);c.stroke();}
  const pat=m.danceCurrent,beat=m.dancePeriod,at=pat?pat.first:0,beatNumber=Math.floor((m.time-at)/beat),inWindow=pat&&m.time>=at-beat&&m.time<at+(pat.count-1)*pat.spacing*beat+.5;
  for(let i=0;i<5;i++){const angle=i*.42-1.1,x=640+Math.sin(angle)*430;c.fillStyle=['#e6c98528','#ad94e128','#78b6e128'][i%3];c.beginPath();c.moveTo(x,10);c.lineTo(x-130,560);c.lineTo(x+160,560);c.closePath();c.fill();}
  for(let i=0;i<4;i++){
   const x=350+i*190,player=i===2,pose=inWindow?(pat.kind==='pose'?'dance':pat.kind==='quick'?'quick':'turn'):'idle';
   const face=inWindow&&pat.kind!=='pose'?(beatNumber%2?-1:1):1;
   if(player){c.fillStyle='#b4dbef33';c.beginPath();c.ellipse(x,544,68,16,0,0,TAU);c.fill();}
   stagePerson(c,x,535,{scale:1.45,t:m.time,pose:player?(m.dancePose>0?pose:'idle'):pose,face:player?m.danceFacing:face,color:player?'#cad6eb':'#292739',gyuwon:false,miss:player&&m.danceError>0});
   if(player){label(c,'★',x,322,24,'#ffe890','center');if(m.danceError>0){burst(c,x+64,390,24,m.time,'#faaca0');}}
  }
  stagePerson(c,638,633,{scale:1.65,t:m.time,pose:'dance',color:'#9b70ac',gyuwon:true});
  c.strokeStyle='#dde2e2';c.lineWidth=8;c.beginPath();c.moveTo(681,495);c.lineTo(681,635);c.stroke();c.fillStyle='#b8c2d2';c.beginPath();c.ellipse(681,488,12,19,-.35,0,TAU);c.fill();
  if(pat&&m.danceCue&&m.time>=pat.cue&&m.time<pat.first){round(c,451,110,378,70,34,'#fcf5d9','#211e3a',3);label(c,m.danceCue,640,146,34,'#55406e','center');}
  if(m.judgementUntil>m.time){label(c,m.judgement,1010,284,35,m.judgement==='PERFECT'?'#ffe8a6':'#b8f8eb','center',4);}
  standardHeader(g,m,{color:'#e9c9ed'});
 }
 function fighter(g,m){
  c.fillStyle='#3c6170';c.fillRect(0,0,1280,720);
  for(let layer=0;layer<3;layer++)for(let i=0;i<12;i++){
   const x=i*133+Math.sin(i*4)*30-layer*12,y=95+(i%5)*29;const color=['#526e73','#76908a','#a5ac8d'][layer];
   round(c,x,y,96,260+layer*75,2,color,'#263e49',3);for(let j=0;j<6;j++){round(c,x+14,y+24+j*35,18,21,2,j%2?'#d7cb8f':'#263f50','#31454c',2);round(c,x+55,y+24+j*35,17,21,2,'#304952','#31454c',2);}
  }
  c.strokeStyle='#222d35';c.lineWidth=18;for(let i=0;i<4;i++){c.beginPath();c.moveTo(i*390-40,140);c.lineTo(i*390+170,520);c.stroke();}
  c.fillStyle='#a17e58';c.beginPath();c.moveTo(0,526);c.lineTo(1280,526);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.strokeStyle='#4f4d43';c.lineWidth=4;for(let i=0;i<18;i++){c.beginPath();c.moveTo(i*92,526);c.lineTo(i*103-70,720);c.stroke();}
  c.strokeStyle='#27363d';c.lineWidth=9;c.beginPath();c.moveTo(0,504);c.lineTo(1280,504);c.stroke();
  const sx=x=>640+x*33;
  for(let i=0;i<2;i++){
   const f=m.fighters[i],a=f.action,pose=f.stun>0?'guard':a?(a.t<a.wind?'wind':a.t<a.wind+a.live?'strike':'idle'):f.guard?'guard':f.crouch?'crouch':f.y>0?'jump':Math.abs(f.x-(i?7:-7))>.01?'run':'idle';
   stagePerson(c,sx(f.x),580-f.y*45,{scale:1.65,t:m.time,pose,face:f.facing,color:i?'#9d7f8f':'#638ba8',gyuwon:!!i,reach:a?Math.min(120,a.range*33/1.65):76});
   if(a&&a.t>=a.wind&&a.t<a.wind+a.live&&a.kind==='skill'){c.save();c.translate(sx(f.x)+f.facing*50,440-f.y*45);c.scale(f.facing,1);c.strokeStyle='#fff2c7';c.lineWidth=10;c.beginPath();c.ellipse(0,0,127,47,-.25,-1.3,1.3);c.stroke();c.restore();}
   if(f.combo>1)label(c,f.combo+' HIT',i?1090:165,225,33,'#fff0b8','center',4);
  }
  for(const s of m.hitSparks)burst(c,sx(s.x),580-s.y*65,45*(1-s.age/.4),m.time,s.blocked?'#9fe6ec':'#ffeb9a');
  const [a,b]=m.fighters;round(c,32,22,1216,103,24,'#1b2730dc','#a5a88a',3);
  bar(c,130,41,425,23,a.hp,a.maxHp,'#e6b35d','#7a3f47');bar(c,725,41,425,23,b.hp,b.maxHp,'#e6b35d','#7a3f47');
  label(c,'서약의 검사',135,94,22,'#e8e0c7');label(c,'최규원',1145,94,22,'#e8e0c7','right');
  c.fillStyle='#18212a';c.beginPath();c.arc(640,70,59,0,TAU);c.fill();c.strokeStyle='#b79863';c.lineWidth=7;c.stroke();label(c,Math.max(0,Math.ceil((m.clock?.duration||44)-m.time)),640,68,42,'#f1d5a7','center');
  bar(c,85,652,325,14,a.meter,100,'#7ed1dd');bar(c,870,652,325,14,b.meter,100,'#a49cdc');
  label(c,'ROUND '+m.fightRound,640,134,17,'#e7d5aa','center',3);label(c,m.score.toLocaleString(),640,684,22,'#fff0c7','center',4);
  if(m.fightReset>0)label(c,a.hp<=0?'DOWN':'K.O.',640,325,94,'#f3d99e','center',9);
 }
 function shooter(g,m){
  c.imageSmoothingEnabled=false;c.fillStyle='#4f646a';c.fillRect(0,0,540,900);
  const offset=(m.scroll*15)%150;
  for(let row=-1;row<8;row++)for(let col=0;col<5;col++){
   const x=col*128-36,y=row*150+offset;
   c.fillStyle=(row+col)%2?'#536771':'#5d7076';c.fillRect(x+3,y+3,123,145);c.strokeStyle='#364c58';c.lineWidth=4;c.strokeRect(x+4,y+4,122,144);
   if((col+row)%3===0){c.fillStyle='#334951';c.fillRect(x+15,y+15,43,34);c.fillStyle='#8b9995';c.fillRect(x+15,y+15,43,6);c.strokeStyle='#b0b5a1';c.lineWidth=2;c.strokeRect(x+18,y+18,37,28);}
   c.strokeStyle='#7c8b8d';c.lineWidth=2;c.beginPath();c.moveTo(x+65,y+20);c.lineTo(x+84,y+45);c.lineTo(x+69,y+66);c.lineTo(x+99,y+90);c.stroke();
  }
  c.strokeStyle='#adada080';c.lineWidth=7;c.beginPath();c.moveTo(55,900);c.lineTo(55,120);c.moveTo(485,900);c.lineTo(485,120);c.stroke();
  const sx=x=>270+x*20,sy=z=>120+(z+22)/44*760;
  for(const e of m.shooterTargets){tank(c,sx(e.x),sy(e.z),{enemy:true,large:e.kind==='carrier',t:m.time,flash:e.wind<.7?(.7-e.wind)*.55:0});if(e.wind<1.05){c.fillStyle='#ffe282';c.beginPath();c.arc(sx(e.x),sy(e.z)+28,4+(1.05-e.wind)*10,0,TAU);c.fill();}bar(c,sx(e.x)-40,sy(e.z)-68,80,5,e.hp,e.maxHp,'#edbc72');}
  for(const b of m.bullets){const x=sx(b.x),y=sy(b.z);c.fillStyle=b.kind==='laser'?'#bd7aee':'#ffe3a5';c.fillRect(x-3,y-22,b.kind==='laser'?6:4,23);c.fillStyle='#ffffff';c.fillRect(x-1,y-20,2,22);}
  for(const b of m.enemyShots){const x=sx(b.x),y=sy(b.z);ellipseNoStroke(c,x,y,5,8,b.kind==='amber'?'#ffb54a':'#ef7e4b');ellipseNoStroke(c,x,y-1,2,4,'#fff6bf');}
  for(const p of m.powerItems){const x=sx(p.x),y=sy(p.z);round(c,x-10,y-11,20,22,3,p.kind==='power'?'#a668d7':'#f3d166','#203642',2);label(c,p.kind==='power'?'P':'★',x,y+1,17,'#fff7ca','center');}
  tank(c,sx(g.player.x),sy(g.player.z),{t:m.time});
  if(g.player.invuln>0){c.strokeStyle='#bff7ffbb';c.lineWidth=2;c.beginPath();c.arc(sx(g.player.x),sy(g.player.z),34,0,TAU);c.stroke();}
  if(m.bombEffect>0){const alpha=Math.min(.8,m.bombEffect);c.fillStyle=`rgba(225,245,255,${alpha*.35})`;c.fillRect(0,120,540,780);for(let i=0;i<8;i++)burst(c,80+(i*73)%420,180+(i*113)%620,45*(1.2-m.bombEffect),m.time,'#fff2ca');}
  round(c,8,8,524,105,12,'#256575','#78e9f2',6);round(c,21,20,499,37,5,'#163345');
  label(c,'SCORE',34,38,15,'#e3d580');label(c,Math.floor(m.score).toLocaleString(),206,38,23,'#fff6c9','right');label(c,'STAGE 10',240,38,18,'#edd577');label(c,'×'+m.bombs,483,38,22,'#fff5b7','right');
  for(let i=0;i<3;i++)label(c,i<Math.ceil(g.player.hp/g.player.maxHp*3)?'♥':'♡',37+i*29,79,26,'#f78286','center');
  label(c,'CHAIN '+m.chain,147,79,18,'#f8d99b');bar(c,285,69,219,18,m.power,3,'#e4b860','#263c49');
  label(c,Math.round(g.boss.hp)+' / '+g.boss.maxHp,270,887,14,'#e3eff0','center',3);
 }
 const ellipseNoStroke=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
 function render(g){
  const m=g?.gyuwon?.years?.musical,active=usesReference2d(m)&&g.status!=='won';canvas.hidden=!active;state.g=g;state.active=active;if(!active)return false;
  const started=performance.now(),rect=shell.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height)),ratio=Math.min(1.5,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
  const vw=m.year===10?540:1280,vh=m.year===10?900:720,scale=Math.min(w/vw,h/vh),left=(w-vw*scale)/2,top=(h-vh*scale)/2;
  Object.assign(state,{width:vw,height:vh,scale,left,top});c.setTransform(ratio,0,0,ratio,0,0);c.fillStyle='#080d16';c.fillRect(0,0,w,h);c.translate(left,top);c.scale(scale,scale);c.save();c.beginPath();c.rect(0,0,vw,vh);c.clip();
  if(m.year===6)runner(g,m);else if(m.year===7)army(g,m);else if(m.year===8)dance(g,m);else if(m.year===9)fighter(g,m);else if(m.year===10)shooter(g,m);c.restore();
  report.drawMs=performance.now()-started;report.width=w;report.height=h;report.sprites=(m.units?.length||0)+(m.bullets?.length||0)+(m.enemyShots?.length||0)+(m.jellies?.length||0)+2;return true;
 }
 return {canvas,render,clearInput:release,stats:()=>({...report}),dispose(){release();canvas.remove();}};
}
