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
export function stagePerson(c,x,y,{scale=1,face=1,t=0,pose='idle',phase=0,gyuwon=false,color='#3b91b1',ink=false,miss=false,reach=76}={}){
 c.save();c.translate(x,y);c.scale(scale*face,scale);const outline=ink?'#111315':'#1d2333',coat=ink?'#f6f5e9':color,skin=ink?'#fffaf0':gyuwon?'#e6c0a0':'#edd0ac';
 const run=pose==='run',slide=pose==='slide',crouch=pose==='crouch',jump=pose==='jump',dance=pose==='dance'||pose==='turn'||pose==='quick';
 const pulse=Math.sin(t*11),lift=run?Math.max(0,pulse)*10:dance?Math.abs(Math.sin(t*5))*5:0;
 const down=slide?67:crouch?35:miss?12:0,lean=run?.23:slide?1.1:pose==='strike'?.16:pose==='wind'?-.16:0;
 ellipse(c,0,1,32,6,'#00000035',null);
 c.translate(0,down-lift);c.rotate(lean);
 const hipsY=-55+(crouch?10:0),shoulder=-96+(crouch?16:0),headY=-119+(crouch?20:0);
 const legSwing=run?Math.sin(t*13)*24:dance?Math.sin(t*8)*10:0;
 for(const side of [-1,1]){const hip=side*10,kneeX=hip+(slide?side*30:legSwing*side*.7),kneeY=hipsY/2+(slide?4:-2),footX=side*16+legSwing*side,footY=-down+lift+(jump?side*6:0);
  line(c,[[hip,hipsY],[kneeX,kneeY],[footX,footY-7]],outline,17);line(c,[[hip,hipsY],[kneeX,kneeY],[footX,footY-7]],ink?'#e4e4d8':'#202a40',11);round(c,footX-7,footY-10,24,12,4,ink?'#fff':'#15202e',outline,2);
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
 if(dance){const arm=pose==='turn'?-1:1;right=[[19,shoulder+7],[42,shoulder-4*arm],[51,shoulder-24*arm]];left=[[-20,shoulder+8],[-41,shoulder+arm*17],[-55,shoulder-arm*10]];}
 for(const arm of [left,right]){line(c,arm,outline,14);line(c,arm,coat,9);const [hx,hy]=arm[2];ellipse(c,hx,hy,7,7,skin,outline,2);}
 if(gyuwon&&!run&&!dance&&!slide){round(c,-38,hipsY-7,15,42,3,'#70414f',outline,3);line(c,[[-35,hipsY+2],[-25,hipsY+2]],'#c6a06a',2);}
 ellipse(c,0,headY,20,24,skin,outline,3);
 c.beginPath();c.moveTo(-21,headY+2);c.bezierCurveTo(-26,headY-25,-8,headY-34,11,headY-27);c.bezierCurveTo(27,headY-19,24,headY+4,18,headY+12);c.lineTo(15,headY-7);c.lineTo(3,headY-17);c.lineTo(-2,headY-6);c.lineTo(-8,headY-14);c.lineTo(-17,headY);c.closePath();c.fillStyle=ink?'#29292c':gyuwon?'#39314f':'#203549';c.fill();c.strokeStyle=outline;c.lineWidth=2;c.stroke();
 if(miss){line(c,[[-11,headY+1],[-5,headY+7],[-11,headY+9]],outline,2);line(c,[[8,headY+1],[14,headY+7],[8,headY+9]],outline,2);}else{ellipse(c,-7,headY+3,2,3,outline,null);ellipse(c,9,headY+3,2,3,outline,null);}
 c.beginPath();c.arc(2,headY+11,5,0,Math.PI);c.strokeStyle=outline;c.lineWidth=1.8;c.stroke();
 if(!ink){path(c,[[-17,shoulder],[-7,shoulder+5],[20,shoulder+2],[41+Math.sin(t*7)*7,shoulder+14],[18,shoulder+9],[-15,shoulder+7]],gyuwon?'#9b79c8':'#d4ae64',outline,1.5);}
 c.restore();
}
export function paperUnit(c,x,y,{type=0,team=1,t=0,wind=0,hp=1,maxHp=1,scale=1}={}){
 c.save();c.translate(x,y);c.scale(scale*team,scale);const attack=wind>0?Math.sin((.55-wind)/.55*Math.PI/2):Math.sin(t*5)*.12,ink='#15191d';
 ellipse(c,0,0,24,5,'#00000020',null);
 if(type===5){path(c,[[-26,-70],[-33,-37],[-21,-8],[20,-8],[32,-39],[23,-70]],'#f7f7eb',ink,4);}
 else{ellipse(c,0,-40,19,29,'#fffdf0',ink,3);}
 for(const side of [-1,1]){line(c,[[side*10,-19],[side*13+Math.sin(t*6+side)*7,-3]],ink,6);ellipse(c,side*13+Math.sin(t*6+side)*7,-2,8,4,'#fffef2',ink,2);}
 const headY=type===5?-88:type===2?-82:-69;
 if(type===2)line(c,[[0,-42],[0,headY+8]],ink,11);
 path(c,[[-19,headY+5],[-20,headY-13],[-11,headY-7],[0,headY-18],[12,headY-8],[21,headY-13],[20,headY+7]],'#fffef1',ink,3);
 ellipse(c,0,headY+3,20,18,'#fffef1',ink,3);
 for(const side of [-1,1]){ellipse(c,side*7,headY+2,1.6,2.5,ink,null);line(c,[[side*7,headY+10],[0,headY+8]],ink,1.5);}
 if(type===1){round(c,10,-55,27,41,10,'#dfdfd2',ink,3);line(c,[[17,-48],[32,-30],[17,-20]],ink,2);}
 else if(type===2){c.beginPath();c.arc(24,-44,24,-1.2,1.2);c.strokeStyle=ink;c.lineWidth=4;c.stroke();line(c,[[33,-66],[33,-22]],ink,1);line(c,[[12,-44],[50+attack*10,-44]],ink,2);}
 else if(type===4){line(c,[[25,-5],[25+attack*13,-82]],ink,5);ellipse(c,25+attack*13,-88,8,11,'#bfa2dd',ink,2);}
 else{line(c,[[15,-40],[30+attack*20,-40]],ink,7);path(c,[[28+attack*20,-43],[49+attack*28,-62],[52+attack*28,-56],[32+attack*20,-36]],'#e2e5dd',ink,2);}
 if(team<0)path(c,[[-17,-55],[-39,-32],[-28,-18],[-7,-42]],'#bb7774',ink,2);
 c.restore();
 if(hp<maxHp){bar(c,x-22*scale,y-114*scale,44*scale,4,hp,maxHp,team>0?'#5ed4bf':'#e89477');}
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
