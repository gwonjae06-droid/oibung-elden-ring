import {audioChannelGain} from './audio-preferences.mjs';

// Only use files already in the repository; never substitute a boss BGM for an effect.
// Other event types still use the existing synthesis until licensed samples are supplied.
export const SOUND_SAMPLES=Object.freeze({
 'swing-sword':Object.freeze(['sword1.mp3','sword2.mp3','sword3.mp3']),
 'boss-slash':Object.freeze(['sword1.mp3','sword2.mp3','sword3.mp3']),
 'boss-thrust':Object.freeze(['sword2.mp3','sword3.mp3']),
 'boss-whirl':Object.freeze(['sword1.mp3','sword3.mp3']),
 'skill-sword':Object.freeze(['sword3.mp3']),
 'hit-slash':Object.freeze(['sword1.mp3','sword2.mp3']),
 'hit-pierce':Object.freeze(['sword2.mp3'])
});
export function createSampleSfx({AudioClass=globalThis.Audio,now=()=>globalThis.performance?.now?.()??Date.now(),storage,coarse=()=>globalThis.matchMedia?.('(pointer: coarse)')?.matches||false,random=Math.random}={}){
 let enabled=false,disposed=false;
 const pool=new Map(),last=new Map();
 const maxVoices=coarse()?5:9;
 let active=0;
 function prepare(file){
  if(pool.has(file))return pool.get(file);
  const clips=[];pool.set(file,clips);
  if(typeof AudioClass!=='function')return clips;
  for(let i=0;i<2;i++){
   try{
    const clip=new AudioClass(new URL('../'+file,import.meta.url).href);
    clip.preload='auto';
    clips.push({audio:clip,playing:false,failed:false});
   }catch{break;}
  }
  return clips;
 }
 function release(v){
  if(!v.playing)return;
  v.playing=false;active=Math.max(0,active-1);
  try{v.audio.onended=null;v.audio.onerror=null;}catch{}
 }
 function stop(v){
  release(v);
  try{v.audio.pause();v.audio.currentTime=0;}catch{}
 }
 return {
  get enabled(){return enabled;},
  get activeCount(){return active;},
  get names(){return Object.keys(SOUND_SAMPLES);},
  setEnabled(value){enabled=Boolean(value)&&!disposed;if(!enabled)for(const clips of pool.values())for(const v of clips)stop(v);return enabled;},
  play(name,{volume=1,minGap=.065}={}){
   if(!enabled||disposed||active>=maxVoices||!Object.hasOwn(SOUND_SAMPLES,name))return false;
   const time=now(),lastAt=last.get(name)??-Infinity;
   if(time-lastAt<minGap*1000)return false;
   const options=SOUND_SAMPLES[name];
   const index=Math.min(options.length-1,Math.floor(random()*options.length)),file=options[index];
   const candidates=[...prepare(file),...options.filter(f=>f!==file).flatMap(f=>prepare(f))];
   const slot=candidates.find(v=>!v.playing&&!v.failed);
   if(!slot)return false;
   const v=slot;v.playing=true;active++;last.set(name,time);
   const gain=audioChannelGain('effects',storage);
   try{
    v.audio.volume=Math.min(1,Math.max(0,Number(volume)*.34*gain));
    v.audio.playbackRate=.95+random()*.12;
    v.audio.currentTime=0;
    v.audio.onended=()=>release(v);
    v.audio.onerror=()=>{v.failed=true;release(v);};
    const task=v.audio.play();
    task?.catch?.(()=>{v.failed=true;release(v);});
    return true;
   }catch{v.failed=true;release(v);return false;}
  },
  dispose(){
   if(disposed)return;disposed=true;enabled=false;
   for(const clips of pool.values())for(const v of clips){
    stop(v);try{v.audio.removeAttribute?.('src');v.audio.load?.();}catch{}
   }
   pool.clear();last.clear();
  }
 };
}
