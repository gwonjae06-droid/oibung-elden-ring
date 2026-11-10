import {drawGyuwonPhoto} from './gyuwon-photo-face.mjs';
// Connected screen-space bones for the same armored protagonist in both games.
// No rhythm rings, attack circles or particles substitute for joint movement.
export function drawGyuwonPerformer(c,x,y,{pose={},scale=1,face=1,gyuwon=false,portrait=null,color='#566b7b',crouch=false,costume=null}={}){
 const p=pose,turn=p.turn||0,width=Math.max(.25,Math.abs(Math.cos(turn))),spinFace=Math.cos(turn)<0?-1:1;
 c.save();c.translate(x+(p.shift||0)*face,y-(p.height||0)*45);c.scale(scale*face*spinFace*width,scale);c.rotate(p.bank||0);
 c.lineCap='round';c.lineJoin='round';
 const line=(points,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();points.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.stroke();};
 const shape=(points,fill)=>{c.fillStyle=fill;c.strokeStyle='#18212b';c.lineWidth=2;c.beginPath();points.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.fill();c.stroke();};
 const oval=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const metal=c.createLinearGradient(-28,0,31,0);metal.addColorStop(0,'#263a4a');metal.addColorStop(.42,'#aebbc0');metal.addColorStop(.63,'#647c8c');metal.addColorStop(1,'#2d4254');
 const hip=-61+(crouch?24:0),shoulder=-111+(crouch?27:0),head=shoulder-33;
 if(costume==='sky')for(const side of [-1,1]){
  shape([[side*15,shoulder+8],[side*52,shoulder-18],[side*94,shoulder-35],[side*73,shoulder+5],[side*42,shoulder+22]],'#8195a8');
  line([[side*20,shoulder+8],[side*62,shoulder-5],[side*89,shoulder-30]],'#c3cdd3',2);
 }
 for(const side of [-1,1]){
  const step=side<0?p.leftStep||0:p.rightStep||0;
  let foot=[side*16+step*25,Math.min(0,-Math.abs(step)*8)],knee=[side*13+step*11,-30-Math.abs(step)*10];
  if(side>0&&p.kick){foot=[22+p.kick*(p.range||4.3)*23,-6-p.kick*74];knee=[20+p.kick*37,-34-p.kick*20];}
  line([[side*11,hip],knee,foot],'#152330',20);line([[side*11,hip],knee,foot],gyuwon?'#30394a':metal,13);
  oval(...knee,9,8,gyuwon?color:'#9cadb4');
  shape([[foot[0]-9,foot[1]-7],[foot[0]+20,foot[1]-7],[foot[0]+24,foot[1]+2],[foot[0]-9,foot[1]+3]],'#273744');
 }
 const coat=gyuwon?color:metal;
 shape([[-25,shoulder],[22,shoulder],[26,hip],[-22,hip+4]],coat);
 shape([[-18,shoulder+8],[0,shoulder+17],[19,shoulder+7],[13,hip-8],[-14,hip-7]],gyuwon?color:'#637e90');
 line([[-18,hip+2],[18,hip]],'#b79965',5);
 for(const side of [-1,1]){
  const angle=side<0?p.leftArm||0:p.rightArm||0,bend=side<0?p.leftElbow||0:p.rightElbow||0;
  const origin=[side*25,shoulder+8],elbow=[side*(33+Math.abs(angle)*14),shoulder+32+angle*25],hand=[side*(30+Math.abs(angle)*18),shoulder+62+angle*52+bend*24];
  if(side>0&&p.strike&&p.attackKind!=='kick'){
   const reach=(p.range||3)*23,extend=p.strike;elbow[0]+=(reach*.48-elbow[0])*extend;elbow[1]+=(shoulder+10-elbow[1])*extend;
   hand[0]+=(reach-hand[0])*extend;hand[1]+=(shoulder+10-hand[1])*extend;
  }
  line([origin,elbow,hand],'#172431',20);line([origin,elbow,hand],coat,14);oval(...origin,13,12,coat);oval(...elbow,8,8,gyuwon?color:'#9cacb2');
  oval(...hand,8,9,gyuwon?'#d6b096':'#778c99');
  for(let i=0;i<3;i++)line([[hand[0]-4+i*4,hand[1]+1],[hand[0]-4+i*4,hand[1]+6]],gyuwon?'#98735d':'#334958',1.3);
 }
 c.save();c.translate(0,head);c.rotate((p.headYaw||0)*.3+(p.headPitch||0)*.18);
 if(gyuwon){
  drawGyuwonPhoto(c,portrait,0,0,25);
  if(costume==='king')shape([[-24,-22],[-25,-43],[-12,-33],[0,-49],[12,-33],[25,-43],[24,-22]],'#c6aa72');
  if(costume==='clown'){shape([[-25,-20],[-28,-53],[0,-30],[23,-52],[25,-20]],'#95607b');oval(-28,-53,4,4,'#d7bc8c');oval(23,-52,4,4,'#d7bc8c');}
 }
 else{oval(0,0,25,29,metal);shape([[-23,-7],[23,-7],[18,18],[0,25],[-19,17]],metal);line([[-18,-3],[18,-3]],'#15232e',6);line([[0,2],[0,20]],'#c3cdd0',2);for(let i=0;i<5;i++)line([[-12+i*6,8],[-12+i*6,15]],'#283d4d',2);}
 c.restore();
 if(gyuwon){shape([[-17,shoulder],[-5,shoulder+19],[0,shoulder+6]],'#e4dbce');shape([[17,shoulder],[5,shoulder+19],[0,shoulder+6]],'#e4dbce');}
 c.restore();
}
