import {BOSS_REGISTRY,PLAYABLE_BOSSES} from './boss-registry.mjs';
// Every finished boss that opens its own battle dialog, newest boss first (a later boss wins if two were ever open).
// Add a boss to the registry and every system that looks for "the battle that is open right now" follows automatically.
export const BATTLE_DIALOGS=Object.freeze([...PLAYABLE_BOSSES].reverse().map(id=>BOSS_REGISTRY[id]).filter(entry=>entry.dialogId).map(entry=>Object.freeze({boss:entry.id,id:entry.dialogId})));
export const BATTLE_DIALOG_IDS=Object.freeze(BATTLE_DIALOGS.map(dialog=>dialog.id));
export const battleDialogSelector=()=>BATTLE_DIALOG_IDS.map(id=>`dialog#${id}[open]`).join(', ');
export function findOpenBattle(doc){
 for(const {boss,id} of BATTLE_DIALOGS){
  const el=doc?.getElementById?.(id);
  if(el?.open)return {boss,id,el,root:el.firstElementChild?.shadowRoot||null};
 }
 return null;
}
export const battleRoots=doc=>BATTLE_DIALOGS.map(({id})=>doc?.getElementById?.(id)?.firstElementChild?.shadowRoot).filter(Boolean);
