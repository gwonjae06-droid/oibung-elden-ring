// Organic dread layer for the possessed casino: filtered air/rumble and slow breath-like pulses.
// No synthesized pitched oscillator, external asset, or independent wall-clock game state.
export function createDiceDread(factory){
 let ctx=null,source=null,filter=null,rumble=null,enabled=false,disposed=false;
 function ensure(){
  if(ctx||disposed)return Boolean(ctx);
  try{
   ctx=factory();if(!ctx)return false;
   const n=Math.max(1,Math.floor(ctx.sampleRate*2)),buffer=ctx.createBuffer(1,n,ctx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<n;i++)data[i]=Math.random()*2-1;
   source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
   filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=115;
   rumble=ctx.createGain();rumble.gain.value=0;
   source.connect(filter);filter.connect(rumble);rumble.connect(ctx.destination);source.start();
   return true;
  }catch{try{source?.stop();}catch{}try{source?.disconnect();filter?.disconnect();rumble?.disconnect();}catch{}ctx=source=filter=rumble=null;return false;}
 }
 return {
  setEnabled(on){enabled=Boolean(on)&&!disposed;},
  update(g,playing=true){
   if(disposed)return;
   const giant=g?.dice?.giant,active=enabled&&playing&&g?.status==='playing'&&!!giant;
   if(!active&&!ctx)return;
   if(active&&!ensure())return;
   const feral=giant?.temperament==='feral',t=Number.isFinite(g?.time)?g.time:0;
   const beat=active?Math.max(0,Math.sin(t*Math.PI*(feral?2.7:1.7)))**14:0;
   const target=active?(feral?.052:.027)+beat*(feral?.025:.011):0;
   rumble?.gain?.setTargetAtTime(target,ctx.currentTime,.09);
   filter?.frequency?.setTargetAtTime(feral?170:110,ctx.currentTime,.2);
  },
  dispose(){
   if(disposed)return;disposed=true;enabled=false;
   try{source?.stop();}catch{}try{source?.disconnect();filter?.disconnect();rumble?.disconnect();}catch{}
   source=filter=rumble=null;
  }
 };
}
