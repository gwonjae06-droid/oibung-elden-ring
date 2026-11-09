// Act VII theatrical world direction. The original audio clock owns every cue.
// Source excerpts were word-aligned automatically; final listening validation is pending.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export const GYUWON_ARMY_STAGES=Object.freeze([
 Object.freeze({at:0,key:'arrival',sky:['#e3c5a5','#f2ddbd'],hill:'#abbf94',soil:'#ad8d69'}),
 Object.freeze({at:17,key:'recruits',sky:['#a2d9e2','#f4e9bd'],hill:'#96c59b',soil:'#ab956b'}),
 Object.freeze({at:32,key:'village',sky:['#88c8df','#f6e6ad'],hill:'#87be97',soil:'#a68861'}),
 Object.freeze({at:56.5,key:'march',sky:['#f2b979','#f4dbad'],hill:'#a4b783',soil:'#ab8059'}),
 Object.freeze({at:86,key:'siege',sky:['#867a9e','#d4a98a'],hill:'#777b83',soil:'#83746b'}),
 Object.freeze({at:112,key:'lonely',sky:['#192d52','#465574'],hill:'#44516c',soil:'#666172'}),
 Object.freeze({at:126,key:'reunion',sky:['#9c98bd','#ebc69e'],hill:'#8da0a1',soil:'#8e8075'}),
 Object.freeze({at:155,key:'victory',sky:['#f3ad77','#fff0bb'],hill:'#acc69a',soil:'#ac8764'}),
 Object.freeze({at:175,key:'exit',sky:['#9e83c1','#e0bbca'],hill:'#8a83ab',soil:'#897c8f'})
]);
export function gyuwonArmyScene(time=0,duration=180){
 const t=clamp((time/(duration||180))*180,0,180);
 let stage=GYUWON_ARMY_STAGES[0];
 for(const cue of GYUWON_ARMY_STAGES)if(t>=cue.at)stage=cue;
 return {...stage,time:t,progress:t/180,
  opening:1-clamp(t/9),reunion:clamp((t-123)/18),
  farewell:clamp((t-174)/6),quiet:t>=112&&t<126};
}
export function gyuwonArmyLaneY(lane=0){return lane===1?547:445;}
export function drawGyuwonArmyWorld(c,m){
 const s=gyuwonArmyScene(m.time,m.clock?.duration||180),t=s.time;
 const sky=c.createLinearGradient(0,0,0,600);
 sky.addColorStop(0,s.sky[0]);sky.addColorStop(.85,s.sky[1]);
 c.fillStyle=sky;c.fillRect(0,0,1280,720);
 // A world that physically changes with each lyric passage, not a static tint.
 const stars=s.quiet||s.key==='exit';
 if(stars){for(let i=0;i<56;i++){const x=(i*197+47)%1280,y=35+(i*89)%340;
  c.fillStyle=i%3?'#fff3d5bb':'#fff9ed';c.beginPath();c.arc(x,y,1+(i%3)*.7,0,Math.PI*2);c.fill();}}
 else {c.fillStyle='#fff5dbaa';c.beginPath();c.arc(s.key==='victory'?1020:960,125,38,0,Math.PI*2);c.fill();}
 // Parallax mountain terraces keep the runners' sky-road silhouettes.
 for(let layer=0;layer<3;layer++){
  const base=306+layer*56,motion=t*(.7+layer*.32),amp=24+layer*8;
  c.fillStyle=layer===0?s.hill:layer===1?s.soil:'#8b967b';
  c.globalAlpha=layer===0?.46:layer===1?.58:.72;
  c.beginPath();c.moveTo(0,720);c.lineTo(0,base);
  for(let x=0;x<=1280;x+=24)c.lineTo(x,base+Math.sin((x+motion*7)/175+layer)*amp+Math.cos(x/91+layer)*9);
  c.lineTo(1280,720);c.fill();
 }
 c.globalAlpha=1;
 // Four visible pieces of the dreamed paper kingdom rise as the verse recruits friends.
 if(['arrival','recruits','village','march'].includes(s.key)){
  const built=clamp((t-17)/35);
  for(let i=0;i<8;i++){
   const x=140+i*134,roof=390-(i%3)*29,raise=32*(1-clamp((built*9-i)/1.7));
   c.fillStyle='#f6e6c9';c.fillRect(x,roof+raise,52,91);
   c.strokeStyle='#6a6670';c.lineWidth=2;c.strokeRect(x,roof+raise,52,91);
   c.fillStyle='#c68481';c.beginPath();c.moveTo(x-9,roof+raise);c.lineTo(x+26,roof-34+raise);c.lineTo(x+62,roof+raise);c.fill();
   c.fillStyle='#6d8290';c.fillRect(x+21,roof+49+raise,12,42);
  }
 }
 if(['siege','lonely','reunion'].includes(s.key)){
  // Broken parapets and distant smoke show the cost of the siege.
  for(let i=0;i<9;i++){
   const x=i*162-30,top=374+(i%3)*18;
   c.fillStyle=i%2?'#646976':'#857b88';c.fillRect(x,top,100,125);
   for(let k=0;k<3;k++){c.fillStyle='#485361';c.fillRect(x+k*31,top-15,21,24);}
   if(s.key!=='lonely'){c.fillStyle='#dbcecc48';c.beginPath();
    c.ellipse(x+35+Math.sin(t+i)*7,top-43,20+i%3*8,42,0,0,Math.PI*2);c.fill();}
  }
 }
 if(s.key==='victory'||s.key==='exit'){
  for(let i=0;i<32;i++){
   const x=(i*89+t*(i%2?2.8:-1.6)+1250)%1280,y=(i*79+Math.sin(t*1.4+i)*25)%490;
   c.fillStyle=i%3?'#f7d8a7bb':'#e8a6bdcc';c.save();c.translate(x,y);c.rotate(t*.5+i);c.fillRect(-3,-6,7,12);c.restore();
  }
 }
 // Two battle lines are real targeting lanes, separated spatially but readable in 2D.
 c.fillStyle=s.quiet?'#56617a':'#9d8260';
 c.fillRect(0,475,1280,245);
 for(const [y,col] of [[445,'#ccb899'],[547,'#d1bd8d']]){
  c.fillStyle=col;c.fillRect(0,y+8,1280,10);
  c.strokeStyle='#ece2c568';c.lineWidth=3;c.setLineDash([17,14]);c.beginPath();c.moveTo(55,y+18);c.lineTo(1220,y+18);c.stroke();c.setLineDash([]);
 }
 // Paper flags from the ending of Act VI become the army's real banners.
 for(let i=0;i<10;i++){
  const x=80+i*124+Math.sin(t*.18+i)*2,y=400-(i%3)*19;
  const h=(s.key==='arrival'?clamp(t/12):1)*55;
  c.strokeStyle='#705a57';c.lineWidth=4;c.beginPath();c.moveTo(x,y+40);c.lineTo(x,y+40-h);c.stroke();
  c.fillStyle=i%2?'#c36679':'#f3d78b';
  c.beginPath();c.moveTo(x,y+40-h);c.lineTo(x+31,y+48-h+Math.sin(t*2+i)*4);
  c.lineTo(x,y+65-h);c.fill();
 }
 if(s.quiet){
  c.fillStyle='#15243b77';c.fillRect(0,0,1280,580);
  // Fallen banners invite the player to rally rather than showing a tutorial.
  for(let i=0;i<5;i++){const x=190+i*202;
   c.strokeStyle='#e3c9aa';c.lineWidth=3;c.beginPath();c.moveTo(x,497);c.lineTo(x+56,519);c.stroke();}
 }
 if(s.key==='reunion'||s.key==='victory'){
  const q=s.reunion;const glow=c.createRadialGradient(645,350,10,645,350,490);
  glow.addColorStop(0,'rgba(255,237,177,'+(.25*q)+')');glow.addColorStop(1,'rgba(255,237,177,0)');
  c.fillStyle=glow;c.fillRect(0,0,1280,680);
 }
 if(s.key==='exit'){ // Wind-blown flags gradually become the violet dance curtains.
  const w=s.farewell;
  c.fillStyle='rgba(97,63,126,'+(.65*w)+')';c.fillRect(0,0,1280,720);
  for(let side of [-1,1]){
   const x=side<0?0:1280-145*w;c.fillStyle='#735188';c.fillRect(x,0,145*w,720);
   c.strokeStyle='#ddc1b4';c.lineWidth=5;c.beginPath();c.moveTo(side<0?145*w:1280-145*w,0);c.lineTo(side<0?145*w:1280-145*w,720);c.stroke();
  }
 }
 return s;
}
