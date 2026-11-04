// Synthesized panicked crowd (no recordings are needed): glissando screams plus toppling chairs.
export function createCrowdScream(makeAudio){
 let ctx=null,out=null,on=false;
 function ensure(){
  if(ctx)return true;
  try{ctx=makeAudio();if(!ctx)return false;out=ctx.createGain();out.gain.value=.6;const comp=ctx.createDynamicsCompressor();out.connect(comp);comp.connect(ctx.destination);return true;}
  catch{ctx=null;return false;}
 }
 function voice(delay,base,len,vol,pan){
  const t=ctx.currentTime+delay,end=t+len,osc=ctx.createOscillator(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain(),gain=ctx.createGain(),f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter();
  osc.type='sawtooth';osc.frequency.setValueAtTime(base,t);osc.frequency.exponentialRampToValueAtTime(base*1.9,t+len*.3);osc.frequency.exponentialRampToValueAtTime(base*1.35,end);
  lfo.frequency.value=6+Math.random()*2;lfoGain.gain.value=base*.05;lfo.connect(lfoGain);lfoGain.connect(osc.frequency);
  f1.type=f2.type='bandpass';f1.frequency.value=850;f2.frequency.value=2400;f1.Q.value=f2.Q.value=3.5;
  osc.connect(f1);osc.connect(f2);f1.connect(gain);f2.connect(gain);
  gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(vol,t+.07);gain.gain.setValueAtTime(vol,t+len*.55);gain.gain.exponentialRampToValueAtTime(.0001,end);
  let tail=gain;
  if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;gain.connect(p);tail=p;}
  tail.connect(out);
  osc.onended=()=>{for(const n of [osc,lfo,lfoGain,f1,f2,gain,tail])try{n.disconnect();}catch{}};
  osc.start(t);lfo.start(t);osc.stop(end+.05);lfo.stop(end+.05);
 }
 function crash(delay,vol){
  const t=ctx.currentTime+delay,len=Math.floor(ctx.sampleRate*.35),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len)**2;
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  s.buffer=buf;f.type='lowpass';f.frequency.value=900;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(out);
  s.onended=()=>{try{s.disconnect();f.disconnect();g.disconnect();}catch{}};s.start(t);
 }
 return {
  setEnabled(value){on=Boolean(value)&&ensure();if(on)ctx.resume?.()?.catch?.(()=>{});return on;},
  scream(){
   // Old sawtooth glissandos sounded like arcade 8-bit alarms.
   // Keep the visual crowd panic; add a licensed crowd recording later.
   return false;
  }
 };
}
