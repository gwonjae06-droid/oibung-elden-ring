import {diceWeapon} from './dice-flow.mjs';
import {createAudio} from './audio.mjs';
import {playDiceCrushEntrance} from './dice-entrance-view.mjs';
import {encounterStore} from './encounter-state.mjs';
import {createProgressionGate,eligibleEncounter} from './progression-gate.mjs';
export function installDiceChain(doc=globalThis.document,win=globalThis.window){
 if(!doc||!win||doc.documentElement.dataset.diceChain)return;doc.documentElement.dataset.diceChain='1';
 let source=null,watch=null,entrance=null,button=null,disposed=false;const contexts=[];
 const audio=createAudio(()=>{const C=win.AudioContext||win.webkitAudioContext;if(!C)return null;const c=new C();contexts.push(c);return c;}),muted=()=>{try{return win.localStorage.getItem('oibung-muted')==='1';}catch{return false;}},unlock=()=>audio.setEnabled(!muted());
 win.addEventListener('pointerdown',unlock,{capture:true,passive:true});win.addEventListener('keydown',unlock,{capture:true});
 function detach(){watch?.disconnect();watch=null;entrance?.dispose();entrance=null;button?.remove();button=null;source=null;}
 function scan(){
  if(disposed)return;const next=doc.getElementById('clown-battle');if(next===source)return;detach();if(!next)return;
  const root=next.firstElementChild?.shadowRoot,result=root?.getElementById('result'),shell=root?.getElementById('arena'),panel=result?.querySelector('.small-panel');
  if(!root||!result||!shell||!panel)return;source=next;const gate=createProgressionGate('clown',()=>encounterStore.read());
  const b=doc.createElement('button');button=b;b.textContent='다음 시련 · 거대 주사위 박성원';b.hidden=true;panel.appendChild(b);
  const ready=()=>!disposed&&source===next&&next.isConnected&&next.open&&!result.hidden;
  async function start(ticket){
   const attempt=ticket||gate.begin(ready());if(!attempt)return;
   if(!gate.valid(attempt,ready())){gate.end(attempt);return;}b.disabled=true;
   try{
    const current=playDiceCrushEntrance(doc,shell,{win,impact:()=>{if(!muted())audio.play('hit-boss',{amount:120,minGap:.15});}});entrance=current;
    const go=await current.finished;if(entrance===current)entrance=null;if(!go||!gate.valid(attempt,ready()))return;
    const m=await import('./dice-battle.mjs');if(!gate.valid(attempt,ready()))return;
    const view=m.launchDiceBattle({weapon:diceWeapon(attempt.weapon),onClose:()=>b.isConnected&&b.focus()});if(!view)throw Error('Dice battle already open');
   }catch(error){console.error(error);if(b.isConnected)b.textContent='전환 재시도 · 거대 주사위 박성원';}
   finally{gate.end(attempt);b.disabled=false;if(source===next&&next.isConnected&&!disposed)check();}
  }
  b.onclick=()=>start();
  function check(){if(disposed||source!==next)return;const canEnter=eligibleEncounter(encounterStore.read(),'clown',ready());b.hidden=!canEnter;if(!canEnter&&entrance)entrance.dispose();const ticket=gate.automatic(ready());if(ticket)start(ticket);}
  watch=new win.MutationObserver(check);watch.observe(result,{attributes:true,attributeFilter:['hidden']});check();
 }
 const observer=new win.MutationObserver(scan);observer.observe(doc.body,{childList:true,subtree:true});scan();
 win.addEventListener('pagehide',e=>{if(e.persisted)return;disposed=true;observer.disconnect();detach();audio.setEnabled(false);for(const c of contexts)c.close?.();win.removeEventListener('pointerdown',unlock,true);win.removeEventListener('keydown',unlock,true);},{capture:true});
}
