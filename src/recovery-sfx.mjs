import {createSampleSfx} from './sample-sfx.mjs';

// Uses native HTMLAudioElement directly. A blocked/suspended Web Audio context
// must never silence the player's uploaded healing recording.
export function createRecoverySfx(options={}){
 const sample=createSampleSfx(options);
 const muted=options.muted||(()=>{try{return globalThis.localStorage?.getItem('oibung-muted')==='1';}catch{return false;}});
 let disposed=false;
 return {
  event(event){
   if(disposed||!event||!['heal-start','skill-heal'].includes(event.type))return false;
   if(muted()){sample.setEnabled(false);return false;}
   sample.setEnabled(true);
   const volume=event.type==='heal-start'?1.35:event.flavor==='cards'?.03:.95;
   return sample.play(event.type==='heal-start'?'healed':'skill-heal',{volume});
  },
  clear(){sample.setEnabled(false);},
  dispose(){if(disposed)return;disposed=true;sample.dispose();},
  get activeCount(){return sample.activeCount;},
  get disposed(){return disposed;}
 };
}
