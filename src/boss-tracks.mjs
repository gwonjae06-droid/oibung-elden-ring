import {gyuwonMusicSection} from './gyuwon-music.mjs';
import {audioChannelGain} from './audio-preferences.mjs';
// External MP3 boss tracks. Sound effects keep using their own audio buses.
export const BOSS_TRACKS=Object.freeze({
  kwon:Object.freeze(['swordbgm.mp3','swordbgm2.mp3']),
  clown:Object.freeze(['clown1.mp3','clown2.mp3']),
  dice:Object.freeze(['dicebgm.mp3','dicebgm2.mp3']),
  blood:Object.freeze(['bloodbgm1.mp3','bloodbgm2.mp3']),
  gyuwon:Object.freeze([null,null,null,null,null,null])
});
export function bossTrack(state){
  if(!state||!Object.hasOwn(BOSS_TRACKS,state.boss))return null;
  if(state.boss==='gyuwon'){const section=gyuwonMusicSection(state.year),asset=BOSS_TRACKS.gyuwon[section];return asset?{key:'gyuwon:'+section,url:new URL('../assets/music/'+asset,import.meta.url).href}:null;}
  const phase=state.phase>=2?2:1;
  // Phase three reuses the second dice MP3 at a faster tempo, never the phase-one track.
  const keyPhase=state.boss==='dice'&&state.phase===3?3:phase;
  return {key:state.boss+':'+keyPhase,url:new URL('../assets/music/'+BOSS_TRACKS[state.boss][phase-1],import.meta.url).href};
}
export function createBossTracks(win=globalThis.window,{AudioClass=win?.Audio,now=()=>win?.performance?.now?.()??Date.now(),fadeMs=1200,volume=.5}={}){
  let current=null,outgoing=null,suspendedAt=null,disposed=false;
  const failed=new Set();
  const entries=()=>[current,outgoing].filter(Boolean);
  function release(entry){
    if(!entry||!entry.alive)return;
    entry.alive=false;entry.audio.onerror=null;
    try{entry.audio.pause();entry.audio.currentTime=0;entry.audio.removeAttribute?.('src');entry.audio.load?.();}catch{}
  }
  function fail(entry){
    if(!entry.alive)return;
    failed.add(entry.key);if(current===entry)current=null;if(outgoing===entry)outgoing=null;
    release(entry);
  }
  function play(entry){
    if(!entry?.alive||entry.blocked||!entry.audio.paused)return;
    try{
      const task=entry.audio.play();
      task?.catch?.(error=>{
        if(!entry.alive)return;
        if(error?.name==='NotAllowedError'){entry.blocked=true;return;}
        if(error?.name!=='AbortError')fail(entry);
      });
    }catch(error){
      if(error?.name==='NotAllowedError')entry.blocked=true;
      else fail(entry);
    }
  }
  function pause(){
    if(suspendedAt===null)suspendedAt=now();
    for(const entry of entries())try{entry.audio.pause();}catch{}
  }
  function reset(){
    for(const entry of entries())release(entry);
    current=outgoing=null;suspendedAt=null;
  }
  function update(state,enabled=true){
    if(disposed||!enabled||!state){pause();return false;}
    const track=bossTrack(state);
    if(!track||!AudioClass||failed.has(track.key)){pause();return false;}
    const time=now();
    if(suspendedAt!==null){
      const gap=Math.max(0,time-suspendedAt);
      for(const entry of entries())entry.started+=gap;
      suspendedAt=null;
    }
    if(!current||current.key!==track.key){
      release(outgoing);outgoing=current;if(outgoing)outgoing.from=outgoing.audio.volume;
      if(state.boss==='blood'&&state.cinematic&&track.key==='blood:2'){release(outgoing);outgoing=null;}
      try{
        const audio=new AudioClass(track.url);
        audio.loop=true;audio.preload='auto';audio.volume=0;audio.playbackRate=state.boss==='dice'&&state.phase===3?1.12:1;if(state.offset)audio.currentTime=state.offset;
        const entry={key:track.key,audio,started:time,alive:true,blocked:false,from:outgoing?.audio.volume??0};
        audio.onerror=()=>fail(entry);current=entry;
      }catch{if(outgoing){current=outgoing;outgoing=null;}return false;}
    }
    for(const entry of entries())play(entry);
    if(!current)return false;
    const progress=Math.min(1,Math.max(0,(time-current.started)/Math.max(1,fadeMs)));
    current.audio.volume=volume*audioChannelGain('music',win?.localStorage)*progress*Math.max(0,Math.min(1,state.gain??1));
    if(outgoing){
      outgoing.audio.volume=Math.min(1,outgoing.from??volume)* (1-progress);
      if(progress>=1){release(outgoing);outgoing=null;}
    }
    return true;
  }
  return {
    update,reset,
    unlock(){for(const entry of entries())entry.blocked=false;if(suspendedAt===null)for(const entry of entries())play(entry);},
    dispose(){if(disposed)return;disposed=true;reset();},
    get playingKey(){return current?.key??null;},
    get state(){return entries().map(e=>({key:e.key,volume:e.audio.volume,time:e.audio.currentTime,paused:e.audio.paused}));},
    get failedKeys(){return [...failed];}
  };
}
