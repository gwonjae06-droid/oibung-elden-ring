import {audioChannelGain} from './audio-preferences.mjs';
export function createDanceCueAudio(make=url=>new Audio(url)){
 const voices=Array.from({length:4},()=>{const a=make(new URL('../clap.mp3',import.meta.url).href);a.preload='auto';return a;});
 let queue=[],owner=null,index=0;
 return {event(e,g){if(e.type!=='gyuwon-dance-cue')return;const m=g.gyuwon.years.musical,rate=e.kind==='pose'?.9:e.kind==='turn'?1.2:1.6;queue.push({at:m.time,rate});if(e.kind==='turn')queue.push({at:m.time+m.dancePeriod*.5,rate});},update(g,{active=true,muted=false}={}){
  if(owner!==g){owner=g;queue=[];for(const a of voices)a.pause();}
  const m=g.gyuwon.years?.musical;if(!m||m.year!==8){queue=[];return;}
  if(!active){for(const a of voices)a.pause();return;}
  queue=queue.filter(q=>{if(q.at>m.time)return true;if(!muted){const a=voices[index++%voices.length];a.pause();a.currentTime=0;a.playbackRate=q.rate;a.volume=.27*audioChannelGain('effects');try{a.play()?.catch(()=>{});}catch{}}return false;});
 },dispose(){queue=[];for(const a of voices){a.pause();a.removeAttribute?.('src');a.load?.();}}};
}
