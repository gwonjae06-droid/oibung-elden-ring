import {bindBossName} from './boss-ui-chain.mjs';
export const CUES={bind:2,pull:3.4,enter:4.7,bow:7.2,reveal:9,ready:9.35};
export const WEAPON_NAMES={sword:'검',hammer:'망치',bow:'활',cards:'카드'};
export const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
let covered=false;
export function setTransitionCovered(value){covered=Boolean(value);}
export function transitionPose(time){const t=Number.isFinite(time)?Math.max(0,time):0,stage=t<CUES.bind?'declare':t<CUES.pull?'bind':t<CUES.enter?'pull':t<CUES.bow?'enter':t<CUES.reveal?'bow':t<CUES.ready?'reveal':'ready',p=smooth((t-CUES.bow)/(CUES.reveal-CUES.bow));return {stage,bind:smooth((t-CUES.bind)/(CUES.pull-CUES.bind)),pull:smooth((t-CUES.pull)/(CUES.enter-CUES.pull)),entry:covered?0:smooth((t-CUES.enter)/(CUES.bow-CUES.enter)),bow:Math.sin(Math.PI*p),ui:t>=CUES.reveal?1:0,select:t>=CUES.ready,title:clamp(t/.6)*(1-clamp((t-2.3)/1.1))};}
export function shouldStartTransition(visible,kicker){return Boolean(visible)&&String(kicker).trim()==='승리';}
export function advanceTransition(time,dt,hidden=false){return hidden||covered?time:time+Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));}
export function chooseWeapon(previous,saved){return Object.hasOwn(WEAPON_NAMES,saved)?saved:Object.hasOwn(WEAPON_NAMES,previous)?previous:'sword';}
export function makeClownLoadout(weapon,unlocked){if(!Object.hasOwn(WEAPON_NAMES,weapon))throw new Error('Unknown weapon');return {version:1,bossId:'clown',weapon,unlocked:Boolean(unlocked)};}
if(typeof window!=='undefined'){
 let running=false;
 window.addEventListener('oibung:clown-weapon-selected',async e=>{if(running)return;running=true;const outer=document.getElementById('boss-transition'),button=outer?.querySelector('.bt-confirm'),label=outer?.querySelector('.bt-selection');const restore=()=>{running=false;setTransitionCovered(false);if(outer)outer.style.visibility='';if(button){button.disabled=false;button.textContent='이 무기로 광대전 시작';}if(label)label.textContent='다른 무기를 선택하거나 광대전에 다시 도전하세요.';button?.focus();};queueMicrotask(()=>{if(running&&label)label.textContent='광대전을 불러옵니다…';});try{const {launchClownBattle}=await import('./clown-battle.mjs');const view=launchClownBattle({weapon:e.detail?.weapon,practice:false,onClose:restore});if(!view)throw new Error('Clown battle already open');setTransitionCovered(true);if(outer)outer.style.visibility='hidden';}catch(error){console.error(error);restore();if(label)label.textContent='광대전 로딩 실패. 새로고침 후 다시 시도해 주세요.';}});
 const attach=()=>{
  const d=document.getElementById('boss-transition');if(!d)return false;
  for(const b of document.querySelectorAll('#menu button'))if(['보스 전환 연출 미리보기','광대 입장 · 전투 연습','광대 입장·전투 연습'].includes(b.textContent.trim()))b.remove();
  const old=d.querySelector('.bt-old'),legacy=[...d.querySelectorAll('.bt-chain')];old?.querySelectorAll('.bt-name,.bt-deadbar').forEach(x=>x.remove());for(const c of legacy)c.style.display='none';
  const style=document.createElement('style');style.textContent='#boss-transition .bt-old>#boss-hud{position:static!important;left:auto!important;bottom:auto!important;transform:none!important;width:100%!important;margin:0!important}';d.appendChild(style);
  let anchor=null,hud=null,binding=null,last='';const oldStyle=old?.style.cssText;
  const restoreHud=()=>{binding?.restore();binding=null;if(anchor&&hud){anchor.replaceWith(hud);anchor=null;hud=null;}if(old)old.style.cssText=oldStyle||'';};
  const bindHud=()=>{if(anchor||!old)return;hud=document.getElementById('boss-hud');if(!hud)return;const r=hud.getBoundingClientRect();anchor=document.createComment('boss-hud-home');hud.replaceWith(anchor);old.appendChild(hud);hud.hidden=false;Object.assign(old.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',bottom:'auto',marginLeft:'0'});binding=bindBossName(hud,false);binding?.update(0);};
  if(legacy[0])new MutationObserver(()=>binding?.update(Number(legacy[0].style.opacity)||0)).observe(legacy[0],{attributes:true,attributeFilter:['style']});
  const update=()=>{if(d.open)bindHud();else restoreHud();const b=d.querySelector('.bt-confirm');if(b&&b.textContent!=='이 무기로 광대전 시작')b.textContent='이 무기로 광대전 시작';if(d.dataset.stage!==last){last=d.dataset.stage;if(last==='ready'){const n=d.querySelector('.bt-note span');if(n)n.textContent='무기를 선택하면 광대 오슬우 전투가 시작됩니다.';}}};new MutationObserver(update).observe(d,{attributes:true,attributeFilter:['open','data-stage']});update();return true;
 };
 if(!attach()){const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(document.body,{childList:true});}
}
