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
 'hit-pierce':Object.freeze(['sword2.mp3']),
 // The only new assets allowed for the player; all other assets/sfx clips are boss-only.
 healed:Object.freeze(['assets/sfx/heal.mp3']),
 'skill-heal':Object.freeze(['assets/sfx/heal.mp3']),
 death:Object.freeze(['assets/sfx/dead.mp3'])
});
export const PLAYER_CLIP_ENVELOPES=Object.freeze({
 healed:Object.freeze({gain:1.35,seconds:2.2,fade:.36,minGap:.25}),
 'skill-heal':Object.freeze({gain:1.1,seconds:1.5,fade:.28,minGap:.25}),
 death:Object.freeze({gain:.9,seconds:2.65,fade:.45,minGap:.5})
});
export function createSampleSfx({AudioClass=globalThis.Audio,now=()=>globalThis.performance?.now?.()??Date.now(),storage,coarse=()=>globalThis.matchMedia?.('(pointer: coarse)')?.matches||false,random=Math.random,schedule=fn=>globalThis.setInterval(fn,40),cancel=id=>globalThis.clearInterval(id)}={}){
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
  if(v.timer!==undefined){cancel(v.timer);v.timer=undefined;}
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
  play(name,{volume=1,minGap,onFailure}={}){
   if(!enabled||disposed||active>=maxVoices||!Object.hasOwn(SOUND_SAMPLES,name))return false;
   const envelope=PLAYER_CLIP_ENVELOPES[name],time=now(),lastAt=last.get(name)??-Infinity;
   if(time-lastAt<(minGap??envelope?.minGap??.065)*1000)return false;
   const options=SOUND_SAMPLES[name];
   const index=Math.min(options.length-1,Math.floor(random()*options.length)),file=options[index];
   const candidates=[...prepare(file),...options.filter(f=>f!==file).flatMap(f=>prepare(f))];
   const slot=candidates.find(v=>!v.playing&&!v.failed);
   if(!slot)return false;
   const v=slot;v.playing=true;active++;last.set(name,time);
   const gain=audioChannelGain('effects',storage);
   try{
    v.audio.volume=Math.min(1,Math.max(0,Number(volume)*.34*(envelope?.gain??1)*gain));
    v.audio.playbackRate=.95+random()*.12;
    v.audio.currentTime=0;
    v.audio.onended=()=>release(v);
    v.audio.onerror=()=>{if(!v.playing)return;v.failed=true;stop(v);onFailure?.();};
    const task=v.audio.play();
    if(envelope){
     const full=v.audio.volume,start=time;
     v.timer=schedule(()=>{
      if(!v.playing)return;
      const left=envelope.seconds-(now()-start)/1000;
      if(left<=0){stop(v);return;}
      v.audio.volume=full*Math.min(1,Math.max(0,left/envelope.fade));
     });
     v.timer?.unref?.();
    }
    task?.catch?.(()=>{if(!v.playing)return;v.failed=true;stop(v);onFailure?.();});
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
