import {gyuwonDisplayYear} from './gyuwon-musical-route.mjs';
import {GYUWON_FACE_URL} from './gyuwon-photo-face.mjs';
import {usesReference2d} from './gyuwon-reference-rules.mjs';
import {label,round,bar,flower,jelly,stagePerson,paperUnit,tank,burst} from './gyuwon-2d-art.mjs';
import {drawArmoredRunner,drawGyuwonRunnerGuide} from './gyuwon-runner-art.mjs';
import {gyuwonRunnerScene,gyuwonRunnerBridgeAt,gyuwonRunnerGuideAt,gyuwonRunnerAccent,gyuwonRunnerLyricStage} from './gyuwon-runner-director.mjs';
import {drawGyuwonArmyWorld,gyuwonArmyLaneY} from './gyuwon-army-director.mjs';
import {createGyuwonArmyDoodle} from './gyuwon-army-doodle.mjs';
import {drawGyuwonDanceWorld} from './gyuwon-dance-director.mjs';
import {drawGyuwonFightWorld} from './gyuwon-fight-art.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const TAU=Math.PI*2;
export function createGyuwon2dView(doc,shell,{onPointer=()=>{},focus=()=>{}}={}){
 const canvas=doc.createElement('canvas');canvas.className='gy-reference-canvas';canvas.setAttribute('aria-label','최규원 2D 미니게임');canvas.tabIndex=0;canvas.hidden=true;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:12;touch-action:none;background:#080c12';shell.appendChild(canvas);
 const portrait=doc.createElement('img');portrait.src=GYUWON_FACE_URL;portrait.decoding='async';
 const lastRunnerFrame=doc.createElement('canvas');const lastRunner2d=lastRunnerFrame.getContext('2d');
 const lastDanceFrame=doc.createElement('canvas');const lastDance2d=lastDanceFrame.getContext('2d');
 const armyDoodle=createGyuwonArmyDoodle(doc,{reducedMotion:!!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches});
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
  label(c,gyuwonDisplayYear(m.year)+'수',43,45,21,color);label(c,Math.round(m.score).toLocaleString(),325,45,31,fg,'right',dark?0:3);
  // The central top belongs to the seven-act theater progress ribbon.
  bar(c,960,28,290,12,g.boss.hp,g.boss.maxHp,'#ba394e',dark?'#6c755b':'#23151c');
  label(c,Math.round(g.boss.hp)+' / '+g.boss.maxHp,1095,60,17,fg,'center',dark?0:2);
  label(c,'COMBO '+m.combo,913,59,15,fg,'right',dark?0:2);
 }
 function runner(g,m){
  const scene=m.runnerScene||gyuwonRunnerScene(m.time,m.clock?.duration||180),biome=scene.biome,
    accent=gyuwonRunnerAccent(scene.time),lyric=m.runnerLyric||gyuwonRunnerLyricStage(scene.time),d=m.runnerDistance||0,t=m.time,
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
  // These are literal staged reactions to the time-aligned original lyrics:
  // not just background palette swaps. Leave safety-critical hitboxes crisp.
  if(lyric?.weight>.01){
   const w=lyric.weight;
   c.save();c.globalAlpha=w;
   if(lyric.kind==='sunlight'||lyric.kind==='tomorrow'){
    c.fillStyle='#fff5b743';
    for(let i=0;i<8;i++){const x=720+i*90;
     c.beginPath();c.moveTo(1060,110);c.lineTo(x-32,470);c.lineTo(x+23,470);c.fill();}
   }
   if(lyric.kind==='mountains'){
    c.fillStyle='#c8d7bd9c';
    c.beginPath();c.moveTo(300,475);
    for(let i=0;i<7;i++){const x=400+i*130;
     c.lineTo(x,420);c.lineTo(x+70,250+(i%3)*38);c.lineTo(x+140,430);}
    c.lineTo(1280,490);c.closePath();c.fill();
   }
   if(lyric.kind==='sea'){
    c.fillStyle='#77b5d6a9';c.beginPath();c.moveTo(0,490);
    for(let x=0;x<=1300;x+=16)c.lineTo(x,435+Math.sin(x*.017+t*2.2)*17);
    c.lineTo(1280,565);c.lineTo(0,565);c.closePath();c.fill();
    for(let i=0;i<5;i++){const x=90+i*275;
     c.strokeStyle='#fff5e8a9';c.lineWidth=3;c.beginPath();
     c.arc(x,469+Math.sin(i+t)*9,28,0,Math.PI);c.stroke();}
   }
   if(lyric.kind==='curtains'){
    c.fillStyle='#8b4568a4';
    for(let i=0;i<2;i++){const side=i===0?0:1,x=side?1180:0;
     c.beginPath();c.moveTo(x,0);c.lineTo(x+(side?-90:90),0);
     c.quadraticCurveTo(x+(side?-60:60),170,x+(side?-100:100),360);
     c.lineTo(x,380);c.closePath();c.fill();}
   }
   if(lyric.kind==='questions'||lyric.kind==='dream'||lyric.kind==='world'){
    for(let i=0;i<9;i++){const x=((i*181-t*11)%1420+1420)%1420-50;
     const y=135+(i*47)%260;
     c.save();c.translate(x,y);c.rotate(Math.sin(t+i)*.15);
     round(c,-15,-20,30,40,2,'#fff2d3bb','#ab8972ba',1.3);
     c.restore();}
   }
   if(lyric.kind==='star'){
    const gx=990,gy=185,r=30+8*Math.sin(t*5);
    c.strokeStyle='#fff5b9';c.lineWidth=4;
    for(let i=0;i<8;i++){const a=i*TAU/8;
     c.beginPath();c.moveTo(gx+Math.cos(a)*r,gy+Math.sin(a)*r);
     c.lineTo(gx+Math.cos(a)*(r+30),gy+Math.sin(a)*(r+30));c.stroke();}
    c.fillStyle='#fff4c5';c.beginPath();c.arc(gx,gy,17,0,TAU);c.fill();
   }
   c.restore();
  }
  const sx=x=>640+x*(1280/44),ground=555,sy=y=>ground-y*52;
  // The director is a *distant* stage presence, never a hitbox or a fake
  // replacement for the playable armored character.
  const guide=gyuwonRunnerGuideAt(t,m.clock?.duration||180,m);
  if(guide){
   const risk=m.obstacles.find(o=>o.id===guide.targetId);
   const x=guide.kind==='curtain'?1040:guide.kind==='moon'?1055:
    guide.kind==='catch'?sx(g.player.x)+105:
    guide.kind==='warn'&&risk?clamp(sx(risk.x)+130,780,1170):
    guide.kind==='run'?sx(g.player.x)+155:1110;
   const y=guide.kind==='moon'?455:guide.kind==='gate'?527:550;
   if(guide.kind==='moon'){c.fillStyle='#fff4db77';c.beginPath();c.arc(1055,260,85,0,TAU);c.fill();}
   if(guide.kind==='warn'&&risk){
    const toX=sx(risk.x),toY=sy(risk.kind==='low'?2.9:.95);
    c.save();c.strokeStyle='#ffe5a3b9';c.lineWidth=3;c.setLineDash([7,9]);
    c.beginPath();c.moveTo(x+35,y-95);c.quadraticCurveTo(x+26,toY-60,toX,toY);c.stroke();
    c.setLineDash([]);c.restore();
   }
   drawGyuwonRunnerGuide(c,x,y,{scale:guide.kind==='moon'?.56:.73,t,
    opacity:guide.opacity,gesture:guide.gesture||guide.kind,portrait});
  }
  for(const a of m.platforms){
   const x=sx(a.x),w=(a.end-a.x)*1280/44;
   if(w<=0)continue;
   const side=a.guide?'#98806e':sky?'#dae0ee':rain?'#576979':quiet?'#5b5876':bridge?'#5c4f46':dawn?'#a98065':'#936a45';
   const top=a.guide?'#fff1b6':sky?'#fff8eb':rain?'#809eaf':quiet?'#9095b4':bridge?'#b99875':dawn?'#f1cb8d':'#8cc960';
   round(c,x,ground,w,190,5,side,'#334458',3);
   round(c,x,ground,w,23,5,top,sky?'#aebfd3':'#4b594b',3);
   if(a.guide){
    c.strokeStyle='#fff5c8';c.lineWidth=3;
    c.beginPath();c.moveTo(x+5,ground-9);c.lineTo(x+w-5,ground-9);c.stroke();
    for(let k=0;k<Math.ceil(w/32);k++)flower(c,x+12+k*32,ground-9+Math.sin(t*8+k)*6,.19,'#fff3bd');
   }
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
    c.beginPath();c.moveTo(x,ground);c.lineTo(x,ground-52*(o.height||1.3));c.stroke();
    if(v==='puddle'||v==='starfall'){
     c.fillStyle=v==='puddle'?'#a9d9ed':'#fff0b1';c.beginPath();c.ellipse(x,ground-27,28,32,0,0,TAU);c.fill();
     c.strokeStyle=v==='puddle'?'#537fa0':'#d1a44a';c.lineWidth=3;c.stroke();
    }else{
     c.fillStyle=v==='bramble'||v==='thorn'?'#8b6084':'#7aaa6c';
     const spike=52*(o.height||1.3);
     c.beginPath();c.moveTo(x-22,ground);c.lineTo(x-16,ground-spike*.64);
     c.lineTo(x,ground-spike);c.lineTo(x+16,ground-spike*.64);c.lineTo(x+24,ground);c.closePath();c.fill();
     c.strokeStyle='#47564d';c.stroke();
    }
   }
  }
  // A glowing *object* attached to the actual dangerous collider, never a
  // false rectangular safe-zone overlay. Plenty of notice before contact.
  for(const o of m.obstacles){
   if(o.hit||o.x<=g.player.x||o.x-g.player.x>21)continue;
   const near=1-(o.x-g.player.x)/21,
    x=sx(o.x),y=sy(o.kind==='low'?2.55:(o.height||1.3)*.55);
   c.save();c.globalAlpha=.20+near*.65;c.strokeStyle='#ffe2a0';
   c.lineWidth=2+near*2;c.beginPath();c.arc(x,y,21+6*Math.sin(t*7),0,TAU);c.stroke();
   for(let i=0;i<4;i++){const a=i*TAU/4+t*.3;
    c.beginPath();c.arc(x+Math.cos(a)*33,y+Math.sin(a)*33,3,0,TAU);c.stroke();}
   c.restore();
  }
  for(const j of m.jellies)jelly(c,sx(j.x),sy(j.y),j.kind,m.time);
  drawArmoredRunner(c,sx(g.player.x),sy(m.jumpY),{
   scale:.68,t,pose:m.runnerPose==='run'&&t<4?'walk':m.runnerPose||'run',
   weapon:g.weapon||'sword',inkAmount:scene.opening,energy:m.starCharge||0,
   slideAmount:m.slideVisual||0,landTime:m.landTime||0,jumpVelocity:m.jumpV||0});
  if(m.bonus>0){for(let i=0;i<7;i++)flower(c,sx(g.player.x)-35-i*18,sy(m.jumpY+1)+Math.sin(i+t*12)*20,.15,'#fff6b8');}
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
  if(m.armyParade){
   // Same marchers become dancers rather than disappearing at an act cut.
   for(let i=0;i<(m.armyFinale?.count||4);i++){
    const x=260+i*160;
    c.fillStyle='#fff0cf45';c.beginPath();c.ellipse(x,549,44,10,0,0,TAU);c.fill();
    paperUnit(c,x,538,{type:m.armyFinale?.kinds?.[i]??i%6,team:1,t:m.time+i,
     wind:0,hp:100,maxHp:100,scale:1.14,portrait});
   }
  }
  if(scene.key==='arrival'){
   const q=scene.opening;
   c.fillStyle='rgba(249,225,180,'+(.29*q)+')';c.fillRect(0,0,1280,600);
   c.fillStyle='#d8ba8e';c.beginPath();c.moveTo(0,470);
   c.lineTo(280,390+18*(1-q));c.lineTo(500,475);c.closePath();c.fill();
  }
  // World + soldiers share Act V's living pencil contour / paper wash.
  // Drawing this before the header keeps UI numbers, bars and buttons sharp.
  armyDoodle.draw(canvas,c,{time:m.time,left:state.left,top:state.top,
   scale:state.scale,ratio:state.ratio||1,quiet:scene.quiet});
  standardHeader(g,m,{dark:!scene.quiet,color:scene.quiet?'#d7ddf8':'#126d83'});
  label(c,Math.floor(m.money)+' / '+m.moneyCap+' 원',1210,112,28,'#ffe29b','right',4);
  bar(c,1008,151,200,13,m.cannon,100,'#c9eaff');
  label(c,'LEVEL '+m.workerLevel,36,606,18,'#fff8d8','left',4);
  label(c,(m.deployLane||0)===0?'▲':'▼',135,606,24,'#fff1c3','center',4);
 }
 function dance(g,m){
  drawGyuwonDanceWorld(c,m,{stagePerson,paperUnit,portrait});
  // Only genuine accuracy feedback, not on-screen attack instructions.
  if(m.judgementUntil>m.time)
   label(c,m.judgement,1090,260,33,m.judgement==='PERFECT'?'#ffe8aa':'#b8f8eb','center',4);
  standardHeader(g,m,{color:m.danceScene?.quiet?'#d8e0ff':'#f6d5f2'});
 }
 function fighter(g,m){drawGyuwonFightWorld(c,g,m,{portrait});}
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
 let pixelFactor=1,slowFrames=0,fastFrames=0;
 function render(g){
  const m=g?.gyuwon?.years?.musical,active=usesReference2d(m)&&g.status!=='won';canvas.hidden=!active;state.g=g;state.active=active;
  // Hold the composited final 3D theater shot underneath the 2D canvas. Its
  // last visible frame dissolves into the painted road without a black cut.
  canvas.style.opacity=active&&m.year===6&&m.handoffFromFive?String(gyuwonRunnerBridgeAt(m.time).paint):'1';
  if(!active)return false;
  const started=performance.now(),w=Math.max(1,Math.round(shell.clientWidth)),h=Math.max(1,Math.round(shell.clientHeight)),cap=Math.min(1.2,globalThis.devicePixelRatio||1,Math.sqrt(1500000/(w*h))),ratio=Math.max(.6,cap*pixelFactor);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
  const vw=m.year===10?540:1280,vh=m.year===10?900:720,scale=Math.min(w/vw,h/vh),left=(w-vw*scale)/2,top=(h-vh*scale)/2;
  Object.assign(state,{width:vw,height:vh,scale,left,top,ratio});c.setTransform(ratio,0,0,ratio,0,0);c.fillStyle='#080d16';c.fillRect(0,0,w,h);c.translate(left,top);c.scale(scale,scale);c.save();c.beginPath();c.rect(0,0,vw,vh);c.clip();
  if(m.year===6)runner(g,m);else if(m.year===7)army(g,m);else if(m.year===8)dance(g,m);else if(m.year===9)fighter(g,m);else if(m.year===10)shooter(g,m);c.restore();
   // Preserve the final VI frame in an offscreen surface. The same painted
   // hill and banners dissolve into VII instead of a black genre cut.
   if(m.year===8&&m.time>=172&&lastDance2d){
     if(lastDanceFrame.width!==canvas.width||lastDanceFrame.height!==canvas.height){
      lastDanceFrame.width=canvas.width;lastDanceFrame.height=canvas.height;
     }
     lastDance2d.clearRect(0,0,lastDanceFrame.width,lastDanceFrame.height);
     lastDance2d.drawImage(canvas,0,0);
    }else if(m.year===9&&m.fromYear===8&&m.time<5.9&&lastDanceFrame.width>0){
     const q=clamp(m.time/5.9,0,1);
     c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=(1-q)*.88;
     c.drawImage(lastDanceFrame,0,0,canvas.width,canvas.height);c.restore();
    }
    if(m.year===6&&m.runnerScene?.biome==='exit'&&lastRunner2d){
    if(lastRunnerFrame.width!==canvas.width||lastRunnerFrame.height!==canvas.height){
     lastRunnerFrame.width=canvas.width;lastRunnerFrame.height=canvas.height;
    }
    lastRunner2d.clearRect(0,0,lastRunnerFrame.width,lastRunnerFrame.height);
    lastRunner2d.drawImage(canvas,0,0);
   }else if(m.year===8&&m.fromYear===6&&m.time<4.5&&lastRunnerFrame.width>0){
    c.save();c.setTransform(1,0,0,1,0,0);
    c.globalAlpha=1-clamp(m.time/4.5,0,1);
    c.drawImage(lastRunnerFrame,0,0,canvas.width,canvas.height);c.restore();
   }
  report.ink=m.year===7?armyDoodle.stats():null;report.drawMs=performance.now()-started;report.pixelRatio=ratio;report.width=w;
  if(report.drawMs>17){slowFrames++;fastFrames=0;}else if(report.drawMs<8){fastFrames++;slowFrames=Math.max(0,slowFrames-1);}else{slowFrames=Math.max(0,slowFrames-1);fastFrames=0;}
  if(slowFrames>=30){pixelFactor=Math.max(.65,pixelFactor-.1);slowFrames=0;}
  if(fastFrames>=240){pixelFactor=Math.min(1,pixelFactor+.08);fastFrames=0;}report.height=h;report.sprites=(m.units?.length||0)+(m.bullets?.length||0)+(m.enemyShots?.length||0)+(m.jellies?.length||0)+2;return true;
 }
 return {canvas,render,clearInput:release,stats:()=>({...report}),dispose(){release();portrait.removeAttribute('src');armyDoodle.dispose();canvas.remove();}};
}
