import {readBattleSession} from './battle-session.mjs';
import {openCoopRoom,COOP_BOSSES} from './coop-ui.mjs';
const installed=new WeakMap();
export function coopWeapon(doc){
 const names={검:'sword',망치:'hammer',활:'bow',카드:'cards'};
 for(const id of ['dice-battle','clown-battle']){const modal=doc.getElementById(id);if(!modal?.open)continue;const root=modal.firstElementChild?.shadowRoot,weapon=readBattleSession(root)?.game?.weapon||names[root?.getElementById('weapon-label')?.textContent?.trim()];if(weapon)return weapon;}
 return readBattleSession(doc)?.game?.weapon||doc.querySelector('#menu .weapon.selected')?.dataset.weapon||'sword';
}
export function installCoopMenu(doc=globalThis.document,win=globalThis.window,{openRoom=openCoopRoom}={}){
 if(!doc||!win)return null;if(installed.has(doc))return installed.get(doc);
 let active=null,disposed=false,observer=null;const rows=new Map(),style=doc.createElement('style');
 style.textContent='.boss-secret .coop-secret-row{display:flex;gap:8px;align-items:stretch}.boss-secret .coop-secret-row>[data-boss]{flex:1;min-width:0}.boss-secret .coop-secret-row>[data-coop-boss]{flex:0 0 90px;width:auto}';
 const safely=fn=>{try{fn();}catch(error){console.warn('Coop menu cleanup failed',error);}};
 const closeRoom=view=>{if(typeof view?.dispose==='function')view.dispose();else view?.close?.({restoreFocus:false});};
 function releaseRow(button,{row,join}){join.onclick=null;join.remove();if(row.parentNode){for(const child of [...row.children])row.parentNode.insertBefore(child,row);row.remove();}rows.delete(button);}
 function scan(){
  if(disposed)return;for(const [b,record] of [...rows])if(record.row.isConnected===false)releaseRow(b,record);
  for(const b of doc.querySelectorAll('.boss-secret [data-boss]')){
   const boss=b.dataset.boss;if(rows.has(b)||!Object.hasOwn(COOP_BOSSES,boss))continue;
   const row=doc.createElement('div');row.className='coop-secret-row';b.parentNode.insertBefore(row,b);row.append(b);const join=doc.createElement('button');join.type='button';join.dataset.coopBoss=boss;join.textContent='방 참가';join.setAttribute('aria-label',COOP_BOSSES[boss]+' 방 참가');row.append(join);rows.set(b,{row,join});
   join.onclick=e=>{if(disposed)return;e.preventDefault();e.stopPropagation();try{const next=openRoom({boss,weapon:coopWeapon(doc),doc,win});if(disposed){safely(()=>closeRoom(next));return;}const old=active;active=next;if(old&&old!==next)safely(()=>closeRoom(old));}catch(error){if(!disposed){const status=row.closest('.boss-secret')?.querySelector('p');if(status)status.textContent=error.message;}}};
  }
 }
 function pagehide(e){if(!e.persisted)control.dispose();}
 const control={dispose(){if(disposed)return;disposed=true;safely(()=>observer?.disconnect());win.removeEventListener?.('pagehide',pagehide,true);const old=active;active=null;safely(()=>closeRoom(old));for(const [b,record] of [...rows])safely(()=>releaseRow(b,record));rows.clear();safely(()=>style.remove());installed.delete(doc);},get disposed(){return disposed;}};
 installed.set(doc,control);
 try{doc.head.append(style);observer=new win.MutationObserver(scan);observer.observe(doc.body,{childList:true,subtree:true});win.addEventListener?.('pagehide',pagehide,{capture:true});scan();}catch(error){control.dispose();throw error;}
 return control;
}
