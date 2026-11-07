import {audioChannelGain} from './audio-preferences.mjs';
// Real MP3s only. Bounded stage-only pool: no synthetic 8-bit fallback.
// Every voice starts from a verified assets/sfx path and respects user mute.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export function createClownRecordedFoley({AudioClass=globalThis.Audio,
 muted=()=>{try{return globalThis.localStorage?.getItem('oibung-muted')==='1'}catch{return false}},
 gain=()=>audioChannelGain('effects'),now=()=>globalThis.performance?.now?.()??Date.now(),maxVoices=5}={}){
 const pool=new Map(),active=new Set(),last=new Map();let disposed=false;
 function stopVoice(v){
  if(!v)return;
  active.delete(v);v.active=false;v.left=0;
  try{v.a.pause();v.a.currentTime=0;v.a.onended=null;v.a.onerror=null;}catch{}
 }
 function play(spec){
  if(disposed||!spec||muted()||typeof AudioClass!=='function')return false;
  const file=String(spec.file||'');
  if(!/^assets\/sfx\/[\w. ()-]+\.mp3$/.test(file))return false;
  const t=now(),gap=clamp(spec.minGap??.18,.08,3);
  if(t-(last.get(file)??-Infinity)<gap*1000)return false;
  const voices=pool.get(file)||[];
  let v=voices.find(x=>!x.active);
  if(!v&&active.size>=maxVoices)return false;
  if(!v){try{
   const a=new AudioClass(new URL('../'+file,import.meta.url).href);a.preload='auto';
   v={a,active:false,left:0,fade:.14,volume:0};
   voices.push(v);pool.set(file,voices);
  }catch{return false;}}
  v.active=true;v.left=clamp(spec.duration??1,.1,2.8);
  v.fade=clamp(spec.fade??.14,.05,.9);
  v.volume=clamp((spec.volume??.16)*clamp(gain(),0,2),0,.65);
  try{
   v.a.volume=v.volume;v.a.playbackRate=clamp(spec.rate??1,.75,1.35);
   v.a.currentTime=0;v.a.onended=()=>stopVoice(v);v.a.onerror=()=>stopVoice(v);
   const p=v.a.play();p?.catch?.(()=>stopVoice(v));
   active.add(v);last.set(file,t);return true;
  }catch{stopVoice(v);return false;}
 }
 function update(dt=0){
  const h=clamp(dt,0,.1);if(!h||disposed)return;
  for(const v of [...active]){
   v.left-=h;
   if(v.left<=0){stopVoice(v);continue;}
   v.a.volume=v.volume*clamp(v.left/v.fade,0,1);
  }
 }
 function stop(){for(const v of [...active])stopVoice(v);}
 function dispose(){if(disposed)return;stop();disposed=true;
  for(const voices of pool.values())for(const v of voices){
   try{v.a.removeAttribute?.('src');v.a.load?.();}catch{}
  }
  pool.clear();last.clear();
 }
 return {play,update,stop,dispose,stats:()=>({active:active.size,files:pool.size})};
}
