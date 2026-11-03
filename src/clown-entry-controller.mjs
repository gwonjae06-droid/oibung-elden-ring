import {restoreBossName} from './boss-ui-chain.mjs';
import {WEAPON_NAMES,setTransitionCovered} from './transition-data.mjs';
const installed=new WeakMap();
export function installClownEntry(doc=globalThis.document,win=globalThis.window,{loadBattle=()=>import('./clown-battle.mjs'),restoreName=restoreBossName,setCovered=setTransitionCovered}={}){
 if(!doc||!win)return null;
 if(installed.has(doc))return installed.get(doc);
 let disposed=false,running=false,serial=0,view=null,restoreCurrent=null,completion=null;
 async function enter(event){
  if(disposed||running)return false;
  const outer=doc.getElementById('boss-transition'),data=event?.detail;
  if(!outer||!outer.open||!outer.isConnected||event?.target!==outer||data?.bossId!=='clown'||!Object.hasOwn(WEAPON_NAMES,data.weapon))return false;
  running=true;const ticket=++serial,button=outer.querySelector('.bt-confirm'),label=outer.querySelector('.bt-selection'),visibility=outer.style.visibility;
  const current=()=>!disposed&&ticket===serial&&outer.isConnected&&outer.open&&doc.getElementById('boss-transition')===outer;
  function restore(){
   if(ticket!==serial)return;running=false;view=null;setCovered(false);
   if(outer.isConnected&&doc.getElementById('boss-transition')===outer){outer.style.visibility=visibility;if(button){button.disabled=false;button.textContent='서커스 입장';}if(label)label.textContent='무기를 선택하세요.';if(outer.open)button?.focus();}
   restoreCurrent=null;
  }
  restoreCurrent=restore;if(label)label.textContent='광대전을 불러옵니다…';
  try{
   const module=await loadBattle();
   if(!current()){restore();return false;}
   restoreName(doc.getElementById('boss-hud'));
   const battle=module.launchClownBattle({weapon:data.weapon,practice:Boolean(data.preview),onClose:restore});
   if(!battle)throw new Error('Clown battle already open');
   if(!current()||!running){battle.close?.();restore();return false;}
   view=battle;setCovered(true);outer.style.visibility='hidden';if(label)label.textContent='광대전 진행 중';return true;
  }catch(error){console.error('Clown entry failed',error);restore();if(outer.isConnected&&outer.open&&label)label.textContent='광대전 로딩 실패. 다시 시도해 주세요.';return false;}
 }
 const control={enter,dispose(){if(completion)return completion;disposed=true;win.removeEventListener('oibung:clown-weapon-selected',enter);let pending;try{pending=view?.close?.();}catch(error){pending=Promise.reject(error);}restoreCurrent?.();serial++;running=false;view=null;installed.delete(doc);completion=Promise.resolve(pending);return completion;}};
 installed.set(doc,control);win.addEventListener('oibung:clown-weapon-selected',enter);return control;
}
