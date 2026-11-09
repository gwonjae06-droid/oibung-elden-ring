import {audioChannelGain} from './audio-preferences.mjs';
export function createGyuwonFoley(makeAudio=url=>new Audio(url)){
 const bank={bike:makeAudio(new URL('../assets/sfx/bikepass.mp3',import.meta.url).href),
 gun:makeAudio(new URL('../assets/sfx/foisal72-gun-fire-346766.mp3',import.meta.url).href)};
 const seen=new Set();let owner=null,lastGun=-100;
 for(const a of Object.values(bank))a.preload='auto';
 function clear(){for(const a of Object.values(bank))a.pause();}
 return {update(g,{active=true,muted=false}={}){
  if(owner!==g){owner=g;seen.clear();clear();lastGun=-100;}
  if(!active){clear();return;}
  for(const h of g.gyuwon.hazards){
   if(h.age<h.warn||seen.has(h.id))continue;seen.add(h.id);
   const key=h.visual==='year-vehicle'?'bike':h.visual==='year-bullet'?'gun':null;
   if(!key||muted||key==='gun'&&g.time-lastGun<.075)continue;
   if(key==='gun')lastGun=g.time;
   const a=bank[key];a.volume=(key==='gun'?.46:.62)*audioChannelGain('effects');
   a.pause();a.currentTime=0;try{a.play()?.catch(()=>{});}catch{}
  }
  const live=new Set(g.gyuwon.hazards.map(h=>h.id));for(const id of seen)if(!live.has(id))seen.delete(id);
 },clear,dispose(){clear();for(const a of Object.values(bank)){a.removeAttribute?.('src');a.load?.();}}};
}
