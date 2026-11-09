// Act VI must show the SAME armored player as the main 3D game, not a
// photographed Gyuwon face or a generic unarmored human. Drawn in one pass
// using the existing helmet/chestplate/cape/weapon silhouette language.
const TAU=Math.PI*2;
function polygon(c,pts,fill,stroke='#1c2530',w=3){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.closePath();c.fillStyle=fill;c.fill();
 if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.lineJoin='round';c.stroke();}
}
function segment(c,pts,color,width=5){
 c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
const clamp=x=>Math.min(1,Math.max(0,Number.isFinite(x)?x:0));
export function drawArmoredRunner(c,x,y,{t=0,scale=1,pose='run',weapon='sword',inkAmount=0,energy=0}={}){
 const ink=clamp(inkAmount);
 // Two drawings are deliberately layered during the ink-to-color reveal.
 if(ink>=.98){drawKnight(c,x,y,{t,scale,pose,weapon,ink:true,energy});return;}
 if(ink>.01){c.save();c.globalAlpha=ink;drawKnight(c,x,y,{t,scale,pose,weapon,ink:true,energy});c.restore();}
 c.save();c.globalAlpha*=1-ink;drawKnight(c,x,y,{t,scale,pose,weapon,ink:false,energy});c.restore();
}
function drawKnight(c,x,y,{t,scale,pose,weapon,ink,energy}){
 const run=pose==='run'||pose==='walk',jump=pose==='jump',slide=pose==='slide',dash=pose==='dash',
  pace=pose==='walk'?5:13,step=run?Math.sin(t*pace):0,lift=run?Math.max(0,Math.sin(t*pace*2))*(pose==='walk'?3:7):0;
 const outline=ink?'#303038':'#1b2633',steel=ink?'#e8e1d6':'#b9c9d5',
  light=ink?'#faf6ec':'#e3edf3',dark=ink?'#aaa49b':'#53677c',
  gold=ink?'#cec4b1':'#d2ae6c',cape=ink?'#d5ccc1':'#253e59';
 c.save();c.translate(x,y);
 c.fillStyle='#151d304a';c.beginPath();c.ellipse(0,1,38*(dash?1.7:1),6,0,0,TAU);c.fill();
 c.scale(scale,scale);
 c.translate(0,-lift+(slide?30:0));
 c.rotate(dash?.36:slide?.65:run?.12:jump?-.12:0);
 // Cape is behind the armor, and follows steps rather than cycling its body.
 const wave=Math.sin(t*7)*4;
 polygon(c,[[-22,-93],[-41,-74],[-55-wave,-38],[-70-wave,-23],[-33,-29],[-22,-55]],
  cape,outline,3);
 segment(c,[[-34,-70],[-42-wave,-50],[-53-wave,-29]],ink?'#bcb1a9':'#5c7491',2);
 // Greaves and separate leg joints make jump/slide silhouettes readable.
 for(const side of [-1,1]){
  const swing=jump?side*8:slide?side*25:step*side*16;
  const knee=[side*10+swing,-43+(jump?-9:slide?12:0)],foot=[side*17+swing*1.55,-4+(jump?-9:slide?5:0)];
  segment(c,[[side*10,-57],knee,foot],outline,19);
  segment(c,[[side*10,-57],knee,foot],steel,13);
  polygon(c,[[foot[0]-10,foot[1]-4],[foot[0]+16,foot[1]-3],[foot[0]+15,foot[1]+4],[foot[0]-11,foot[1]+4]],dark,outline,2.4);
  polygon(c,[[knee[0]-10,knee[1]-4],[knee[0]+9,knee[1]-8],[knee[0]+11,knee[1]+12],[knee[0]-7,knee[1]+10]],light,outline,2);
 }
 // Breastplate, pauldrons and gold crest follow the 3D armored avatar motif.
 polygon(c,[[-23,-99],[20,-99],[25,-60],[11,-54],[-26,-59]],steel,outline,3.4);
 polygon(c,[[-16,-91],[15,-91],[12,-67],[-4,-58],[-17,-70]],light,outline,2.2);
 polygon(c,[[-3,-92],[6,-85],[5,-66],[-4,-62],[-10,-72]],gold,outline,1.4);
 polygon(c,[[-33,-100],[-21,-111],[-7,-101],[-11,-88],[-34,-88]],light,outline,3);
 polygon(c,[[8,-101],[22,-111],[33,-99],[32,-87],[11,-89]],light,outline,3);
 // Forearms / gauntlets and a firm forward fighting stance.
 const armBounce=run?step*7:0;
 segment(c,[[-27,-92],[-35,-68],[-22+armBounce,-51]],outline,16);
 segment(c,[[-27,-92],[-35,-68],[-22+armBounce,-51]],steel,11);
 segment(c,[[24,-92],[34,-69],[20-armBounce,-52]],outline,16);
 segment(c,[[24,-92],[34,-69],[20-armBounce,-52]],steel,11);
 polygon(c,[[-28+armBounce,-55],[-14+armBounce,-58],[-10+armBounce,-44],[-26+armBounce,-42]],dark,outline,2);
 polygon(c,[[12-armBounce,-55],[26-armBounce,-58],[30-armBounce,-43],[13-armBounce,-41]],dark,outline,2);
 // Completely enclosed steel helmet: never reveal a photographic human face.
 polygon(c,[[-22,-132],[-16,-151],[-5,-159],[13,-157],[23,-143],[22,-119],[15,-112],[-15,-112],[-22,-120]],steel,outline,3.5);
 polygon(c,[[-19,-135],[20,-136],[17,-126],[-15,-124]],outline,outline,2);
 segment(c,[[-12,-131],[-3,-129],[11,-131]],ink?'#fbf3db':'#83b7d3',2.4);
 polygon(c,[[-5,-160],[0,-168],[7,-159],[8,-151],[-5,-151]],gold,outline,2);
 polygon(c,[[-15,-120],[-4,-113],[14,-115],[20,-123],[20,-117],[8,-108],[-8,-109],[-20,-118]],dark,outline,2);
 // Preserve the player's weapon choice as a small distinct carried silhouette.
 c.save();c.translate(-19,-70);c.rotate(-.19+step*.05);
 if(weapon==='hammer'){
  segment(c,[[0,0],[-11,36]],gold,5);polygon(c,[[-28,-5],[-9,-9],[3,2],[-17,6]],light,outline,2);
 }else if(weapon==='bow'){
  c.beginPath();c.arc(-9,0,31,-1.2,1.35);c.strokeStyle=gold;c.lineWidth=5;c.stroke();
  segment(c,[[-19,-29],[-19,29]],light,1.7);
 }else if(weapon==='cards'){
  for(let i=0;i<3;i++)polygon(c,[[-17+i*6,5+i*5],[-3+i*6,-3+i*5],[10+i*6,9+i*5],[-5+i*6,19+i*5]],i%2?gold:light,outline,1.4);
 }else{
  segment(c,[[-3,1],[-12,34]],dark,5);
  polygon(c,[[-6,9],[-15,39],[-23,44],[-18,13]],light,outline,2);
  segment(c,[[-21,17],[0,24]],gold,4);
 }
 c.restore();
 if(dash){for(let i=0;i<4;i++)segment(c,[[-45-i*19,-105+i*13],[-85-i*20,-95+i*13]],
   ink?'#a39b93':energy>0?'#fff2b0':'#a7dcf0',4-i*.5);}
 c.restore();
}
export function drawGyuwonRunnerGuide(c,x,y,{scale=1,t=0,opacity=1,gesture='open'}={}){
 c.save();c.globalAlpha*=clamp(opacity);c.translate(x,y);c.scale(scale,scale);
 const ink='#222c3b',coat='#3f3047',gold='#f1cf8e';
 c.fillStyle='#20222c50';c.beginPath();c.ellipse(0,1,29,5,0,0,TAU);c.fill();
 polygon(c,[[-20,-100],[16,-101],[21,-57],[37,-8],[-9,-31],[-33,-8],[-22,-63]],coat,ink,2.5);
 polygon(c,[[-10,-100],[8,-99],[4,-64],[-4,-64]],'#eee3d3',ink,1.4);
 polygon(c,[[-3,-98],[2,-88],[-4,-68],[-8,-88]],gold,null);
 segment(c,[[-20,-93],[-31,-65],[-24,-25]],ink,10);
 const reach=gesture==='open'?45:gesture==='gate'?65:20;
 segment(c,[[17,-94],[26,-76],[reach,-94+Math.sin(t*1.4)*4]],ink,11);
 c.fillStyle='#f0d9ba';c.beginPath();c.arc(0,-121,21,0,TAU);c.fill();
 polygon(c,[[-22,-128],[-18,-146],[-7,-152],[13,-149],[24,-133],[18,-141],[7,-135],[-5,-141],[-14,-132]],ink,null);
 c.restore();
}
