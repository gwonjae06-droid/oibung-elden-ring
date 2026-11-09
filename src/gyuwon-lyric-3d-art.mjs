// Source-lyric 3D stage props: a bounded, pooled grammar of actual meshes.
// showAt is owned by gyuwon-musical-stage and reuses 92 meshes per frame.
// Acts 5 and 11 and the ending alone consume this layer.
import {gyuwonLyricActionAt,GYUWON_LYRIC_ACTIONS} from './gyuwon-lyric-actions.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const x=clamp(v);return x*x*(3-2*x);};
export function gyuwonLyricStagePose(year,time){
 const key=String(year),cue=gyuwonLyricActionAt(key,time);
 if(cue)return cue;
 const list=GYUWON_LYRIC_ACTIONS[key];if(!list)return null;
 let prev=null;for(const row of list){if(row.end<=time)prev=row;else break;}
 if(!prev)return null;
 // Instrumentals continue the previous scenery, without fabricated words.
 return {...prev,time,phase:1,weight:.30,instrumental:true};
}
export function drawGyuwonLyricStageProps(showAt,m,{start=40}={}){
 const key=m.finishing?'ending':m.year,lyric=gyuwonLyricStagePose(key,m.time);
 if(!lyric||!['5','11','ending'].includes(String(key)))return null;
 const q=ease(lyric.phase),fade=lyric.instrumental?.32:clamp((m.time-lyric.start)/.33);
 const t=m.time,visual=lyric.visual,idx=lyric.index;
 // The prop grammar is deterministic and contains no live allocations.
 let n=start;const add=o=>{if(n>90)return;showAt(n++,o);};
 const box=(x,y,z,sx,sy,sz,color=6,rotate=0)=>add({x,y,z,sx,sy,sz,color,rotate});
 const orb=(x,y,z,r,color=6)=>add({x,y,z,sx:r,sy:r,sz:r,color});
 const floor=(x,z,sx,sz,color=6)=>add({x,y:.05,z,sx,sy:.1,sz,color,flat:true});
 const rail=(x,y,z,scale=1,color=6)=>add({x,y,z,sx:scale,sy:scale,sz:scale,color});
 if(['doors','windows','mirror','question'].includes(visual)){
  for(let i=0;i<10;i++){
   const x=(i-4.5)*3.0,z=-12-(i%3)*3;
   box(x,4.2,z,.19,7.2,1.9,6);box(x+1.1,4.2,z,.19,7.2,1.9,6);
   box(x+.55,7.8,z,1.7,.23,1.9,6);
   if(visual==='mirror')orb(x+.55,4.7,z,.52,8);
   if(visual==='question')orb(x+.55,5.2+Math.sin(t+i)*.5,z,.32,6);
  }
 }else if(['roads','road','steps','floor'].includes(visual)){
  for(let i=0;i<24;i++){const z=-15+i*1.6,x=Math.sin(i*.2+idx)*1.5;
   floor(x,z,4.7-i*.055,1.5,i%2?6:9);}
 }else if(['sea','rain','fog','sky','elements'].includes(visual)){
  const waves=visual==='sea',rain=visual==='rain',sky=visual==='sky';
  for(let i=0;i<30;i++){
   const a=i*2.4+idx*.3,x=Math.sin(a)*11,y=waves?.25+Math.sin(t*2+i)*.5:rain?7+(i%7)*1.4:
    sky?8+(i%6)*.8:1.4+(i%7)*.5,z=-10+Math.cos(a)*6;
   add({x,y,z,sx:waves?1.9:.22,sy:waves?.28:rain?1.55:.35,sz:waves?1.5:.25,
    color:waves?10:rain?8:sky?8:i%2?4:0});
  }
 }else if(['stars','star','moon','sun'].includes(visual)){
  const isSun=visual==='sun';
  for(let i=0;i<(isSun?18:36);i++){
   const a=i*2.399+idx,x=Math.sin(a)*12,y=6+(i%7)*1.1,z=-12+Math.cos(a)*6;
   orb(x,y,z,isSun?.16:.11+(i%3)*.07,isSun?9:6);
  }
  if(isSun)orb(8.8,11,-17,2,9);
 }else if(visual==='crown'){
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;
   orb(Math.sin(a)*3,9+Math.abs(Math.cos(a*3))*.7,-12+Math.cos(a)*3,.4,6);}
  add({x:0,y:9,z:-12,sx:3.1,sy:.55,sz:3.1,color:6});
 }else if(visual==='sword'){
  box(0,7,-11,.25,7.3,.25,8);box(0,4.5,-11,3,.25,.4,6);
  add({x:0,y:11,z:-11,sx:.75,sy:.75,sz:.75,color:6});
 }else if(visual==='curtain'){
  for(let i=0;i<22;i++){const side=i<11?-1:1,x=side*(7+(i%11)*.25);
   box(x,7.2,-8,.29,13.8,1.1,i%2?4:7);}
 }else if(visual==='trumpet'){
  for(let i=0;i<5;i++){const x=-10+i*5;
   box(x,4,-9,.5,.5,2.9,6);orb(x,4,-6.6,.85,6);}
 }else if(['stage','ring','shield','pulse'].includes(visual)){
  for(let i=0;i<12;i++){const a=i*Math.PI/6;
   floor(Math.sin(a)*7,-12+Math.cos(a)*6,2,2,i%2?6:8);}
 }else if(['masks','clones','dancers','choir','ensemble','child'].includes(visual)){
  const count=visual==='child'?1:visual==='clones'?5:visual==='ensemble'?6:4;
  for(let i=0;i<count;i++){const x=visual==='child'?0:(i-(count-1)/2)*4.2,z=-12-Math.abs(i-(count-1)/2)*.3;
   const sway=Math.sin(t*3+i)*.35,scale=visual==='child'?.6:1;
   box(x,2.5*scale,z,1.05*scale,3.4*scale,1*scale,i%3+2);
   orb(x,5.1*scale,z,.78*scale,9);
   box(x-1.0*scale,2.9*scale+sway,z,.38*scale,2.6*scale,.4*scale,i%3+2);
   box(x+1.0*scale,2.9*scale-sway,z,.38*scale,2.6*scale,.4*scale,i%3+2);
  }
 }else if(visual==='wings'){
  for(const side of [-1,1])for(let i=0;i<9;i++){
   const a=i/9,dx=side*(1+i*1.1),yy=5+Math.sin(a*Math.PI)*3+Math.sin(t*1.6)*.2;
   add({x:dx,y:yy,z:-11,sx:.65,sy:2.7-a,sz:.6,color:8,rotate:side*.27});
  }
 }else if(['world','home','flower'].includes(visual)){
  if(visual==='home'){box(0,3,-13,7,5,5,5);box(0,6,-13,7.5,1,6,4);
   box(0,2,-9.9,1.7,3,1,9);}
  else for(let i=0;i<18;i++){const a=i*2.4,x=Math.sin(a)*11,z=-10+Math.cos(a)*5;
   orb(x,2+Math.sin(t+i)*.2,z,visual==='flower'?.34:.85,i%5+1);}
 }else if(visual==='heart'){
  for(let i=0;i<14;i++){const a=i*Math.PI*2/14;
   orb(Math.sin(a)*3,4+Math.cos(a)*2,-11,.43,i%3?4:1);}
 }else if(visual==='spotlight'||visual==='dark'){
  for(let i=0;i<8;i++){const a=i*Math.PI/4;
   floor(Math.sin(a)*9,-12+Math.cos(a)*7,1.4,1.4,visual==='dark'?7:6);}
 }else if(visual==='ribbons'){
  for(let i=0;i<30;i++){const a=i*.27+t*.5, r=3+i*.17;
   orb(Math.sin(a)*r,4+i*.13,-11+Math.cos(a)*r,.18,i%2?1:6);}
 }else if(visual==='hand'){
  box(0,4,-9,2,3,1,9);for(let i=0;i<5;i++)box(-.8+i*.4,6.1,-9,.25,1.4,.4,9);
 }
 return {id:lyric.id,visual:lyric.visual,gesture:lyric.gesture,phase:q,fade,props:n-start};
}
