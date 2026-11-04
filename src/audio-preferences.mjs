// Persisted volumes shared by menu, boss music and Web Audio effects.
// All defaults remain at 1 to preserve existing loudness for saved profiles.
export const AUDIO_CHANNELS=Object.freeze(['master','music','effects','ambient','ui']);
export const AUDIO_VOLUME_PREFIX='oibung.audio.';
export function clampVolume(value,fallback=1){
 const number=Number(value);
 return Number.isFinite(number)?Math.max(0,Math.min(1,number)):fallback;
}
export function readAudioVolume(channel,storage){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 if(!AUDIO_CHANNELS.includes(channel))return 1;
 try{
  const value=storage?.getItem?.(AUDIO_VOLUME_PREFIX+channel);
  return value==null?1:clampVolume(value);
 }catch{return 1;}
}
export function writeAudioVolume(channel,value,storage){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 if(!AUDIO_CHANNELS.includes(channel))return false;
 try{storage?.setItem?.(AUDIO_VOLUME_PREFIX+channel,String(clampVolume(value)));return !!storage;}
 catch{return false;}
}
export function audioChannelGain(channel,storage){
 return readAudioVolume('master',storage)*(channel==='master'?1:readAudioVolume(channel,storage));
}
