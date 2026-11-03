import {readBattleSession} from './battle-session.mjs';
import {diceWeapon} from './dice-flow.mjs';
import {createAudio} from './audio.mjs';
import {playDiceCrushEntrance} from './dice-entrance-view.mjs';
import {encounterStore} from './encounter-state.mjs';
import {createProgressionGate,eligibleEncounter} from './progression-gate.mjs';
const installations=new WeakMap();
export function installDiceChain(doc=globalThis.document,win=globalThis.window,{loadBattle=()=>import('./dice-battle.mjs'),playEntrance=playDiceCrushEntrance,makeAudio=createAudio}={}){
 if(!doc||!win)return null;if(installations.has(doc))return installations.get(doc);
 let source=null,watch=null,observer=null,entrance=null,button=null,battle=null,disposed=false;const contexts=[];
 const audio=makeAudio(()=>{const C=win.AudioContext||win.webkitAudioContext;if(!C)return null;const c=new C();contexts.push(c);return c;}),muted=()=>{try{return win.localStorage.getItem('oibung-muted')==='1';}catch{return false;}},unlock=()=>{if(!disposed)audio.setEnabled(!muted());};
 const safely=fn=>{try{fn();}catch(error){console.warn('Dice chain cleanup failed',error);}};
 function detach(){const oldWatch=watch,oldEntrance=entrance,oldButton=button;watch=null;entrance=null;button=null;source=null;safely(()=>oldWatch?.());safely(()=>oldEntrance?.dispose());safely(()=>oldButton?.remove());}
 function scan(){
  if(disposed)return;const next=doc.getElementById('clown-battle');if(next===source)return;detach();if(!next)return;
  const root=next.firstElementChild?.shadowRoot,result=root?.getElementById('result'),shell=root?.getElementById('arena'),panel=result?.querySelector('.small-panel');
  if(!root||!result||!shell||!panel)return;source=next;const readEncounter=()=>readBattleSession(root)?.encounter||encounterStore.read(),gate=createProgressionGate('clown',readEncounter);
  const b=doc.createElement('button');button=b;b.textContent='다음 시련 · 거대 주사위 박성원';b.hidden=true;panel.appendChild(b);
  const ready=()=>!disposed&&source===next&&next.isConnected&&next.open&&!result.hidden;
  async function start(ticket){
   const attempt=ticket||gate.begin(ready());if(!attempt)return;
   if(!gate.valid(attempt,ready())){gate.end(attempt);return;}b.disabled=true;
   try{
    const current=playEntrance(doc,shell,{win,impact:()=>{if(!disposed&&!muted())audio.play('hit-boss',{amount:120,minGap:.15});}});entrance=current;
    const go=await current.finished;if(entrance===current)entrance=null;if(!go||!gate.valid(attempt,ready()))return;
    const m=await loadBattle();if(!gate.valid(attempt,ready()))return;
    let ended=false;const view=m.launchDiceBattle({weapon:diceWeapon(attempt.weapon),onClose:()=>{ended=true;battle=null;if(!disposed&&b.isConnected)b.focus();}});if(!view)throw Error('Dice battle already open');if(!ended)battle=view;
   }catch(error){if(!disposed){console.error(error);if(b.isConnected)b.textContent='전환 재시도 · 거대 주사위 박성원';}}
   finally{gate.end(attempt);b.disabled=false;if(source===next&&next.isConnected&&!disposed)check();}
  }
  b.onclick=()=>start();
  function check(){if(disposed||source!==next)return;const canEnter=eligibleEncounter(readEncounter(),'clown',ready());b.hidden=!canEnter;if(!canEnter&&entrance)entrance.dispose();const ticket=gate.automatic(ready());if(ticket)start(ticket);}
  if(result.addEventListener){result.addEventListener('oibung:result-ready',check);watch=()=>result.removeEventListener('oibung:result-ready',check);}else{const legacy=new win.MutationObserver(check);legacy.observe(result,{attributes:true,attributeFilter:['hidden']});watch=()=>legacy.disconnect();}check();
 }
 function pagehide(e){if(!e.persisted)control.dispose();}
 let completion=null;const control={dispose(){if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;safely(()=>observer?.disconnect());safely(detach);safely(()=>audio.setEnabled(false));const pending=[];try{if(battle)pending.push(Promise.resolve(battle.close?.()));}catch(error){pending.push(Promise.reject(error));}battle=null;for(const c of contexts)try{pending.push(Promise.resolve(c.close?.()));}catch(error){pending.push(Promise.reject(error));}contexts.length=0;win.removeEventListener('pointerdown',unlock,true);win.removeEventListener('keydown',unlock,true);win.removeEventListener('pagehide',pagehide,true);delete doc.documentElement.dataset.diceChain;installations.delete(doc);Promise.allSettled(pending).then(results=>finish({errors:results.filter(x=>x.status==='rejected').map(x=>x.reason).concat(results.filter(x=>x.status==='fulfilled').flatMap(x=>x.value?.errors||[]))}));return completion;},get disposed(){return disposed;}};
 installations.set(doc,control);doc.documentElement.dataset.diceChain='1';
 try{win.addEventListener('pointerdown',unlock,{capture:true,passive:true});win.addEventListener('keydown',unlock,{capture:true});observer=new win.MutationObserver(scan);observer.observe(doc.body,{childList:true,subtree:true});scan();win.addEventListener('pagehide',pagehide,{capture:true});}
 catch(error){control.dispose();throw error;}
 return control;
}
