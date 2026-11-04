import {audioChannelGain} from './audio-preferences.mjs';

// The uploaded hit.mp3 plays for every accepted player damage event.
// A small voice pool avoids cutting off consecutive impacts.
export const PLAYER_HIT_MP3_URL=new URL('../assets/sfx/hit.mp3',import.meta.url).href;
export function createPlayerHitFeedback(shell,{AudioClass=globalThis.Audio,muted=()=>{try{return globalThis.localStorage?.getItem('oibung-muted')==='1';}catch{return false;}},now=()=>Date.now()}={}){
 if(!shell?.ownerDocument||!shell.appendChild)return {hit(){return false;},clear(){},dispose(){}};
 const doc=shell.ownerDocument,style=doc.createElement('style'),cover=doc.createElement('div');
 style.textContent=`
 .oden-hit-overlay{position:absolute;inset:0;pointer-events:none;z-index:38;opacity:0;visibility:hidden;background:radial-gradient(ellipse 72% 68% at 50% 48%,transparent 30%,rgba(122,0,12,.38) 65%,rgba(92,0,6,.89) 100%),linear-gradient(120deg,rgba(255,221,211,.16),transparent 40%);mix-blend-mode:normal}
 .oden-hit-overlay.active{visibility:visible;animation:oden-damage-flash .48s cubic-bezier(.08,.65,.3,1) both}
 @keyframes oden-damage-flash{0%{opacity:.95}17%{opacity:1}35%{opacity:.63}100%{opacity:0}}
 @media(prefers-reduced-motion:reduce){.oden-hit-overlay.active{animation:oden-damage-flash .65s ease-out both}}
 `;
 cover.className='oden-hit-overlay';cover.setAttribute('aria-hidden','true');
 shell.append(style,cover);
 let disposed=false,last=0,clips=[],missing=false,serial=0;
 function sound(){
  if(muted()||missing||typeof AudioClass!=='function')return;
  try{
   // Reuse finished clips first. Keep at most three simultaneous player hit voices.
   let slot=clips.find(v=>v.audio.paused||v.audio.ended);
   if(!slot&&clips.length<3){
    const audio=new AudioClass(PLAYER_HIT_MP3_URL);audio.preload='auto';
    slot={audio,serial:0};audio.onerror=()=>{missing=true;try{audio.pause();}catch{}};
    clips.push(slot);
   }
   if(!slot)slot=clips.reduce((old,v)=>v.serial<old.serial?v:old);
   const audio=slot.audio;slot.serial=++serial;
   audio.pause?.();audio.currentTime=0;
   audio.volume=Math.min(.48,.42*audioChannelGain('effects'));
   const task=audio.play?.();
   task?.catch?.(error=>{
    // Do not permanently disable audio because one autoplay attempt was blocked.
    if(error?.name!=='NotAllowedError'&&error?.name!=='AbortError')missing=true;
   });
  }catch{missing=true;}
 }
 function clear(){cover.classList.remove('active');for(const {audio} of clips)try{audio.pause();audio.currentTime=0;}catch{}}
 function hit(event){
  if(disposed||!event||!['player-hit','hurt','player-crushed'].includes(event.type))return false;
  if(event.type!=='player-crushed'&&!(Number(event.amount)>0))return false;
  cover.classList.remove('active');
  // Restart animation even if hits arrive in rapid succession.
  void cover.offsetWidth;
  cover.classList.add('active');last=now();
  sound();return true;
 }
 function dispose(){if(disposed)return;disposed=true;clear();for(const {audio} of clips){audio.onerror=null;audio.removeAttribute?.('src');audio.load?.();}clips=[];style.remove();cover.remove();}
 return {hit,clear,dispose,get lastHitAt(){return last;}};
}
