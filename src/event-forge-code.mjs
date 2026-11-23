// Event-only forge code. The activation key is scoped to the event participant,
// not the normal save. No other weapon or regular journey is affected.
export const EVENT_BOW_KEY='oibung.oden-event.bow-200.v1';
export const EVENT_BOW_DAMAGE=200;
const FORGE_CODE='규원아사랑해';

export function matchesEventForgeCode(value){
 return typeof value==='string'&&value.normalize('NFC').trim()===FORGE_CODE;
}

export function isEventForgeShortcut(event,{screen,eventMode,registered,open=false}={}){
 if(!event||screen!=='forge'||!eventMode||!registered||open||
  event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return false;
 const target=event.target;
 if(target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(String(target?.tagName||'').toUpperCase()))return false;
 return event.code==='Semicolon'||event.key===';';
}

export function eventBowProjectileDamage(game,ordinaryDamage){
 return game?.odenPrizeEvent===true&&game?.eventBowDamage200===true&&game?.weapon==='bow'
  ?EVENT_BOW_DAMAGE:ordinaryDamage;
}
