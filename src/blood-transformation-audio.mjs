import {audioChannelGain} from './audio-preferences.mjs';
import {smooth} from './blood-transformation.mjs';

// Original recordings, unchanged. Start offsets remove only measured leading silence.
export const BLOOD_CINEMATIC_CUES=Object.freeze([
 {name:'prayer',file:'womanvoice.mp3',at:.6,offset:.077,gain:.29,end:4.4},
 {name:'bell',file:'bell.mp3',at:1.8,offset:.157,gain:.62,end:4.6}
]);
export function createBloodTransformationAudio({AudioClass=globalThis.Audio,storage,makeContext}={}){
 let disposed=false,wasActive=false,ctx=null,room=null,gate=null;const clips=new Map(),fired=new Set(),nodes=[];
 for(const cue of BLOOD_CINEMATIC_CUES)if(AudioClass){const audio=new AudioClass(new URL('../assets/sfx/'+cue.file,import.meta.url).href);audio.preload='auto';clips.set(cue.name,{audio,cue,started:false});}
 function stop(){if(gate)gate.gain.value=0;for(const {audio}of clips.values())try{audio.pause();audio.currentTime=0;}catch{} }
 function reset(){stop();fired.clear();wasActive=false;for(const v of clips.values()){v.started=v.failed=false;v.attempts=0;}}
 function unlock(){
  if(disposed||ctx||!makeContext)return;
  try{ctx=makeContext();if(!ctx)return;gate=ctx.createGain();gate.gain.value=0;gate.connect(ctx.destination);room=ctx.createGain();room.gain.value=.13;const delay=ctx.createDelay(.5),feedback=ctx.createGain(),filter=ctx.createBiquadFilter();delay.delayTime.value=.19;feedback.gain.value=.25;filter.type='lowpass';filter.frequency.value=2700;room.connect(delay);delay.connect(filter);filter.connect(gate);filter.connect(feedback);feedback.connect(delay);nodes.push(gate,room,delay,feedback,filter);
   for(const v of clips.values()){const source=ctx.createMediaElementSource(v.audio);source.connect(gate);source.connect(room);nodes.push(source);}ctx.resume()?.catch(()=>{});
  }catch{/* Direct playback remains available when spatial processing is unsupported. */}
 }
 function update(g,{running=true,muted=false}={}){
  if(disposed)return;const active=g.boss.state==='transition'&&g.boss.phase===2;
  if(!active){if(wasActive)stop();wasActive=false;return;}
  if(!wasActive){fired.clear();wasActive=true;for(const v of clips.values()){v.started=v.failed=false;v.attempts=0;}}
  if(gate)gate.gain.value=running&&!muted?1:0;
  const t=g.blood.t,gain=audioChannelGain('effects',storage);
  for(const v of clips.values()){
   const {audio,cue}=v;
   if(!running||muted){audio.pause();continue;}
   if(t>=cue.end){audio.pause();continue;}
   if(!fired.has(cue.name)&&t>=cue.at){fired.add(cue.name);v.started=true;try{audio.currentTime=cue.offset+Math.max(0,t-cue.at);}catch{}}
   audio.volume=Math.min(1,cue.gain*gain*(1-smooth(cue.end-.45,cue.end,t)));
   if(v.started&&!v.failed&&audio.paused&&!audio.ended){try{audio.currentTime=cue.offset+Math.max(0,t-cue.at);v.attempts++;audio.play()?.catch(()=>{v.failed=true;});}catch{v.failed=true;}}
  }
 }
 return {update,unlock,reset,skip:()=>{stop();for(const cue of BLOOD_CINEMATIC_CUES)fired.add(cue.name);},
  get fired(){return [...fired];},get state(){return [...clips.values()].map(v=>({name:v.cue.name,attempts:v.attempts||0,paused:v.audio.paused,time:v.audio.currentTime,volume:v.audio.volume,failed:!!v.failed}));},dispose(){if(disposed)return;reset();disposed=true;for(const {audio}of clips.values()){audio.removeAttribute?.('src');audio.load?.();}clips.clear();for(const n of nodes)n.disconnect();ctx?.close()?.catch(()=>{});}};
}
