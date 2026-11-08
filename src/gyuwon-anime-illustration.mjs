import * as THREE from 'three';
// One hand-drawn canvas portrait becomes the 2D standee, photocards and merch.
// No external image service or 3D doll. A tiny neutral texture is used only
// during headless Node checks where a DOM canvas is unavailable.
const palettes=[
 ['#d86cab','#63345b','#fad8ca','#f7edf7'],
 ['#6badd7','#2d4569','#ffe4d1','#e5f7ff'],
 ['#d0ac65','#665039','#ffdcc7','#fff3d0'],
 ['#977bc9','#392f70','#ffdbc9','#f0e9ff'],
 ['#5ba99f','#2d5957','#f8dccb','#e1fff1'],
 ['#cc8b71','#6b3a48','#ffe0ca','#fff0e8']
];
export function createGyuwonAnimeIllustration(index=0){
 const [accent,hair,skin,light]=palettes[((index%6)+6)%6];
 if(typeof document==='undefined'||typeof document.createElement!=='function'){
  const t=new THREE.DataTexture(new Uint8Array([241,215,230,255]),1,1);
  t.needsUpdate=true;return t;
 }
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=576;
 const c=canvas.getContext('2d');
 if(!c){const t=new THREE.DataTexture(new Uint8Array([241,215,230,255]),1,1);t.needsUpdate=true;return t;}
 const W=384,H=576;
 const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,light);bg.addColorStop(1,accent);
 c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.globalAlpha=.40;for(let i=0;i<28;i++){
  const x=((i*61)%373),y=((i*107)%568),r=3+i%5*2;
  c.fillStyle=i%2?'#ffffff':accent;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 }c.globalAlpha=1;
 c.strokeStyle='#ffffffaa';c.lineWidth=9;c.strokeRect(17,18,W-34,H-36);
 const path=(fill,outline,points,w=4)=>{
  c.beginPath();for(const [i,p] of points.entries()){
   if(i===0)c.moveTo(p[0],p[1]);else if(p.length===6)c.bezierCurveTo(...p);else c.lineTo(p[0],p[1]);
  }c.closePath();c.fillStyle=fill;c.fill();
  if(outline){c.strokeStyle=outline;c.lineWidth=w;c.lineJoin='round';c.stroke();}
 };
 // Flowing hair silhouette and layered ribbons, never a bevelled 3D head.
 path(hair,'#36223a',[[88,216],[67,295,68,422,93,497],[113,539],[270,539],[302,500],[324,415,311,290,291,207],
  [248,118,138,130,88,216]],5);
 path(accent,'#543653',[[118,352],[77,405],[65,541],[318,541],[310,405],[268,350]],5);
 path(light,'#573d5e',[[151,374],[188,399],[225,374],[251,450],[270,530],[110,530],[130,450]],3);
 // Sailor collar & tied bow.
 path('#ffffff','#594d67',[[125,370],[186,409],[257,368],[238,452],[143,453]],3);
 path(accent,'#4b3159',[[182,409],[143,389],[149,434],[182,424],[218,434],[235,395],[191,405]],3);
 c.fillStyle='#fff7e8';c.beginPath();c.ellipse(190,419,10,11,0,0,Math.PI*2);c.fill();
 // Neck and large anime face.
 path(skin,'#785c69',[[170,335],[169,378],[194,393],[215,373],[214,332]],3);
 path(skin,'#664a58',[[111,211],[115,305,150,352,186,356],[243,355,275,319,274,234],
  [261,181,151,178,111,211]],4);
 // Side bangs, layered fringe and side locks.
 path(hair,'#32283d',[[107,251],[89,181,127,140,185,137],[241,129,285,174,278,253],
  [254,229],[242,209,222,204,214,185],[188,222,153,219,127,194],[124,217,111,232,107,251]],4);
 for(const sign of [-1,1]){
  const x=190+sign*52;
  path(hair,'#32283d',[[x,182],[x+sign*28,218],[x+sign*30,365],[x+sign*9,403],
   [x+sign*10,272]],2);
 }
 // Large glossy eyes with separate iris, specular light and upper lashes.
 for(const sign of [-1,1]){
  const x=190+sign*37;
  c.fillStyle='#3b2c3f';c.beginPath();c.ellipse(x,276,25,19,0,Math.PI,2*Math.PI);c.fill();
  c.fillStyle='#ffffff';c.beginPath();c.ellipse(x,278,19,20,0,0,TAU());c.fill();
  const eg=c.createLinearGradient(x,260,x,296);eg.addColorStop(0,accent);eg.addColorStop(1,'#252743');
  c.fillStyle=eg;c.beginPath();c.ellipse(x,279,12,18,0,0,TAU());c.fill();
  c.fillStyle='#242033';c.beginPath();c.arc(x,280,6.5,0,TAU());c.fill();
  c.fillStyle='#ffffff';c.beginPath();c.arc(x-4,271,5,0,TAU());c.fill();c.beginPath();c.arc(x+5,288,2.8,0,TAU());c.fill();
  c.strokeStyle='#422f47';c.lineWidth=3.5;c.beginPath();c.moveTo(x-21,274);c.quadraticCurveTo(x,255,x+21,274);c.stroke();
  c.fillStyle='#f2a4a4aa';c.beginPath();c.ellipse(x+sign*2,309,18,8,0,0,TAU());c.fill();
 }
 c.strokeStyle='#aa6d75';c.lineWidth=3;c.beginPath();c.arc(190,319,9,.12,Math.PI-.12);c.stroke();
 c.fillStyle='#ffffffcc';c.beginPath();c.arc(190,321,3,0,TAU());c.fill();
 // Hair ornament, ribbon and stars.
 path(accent,'#543650',[[259,188],[298,166],[290,207],[260,197],[239,215],[240,175]],3);
 for(let i=0;i<13;i++){const x=(i*89)%350+16,y=(i*57)%482+33;
  c.fillStyle=i%3===0?'#ffffff':light;c.beginPath();
  for(let p=0;p<8;p++){const a=p*Math.PI/4;const r=p%2?2.3:6.5;
   if(p===0)c.moveTo(x+r,y);else c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
  }c.closePath();c.fill();}
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 tex.userData.artStyle='gyuwon-original-2d-anime-girl-portrait';return tex;
}
function TAU(){return Math.PI*2;}
