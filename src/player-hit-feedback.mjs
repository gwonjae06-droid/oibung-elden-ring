import {audioChannelGain} from './audio-preferences.mjs';

// The requested hit.mp3 has not been uploaded yet. The URL becomes active on
// the next page load once it exists; a 404 never suppresses the visual hit cue.
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
 let disposed=false,last=0,hitAudio=null,missing=false;
 function sound(){
  if(muted()||missing||typeof AudioClass!=='function')return;
  try{
   if(!hitAudio){hitAudio=new AudioClass(PLAYER_HIT_MP3_URL);hitAudio.preload='auto';hitAudio.onerror=()=>{missing=true;hitAudio?.pause?.();};}
   hitAudio.pause?.();hitAudio.currentTime=0;
   hitAudio.volume=Math.min(.44,.30*audioChannelGain('effects'));
   const p=hitAudio.play?.();p?.catch?.(()=>{missing=true;});
  }catch{missing=true;}
 }
 function clear(){cover.classList.remove('active');if(hitAudio)try{hitAudio.pause();hitAudio.currentTime=0;}catch{}}
 function hit(event){
  if(disposed||!event||!['player-hit','hurt','player-crushed'].includes(event.type))return false;
  if(event.type!=='player-crushed'&&!(Number(event.amount)>0))return false;
  cover.classList.remove('active');
  // Restart animation even if hits arrive in rapid succession.
  void cover.offsetWidth;
  cover.classList.add('active');last=now();
  sound();return true;
 }
 function dispose(){if(disposed)return;disposed=true;clear();if(hitAudio){hitAudio.onerror=null;hitAudio.removeAttribute?.('src');hitAudio.load?.();hitAudio=null;}style.remove();cover.remove();}
 return {hit,clear,dispose,get lastHitAt(){return last;}};
}
