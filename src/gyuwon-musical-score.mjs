import {audioChannelGain} from './audio-preferences.mjs';
import {GYUWON_SONGS,gyuwonSongKey} from './gyuwon-song-data.mjs';

// Combat reads this media clock. Muting changes gain; pausing preserves position.
export function createGyuwonMusicalScore(makeAudio=url=>new Audio(url),now=()=>performance.now()/1000){
 let owner=null,key=null,current=null,disposed=false,enabled=false;
 const cache=new Map();
 function release(a){a.onended=a.onerror=null;a.pause();a.removeAttribute?.('src');a.load?.();}
 function get(id){
  if(cache.has(id))return cache.get(id);
  const file=id==='prelude'?'swordbgm.mp3':GYUWON_SONGS[id].file;
  const a=makeAudio(new URL('../assets/music/'+file,import.meta.url).href);
  a.preload='auto';a.loop=id==='prelude';cache.set(id,a);return a;
 }
 function clear(){for(const a of cache.values())release(a);cache.clear();current=null;key=null;}
 function select(g,id){
  current?.audio.pause();key=id;
  const audio=get(id),m=g.gyuwon.years?.musical;
  current={audio,model:m,clock:{time:0,duration:GYUWON_SONGS[id]?.duration||0,ended:false,source:'media',afterEnd:0},lastTime:0,lastProgress:now(),lastTick:now(),wasEnded:false,fallback:false,pending:false};
  const entry=current;audio.currentTime=0;
  audio.onended=()=>{if(current===entry&&enabled&&!entry.fallback&&!audio.loop)entry.clock.ended=true;};
  audio.onerror=()=>fallback(entry);
  if(m)m.clock=entry.clock;
  const next=typeof id==='number'?(id<11?id+1:'ending'):null;
  for(const [k,a]of cache)if(k!==id&&k!==next){release(a);cache.delete(k);}
  if(next)get(next);
 }
 function fallback(entry){
  if(current!==entry||entry.fallback)return;
  entry.fallback=true;entry.audio.pause();entry.clock.source='fallback';
  entry.clock.time=Math.max(entry.clock.time,entry.model?.time||0);
 }
 function bridge(entry){
  const stamp=now(),delta=Math.max(0,stamp-entry.lastTick);entry.lastTick=stamp;
  if(entry.clock.ended){if(entry.wasEnded)entry.clock.afterEnd+=delta;entry.wasEnded=true;}
 }
 function update(g,{enabled:active=true,muted=false}={}){
  if(disposed)return false;
  if(owner!==g){clear();owner=g;}
  enabled=active;
  const m=g?.gyuwon?.years?.musical,id=m?gyuwonSongKey(m):'prelude';
  if(key!==id)select(g,id);
  const e=current,a=e.audio;
  a.muted=muted;a.volume=(id==='prelude'?.24:.7)*audioChannelGain('music');
  if(!active){a.pause();e.lastProgress=e.lastTick=now();return true;}
  if(e.fallback){e.clock.time+=Math.max(0,now()-e.lastTick);e.clock.ended=e.clock.time>=e.clock.duration;bridge(e);return false;}
  if(Number.isFinite(a.duration)&&a.duration>0)e.clock.duration=a.duration;
  if(Number.isFinite(a.currentTime))e.clock.time=Math.max(e.clock.time,a.currentTime);
  if(a.ended&&!a.loop)e.clock.ended=true;bridge(e);
  if(e.clock.time>e.lastTime+.005){e.lastTime=e.clock.time;e.lastProgress=now();}
  if(!e.clock.ended&&now()-e.lastProgress>6)fallback(e);
  if(a.paused&&!e.clock.ended&&!e.pending&&!e.fallback){
   e.pending=true;
   try{Promise.resolve(a.play()).catch(()=>fallback(e)).finally(()=>{e.pending=false;if(!enabled||current!==e)a.pause();});}
   catch{e.pending=false;fallback(e);}
  }
  return true;
 }
 function stop(){enabled=false;current?.audio.pause();if(current)current.lastProgress=current.lastTick=now();}
 return {update,stop,dispose(){if(disposed)return;disposed=true;stop();clear();},get mode(){return key;}};
}
