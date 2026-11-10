import {battleDialogSelector} from './battle-dialogs.mjs';
import {applyBossDamage} from './boss-damage.mjs';
// TEMP DEV: remove this module and its battle-session wiring before release.
const AMOUNT=500,TEXT_INPUT=/^(INPUT|TEXTAREA|SELECT)$/;
export function installDevBossDamage(root,read){
 const doc=root.ownerDocument||root,win=doc.defaultView;
 if(!win?.addEventListener)return ()=>{};
 let disposed=false;
 function current(g){
  if(disposed)return false;
  const host=root.host;
  if(host){if(!host.closest?.('dialog')?.open)return false;}
  else if(doc.querySelector?.(battleDialogSelector()))return false;
  const state=read();return !!state?.active&&state.game===g&&g?.status==='playing'&&!g.odenPrizeEvent;
 }
 function onKey(event){
  if(disposed||event.code!=='Semicolon'||event.shiftKey||event.repeat||event.isComposing||event.ctrlKey||event.altKey||event.metaKey)return;
  if(event.composedPath?.().some(el=>el?.isContentEditable||TEXT_INPUT.test(el?.tagName||'')))return;
  const g=read()?.game;if(!g?.boss||!current(g))return;
  event.preventDefault();
  applyBossDamage(g,AMOUNT,{isCurrent:()=>current(g)}).catch(error=>console.error('Dev damage failed',error));
 }
 win.addEventListener('keydown',onKey,true);
 return ()=>{disposed=true;win.removeEventListener('keydown',onKey,true);};
}
