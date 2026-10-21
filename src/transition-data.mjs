import {restoreBossName} from './boss-ui-chain.mjs';
export const CUES={bind:2,pull:3.4,enter:4.7,bow:7.2,reveal:9,ready:9.35};
export const WEAPON_NAMES={sword:'검',hammer:'망치',bow:'활',cards:'카드'};
export const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
let covered=false;
export function setTransitionCovered(value){covered=Boolean(value);}
export function transitionPose(time){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const stage=t<CUES.bind?'declare':t<CUES.pull?'bind':t<CUES.enter?'pull':t<CUES.bow?'enter':t<CUES.reveal?'bow':t<CUES.ready?'reveal':'ready';
 const bowProgress=smooth((t-CUES.bow)/(CUES.reveal-CUES.bow));
 return {stage,bind:smooth((t-CUES.bind)/(CUES.pull-CUES.bind)),pull:smooth((t-CUES.pull)/(CUES.enter-CUES.pull)),entry:covered?0:smooth((t-CUES.enter)/(CUES.bow-CUES.enter)),bow:Math.sin(Math.PI*bowProgress),ui:t>=CUES.reveal?1:0,select:t>=CUES.ready,title:clamp(t/.6)*(1-clamp((t-2.3)/1.1))};
}
export function shouldStartTransition(resultVisible,kicker){return Boolean(resultVisible)&&String(kicker).trim()==='승리';}
export function advanceTransition(time,dt,hidden=false){return hidden||covered?time:time+Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));}
export function chooseWeapon(previous,saved){return Object.hasOwn(WEAPON_NAMES,saved)?saved:Object.hasOwn(WEAPON_NAMES,previous)?previous:'sword';}
export function makeClownLoadout(weapon,unlocked){if(!Object.hasOwn(WEAPON_NAMES,weapon))throw new Error('Unknown weapon');return {version:1,bossId:'clown',weapon,unlocked:Boolean(unlocked)};}
if(typeof window!=='undefined'){
 import('./game-ui.mjs').then(m=>m.installGameUi()).catch(e=>console.error('Game UI unavailable',e));
 import('./boss-music.mjs').then(m=>m.installBossMusic()).catch(e=>console.error('Boss music unavailable',e));
 import('./dice-chain.mjs').then(m=>m.installDiceChain()).catch(e=>console.error('Dice chain unavailable',e));
 let running=false;
 window.addEventListener('oibung:clown-weapon-selected',async e=>{
  if(running)return;running=true;
  const outer=document.getElementById('boss-transition'),button=outer?.querySelector('.bt-confirm'),label=outer?.querySelector('.bt-selection');
  const restore=()=>{running=false;setTransitionCovered(false);if(outer)outer.style.visibility='';if(button){button.disabled=false;button.textContent='서커스 입장';}if(label)label.textContent='무기를 선택하세요.';button?.focus();};
  queueMicrotask(()=>{if(running&&label)label.textContent='광대전을 불러옵니다…';});
  try{restoreBossName(document.getElementById('boss-hud'));const {launchClownBattle}=await import('./clown-battle.mjs');const view=launchClownBattle({weapon:e.detail?.weapon,practice:Boolean(e.detail?.preview),onClose:restore});if(!view)throw new Error('Clown battle already open');setTransitionCovered(true);if(outer)outer.style.visibility='hidden';if(label)label.textContent='광대전 진행 중';}
  catch(error){console.error(error);restore();if(label)label.textContent='광대전 로딩 실패. 새로고침 후 다시 시도해 주세요.';}
 });
 const attach=()=>{const d=document.getElementById('boss-transition');if(!d)return false;let last='';const update=()=>{const b=d.querySelector('.bt-confirm');if(b&&b.textContent!=='서커스 입장')b.textContent='서커스 입장';if(d.dataset.stage!==last){last=d.dataset.stage;if(last==='ready'){const note=d.querySelector('.bt-note span');if(note)note.textContent='무기를 선택하세요.';}}};new MutationObserver(update).observe(d,{attributes:true,attributeFilter:['data-stage']});update();return true;};
 if(!attach()){const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(document.body,{childList:true});}
}
