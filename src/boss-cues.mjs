import {audioChannelGain} from './audio-preferences.mjs';

// Recorded cues shared by every implemented boss. This module never synthesizes
// substitute tones, and it leaves combat BGM on the independent music bus.
export const BOSS_CUE_FILES=Object.freeze({
 start:'bossstart.mp3',
 die:'bossdie.mp3'
});
const CUE_VOLUME=Object.freeze({start:.34,die:.48});
export const BOSS_DIE_MAX_MS=3000;

export function createBossCues({AudioClass=globalThis.Audio,storage=globalThis.localStorage,muted=()=>{try{return storage?.getItem('oibung-muted')==='1';}catch{return false;}},schedule=fn=>globalThis.setTimeout(fn,BOSS_DIE_MAX_MS),cancel=id=>globalThis.clearTimeout(id)}={}){
 const voices=new Map();let disposed=false,deathTimer=null;
 function stop(kind){
  if(!kind||kind==='die'){
   if(deathTimer!==null){cancel(deathTimer);deathTimer=null;}
   const dying=voices.get('die');if(dying)dying.ontimeupdate=null;
  }
  const keys=kind?[kind]:[...voices.keys()];
  for(const key of keys){const audio=voices.get(key);if(!audio)continue;try{audio.pause();audio.currentTime=0;}catch{}}
 }
 function play(kind){
  if(disposed||!Object.hasOwn(BOSS_CUE_FILES,kind)||typeof AudioClass!=='function'||muted())return false;
  try{
   stop();
   let audio=voices.get(kind);
   if(!audio){
    audio=new AudioClass(new URL('../assets/sfx/'+BOSS_CUE_FILES[kind],import.meta.url).href);
    audio.preload='auto';voices.set(kind,audio);
   }
   audio.currentTime=0;
   audio.volume=Math.min(1,CUE_VOLUME[kind]*audioChannelGain('effects',storage));
   const task=audio.play();
   task?.catch?.(()=>{}); // Browser autoplay can be blocked; never break the boss encounter.
   if(kind==='die'){
    // Timer limits wall-clock playback; media-time guard handles throttled tabs.
    audio.ontimeupdate=()=>{if(audio.currentTime>=BOSS_DIE_MAX_MS/1000)stop('die');};
    deathTimer=schedule(()=>{deathTimer=null;stop('die');});
   }
   return true;
  }catch{return false;}
 }
 function dispose(){
  if(disposed)return;disposed=true;stop();
  for(const audio of voices.values())try{audio.removeAttribute?.('src');audio.load?.();}catch{}
  voices.clear();
 }
 return {play,stop,dispose};
}
let shared=null;
export function playBossCue(kind){shared??=createBossCues();return shared.play(kind);}
export function stopBossCue(kind){shared?.stop(kind);}
