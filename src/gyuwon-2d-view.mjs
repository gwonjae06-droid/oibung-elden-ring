import {GYUWON_FACE_URL} from './gyuwon-photo-face.mjs';
import {usesReference2d} from './gyuwon-reference-rules.mjs';
import {label,round,bar,flower,jelly,stagePerson,paperUnit,tank,burst} from './gyuwon-2d-art.mjs';
import {drawArmoredRunner,drawGyuwonRunnerGuide} from './gyuwon-runner-art.mjs';
import {gyuwonRunnerScene,gyuwonRunnerGuideAt,gyuwonRunnerAccent} from './gyuwon-runner-director.mjs';
import {drawGyuwonArmyWorld,gyuwonArmyLaneY} from './gyuwon-army-director.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
export function createGyuwon2dView(doc,shell,{onPointer=()=>{},focus=()=>{}}={}){
 const canvas=doc.createElement('canvas');canvas.className='gy-reference-canvas';canvas.setAttribute('aria-label','최규원 2D 미니게임');canvas.tabIndex=0;canvas.hidden=true;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:12;touch-action:none;background:#080c12';shell.appendChild(canvas);
 const portrait=doc.createElement('img');portrait.src=GYUWON_FACE_URL;portrait.decoding='async';
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
  // The central top belongs to the seven-act theater progress ribbon.
  bar(c,960,28,290,12,g.boss.hp,g.boss.maxHp,'#ba394e',dark?'#6c755b':'#23151c');
  label(c,Math.round(g.boss.hp)+' / '+g.boss.maxHp,1095,60,17,fg,'center',dark?0:2);
  label(c,'COMBO '+m.combo,913,59,15,fg,'right',dark?0:2);
 }
 function runner(g,m){
  const scene=m.runnerScene||gyuwonRunnerScene(m.time,m.clock?.duration||180),biome=scene.biome,
    accent=gyuwonRunnerAccent(scene.time),d=m.runnerDistance||0,t=m.time,
    rain=biome==='rain'||accent.shower,quiet=biome==='quiet',dawn=['sunrise','finale','exit'].includes(biome),
    bridge=biome==='bridge',sky=biome==='skyroad',theater=biome==='theater';
  const palettes={
   theater:['#d4c2a5','#ead8bb','#d1c39e'],meadow:['#a4d6b9','#e7efa6','#b4d88e'],
   bridge:['#9ebfc7','#e3d2b6','#91b092'],rain:['#304e73','#7188a0','#5c7776'],
   quiet:['#192e58','#4e588d','#8785ae'],sunrise:['#f59d80','#ffdab1','#a6cc94'],
   skyroad:['#85b8e2','#def0ff','#ddd2f2'],finale:['#e9ac7e','#ffe0a1','#b8c9e2'],
   exit:['#debe91','#f9ebc0','#ccaca2']
  };
  const p=palettes[biome]||palettes.meadow;
  const bg=c.createLinearGradient(0,0,0,720);
  bg.addColorStop(0,p[0]);bg.addColorStop(.58,p[1]);bg.addColorStop(1,p[2]);
  c.fillStyle=bg;c.fillRect(0,0,1280,720);
  if(quiet||sky||biome==='finale'){
   for(let i=0;i<58;i++){
    const x=((i*157-d*.18)%1390+1390)%1390-40,y=30+(i*71)%310;
    c.fillStyle=(i%4===0?'#fff4bf':'#fffdf4')+(quiet?'aa':'91');
    c.beginPath();c.arc(x,y,1.5+(i%4)*.5,0,TAU);c.fill();
   }
  }
  if(dawn||biome==='finale'||biome==='exit'){
   const rad=c.createRadialGradient(1060,195,5,1060,195,270);
   rad.addColorStop(0,'#fff8cfec');rad.addColorStop(.35,'#ffe09d78');rad.addColorStop(1,'#ffe8a000');
   c.fillStyle=rad;c.fillRect(650,0,630,500);
   c.fillStyle='#fff8df';c.beginPath();c.arc(1060,195,42,0,TAU);c.fill();
  }
  // Multi-plane parallax responds to actual distance, not a fake camera.
  for(let layer=0;layer<3;layer++){
   const front=layer===2,offset=layer*100,base=front?488:275+layer*84;
   c.fillStyle=bridge?['#6f8e92','#809e92','#718f79'][layer]:
     rain?['#3a536a','#53777f','#678c81'][layer]:
     quiet?['#334b75','#58658a','#746b92'][layer]:
     sky?['#9bc0db','#bed8e5','#d9eaf1'][layer]:
     dawn?['#ce9988','#d6b58f','#d6d6a6'][layer]:
     ['#91b3a8','#a0c6a4','#b4d49d'][layer];
   c.beginPath();c.moveTo(0,720);c.lineTo(0,base);
   for(let x=0;x<=1340;x+=35)
    c.lineTo(x,base+Math.sin((x+d*(layer+1)*2+offset)/(196-layer*24))*((front?25:50)+layer*4));
   c.lineTo(1280,720);c.closePath();c.fill();
  }
  if(bridge||rain){
   // Suspension ropes and bridge supports silhouette the gorge.
   for(let i=0;i<7;i++){
    const x=((i*270-d*4.4)%1680+1680)%1680-200;
    c.strokeStyle=rain?'#8b9e9fc8':'#7a7f78bd';c.lineWidth=7;
    c.beginPath();c.moveTo(x,530);c.lineTo(x,320);c.stroke();
    c.strokeStyle=rain?'#b6cdd089':'#d9bd8b92';c.lineWidth=3;
    c.beginPath();c.moveTo(x-80,435);c.quadraticCurveTo(x,360,x+80,435);c.stroke();
   }
  }
  if(sky||biome==='finale'||biome==='exit'){
   for(let i=0;i<17;i++){
    const x=((i*205-d*4)%1660+1660)%1660-190,y=190+(i*83)%270;
    c.fillStyle=sky?'#ffffff72':'#fff3d87c';
    c.beginPath();c.ellipse(x,y,64+(i%3)*18,13+(i%4)*7,0,0,TAU);c.fill();
   }
  }
  for(let i=0;i<24;i++){
   const x=((i*133-d*(rain?5:9))%1440+1440)%1440-60,y=150+(i*89)%370;
   if(rain){c.strokeStyle='#edf5ffc2';c.lineWidth=i%3===0?2.5:1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x-17,y+36);c.stroke();}
   else if(quiet){c.fillStyle='#fff4d9cb';c.beginPath();c.arc(x,y,1.3+i%3,0,TAU);c.fill();}
   else if(!bridge&&!sky)flower(c,x,y,.44+(i%3)*.3,dawn?'#ffecd7':i%4?'#fffce1':'#f5c0a6');
  }
  // The director is a *distant* stage presence, never a hitbox or a fake
  // replacement for the playable armored character.
  const guide=gyuwonRunnerGuideAt(t,m.clock?.duration||180);
  if(guide){
   const x=guide.kind==='curtain'?1040:guide.kind==='moon'?1055:1110;
   const y=guide.kind==='moon'?455:guide.kind==='gate'?527:550;
   if(guide.kind==='moon'){c.fillStyle='#fff4db77';c.beginPath();c.arc(1055,260,85,0,TAU);c.fill();}
   drawGyuwonRunnerGuide(c,x,y,{scale:guide.kind==='moon'?.56:.73,t,opacity:guide.opacity,gesture:guide.kind==='gate'?'gate':'open'});
  }
  const sx=x=>640+x*(1280/44),ground=555,sy=y=>ground-y*52;
  for(const a of m.platforms){
   const x=sx(a.x),w=(a.end-a.x)*1280/44;
   if(w<=0)continue;
   const side=sky?'#dae0ee':rain?'#576979':quiet?'#5b5876':bridge?'#5c4f46':dawn?'#a98065':'#936a45';
   const top=sky?'#fff8eb':rain?'#809eaf':quiet?'#9095b4':bridge?'#b99875':dawn?'#f1cb8d':'#8cc960';
   round(c,x,ground,w,190,5,side,'#334458',3);
   round(c,x,ground,w,23,5,top,sky?'#aebfd3':'#4b594b',3);
   if(bridge||rain){c.strokeStyle='#d3c1a68b';c.lineWidth=3;
    for(let xx=x+12;xx<x+w;xx+=48){c.beginPath();c.moveTo(xx,ground+2);c.lineTo(xx+12,ground+24);c.stroke();}}
   else if(sky){c.fillStyle='#ffffff60';for(let i=0;i<w/57;i++){c.beginPath();c.arc(x+i*57+23,ground+14,17,0,TAU);c.fill();}}
   else{c.save();c.beginPath();c.rect(x,ground+1,w,20);c.clip();
    for(let xx=x+10;xx<x+w;xx+=31)flower(c,xx,ground+8,.24,dawn?'#f4e4ba':'#e5edb0');c.restore();}
  }
  for(const o of m.obstacles){
   const x=sx(o.x),lo=o.kind==='low',v=o.variant||'',wobble=Math.sin(t*4+x)*3;
   if(lo){
    // Draw only in the genuine overhead collision interval (1.5~3.6m).
    c.strokeStyle=rain?'#b7c9d9':bridge?'#bea789':'#6b6b51';c.lineWidth=10;
    c.beginPath();c.moveTo(x+10,sy(4));c.quadraticCurveTo(x-25+wobble,sy(3.0),x,sy(1.7));c.stroke();
    if(v==='rope'||v==='branch'||v==='curtain'||v==='cloud'){
     round(c,x-27,sy(3.1),54,69,12,v==='cloud'?'#f9f8e5':v==='curtain'?'#8f5970':'#627b69','#40505d',3);
    }else for(let k=0;k<3;k++)flower(c,x+14+k*9,sy(3.2)+k*22,.39,'#e9c87c');
   }else{
    // Ground hazards always remain visible where their *actual* hitbox is.
    c.strokeStyle='#465653';c.lineWidth=4;
    c.beginPath();c.moveTo(x,ground);c.lineTo(x,ground-72);c.stroke();
    if(v==='puddle'||v==='starfall'){
     c.fillStyle=v==='puddle'?'#a9d9ed':'#fff0b1';c.beginPath();c.ellipse(x,ground-27,28,32,0,0,TAU);c.fill();
     c.strokeStyle=v==='puddle'?'#537fa0':'#d1a44a';c.lineWidth=3;c.stroke();
    }else{
     c.fillStyle=v==='bramble'||v==='thorn'?'#8b6084':'#7aaa6c';
     c.beginPath();c.moveTo(x-22,ground);c.lineTo(x-16,ground-44);
     c.lineTo(x,ground-71);c.lineTo(x+16,ground-44);c.lineTo(x+24,ground);c.closePath();c.fill();
     c.strokeStyle='#47564d';c.stroke();
    }
   }
  }
  for(const j of m.jellies)jelly(c,sx(j.x),sy(j.y),j.kind,m.time);
  drawArmoredRunner(c,sx(g.player.x),sy(m.jumpY),{
   scale:1.03,t,pose:m.dashTime>0?'dash':m.slide>0?'slide':m.jumpY>.1?'jump':t<4?'walk':'run',
   weapon:g.weapon||'sword',inkAmount:scene.opening,energy:m.starCharge||0});
  if(m.dashTime>0){for(let i=0;i<10;i++)flower(c,sx(g.player.x)-20-i*25,sy(m.jumpY+1)+Math.sin(i*1.6+t*14)*17,.14,'#ffefa7');}
  else if(m.bonus>0){for(let i=0;i<7;i++)flower(c,sx(g.player.x)-35-i*18,sy(m.jumpY+1)+Math.sin(i+t*12)*20,.15,'#fff6b8');}
  // Act 5's real velvet proscenium visually folds into the first 2D road.
  if(scene.opening>.001){
   const q=scene.opening;
   c.fillStyle='rgba(74,28,43,'+(q*.97)+')';
   c.fillRect(0,0,100*q,720);c.fillRect(1280-100*q,0,100*q,720);
   c.strokeStyle='rgba(234,198,136,'+(q*.95)+')';c.lineWidth=12;
   c.beginPath();c.moveTo(100*q,0);c.lineTo(100*q,720);
   c.moveTo(1280-100*q,0);c.lineTo(1280-100*q,720);c.stroke();
   c.fillStyle='rgba(247,230,203,'+(q*.14)+')';c.fillRect(0,0,1280,720);
  }
  // A few paper flags, rather than a black cut, prefigure the seventh act.
  if(biome==='exit'){
   const q=scene.farewell;
   c.strokeStyle='#75614c';c.lineWidth=6;
   for(let i=0;i<7;i++){const x=680+i*86;
    c.beginPath();c.moveTo(x,550);c.lineTo(x,410-(i%2)*24);c.stroke();
    c.fillStyle=i%2?'#a45061':'#d9ba82';
    c.beginPath();c.moveTo(x,411-(i%2)*24);c.lineTo(x+38*q,425-(i%2)*24);c.lineTo(x,444-(i%2)*24);c.fill();}
   // Reveal the same paper kingdom seen in Act VII's first verse.
   c.save();c.globalAlpha=q;c.fillStyle='#c7a78d';
   c.beginPath();c.moveTo(910,530);c.lineTo(1060,417);c.lineTo(1280,505);c.lineTo(1280,565);c.fill();
   c.fillStyle='#f9e6cb';c.fillRect(1115,382,110,108);
   c.fillStyle='#ba777d';c.beginPath();c.moveTo(1095,382);c.lineTo(1170,324);c.lineTo(1245,382);c.fill();
   c.fillStyle='#647987';c.fillRect(1155,435,25,55);c.restore();
  }
  standardHeader(g,m,{dark:true,color:quiet?'#dae0ff':'#3e89a4'});
  round(c,25,89,327,42,17,'#fffbd6bb','#637c46');
  bar(c,83,101,250,17,m.energy,100,'#f18d66','#8d985b');
  label(c,'♥',49,111,28,'#db5d64','center');
  round(c,25,143,327,27,9,'#142c4099','#f5e0ab86',1);
  bar(c,31,150,315,13,m.starCharge||0,100,'#ffe9ac','#526779');
  label(c,'✦',44,151,19,'#fffce2');
  label(c,Math.floor(m.runnerDistance)+' m',1090,99,25,'#fff8dc','right',4);
  label(c,'● '+m.pickups,48,197,24,'#fff8dc','left',4);
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
  const scene=drawGyuwonArmyWorld(c,m),t=scene.time;
  const sx=x=>640+x*29,quiet=m.armyTruce;
  castle(sx(-18),false,m.baseHp,m.baseMaxHp);
  castle(sx(18),true,m.enemyBaseHp,m.enemyBaseMaxHp);
  if(m.enemyFort>=2){
   const x=sx(18),height=m.enemyFort===3?107:61;
   c.fillStyle=m.enemyFort===3?'#625876':'#79717a';
   c.fillRect(x-66,311-height,132,height);
   for(let i=0;i<5;i++)c.fillRect(x-75+i*32,296-height,22,24);
   c.strokeStyle=m.enemyFort===3?'#e8be94':'#c6b9a4';c.lineWidth=4;
   c.strokeRect(x-66,311-height,132,height);
   if(m.enemyBaseHp<=0){c.fillStyle='#392c2fbd';c.fillRect(x-68,275-height,136,height+34);}
  }
  // The ground, not a tutorial overlay, announces the chosen production line.
  const activeY=gyuwonArmyLaneY(m.deployLane||0);
  c.fillStyle='#e8f7d723';c.fillRect(35,activeY+10,1209,9);
  for(let i=0;i<8;i++){const x=105+i*149;
   c.fillStyle=(m.deployLane||0)===0?'#f8e8b8ad':'#cbf4e5ad';
   c.beginPath();c.arc(x,activeY+12,3+Math.sin(t*3+i)*.8,0,TAU);c.fill();}
  const sorted=[...m.units].sort((a,b)=>(a.lane??0)-(b.lane??0)||a.team-b.team||a.x-b.x);
  for(const u of sorted){
   const uy=gyuwonArmyLaneY(u.lane??0);
   paperUnit(c,sx(u.x),uy,{type:u.type,team:u.team,t:m.time+u.id,
    wind:u.wind,hp:u.hp,maxHp:u.maxHp,scale:u.type===5?1.48:1.02,portrait});
   if(u.kind==='supply'){
    c.fillStyle='#8e694b';c.fillRect(sx(u.x)-30,uy+6,62,13);
    for(const side of [-1,1]){c.fillStyle='#4c555a';c.beginPath();c.arc(sx(u.x)+side*20,uy+20,8,0,TAU);c.fill();}
   }
   if(quiet&&u.team>0){c.strokeStyle='#e8deb1a1';c.lineWidth=3;
    c.beginPath();c.moveTo(sx(u.x)-11,uy-43);c.lineTo(sx(u.x)+4,uy-55);c.stroke();}
  }
  if(m.cannonShot){const a=m.cannonShot;for(const lane of [0,1]){
   const y=gyuwonArmyLaneY(lane)-70;
   if(a.age<.65)burst(c,sx(-18),y,14+a.age*36,a.age,'#c6f9ff');
   else{c.strokeStyle='#bcfaff';c.lineWidth=8;c.beginPath();c.moveTo(sx(-18),y);
    c.lineTo(sx(Math.min(18,a.x)),y);c.stroke();burst(c,sx(Math.min(18,a.x)),y,27,a.age);}
  }}
  if(m.armySiegeFlash>0){c.fillStyle='#f6e4ba';c.globalAlpha=Math.min(.38,m.armySiegeFlash);
   c.fillRect(sx(18)-55,270,110,268);c.globalAlpha=1;}
  if(m.rallyPulse>0){const q=1-m.rallyPulse/2.4;
   c.strokeStyle='#ffe6aa';c.lineWidth=8*(1-q)+2;c.globalAlpha=.75*(1-q);
   c.beginPath();c.arc(sx(-18),440,60+380*q,Math.PI,Math.PI*2);c.stroke();c.globalAlpha=1;}
  if(scene.key==='arrival'){
   const q=scene.opening;
   c.fillStyle='rgba(249,225,180,'+(.29*q)+')';c.fillRect(0,0,1280,600);
   c.fillStyle='#d8ba8e';c.beginPath();c.moveTo(0,470);
   c.lineTo(280,390+18*(1-q));c.lineTo(500,475);c.closePath();c.fill();
  }
  standardHeader(g,m,{dark:!scene.quiet,color:scene.quiet?'#d7ddf8':'#126d83'});
  label(c,Math.floor(m.money)+' / '+m.moneyCap+' 원',1210,112,28,'#ffe29b','right',4);
  bar(c,1008,151,200,13,m.cannon,100,'#c9eaff');
  label(c,'LEVEL '+m.workerLevel,36,606,18,'#fff8d8','left',4);
  label(c,(m.deployLane||0)===0?'▲':'▼',135,606,24,'#fff1c3','center',4);
 }
 function dance(g,m){
  c.fillStyle='#151437';c.fillRect(0,0,1280,720);
  const glow=c.createRadialGradient(640,230,50,640,230,650);glow.addColorStop(0,'#665698');glow.addColorStop(1,'#17142e');c.fillStyle=glow;c.fillRect(0,0,1280,590);
  for(let side of [-1,1]){const x=640+side*550;for(let i=0;i<6;i++){c.fillStyle=i%2?'#412750':'#5c3865';c.beginPath();c.moveTo(x+side*i*23,0);c.bezierCurveTo(x+side*(i*21-15),200,x+side*(i*24+20),400,x+side*i*18,620);c.lineTo(x+side*(i+1)*21,620);c.lineTo(x+side*(i+1)*22,0);c.fill();}}
  c.fillStyle='#c5a579';c.beginPath();c.moveTo(180,510);c.lineTo(1100,510);c.lineTo(1280,720);c.lineTo(0,720);c.fill();
  c.strokeStyle='#6b4b55';c.lineWidth=3;for(let i=0;i<16;i++){c.beginPath();c.moveTo(640+(i-8)*42,510);c.lineTo((i-2)*110,720);c.stroke();}
  const pat=m.danceCurrent,beat=m.dancePeriod,at=pat?pat.first:0,beatNumber=Math.floor((m.time-at)/beat),inWindow=pat&&m.time>=at-beat&&m.time<at+(pat.count-1)*pat.spacing*beat+.5;
  const performance=m.masterScene?.kind||'pose';
  const response=m.judgementUntil>m.time&&m.judgement==='PERFECT';
  if(performance==='bridge'){c.fillStyle='#11153188';c.fillRect(0,0,1280,570);}
  if(performance==='encore'||performance==='bow'){
   for(let i=0;i<44;i++){
    const x=(i*197+m.time*15)%1290,y=(i*91+Math.sin(m.time+i)*25)%515;
    c.fillStyle=i%2?'#ead4a2':'#bca6de';c.globalAlpha=.24+Math.sin(m.time*2+i)*.11;
    c.beginPath();c.arc(x,y,3+(i%4),0,TAU);c.fill();
   }c.globalAlpha=1;
  }
  for(let i=0;i<5;i++){const angle=i*.42-1.1,x=640+Math.sin(angle)*430;c.fillStyle=['#e6c98528','#ad94e128','#78b6e128'][i%3];c.beginPath();c.moveTo(x,10);c.lineTo(x-130,560);c.lineTo(x+160,560);c.closePath();c.fill();}
  for(let i=0;i<4;i++){
   const x=350+i*190,player=i===2,pose=inWindow?(pat.kind==='pose'?'dance':pat.kind==='quick'?'quick':'turn'):'idle';
   const offset=player?0:i%2?.11:-.11,scale=player?1.53:1.4;
   if(response){c.fillStyle='#f2dc9855';c.beginPath();c.ellipse(x,515,54+15*Math.sin(m.time*13+i),12,0,0,TAU);c.fill();}
   const face=inWindow&&pat.kind!=='pose'?(beatNumber%2?-1:1):1;
   if(player){c.fillStyle='#b4dbef33';c.beginPath();c.ellipse(x,544,68,16,0,0,TAU);c.fill();}
   stagePerson(c,x,535,{scale,t:m.time+offset,pose:player?(m.dancePose>0?pose:'idle'):pose,face:player?m.danceFacing:face,color:player?'#cad6eb':'#292739',gyuwon:false,miss:player&&m.danceError>0});
   if(player){label(c,'★',x,322,24,'#ffe890','center');if(m.danceError>0){burst(c,x+64,390,24,m.time,'#faaca0');}}
  }
  stagePerson(c,638,633,{scale:1.65,t:m.time,pose:performance==='bridge'?'idle':'dance',color:'#9b70ac',gyuwon:true,portrait,miss:m.danceError>0&&performance==='bridge'});
  if(response)for(let i=0;i<12;i++){const a=i*TAU/12+m.time*.5,x=640+Math.cos(a)*175,y=460+Math.sin(a)*67;flower(c,x,y,.24+(m.combo%5)*.07,'#f8edb7');}
  c.strokeStyle='#dde2e2';c.lineWidth=8;c.beginPath();c.moveTo(681,495);c.lineTo(681,635);c.stroke();c.fillStyle='#b8c2d2';c.beginPath();c.ellipse(681,488,12,19,-.35,0,TAU);c.fill();
  if(pat&&m.danceCue&&m.time>=pat.cue&&m.time<pat.first){
   // Leaders prepare the action through their halos, not a text prompt box.
   const cue=Math.max(0,Math.min(1,(m.time-pat.cue)/Math.max(.01,pat.first-pat.cue)));
   c.strokeStyle='#f6e0af';c.lineWidth=3+3*cue;
   for(let k=0;k<4;k++){const x=350+k*190;c.beginPath();c.arc(x,332,19+cue*9,.1,Math.PI*1.9);c.stroke();}
  }
  if(m.judgementUntil>m.time){label(c,m.judgement,1010,284,35,m.judgement==='PERFECT'?'#ffe8a6':'#b8f8eb','center',4);}
  standardHeader(g,m,{color:'#e9c9ed'});
 }
 function fighter(g,m){
  c.fillStyle=['#3c6170','#53536a','#593f62'][Math.min(2,Math.max(0,m.fightRound-1))];c.fillRect(0,0,1280,720);
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
   stagePerson(c,sx(f.x),580-f.y*45,{scale:1.65,t:m.time,pose,face:f.facing,color:i?'#9d7f8f':'#638ba8',gyuwon:!!i,portrait,reach:a?Math.min(120,a.range*33/1.65):76});
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
  if(m.fightReset>0){label(c,a.hp<=0?'DOWN':'K.O.',640,325,94,'#f3d99e','center',9);
   for(let i=0;i<22;i++)flower(c,280+(i*53)%720,260+(i*31)%160,.17,'#ffd99f');
  }
  if(m.masterScene?.kind==='breather'){
   c.fillStyle='#dcd3de24';c.fillRect(0,138,1280,380);
   for(let i=0;i<7;i++){c.strokeStyle='#f3d9ae';c.lineWidth=2;c.beginPath();
    c.arc(640+i*30-90,270+Math.sin(m.time*.5+i)*8,16,Math.PI*.4,Math.PI*1.4);c.stroke();}
  }
 }
 function shooter(g,m){
  c.imageSmoothingEnabled=false;const sky=m.actProgress>.74?'#121a3c':m.actProgress>.45?'#2b4263':'#4f646a';c.fillStyle=sky;c.fillRect(0,0,540,900);
   if(m.actProgress>.45){for(let i=0;i<75;i++){const x=(i*97)%540,y=(i*131+m.scroll*(i%3+2))%900;c.fillStyle=i%5===0?'#fbe8b8':'#dde9ff88';c.fillRect(x,y,i%7===0?3:2,i%7===0?3:2);}}
  if(m.actProgress<.45){
   const offset=(m.scroll*15)%150;
   for(let row=-1;row<8;row++)for(let col=0;col<5;col++){
    const x=col*128-36,y=row*150+offset;
    c.fillStyle=(row+col)%2?'#536771':'#5d7076';c.fillRect(x+3,y+3,123,145);
    c.strokeStyle='#364c58';c.lineWidth=4;c.strokeRect(x+4,y+4,122,144);
    if((col+row)%3===0){c.fillStyle='#334951';c.fillRect(x+15,y+15,43,34);
     c.fillStyle='#8b9995';c.fillRect(x+15,y+15,43,6);}
   }
   c.strokeStyle='#adada080';c.lineWidth=7;c.beginPath();
   c.moveTo(55,900);c.lineTo(55,120);c.moveTo(485,900);c.lineTo(485,120);c.stroke();
  }else{
   // Leave the city. The visual background never interferes with live bullets.
   const nebula=c.createRadialGradient(285,340,40,270,390,370);
   nebula.addColorStop(0,m.victoryFlight?'#7b617a':'#5d53804d');
   nebula.addColorStop(1,'#151b4500');c.fillStyle=nebula;c.fillRect(0,0,540,900);
   for(let i=0;i<86;i++){
    const x=(i*149+Math.sin(i*7)*60+540)%540,y=(i*103+m.scroll*(.6+i%3))%900;
    const r=i%13===0?3:i%3===0?2:1.3;
    c.fillStyle=i%5===0?'#fff1b3':'#bfdaff';c.globalAlpha=.45+.45*Math.sin(m.time*.9+i)**2;
    c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
   }
   c.globalAlpha=1;c.strokeStyle=m.victoryFlight?'#ffdfae88':'#92a1d044';
   c.lineWidth=3;for(let i=0;i<4;i++){
    const yy=(i*260+m.scroll*8)%1150-100;
    c.beginPath();c.ellipse(270,yy,260,68,.08,0,TAU);c.stroke();
   }
   if(m.victoryFlight)for(let i=0;i<12;i++){
    const x=(i*49+m.time*38)%540,y=(i*127+m.scroll*7)%890;
    c.strokeStyle='#f6d89d';c.lineWidth=2;c.beginPath();c.moveTo(x-5,y+17);c.lineTo(x+4,y-18);c.stroke();
   }
  }
  const sx=x=>270+x*20,sy=z=>120+(z+22)/44*760;
  for(const e of m.shooterTargets){
   tank(c,sx(e.x),sy(e.z),{enemy:true,large:e.kind==='carrier',t:m.time,flash:e.wind<.7?(.7-e.wind)*.55:0});
   if(e.wind<1.13&&e.lockedAim!=null){
    const x=sx(e.x),y=sy(e.z)+21,a=e.lockedAim;
    c.save();c.setLineDash([10,9]);c.strokeStyle='#ffcf7299';c.lineWidth=3;
    c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(a)*145,y+Math.cos(a)*145);c.stroke();c.restore();
    c.fillStyle='#ffe282';c.beginPath();c.arc(x,y,4+(1.13-e.wind)*8,0,TAU);c.fill();
   }
   if(e.kind==='carrier'&&e.phase===7){
    c.strokeStyle='#e3c0e4';c.lineWidth=7;c.beginPath();
    c.ellipse(sx(e.x),sy(e.z),58+Math.sin(m.time*2)*5,45,0,0,TAU);c.stroke();
    for(const wing of [-1,1]){
     c.fillStyle='#6c456c';c.beginPath();c.moveTo(sx(e.x)+wing*26,sy(e.z)-30);
     c.lineTo(sx(e.x)+wing*92,sy(e.z)-52);c.lineTo(sx(e.x)+wing*72,sy(e.z)+24);
     c.lineTo(sx(e.x)+wing*25,sy(e.z)+12);c.closePath();c.fill();
    }
   }
   bar(c,sx(e.x)-40,sy(e.z)-68,80,5,e.hp,e.maxHp,'#edbc72');
  }
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
  const m=g?.gyuwon?.years?.musical,active=usesReference2d(m)&&g.status!=='won';canvas.hidden=!active;state.g=g;state.active=active;
  // Hold the composited final 3D theater shot underneath the 2D canvas. Its
  // last visible frame dissolves into the painted road without a black cut.
  canvas.style.opacity=active&&m.year===6?String(clamp((m.time-.15)/5.8,0,1)):'1';
  if(!active)return false;
  const started=performance.now(),rect=shell.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height)),ratio=Math.min(1.5,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
  const vw=m.year===10?540:1280,vh=m.year===10?900:720,scale=Math.min(w/vw,h/vh),left=(w-vw*scale)/2,top=(h-vh*scale)/2;
  Object.assign(state,{width:vw,height:vh,scale,left,top});c.setTransform(ratio,0,0,ratio,0,0);c.fillStyle='#080d16';c.fillRect(0,0,w,h);c.translate(left,top);c.scale(scale,scale);c.save();c.beginPath();c.rect(0,0,vw,vh);c.clip();
  if(m.year===6)runner(g,m);else if(m.year===7)army(g,m);else if(m.year===8)dance(g,m);else if(m.year===9)fighter(g,m);else if(m.year===10)shooter(g,m);c.restore();
  report.drawMs=performance.now()-started;report.width=w;report.height=h;report.sprites=(m.units?.length||0)+(m.bullets?.length||0)+(m.enemyShots?.length||0)+(m.jellies?.length||0)+2;return true;
 }
 return {canvas,render,clearInput:release,stats:()=>({...report}),dispose(){release();portrait.removeAttribute('src');canvas.remove();}};
}
