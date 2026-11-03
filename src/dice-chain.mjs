import {createDiceGate,diceWeapon,shouldStartDice} from './dice-flow.mjs';
import {createAudio} from './audio.mjs';
import {playDiceCrushEntrance} from './dice-entrance-view.mjs';
export function installDiceChain(doc=globalThis.document,win=globalThis.window){
 if(!doc||!win||doc.documentElement.dataset.diceChain)return;doc.documentElement.dataset.diceChain='1';
 let source=null,watch=null,entrance=null,button=null,busy=false;const contexts=[];
 const audio=createAudio(()=>{const C=win.AudioContext||win.webkitAudioContext;if(!C)return null;const c=new C();contexts.push(c);return c;}),muted=()=>{try{return win.localStorage.getItem('oibung-muted')==='1';}catch{return false;}},unlock=()=>audio.setEnabled(!muted());
 win.addEventListener('pointerdown',unlock,{capture:true,passive:true});win.addEventListener('keydown',unlock,{capture:true});
 function detach(){watch?.disconnect();watch=null;entrance?.dispose();entrance=null;button?.remove();button=null;source=null;}
 function scan(){
  const next=doc.getElementById('clown-battle');if(next===source)return;detach();if(!next)return;
  const root=next.firstElementChild?.shadowRoot,result=root?.getElementById('result'),shell=root?.getElementById('arena'),panel=result?.querySelector('.small-panel');
  if(!root||!result||!shell||!panel)return;source=next;const gate=createDiceGate();
  const b=doc.createElement('button');button=b;b.textContent='다음 시련 · 거대 주사위 박성원';b.hidden=true;panel.appendChild(b);
  const valid=()=>source===next&&next.isConnected&&shouldStartDice(next.open,!result.hidden,root.getElementById('result-kicker')?.textContent);
  async function start(){
   if(busy||!valid()||!gate.begin())return;busy=true;b.disabled=true;
   try{
    const current=playDiceCrushEntrance(doc,shell,{win,impact:()=>{if(!muted())audio.play('hit-boss',{amount:120,minGap:.15});}});entrance=current;
    const go=await current.finished;if(entrance===current)entrance=null;if(!go||!valid())return;
    const m=await import('./dice-battle.mjs');if(!valid())return;
    const view=m.launchDiceBattle({weapon:diceWeapon(root.getElementById('skill-hud')?.dataset.weapon),onClose:()=>b.isConnected&&b.focus()});
    if(!view)throw Error('Dice battle already open');
   }catch(error){console.error(error);b.textContent='전환 재시도 · 거대 주사위 박성원';}
   finally{busy=false;gate.end();b.disabled=false;}
  }
  b.onclick=start;
  function check(){if(source!==next)return;const visible=!result.hidden,won=String(root.getElementById('result-kicker')?.textContent||'').trim()==='승리';b.hidden=!(visible&&won);if(!visible)entrance?.dispose();if(gate.observe(next.open,visible,won?'승리':'패배'))start();}
  watch=new win.MutationObserver(check);watch.observe(result,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true});check();
 }
 const observer=new win.MutationObserver(scan);observer.observe(doc.body,{childList:true,subtree:true});scan();
 win.addEventListener('pagehide',e=>{if(e.persisted)return;observer.disconnect();detach();audio.setEnabled(false);for(const c of contexts)c.close?.();win.removeEventListener('pointerdown',unlock,true);win.removeEventListener('keydown',unlock,true);},{capture:true});
}
