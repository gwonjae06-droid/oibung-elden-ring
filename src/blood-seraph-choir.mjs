// Music-driven visual cues for the third-phase Seraph.
// The only source is the ACTUAL phase-two MP3 playback, not an independent
// metronome or new SFX. Uses a non-invasive captureStream analyser when the
// browser supports one; unsupported/private audio environments simply fall
// back to calm, non-synchronised idle wings.
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
let current=null;
const clock=()=>globalThis.performance?.now?.()??Date.now();
export function publishBloodSeraphChoir({seconds=0,energy=0,crescendo=0,accent=0,source='none'}={},at=clock()){
 current={seconds:Math.max(0,seconds),energy:clamp(energy),
  crescendo:clamp(crescendo),accent:clamp(accent),source,
  at:Number.isFinite(at)?at:clock()};
}
export function resetBloodSeraphChoir(){current=null;}
export function bloodSeraphChoirCue(at=clock()){
 if(!current||at-current.at>600||current.at-at>200)
  return {active:false,seconds:0,energy:0,crescendo:0,accent:0,source:'none'};
 return {active:current.source==='audio',seconds:current.seconds,
  energy:current.energy,crescendo:current.crescendo,accent:current.accent,source:current.source};
}

// An audio probe is deliberately connected to a MUTED, captured stream.
// Unlike createMediaElementSource(audio), it NEVER reroutes the main
// <audio> node, so autoplay unlocking, music volume, speed and crossfades
// keep working even when the optional analyser is not available.
export function createBloodSeraphChoirProbe(win,audio){
 const AudioContext=win?.AudioContext||win?.webkitAudioContext;
 if(!AudioContext||typeof audio?.captureStream!=='function')return null;
 let stream,ctx,source,analyser,silence;
 try{
  stream=audio.captureStream();
  if(!stream?.getAudioTracks?.().length)return null;
  ctx=new AudioContext();
  analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.82;
  source=ctx.createMediaStreamSource(stream);
  silence=ctx.createGain();silence.gain.value=0;
  source.connect(analyser);analyser.connect(silence);silence.connect(ctx.destination);
 }catch(error){
  try{ctx?.close?.();}catch{}
  return null;
 }
 const bins=new Uint8Array(analyser.frequencyBinCount);
 let baseline=0,previous=0,level=0,disposed=false;
 function unlock(){if(!disposed)try{ctx.resume()?.catch?.(()=>{});}catch{}}
 function sample(){
  if(disposed||ctx.state!=='running'||audio.paused)return null;
  analyser.getByteFrequencyData(bins);
  // The vocal/choir band is mostly present in the 220-2300 Hz spectrum.
  // We measure sustained spectral rise, not guessed choir timestamps.
  const spacing=ctx.sampleRate/analyser.fftSize;
  const lo=Math.max(1,Math.round(220/spacing)),hi=Math.min(bins.length-1,Math.round(2300/spacing));
  if(hi<=lo)return null;
  let sum=0;for(let i=lo;i<=hi;i++)sum+=bins[i];
  const raw=sum/((hi-lo+1)*255);
  level=level*.68+raw*.32;
  baseline=baseline*.973+level*.027;
  const crescendo=clamp((level-baseline)*5.8);
  const accent=clamp((level-previous)*13.5);
  previous=previous*.70+level*.30;
  return {seconds:audio.currentTime,energy:clamp(level*2.6),
   crescendo,accent,source:'audio'};
 }
 function dispose(){
  if(disposed)return;disposed=true;
  try{source?.disconnect();analyser?.disconnect();silence?.disconnect();}catch{}
  try{ctx?.close?.();}catch{}
 }
 return {unlock,sample,dispose,get active(){return !disposed&&ctx.state==='running';}};
}
