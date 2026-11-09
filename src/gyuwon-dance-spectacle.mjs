// Act VIII supplementary stagecraft. The scenes follow the source-master clock.
// Only 10.635-17.446 is tied to preserved source audio excerpts. Later lyric
// moments are provisional staging anchors pending a full listening pass.
// All effects are VISUAL ONLY: no hidden hitboxes, damage, or timing ownership.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
const PI=Math.PI,TAU=2*PI;
export const GYUWON_DANCE_LYRIC_MOMENTS=Object.freeze([
 {at:0,key:'parade',focus:'banners'},
 {at:10.635,key:'listen',focus:'lamps'},
 {at:20.06,key:'feel',focus:'floor'},
 {at:28.96,key:'step-left',focus:'footsteps'},
 {at:31,key:'step-right',focus:'footsteps'},
 {at:33.32,key:'morning-promise',focus:'sky'},
 {at:39.96,key:'star-tap',focus:'stars'},
 {at:44.06,key:'clap',focus:'rings'},
 {at:47.64,key:'spin-bow',focus:'silks'},
 {at:52.3,key:'never-miss',focus:'floor'},
 {at:56.98,key:'dreams',focus:'footsteps'},
 {at:59.98,key:'world-choir',focus:'crowd'},
 {at:64.82,key:'lovely-song',focus:'silks'},
 {at:92.4,key:'fade',focus:'silence'},
 {at:97.34,key:'new-tune',focus:'lamps'},
 {at:102.18,key:'nothing-left',focus:'silence'},
 {at:105.66,key:'still-dance',focus:'solo'},
 {at:112.42,key:'star-reprise',focus:'stars'},
 {at:116.48,key:'reaching',focus:'rings'},
 {at:120.02,key:'rain',focus:'rain'},
 {at:123.9,key:'again',focus:'floor'},
 {at:130,key:'reunion',focus:'crowd'},
 {at:158,key:'sunrise',focus:'sky'},
 {at:174.5,key:'bow',focus:'silks'}
].map(Object.freeze));
export function gyuwonDanceLyricMoment(time=0){
 const t=clamp(time,0,180);let i=0;
 for(let k=1;k<GYUWON_DANCE_LYRIC_MOMENTS.length;k++)
  if(t>=GYUWON_DANCE_LYRIC_MOMENTS[k].at)i=k;
 const cue=GYUWON_DANCE_LYRIC_MOMENTS[i];
 return {...cue,time:t,age:t-cue.at,
  next:GYUWON_DANCE_LYRIC_MOMENTS[i+1]?.at??180};
}
function oval(c,x,y,rx,ry,color,stroke=null,width=1){
 c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);
 if(color){c.fillStyle=color;c.fill();}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function path(c,points,color){
 c.beginPath();c.moveTo(points[0][0],points[0][1]);
 for(let k=1;k<points.length;k++)c.lineTo(points[k][0],points[k][1]);
 c.closePath();c.fillStyle=color;c.fill();
}
function glow(c,x,y,r,rgb,opacity=1){
 const g=c.createRadialGradient(x,y,0,x,y,r);
 g.addColorStop(0,'rgba('+rgb+','+(opacity*.6)+')');
 g.addColorStop(.35,'rgba('+rgb+','+(opacity*.18)+')');
 g.addColorStop(1,'rgba('+rgb+',0)');
 c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);
}
export function drawGyuwonDanceLyricBackdrop(c,s,m){
 const t=s.time,moment=gyuwonDanceLyricMoment(t);
 // Three depth planes, with visible architectural parallax rather than one flat tint.
 const buildings=['listen','feel','step-left','step-right','morning-promise',
  'never-miss','dreams','world-choir','lovely-song','reunion','sunrise'];
 if(buildings.includes(moment.key)||s.key==='ensemble'||s.key==='grand'){
  for(let layer=0;layer<3;layer++){
   c.save();c.globalAlpha=.14+layer*.1;
   const speed=(.35+layer*.22)*t;
   for(let i=0;i<11;i++){
    const x=((i*157+layer*71-speed)%1560+1560)%1560-140;
    const w=50+layer*19+(i%3)*8,h=112+layer*30+(i*13)%65;
    const y=480-layer*12-h;
    c.fillStyle=layer===2?'#2d294b':layer===1?'#4a4260':'#77708b';
    c.fillRect(x,y,w,h);
    if(i%3===0){c.beginPath();c.moveTo(x-9,y);c.lineTo(x+w*.5,y-29);
      c.lineTo(x+w+9,y);c.closePath();c.fill();}
    for(let k=0;k<3;k++){c.fillStyle='#f3cca1';
      c.fillRect(x+11+k*(w-19)/3,y+20,5,11);}
   }
   c.restore();
  }
 }
 // The promises about listening and rhythm are answered by lights across the world.
 if(['listen','feel','new-tune','never-miss'].includes(moment.key)){
  const pulse=clamp(moment.age/2.6);
  for(let i=0;i<7;i++){
   const x=190+i*152,y=280+(i%3)*31;
   if(i/7>pulse)continue;
   glow(c,x,y,30,'254,215,168',.23);
   oval(c,x,y,5,5,'#ffe4b7');
  }
 }
 if(moment.key==='morning-promise'){
  // A glimpse of sunrise, not the actual dawn: the finale still has a payoff.
  glow(c,1080,155,160,'255,203,148',.18*clamp(moment.age));
 }
 if(s.stars){
  // Twinkling constellations are anchored to musical notes and slowly connect.
  c.save();c.globalAlpha=.3+.3*(.5+.5*Math.cos(t*.7));
  c.strokeStyle='#d4e4ff';c.lineWidth=1.3;
  for(let i=0;i<11;i++){
   const x=90+i*109,y=90+(i*67)%160;
   c.beginPath();c.moveTo(x,y);
   c.lineTo(x+63,y+((i%3)-1)*34);c.stroke();
   oval(c,x,y,2.4,2.4,'#eef4ff');
  }
  c.restore();
  for(let i=0;i<8;i++){
   const x=180+i*125,y=410+(i%3)*19;
   glow(c,x,y,42,'147,201,255',.23);
  }
 }
 // Quiet lyrics drain the set in stages, but leave the real lead clearly visible.
 if(s.quiet){
  const q=clamp((t-92.4)/10);
  c.fillStyle='rgba(5,9,22,'+(.25+.22*q)+')';c.fillRect(0,0,1280,498);
  if(moment.key==='new-tune'){
   for(let i=0;i<5;i++){
    const x=350+i*145;glow(c,x,290,43,'200,214,255',.08+.13*clamp(moment.age/3));
   }
  }
  if(moment.key==='still-dance')glow(c,315,405,175,'239,226,183',.18);
 }
 // Rain is a weather system: distant curtains + blurred wet atmosphere.
 if(s.rain){
  const fog=c.createLinearGradient(0,360,0,625);
  fog.addColorStop(0,'rgba(158,198,226,0)');
  fog.addColorStop(.7,'rgba(163,204,230,.18)');
  fog.addColorStop(1,'rgba(135,190,222,.08)');
  c.fillStyle=fog;c.fillRect(0,355,1280,280);
  for(let row=0;row<2;row++)for(let i=0;i<34;i++){
   const x=(i*47+t*(row?67:39))%1350-40,y=65+(i*57+row*99)%435;
   c.strokeStyle=row?'#d8f5ff88':'#d8f5ff45';c.lineWidth=row?1.5:.9;
   c.beginPath();c.moveTo(x,y);c.lineTo(x-11,y+35);c.stroke();
  }
 }
 if(s.dawn>0){
  // Dawn opens wide instead of merely applying an orange screen filter.
  const a=s.dawn;
  for(let i=0;i<9;i++){
   const x=1035,y=180;
   c.save();c.translate(x,y);c.rotate((i-4)*.25);
   c.globalAlpha=.11*a;c.fillStyle='#ffebc0';
   path(c,[[-16,-65],[-83,-390],[83,-390],[16,-65]],'#ffecc8');
   c.restore();
  }
  glow(c,1035,178,260,'255,224,164',.22*a);
 }
 return moment;
}
export function drawGyuwonDanceLyricFloor(c,s,m,tele){
 const t=s.time,moment=gyuwonDanceLyricMoment(t);
 // Floor materials vary by meaning, while keeping identical input hit timing.
 const isWater=s.rain,isStar=s.stars,dim=s.quiet;
 c.save();c.beginPath();c.moveTo(155,501);c.lineTo(1125,501);c.lineTo(1280,720);
 c.lineTo(0,720);c.closePath();c.clip();
 const floorGlow=c.createLinearGradient(0,500,0,720);
 floorGlow.addColorStop(0,isWater?'#c2dcfa30':isStar?'#a6caff35':'#ffe1bb2b');
 floorGlow.addColorStop(1,dim?'#d6dbff07':'#fff1cb06');
 c.fillStyle=floorGlow;c.fillRect(0,500,1280,220);
 // Reflection is aligned under dancers, not a second ghost entity.
 for(const x of [315,670,1050]){
  const shade=c.createRadialGradient(x,555,0,x,555,86);
  shade.addColorStop(0,isWater?'#b7e5ff48':'#f7e9ce32');
  shade.addColorStop(1,'#ffffff00');
  c.fillStyle=shade;c.fillRect(x-90,545,180,94);
 }
 if(isStar){
  for(let i=0;i<23;i++){
   const x=70+i*57,y=547+(i*19)%150;
   const size=3+(i%3)*1.4,alpha=.22+.25*(.5+.5*Math.sin(t*1.1+i));
   c.strokeStyle='rgba(226,239,255,'+alpha+')';c.lineWidth=1.2;
   c.beginPath();c.moveTo(x-size,y);c.lineTo(x+size,y);
   c.moveTo(x,y-size);c.lineTo(x,y+size);c.stroke();
  }
 }
 if(isWater){
  for(let i=0;i<12;i++){
   const x=90+i*107,y=556+(i%4)*32;
   const ripple=(t*.75+i*.2)%1;
   c.strokeStyle='rgba(205,242,255,'+((1-ripple)*.48)+')';
   c.lineWidth=1.5;c.beginPath();c.ellipse(x,y,9+22*ripple,2+6*ripple,0,0,TAU);c.stroke();
  }
 }
 // Lyric-dependent footprints use the same rhythmic phase as the input window.
 if(tele?.active){
  const toBeat=clamp(1-Math.abs(tele.remaining)/.24);
  const lead=tele.lead;
  const direction=moment.key==='step-left'?-1:moment.key==='step-right'?1:
   ((tele.index+Math.floor(tele.at*2))%2?1:-1);
  const step=tele.action==='light';
  const x=670+direction*47,y=549;
  if(step){
   glow(c,x,y,50,'255,224,170',.18+.25*lead);
   c.save();c.translate(x,y);c.rotate(direction*.22);
   c.strokeStyle='rgba(255,232,183,'+(.32+.6*lead)+')';
   c.lineWidth=3+5*toBeat;c.beginPath();c.ellipse(0,0,15,28,0,0,TAU);c.stroke();c.restore();
  }else{
   c.strokeStyle='rgba(245,226,211,'+(.3+.5*lead)+')';
   c.lineWidth=4+3*toBeat;c.beginPath();
   c.ellipse(670,557,57+10*lead,15+5*lead,0,PI*.3,PI*1.95);c.stroke();
  }
 }
 c.restore();
 return moment;
}
export function drawGyuwonDanceLyricForeground(c,s,m,tele){
 const t=s.time,moment=gyuwonDanceLyricMoment(t);
 // Low-frequency costume/surface effects: no warning overlays or bright wall.
 if(['clap','reaching'].includes(moment.key)){
  const q=clamp(moment.age/3);
  for(let i=0;i<3;i++){
   const radius=45+i*75+q*45,alpha=(1-q)*(.17+i*.045);
   c.strokeStyle='rgba(250,221,181,'+alpha+')';c.lineWidth=2+i*.5;
   c.beginPath();c.ellipse(670,425,radius,radius*.28,0,0,TAU);c.stroke();
  }
 }
 if(['spin-bow','lovely-song','reunion','again'].includes(moment.key)){
  for(let i=0;i<16;i++){
   const x=100+i*72+Math.sin(t*.55+i)*12;
   const y=100+(i*89)%330+t%5*5;
   c.save();c.translate(x,y);c.rotate(Math.sin(t*.65+i)*.23);
   c.globalAlpha=.16+.12*(.5+.5*Math.cos(t+i));
   c.fillStyle=i%2?'#f1b4ca':'#ffe2b0';c.fillRect(-3,-10,6,20);c.restore();
  }
 }
 // A justified hit is rewarded at the dancer's actual foot-contact time.
 if(m.danceHit&&t-m.danceHit.at>=0&&t-m.danceHit.at<.42){
  const age=t-m.danceHit.at,q=1-age/.42;
  const x=m.danceHit.action==='skill'?670:670+(m.danceHit.facing||1)*38;
  c.save();c.globalAlpha=q;
  for(let i=0;i<14;i++){
   const a=i*TAU/14+t*.35,r=20+age*155;
   oval(c,x+Math.cos(a)*r,522+Math.sin(a)*r*.37,2.5+q*2,2.5+q*2,
    m.danceHit.grade==='PERFECT'?'#fff1c1':'#b9e8f2');
  }
  c.restore();
 }
 if(m.danceError>0){
  const q=clamp(m.danceError/.6);
  c.strokeStyle='rgba(216,145,171,'+(.3*q)+')';c.lineWidth=2;
  c.beginPath();c.ellipse(670,548,72+25*(1-q),14,0,0,TAU);c.stroke();
 }
 // The last curtain falls without ever hiding the actual performer.
 if(s.ring>0){
  c.save();c.globalAlpha=.13*s.ring;
  for(let i=0;i<20;i++){
   const x=(i*149)%1280,y=(i*83+t*8)%440;
   c.fillStyle=i%2?'#ffd9ad':'#f3baca';c.fillRect(x,y,4,11);
  }
  c.restore();
 }
 return moment;
}
