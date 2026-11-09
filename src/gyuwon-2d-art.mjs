import {drawGyuwonPhoto} from './gyuwon-photo-face.mjs';
const TAU=Math.PI*2;
const ellipse=(c,x,y,rx,ry,fill,stroke='#19202b',line=3)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=line;c.strokeStyle=stroke;c.stroke();}};
const line=(c,points,color,width)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();};
const path=(c,points,fill,stroke='#1a2130',width=3)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}};
export function label(c,text,x,y,size=24,color='#fff',align='left',outline=0){c.font=`800 ${size}px system-ui, sans-serif`;c.textAlign=align;c.textBaseline='middle';if(outline){c.strokeStyle='#111926';c.lineWidth=outline;c.strokeText(String(text),x,y);}c.fillStyle=color;c.fillText(String(text),x,y);}
export function round(c,x,y,w,h,r,fill,stroke=null,width=2){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
export function bar(c,x,y,w,h,value,max,color,back='#132130'){round(c,x,y,w,h,h/2,back);if(value>0)round(c,x,y,w*Math.max(0,Math.min(1,value/max)),h,h/2,color);}
export function flower(c,x,y,s=1,color='#fff8cf'){c.save();c.translate(x,y);c.scale(s,s);for(let i=0;i<5;i++){c.save();c.rotate(i*TAU/5);ellipse(c,0,-13,7,13,color,null);c.restore();}ellipse(c,0,0,5,5,'#e8b54a',null);c.restore();}
export function jelly(c,x,y,kind='jelly',time=0){c.save();c.translate(x,y);c.rotate(Math.sin(time*3+x)*.18);if(kind==='heart'){c.beginPath();c.moveTo(0,14);c.bezierCurveTo(-32,-4,-10,-28,0,-12);c.bezierCurveTo(10,-28,32,-4,0,14);c.fillStyle='#ff676d';c.fill();c.strokeStyle='#a63340';c.lineWidth=3;c.stroke();}else{ellipse(c,0,0,kind==='gold'?12:9,kind==='gold'?12:15,kind==='gold'?'#ffdf5b':'#43c5ee',kind==='gold'?'#a57923':'#165d86',3);ellipse(c,-3,-5,3,5,'#c6f9ff',null);}c.restore();}
// Original articulated 2D stage characters. The same action windup and contact
// phase that drive gameplay place hands, feet, guard and hit reactions here.
export function stagePerson(c,x,y,{scale=1,face=1,t=0,pose='idle',phase=0,gyuwon=false,portrait=null,color='#3b91b1',ink=false,miss=false,reach=76,theater=false,choreography=null}={}){
 c.save();c.translate(x,y);c.scale(scale*face,scale);const outline=ink?'#111315':'#1d2333',coat=ink?'#f6f5e9':color,skin=ink?'#fffaf0':gyuwon?'#e6c0a0':'#edd0ac';
 const run=pose==='run',slide=pose==='slide',crouch=pose==='crouch',jump=pose==='jump',dance=pose==='dance'||pose==='turn'||pose==='quick';
 const pulse=Math.sin(t*11),preparation=choreography?
  Math.max(0,Math.min(1,choreography.lead||0)):0;
 const turning=theater&&pose==='turn';
 const lift=run?Math.max(0,pulse)*10:dance?
  (theater?1.2+3.3*preparation:Math.abs(Math.sin(t*5))*5):0;
 const down=slide?67:crouch?35:miss?12:0,lean=run?.23:slide?1.1:pose==='strike'?.16:pose==='wind'?-.16:0;
 ellipse(c,0,1,32,6,'#00000035',null);
 c.translate(0,down-lift);
 // A small anticipatory weight shift precedes the turn; no pose teleport.
 c.rotate(lean+(theater&&choreography?(turning?-.12+.21*preparation:
   Math.sin(t*1.8)*.035*preparation):0));
 const hipsY=-55+(crouch?10:0),shoulder=-96+(crouch?16:0),headY=-119+(crouch?20:0);
 const legSwing=run?Math.sin(t*13)*24:dance?
  (theater?(turning?3+preparation*8:Math.sin(t*8)*4+preparation*7):Math.sin(t*8)*10):0;
 for(const side of [-1,1]){const hip=side*10,kneeX=hip+(slide?side*30:legSwing*side*.7),kneeY=hipsY/2+(slide?4:-2),footX=side*16+legSwing*side,footY=-down+lift+(jump?side*6:0);
  line(c,[[hip,hipsY],[kneeX,kneeY],[footX,footY-7]],outline,17);line(c,[[hip,hipsY],[kneeX,kneeY],[footX,footY-7]],ink?'#e4e4d8':'#202a40',11);round(c,footX-7,footY-10,24,12,4,ink?'#fff':'#15202e',outline,2);
 }
 if(theater){
  // Act VIII only: separate jacket tails lag behind the hip and the turn.
  const drag=Math.sin(t*2.8)*6+(turning?preparation*15:preparation*5);
  path(c,[[-22,hipsY-6],[-8,hipsY],[-13+drag,1],[-33+drag*.6,-4],
    [-31,hipsY+1]],gyuwon?'#7a568e':'#687489',outline,2);
  path(c,[[7,hipsY-6],[22,hipsY-6],[34+drag,1],[15+drag*.5,-5],
    [9,hipsY+3]],gyuwon?'#ac83b7':'#a2b1c5',outline,2);
  line(c,[[-22,hipsY],[0,hipsY+5],[23,hipsY]],'#e6ca9a',2);
 }
 path(c,[[-21,shoulder+3],[19,shoulder],[24,hipsY-3],[8,hipsY+6],[-26,hipsY+1]],coat,outline,3);
 path(c,[[-8,shoulder+3],[8,shoulder+3],[2,hipsY-7]],ink?'#fff':'#e9e8db',outline,1);
 if(!ink){path(c,[[-1,shoulder+13],[5,shoulder+18],[3,hipsY-12],[-3,hipsY-17]],gyuwon?'#7863bc':'#d9ae68',null);for(let i=0;i<3;i++)ellipse(c,9,hipsY-9-i*9,1.5,1.5,'#e5c78d',null);}
 const attacking=pose==='strike',wind=pose==='wind',guard=pose==='guard';
 let right=[[19,shoulder+7],[31,shoulder+30],[31,shoulder+49]],left=[[-20,shoulder+8],[-32,shoulder+31],[-23,shoulder+48]];
 if(run){right=[[19,shoulder+7],[35+pulse*12,shoulder+27],[14-pulse*17,shoulder+12]];left=[[-20,shoulder+8],[-28-pulse*12,shoulder+32],[-42+pulse*18,shoulder+18]];}
 if(wind){right=[[19,shoulder+7],[5,shoulder-2],[-17,shoulder+11]];left=[[-20,shoulder+8],[-28,shoulder-8],[-3,shoulder-10]];}
 if(attacking){right=[[19,shoulder+7],[reach*.55,shoulder+5],[reach,shoulder+10]];left=[[-20,shoulder+8],[-23,shoulder+25],[-1,shoulder+25]];}
 if(guard){right=[[19,shoulder+7],[35,shoulder-1],[18,headY-1]];left=[[-20,shoulder+8],[5,shoulder-1],[13,headY-9]];}
 if(dance){
  const arm=pose==='turn'?-1:1;
  const q=theater&&choreography?preparation:1;
  // The conductor opens the leading arm during the actual windup.
  right=[[19,shoulder+7],[31+11*q,shoulder+15-19*q*arm],
    [30+21*q,shoulder+29-53*q*arm]];
  left=[[-20,shoulder+8],[-28-13*q,shoulder+24+(17*arm-24)*q],
    [-24-31*q,shoulder+38+(-10*arm-38)*q]];
 }
 for(const arm of [left,right]){line(c,arm,outline,14);line(c,arm,coat,9);const [hx,hy]=arm[2];ellipse(c,hx,hy,7,7,skin,outline,2);}
 if(gyuwon&&!run&&!dance&&!slide){round(c,-38,hipsY-7,15,42,3,'#70414f',outline,3);line(c,[[-35,hipsY+2],[-25,hipsY+2]],'#c6a06a',2);}
 if(gyuwon)drawGyuwonPhoto(c,portrait,0,headY,24,{mirror:face<0});else{
 ellipse(c,0,headY,20,24,skin,outline,3);
 c.beginPath();c.moveTo(-21,headY+2);c.bezierCurveTo(-26,headY-25,-8,headY-34,11,headY-27);c.bezierCurveTo(27,headY-19,24,headY+4,18,headY+12);c.lineTo(15,headY-7);c.lineTo(3,headY-17);c.lineTo(-2,headY-6);c.lineTo(-8,headY-14);c.lineTo(-17,headY);c.closePath();c.fillStyle=ink?'#29292c':gyuwon?'#39314f':'#203549';c.fill();c.strokeStyle=outline;c.lineWidth=2;c.stroke();
 if(miss){line(c,[[-11,headY+1],[-5,headY+7],[-11,headY+9]],outline,2);line(c,[[8,headY+1],[14,headY+7],[8,headY+9]],outline,2);}else{ellipse(c,-7,headY+3,2,3,outline,null);ellipse(c,9,headY+3,2,3,outline,null);}
 c.beginPath();c.arc(2,headY+11,5,0,Math.PI);c.strokeStyle=outline;c.lineWidth=1.8;c.stroke();
 }
 if(!ink){path(c,[[-17,shoulder],[-7,shoulder+5],[20,shoulder+2],[41+Math.sin(t*7)*7,shoulder+14],[18,shoulder+9],[-15,shoulder+7]],gyuwon?'#9b79c8':'#d4ae64',outline,1.5);}
 if(theater){
  // Tailored theatrical waistcoat, gold piping, gloves and lapel highlights.
  line(c,[[-20,shoulder+6],[-10,hipsY-4],[0,hipsY]],
   gyuwon?'#eecb95':'#c8dce9',2.4);
  line(c,[[20,shoulder+5],[12,hipsY-4],[2,hipsY]],
   gyuwon?'#eecb95':'#c8dce9',2.4);
  ellipse(c,0,hipsY-6,4,4,'#f5e4b3',null);
  if(gyuwon){
   // The familiar face remains, but his eight-act topcoat and collar change.
   path(c,[[-18,headY+27],[-6,headY+19],[0,headY+35]],
    '#e9d0aa',outline,1);
   path(c,[[0,headY+35],[7,headY+19],[18,headY+27]],
    '#e9d0aa',outline,1);
  }
 }
 c.restore();
}
// Six stagebook silhouettes, four derived from the previously fought bosses.
// All details are live Canvas paths so they animate with the SAME hit windup
// used by the army simulation; no tiny text or inaccessible remote sprites.
export function paperUnit(c,x,y,{type=0,team=1,t=0,wind=0,hp=1,maxHp=1,scale=1,portrait=null}={}){
 c.save();c.translate(x,y);c.scale(scale*team,scale);
 const ink='#18202b',enemy=team<0,shade=enemy?'#6c6573':'#f7eedc',
  gold=enemy?'#a47467':'#e5be75',red=enemy?'#6d2438':'#ab3550';
 const strike=wind>0?Math.min(1,Math.max(0,(.55-wind)/.55)):0,
  sway=Math.sin(t*5),bounce=Math.max(0,Math.sin(t*4))*(type===2?2:1.6);
 ellipse(c,0,0,26,5,'#101b2b26',null);
 c.translate(0,-bounce);
 // Distinct feet and weighted walking. Boss 5 is a towering marching frame.
 const height=type===5?1.26:1;
 for(const side of [-1,1]){
  const foot=side*13+sway*side*3;
  line(c,[[side*9,-22*height],[foot,-7],[foot+side*2,-2]],ink,6);
  round(c,foot-9,-8,20,9,3,ink);
 }
 if(type===0){ // Kwon: elongated angular chin/blade and charcoal knight.
  path(c,[[-23,-34],[-13,-75],[15,-75],[26,-35],[12,-19],[-15,-19]],'#344554',ink,3);
  path(c,[[-14,-55],[3,-100],[18,-55],[9,-48]],'#d4dddf',ink,3);
  ellipse(c,0,-80,18,19,shade,ink,3);
  path(c,[[-10,-70],[0,-35],[10,-70],[0,-60]],'#e6dca8',ink,2);
  path(c,[[21,-73],[27+strike*17,-108],[38+strike*18,-112],[32,-55]],'#d6dbda',ink,2);
  line(c,[[-12,-64],[-32,-58]],'#9caabd',8);
 }else if(type===1){ // Oslu: off-kilter clown silhouette, red-white collar and gloves.
  path(c,[[-25,-34],[-20,-68],[0,-81],[24,-68],[29,-33]],'#a53b52',ink,3);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(c,Math.sin(a)*23,-66+Math.cos(a)*6,7,11,i%2?'#efe2ca':'#783a69',ink,1);}
  ellipse(c,0,-93,20,22,shade,ink,3);
  path(c,[[-17,-106],[-22,-120],[-8,-114],[0,-126],[13,-114],[23,-121],[19,-106]],'#812b47',ink,2);
  ellipse(c,-6,-92,3,4,ink,null);ellipse(c,8,-92,3,4,ink,null);
  ellipse(c,1,-85,5,5,'#b53550',ink,1);
  c.strokeStyle=ink;c.lineWidth=2.5;c.beginPath();c.arc(2,-84,12,.15,Math.PI-.2);c.stroke();
  ellipse(c,29+strike*17,-61-strike*10,10,10,'#f5eee0',ink,2);
  ellipse(c,-28,-51,9,9,'#f5eee0',ink,2);
 }else if(type===2){ // Sungwon: a genuinely rotating six-faced casino die.
  const rot=sway*.1+strike*.35;c.save();c.translate(0,-56);c.rotate(rot);
  round(c,-27,-30,54,56,6,'#353a46',gold,4);
  round(c,-20,-23,40,40,4,'#e9dcc5',ink,2);
  const dots=[[-10,-11],[10,-11],[-10,1],[10,1],[-10,13],[10,13]];
  for(let k=0;k<6;k++)ellipse(c,dots[k][0],dots[k][1],3.4,3.4,'#8d3146',null);
  c.restore();
  line(c,[[-20,-60],[-29,-45]],gold,6);
  line(c,[[20,-60],[33+strike*15,-43]],gold,7);
  ellipse(c,35+strike*15,-40,9,9,'#efe7d5',ink,2);
 }else if(type===3){ // Baeseojun: blood wings, halo and head.
  path(c,[[-22,-39],[-13,-72],[15,-72],[25,-39]],'#641f35',ink,3);
  for(const side of [-1,1]){
   for(let k=0;k<4;k++){
    const a=side*(20+k*10),wave=sway*3;
    path(c,[[side*12,-70],[a,-108-k*7+wave],[a+side*8,-75-k*5],[side*23,-47]],k%2?'#a9405c':'#7b2646',ink,1);
   }
  }
  ellipse(c,0,-90,19,20,shade,ink,3);
  c.strokeStyle='#e8c2a3';c.lineWidth=3;c.beginPath();c.ellipse(0,-117,26,9,0,0,TAU);c.stroke();
  ellipse(c,0,-84,4,5,'#ad4d60',null);
  line(c,[[17,-62],[30+strike*12,-85]],'#ac4262',7);
 }else if(type===4){ // Gyuwon: answer sheets and pencil, unmade choices.
  path(c,[[-23,-36],[-16,-79],[18,-79],[22,-36]],'#657792',ink,3);
  drawGyuwonPhoto(c,portrait,0,-94,20,{mirror:team<0});
  round(c,-33,-68,23,41,3,'#faf6de',ink,2);
  for(let k=0;k<4;k++)line(c,[[-28,-58+k*9],[-17,-58+k*9]],k===1?'#b85662':'#81909b',2);
  line(c,[[17,-73],[31+strike*10,-95]],'#d8ae6c',6);
  ellipse(c,32+strike*10,-96,6,8,'#f6d79e',ink,1);
 }else{ // Towering finale marcher / choir stagehand.
  path(c,[[-28,-44],[-30,-92],[-11,-103],[17,-103],[33,-86],[26,-44]],'#4d405e',ink,4);
  ellipse(c,0,-118,26,30,shade,ink,4);
  path(c,[[-32,-112],[0,-148],[32,-112],[0,-124]],gold,ink,2);
  for(const side of [-1,1])line(c,[[side*24,-85],[side*(35+strike*14),-54]],ink,12);
  line(c,[[0,-108],[0,-165]],gold,8);
  path(c,[[-7,-165],[7,-165],[0,-178]],red,ink,2);
 }
 if(enemy){path(c,[[-29,-44],[-12,-36],[-1,-43],[-15,-59]],'#a53a43',ink,2);}
 c.restore();
 if(hp<maxHp)bar(c,x-25*scale,y-(type===5?188:137)*scale,50*scale,5,hp,maxHp,team>0?'#5ed4bf':'#e89477');
}
export function tank(c,x,y,{enemy=false,large=false,t=0,flash=0,pixel=1}={}){
 c.save();c.translate(Math.round(x),Math.round(y));const s=large?1.55:1;c.scale(s,s);const metal=enemy?'#73775e':'#7c9d8f',dark='#252e33',light='#d3cfaa';
 const r=(x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
 r(-25,-32,50,64,'#141b24');r(-29,-26,12,53,dark);r(17,-26,12,53,dark);
 for(let i=0;i<6;i++){r(-28,-23+i*8,10,3,'#a9ad91');r(18,-23+i*8,10,3,'#a9ad91');}
 path(c,[[-18,-29],[16,-29],[23,-13],[22,24],[-22,24],[-24,-12]],metal,'#20282a',3);
 r(-17,-22,6,33,light);r(12,-20,6,32,'#4e5e59');r(-12,8,24,12,'#485550');
 ellipse(c,0,-3,14,17,metal,dark,3);r(-3,enemy?7:-52,7,enemy?33:47,dark);r(-1,enemy?9:-51,3,enemy?30:47,light);
 for(const side of [-1,1]){r(side*16-4,-27,7,13,light);r(side*16-3,11,6,7,'#dba16c');}
 if(flash>0){c.globalAlpha=Math.min(.8,flash);r(-20,-29,40,55,'#fff1ab');}
 if(!enemy){ellipse(c,0,1,4,4,'#c6fbff','#276985',1.3);ellipse(c,0,28,5,3,'#f4aa39',null);}
 c.restore();
}
export function burst(c,x,y,r=28,t=0,color='#fff2a2'){
 c.save();c.translate(x,y);c.rotate(t*3);const pts=[];for(let i=0;i<18;i++){const a=i*TAU/18,q=i%2?r*.35:r;pts.push([Math.cos(a)*q,Math.sin(a)*q]);}path(c,pts,color,'#e39568',2);c.restore();
}
