import {createMenuScore} from './menu-score.mjs';
import {audioChannelGain} from './audio-preferences.mjs';

// The filename is intentionally the exact name uploaded to assets/music.
export const MENU_THEME_URL=new URL('../assets/music/maintheme.mp3',import.meta.url).href;
const clamp=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):.55;

/**
 * Plays the uploaded menu MP3; the original generated piano is a fallback only.
 * A browser gesture is required before constructing or playing an audio element.
 */
export function createMenuTheme(win,{AudioClass=win?.Audio,makeFallback=createMenuScore,fadeMs=300,now=()=>win?.performance?.now?.()??Date.now()}={}){
 const fallback=makeFallback(win);
 let audio=null,failed=typeof AudioClass!=='function',unlocked=false,disposed=false,enabled=false;
 let level=.55,blocked=false,pending=false,timer=null,from=0,target=0,started=0;
 const clearTimer=()=>{if(timer!==null){win.clearInterval(timer);timer=null;}};
 function fail(){
  if(failed||disposed)return;
  failed=true;clearTimer();
  if(audio){audio.onerror=null;try{audio.pause();}catch{}audio=null;}
  if(unlocked)fallback.unlock();
  fallback.update(enabled,level*audioChannelGain('music',win?.localStorage));
 }
 function ensure(){
  if(audio||failed||disposed||!unlocked)return;
  try{
   audio=new AudioClass(MENU_THEME_URL);
   if(typeof audio.play!=='function'||typeof audio.pause!=='function')throw Error('MP3 audio is unavailable');
   audio.preload='auto';
   audio.loop=true;
   audio.volume=0;
   audio.onerror=fail;
  }catch{audio=null;fail();}
 }
 function play(){
  if(!audio||disposed||!unlocked||!enabled||pending||blocked||!audio.paused)return;
  try{
   const result=audio.play();
   if(result?.then){
    pending=true;
    result.then(()=>{pending=false;},error=>{
     pending=false;
     if(disposed||failed)return;
     if(error?.name==='NotAllowedError'){blocked=true;return;}
     if(error?.name!=='AbortError')fail();
    });
   }
  }catch(error){
   if(error?.name==='NotAllowedError')blocked=true;
   else fail();
  }
 }
 function tick(){
  if(disposed||!audio){clearTimer();return;}
  const u=Math.min(1,Math.max(0,(now()-started)/Math.max(1,fadeMs)));
  audio.volume=clamp(from+(target-from)*u);
  if(u===1){clearTimer();if(target===0)audio.pause();}
 }
 function setTarget(value){
  if(!audio||Math.abs(target-value)<1e-5)return;
  if(timer!==null)tick();
  if(!audio)return;
  from=audio.volume;target=value;started=now();
  if(Math.abs(from-target)<1e-5){audio.volume=target;if(!target)audio.pause();clearTimer();}
  else if(timer===null)timer=win.setInterval(tick,40);
 }
 return {
  unlock(){
   if(disposed)return;
   unlocked=true;blocked=false;
   if(failed){fallback.unlock();fallback.update(enabled,level*audioChannelGain('music',win?.localStorage));return;}
   ensure();if(enabled)play();
  },
  update(on,volume=.55,{immediateStop=false}={}){
   if(disposed)return;
   enabled=Boolean(on);level=clamp(volume);
   if(failed){fallback.update(enabled,level*audioChannelGain('music',win?.localStorage));return;}
   if(!unlocked)return;
   ensure();if(failed)return;
   if(!audio)return;
   if(!enabled&&immediateStop){
    clearTimer();from=target=0;audio.volume=0;audio.pause();return;
   }
   if(enabled)play();
   setTarget(enabled?level*audioChannelGain('music',win?.localStorage):0);
  },
  async dispose(){
   if(disposed)return;
   disposed=true;enabled=false;clearTimer();
   if(audio){
    audio.onerror=null;
    try{audio.pause();audio.removeAttribute?.('src');audio.load?.();}catch{}
    audio=null;
   }
   await fallback.dispose();
  },
  get usingFallback(){return failed;},
  get source(){return MENU_THEME_URL;}
 };
}
