// Act VII's Canvas2D equivalent of the Act V living-ink postprocess.
// Keep world + soldiers in the ink pass; the gameplay HUD and HTML controls
// are drawn afterwards, so currencies, subtitles and touch targets stay crisp.
// The world is never frozen: only its subtle contour stencil updates at 8 Hz.
export const GYUWON_ARMY_DOODLE_WIDTH=320;
export const GYUWON_ARMY_DOODLE_HEIGHT=180;
export const gyuwonArmyDoodleFrame=(time=0,reducedMotion=false)=>
 reducedMotion?0:Math.floor(Math.max(0,Number.isFinite(time)?time:0)*8)%2;
export const gyuwonArmyDoodleSample=(time=0,reducedMotion=false)=>
 reducedMotion?Math.floor(Math.max(0,time)*4):Math.floor(Math.max(0,time)*8);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const grainHash=(x,y,seed=7)=>{
 let z=Math.imul((x|0)^seed,374761393)+Math.imul((y|0)+seed,668265263);
 z=Math.imul(z^(z>>>13),1274126177);return ((z^(z>>>16))>>>0)/4294967295;
};
// Published separately so tests can check the CPU budget and ink-strength
// contract without opening a browser, WebGL renderer, or audio track.
export function gyuwonArmyInkAlpha(gradient,lightness,frame=0){
 const edge=clamp((gradient-.035)*4.8);
 const dark=clamp((.44-lightness)*1.8)*.1;
 const paperHatch=lightness<.56&&frame?.012:0;
 return Math.round(255*clamp(edge*.65+dark+paperHatch,0,.72));
}
export function createGyuwonArmyDoodle(doc,{reducedMotion=false}={}){
 const sample=doc.createElement('canvas'),outline=doc.createElement('canvas');
 const paper=doc.createElement('canvas');
 const W=GYUWON_ARMY_DOODLE_WIDTH,H=GYUWON_ARMY_DOODLE_HEIGHT;
 sample.width=outline.width=W;sample.height=outline.height=H;
 paper.width=paper.height=128;
 const sctx=sample.getContext('2d',{willReadFrequently:true});
 const octx=outline.getContext('2d');
 const pctx=paper.getContext('2d');
 let pattern=null,disabled=false,lastTick=-1,inkFrames=0,grainFrames=0;
 if(pctx){
  pctx.clearRect(0,0,128,128);
  // Pixel-stable paper grain. Never regenerate each frame: no TV noise.
  for(let i=0;i<1350;i++){
   const x=Math.floor(grainHash(i,17)*128),y=Math.floor(grainHash(13,i)*128);
   const a=.13+grainHash(i,31)*.19;
   pctx.fillStyle='rgba(49,37,35,'+a.toFixed(3)+')';
   pctx.fillRect(x,y,grainHash(i,3)>.88?2:1,1);
  }
  pctx.lineWidth=.6;
  for(let i=0;i<175;i++){
   const x=grainHash(i,93)*128,y=grainHash(55,i)*128;
   pctx.strokeStyle='rgba(77,62,52,'+(.08+grainHash(i,74)*.18).toFixed(3)+')';
   pctx.beginPath();pctx.moveTo(x,y);pctx.lineTo(x+2.5,y-.7);pctx.stroke();
  }
 }
 function refresh(worldCanvas,{left=0,top=0,scale=1,ratio=1}={}){
  if(!sctx||!octx||!worldCanvas||scale<=0)return false;
  // Rendered screen pixels are cropped back to the fixed virtual stage.
  const sx=left*ratio,sy=top*ratio,sw=1280*scale*ratio,sh=720*scale*ratio;
  try{
   sctx.clearRect(0,0,W,H);
   sctx.drawImage(worldCanvas,sx,sy,sw,sh,0,0,W,H);
   const src=sctx.getImageData(0,0,W,H).data;
   const image=octx.createImageData(W,H),dst=image.data;
   // 320 x 180 x 3 taps; independent of display resolution and device DPR.
   // Read only the previous/right/below pixels; geometry remains authoritative.
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const p=(y*W+x)*4,r=(y*W+Math.min(W-1,x+1))*4,
     d=(Math.min(H-1,y+1)*W+x)*4;
    const lum=(i)=>.299*src[i]+.587*src[i+1]+.114*src[i+2];
    const v=lum(p),edge=(Math.abs(v-lum(r))+Math.abs(v-lum(d)))/255;
    const hatch=((x+y*2)%11===0)?1:0;
    const a=gyuwonArmyInkAlpha(edge,v/255,hatch);
    dst[p]=19;dst[p+1]=17;dst[p+2]=22;dst[p+3]=a;
   }
   octx.putImageData(image,0,0);
   inkFrames++;return true;
  }catch(error){
   // Cross-origin portrait textures can taint a Canvas2D on some hosts.
   // Paper and existing vector outlines remain instead of breaking the game.
   disabled=true;return false;
  }
 }
 function draw(worldCanvas,ctx,{time=0,left=0,top=0,scale=1,ratio=1,quiet=false}={}){
  if(!ctx)return false;
  const tick=gyuwonArmyDoodleSample(time,reducedMotion);
  if(!disabled&&lastTick!==tick){
   if(refresh(worldCanvas,{left,top,scale,ratio}))lastTick=tick;
  }
  ctx.save();
  // Extremely restrained watercolor-on-paper wash: preserves the blue
  // night, crimson flags, and unit silhouettes rather than whitening them.
  ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=quiet?.105:.065;
  ctx.fillStyle=quiet?'#a6a0bb':'#f8e9c8';ctx.fillRect(0,0,1280,720);
  ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.25;
  if(!pattern&&pctx)pattern=ctx.createPattern(paper,'repeat');
  if(pattern){ctx.fillStyle=pattern;ctx.fillRect(0,0,1280,720);grainFrames++;}
  // A/B redraw: only ink shifts a fraction of a pixel. The unit model,
  // target positions, and hitboxes never wobble.
  if(!disabled&&lastTick>=0){
   ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.72;
   ctx.imageSmoothingEnabled=true;
   ctx.drawImage(outline,gyuwonArmyDoodleFrame(time,reducedMotion)?.55:-.55,0,1280,720);
  }
  ctx.restore();
  return !disabled&&lastTick>=0;
 }
 return {draw,stats:()=>({active:!disabled,inkFrames,grainFrames,sampleWidth:W,sampleHeight:H}),
  dispose(){sample.width=sample.height=0;outline.width=outline.height=0;paper.width=paper.height=0;pattern=null;}};
}
