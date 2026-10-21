import {restoreBossName} from './boss-ui-chain.mjs';
export const CLEAN_UI_CSS=`
#arena[data-clean-ui] #damage-layer,#arena[data-clean-ui] #boss-action,#arena[data-clean-ui] .brand>div>span,#arena[data-clean-ui] #load-status[data-ready-hidden]{display:none!important}
#arena[data-clean-ui] #notice:not([data-phase-dialogue]){display:none!important}
#arena[data-clean-ui] .brand{z-index:50;pointer-events:auto;cursor:inherit}
#arena[data-clean-ui] .brand:focus-visible{outline:1px solid currentColor;outline-offset:4px}
.pause-settings{display:flex;gap:8px;margin:12px 0}.pause-settings>button{flex:1;min-width:0;width:auto;margin:0!important}
#boss-transition .bt-return,#boss-transition .bt-note>span:not([data-ui-status]),#boss-transition .bt-next small,#boss-transition .bt-choice>p:not([data-ui-status]){display:none!important}
#boss-transition .bt-note .bt-confirm{width:min(320px,86vw);margin:10px auto 0;pointer-events:auto}
.game-intro{position:absolute;left:50%;bottom:23%;transform:translateX(-50%);width:max-content;max-width:86%;margin:0;color:#f5e8ce;text-align:center;text-shadow:0 2px 5px #000;pointer-events:none;z-index:8}
.boss-secret{position:fixed;inset:0;margin:auto;width:min(360px,86vw);max-height:80dvh;padding:24px;border:1px solid #ae925b;border-radius:10px;background:#19151c;color:#f5e8ce;text-align:center}.boss-secret::backdrop{background:#0009}.boss-secret button{display:block;width:100%;margin:10px 0;padding:12px;color:inherit;background:#352831;border:1px solid #937b53;border-radius:5px}.boss-secret button:disabled{opacity:.5}.boss-secret h2{margin:0 0 16px}.boss-secret p{font-size:13px}
`;
export function compactLabel(id,text){return {retry:'재도전',change:'무기 변경',quit:'무기 선택',resume:'계속'}[id]||(id==='pause'&&text==='전투 계속'?'계속':text);}
export function readWeapon(root,doc){const names={검:'sword',망치:'hammer',활:'bow',카드:'cards'},label=root.getElementById('weapon-label')?.textContent?.trim();return names[label]||doc.querySelector('#menu .weapon.selected')?.dataset.weapon||'sword';}
export function combatActive(root){const get=id=>root.getElementById(id),hud=get('boss-hud');return Boolean(hud&&!hud.hidden&&get('arena')?.style.visibility!=='hidden'&&['menu','pause-screen','result'].every(id=>!get(id)||get(id).hidden));}
export function pauseForChooser(root){const p=root.getElementById('pause');if(!combatActive(root)||!p||p.disabled)return ()=>{};p.click();return ()=>{if(root.getElementById('pause-screen')?.hidden===false)root.getElementById('resume')?.click();};}
export async function enterBoss(boss,weapon,doc=globalThis.document,loadClown=()=>import('./clown-battle.mjs')){
 if(!['kwon','clown'].includes(boss)||!['sword','hammer','bow','cards'].includes(weapon))throw Error('Invalid boss selection');
 const start=doc.getElementById('start');if(!start||start.disabled)throw Error('Arena is not ready');
 doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot?.getElementById('change')?.click();
 const outer=doc.getElementById('boss-transition');if(outer?.open)outer.querySelector('.bt-return')?.click();
 restoreBossName(doc.getElementById('boss-hud'));doc.querySelector('#menu .weapon[data-weapon="'+weapon+'"]')?.click();
 if(boss==='kwon'){start.click();return;}
 const {launchClownBattle}=await loadClown();const view=launchClownBattle({weapon,practice:true,onClose:()=>doc.getElementById('change')?.click()});if(!view)throw Error('Battle already open');return view;
}
export function takeIntro(seen,boss,active){if(!active||seen.has(boss))return false;seen.add(boss);return true;}
const installed=new WeakSet();
export function installGameUi(doc=globalThis.document,win=globalThis.window){
 if(!doc||!win||installed.has(doc))return;installed.add(doc);
 const roots=new WeakSet(),brands=new WeakSet(),seen=new Set(),noisy=new Set(['hp-value','stamina-value','boss-value','skill-text','skill-name','weapon-label','flasks','phase-label','boss-action','notice','damage-layer']);let queued=false,navigating=false;
 const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 function schedule(){if(queued)return;queued=true;win.requestAnimationFrame(()=>{queued=false;apply();});}
 function watch(root){if(roots.has(root))return;roots.add(root);const style=doc.createElement('style');style.textContent=CLEAN_UI_CSS;(root.head||root).appendChild(style);const observer=new win.MutationObserver(records=>{if(records.some(r=>{const el=r.target.nodeType===1?r.target:r.target.parentElement;if(r.type==='attributes'&&r.attributeName==='style')return el?.id==='arena';return !noisy.has(el?.closest?.('[id]')?.id);}))schedule();});observer.observe(root===doc?doc.body:root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-stage','style']});}
 function open(root){
  if(navigating||doc.querySelector('.boss-secret[open]'))return;
  const resume=pauseForChooser(root),weapon=readWeapon(root,doc),d=doc.createElement('dialog');d.className='boss-secret';d.setAttribute('aria-label','보스 선택');d.innerHTML='<h2>보스 선택</h2><button data-boss="kwon">긴턱의 이권재</button><button data-boss="clown">광대 오슬우</button><p role="status"></p><button data-close>닫기</button>';doc.body.appendChild(d);let selected=false;
  const finish=()=>{d.close();d.remove();if(!selected)resume();};d.querySelector('[data-close]').onclick=finish;d.addEventListener('cancel',e=>{e.preventDefault();if(!navigating)finish();});d.addEventListener('keydown',e=>e.stopPropagation());
  for(const b of d.querySelectorAll('[data-boss]')){b.disabled=Boolean(doc.getElementById('start')?.disabled);b.onclick=async()=>{if(navigating)return;navigating=true;for(const x of d.querySelectorAll('button'))x.disabled=true;text(d.querySelector('p'),'불러오는 중…');try{await enterBoss(b.dataset.boss,weapon,doc);selected=true;finish();const battle=doc.getElementById('clown-battle');(battle?.firstElementChild?.shadowRoot||doc).getElementById('world')?.focus();}catch(error){console.error(error);text(d.querySelector('p'),'전투를 불러오지 못했습니다.');for(const x of d.querySelectorAll('button'))x.disabled=false;}finally{navigating=false;}};}
  try{d.showModal();d.querySelector('[data-boss]')?.focus();}catch(error){d.remove();resume();console.error(error);}
 }
 function polish(root,boss){
  watch(root);const arena=root.getElementById('arena');if(!arena)return;if(!arena.hasAttribute('data-clean-ui'))arena.setAttribute('data-clean-ui','');
  const brand=arena.querySelector('.brand');text(brand?.querySelector('div>span'),'');if(brand&&!brands.has(brand)){brands.add(brand);brand.setAttribute('role','button');brand.setAttribute('tabindex','0');brand.setAttribute('aria-label','오이붕');brand.onclick=()=>open(root);brand.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open(root);}};}
  for(const el of arena.querySelectorAll('.prototype'))el.remove();for(const b of arena.querySelectorAll('#menu button'))if(b.textContent.trim()==='보스 전환 연출 미리보기')b.remove();
  const status=root.getElementById('load-status');if(status){const value=status.textContent.trim();if(value.startsWith('준비 완료')){status.setAttribute('data-ready-hidden','');text(status,'');}else if(value)status.removeAttribute('data-ready-hidden');}
  for(const id of ['retry','change','quit','resume','pause']){const b=root.getElementById(id);if(b)text(b,compactLabel(id,b.textContent));}
  const panel=root.getElementById('pause-screen')?.querySelector('.small-panel');if(panel){let settings=panel.querySelector('.pause-settings');if(!settings){settings=doc.createElement('div');settings.className='pause-settings';settings.setAttribute('aria-label','설정');panel.insertBefore(settings,root.getElementById('quit'));}for(const id of ['theme','sound']){const b=root.getElementById(id);if(b&&b.parentNode!==settings)settings.appendChild(b);}}
  if(takeIntro(seen,boss,combatActive(root)&&!(root===doc&&doc.getElementById('boss-transition')?.open))){const p=doc.createElement('p');p.className='game-intro';p.textContent=boss==='kwon'?'틈을 읽고, 대검을 피해 파고드세요.':'공연이 시작됩니다.';arena.appendChild(p);win.setTimeout(()=>p.remove(),3500);}else if(!combatActive(root))arena.querySelector('.game-intro')?.remove();
 }
 function apply(){
  polish(doc,'kwon');const shadow=doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot;if(shadow)polish(shadow,'clown');
  const d=doc.getElementById('boss-transition');if(d){const button=d.querySelector('.bt-confirm'),back=d.querySelector('.bt-return'),note=d.querySelector('.bt-note');text(d.querySelector('.bt-choice h3'),'무기 선택');if(button){text(button,'서커스 입장');const hidden=d.dataset.stage!=='ready';if(button.hidden!==hidden)button.hidden=hidden;if(note&&button.parentNode!==note)note.insertBefore(button,back);}for(const status of d.querySelectorAll('.bt-selection,.bt-note>span')){if(/실패|못했|불러옵니다|로딩 중/.test(status.textContent))status.setAttribute('data-ui-status','');else status.removeAttribute('data-ui-status');}}
 }
 apply();
}
