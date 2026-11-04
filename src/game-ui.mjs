import {reducedMotion} from './display-preferences.mjs';
import {restoreBossName} from './boss-ui-chain.mjs';
import {playBossIntro} from './boss-intro.mjs';
import {createDisposerScope} from './runtime/disposer.mjs';
import {readBattleSession} from './battle-session.mjs';
import {settleCleanup,combineCleanupReports} from './runtime/cleanup-completion.mjs';
export const SECRET_BOSSES=Object.freeze([{id:'kwon',name:'긴턱의 이권재'},{id:'clown',name:'광대 오슬우'},{id:'dice',name:'거대 주사위 박성원'}].map(Object.freeze));
export const CLEAN_UI_CSS=`
#arena[data-clean-ui] #damage-layer,#arena[data-clean-ui] #boss-action:not([data-critical]),#arena[data-clean-ui] .brand>div>span,#arena[data-clean-ui] #load-status[data-ready-hidden]{display:none!important}
#arena[data-clean-ui] #notice:not([data-phase-dialogue]):not([data-critical]){display:none!important}
#arena[data-clean-ui] .brand{z-index:50;pointer-events:auto;cursor:inherit}
#arena[data-clean-ui] .brand:focus-visible{outline:1px solid currentColor;outline-offset:4px}
.pause-settings{display:flex;gap:8px;margin:12px 0}.pause-settings>button{flex:1;min-width:0;width:auto;margin:0!important}
#boss-transition .bt-return,#boss-transition .bt-note>span:not([data-ui-status]),#boss-transition .bt-next small,#boss-transition .bt-choice>p:not([data-ui-status]){display:none!important}
#boss-transition .bt-note .bt-confirm{width:min(320px,86vw);margin:10px auto 0;pointer-events:auto}
.game-intro{position:absolute;left:50%;bottom:23%;transform:translateX(-50%);width:max-content;max-width:86%;margin:0;color:#f5e8ce;text-align:center;text-shadow:0 2px 5px #000;pointer-events:none;z-index:8}
.boss-secret{position:fixed;inset:0;margin:auto;width:min(360px,86vw);max-height:80dvh;padding:24px;border:1px solid #ae925b;border-radius:10px;background:#19151c;color:#f5e8ce;text-align:center}.boss-secret::backdrop{background:#0009}.boss-secret button{display:block;width:100%;margin:10px 0;padding:12px;color:inherit;background:#352831;border:1px solid #937b53;border-radius:5px}.boss-secret button:disabled{opacity:.5}.boss-secret h2{margin:0 0 16px}.boss-secret p{font-size:13px}
`;
export function compactLabel(id,text){return {retry:'재도전',change:'무기 변경',quit:'무기 선택',resume:'계속'}[id]||(id==='pause'&&text==='전투 계속'?'계속':text);}
export function readWeapon(root,doc){const weapon=readBattleSession(root)?.game?.weapon;if(weapon)return weapon;const names={검:'sword',망치:'hammer',활:'bow',카드:'cards'},label=root.getElementById('weapon-label')?.textContent?.trim();return names[label]||doc.querySelector('#menu .weapon.selected')?.dataset.weapon||'sword';}
export function combatActive(root){const session=readBattleSession(root);if(session)return Boolean(session.active);const get=id=>root.getElementById(id),hud=get('boss-hud');return Boolean(hud&&!hud.hidden&&get('arena')?.style.visibility!=='hidden'&&['menu','pause-screen','result'].every(id=>!get(id)||get(id).hidden));}
export function pauseForChooser(root){const session=readBattleSession(root);if(session?.pause&&session?.resume){if(!session.active||!session.pause())return ()=>{};return ()=>session.resume();}const p=root.getElementById('pause');if(!combatActive(root)||!p||p.disabled)return ()=>{};p.click();return ()=>{if(root.getElementById('pause-screen')?.hidden===false)root.getElementById('resume')?.click();};}
export function closeDiceBattle(doc){const modal=doc.getElementById('dice-battle');if(!modal)return;const root=modal.firstElementChild?.shadowRoot,session=readBattleSession(root);if(session?.close)session.close();else{const exit=root?.querySelector?.('[data-dice-exit]')||Array.from(root?.querySelectorAll?.('button')||[]).find(b=>b.textContent?.trim()==='광대전 결과로');if(!exit)throw Error('Dice battle exit unavailable');exit.click();}if(doc.getElementById('dice-battle'))throw Error('Dice battle did not close');}
export async function enterBoss(boss,weapon,doc=globalThis.document,loadClown=()=>import('./clown-battle.mjs'),loadDice=()=>import('./dice-battle.mjs'),{isCurrent=()=>true,onClose=()=>{}}={}){
 if(!SECRET_BOSSES.some(b=>b.id===boss)||!['sword','hammer','bow','cards'].includes(weapon))throw Error('Invalid boss selection');
 if(!isCurrent())return null;const start=doc.getElementById('start');if(!start||start.disabled)throw Error('Arena is not ready');
 closeDiceBattle(doc);const clownRoot=doc.getElementById('clown-battle')?.firstElementChild?.shadowRoot,clownSession=clownRoot&&readBattleSession(clownRoot);if(clownSession?.close)clownSession.close();else clownRoot?.getElementById('change')?.click();
 const outer=doc.getElementById('boss-transition');if(outer?.open){const transition=readBattleSession(outer);if(transition?.close)transition.close();else outer.querySelector('.bt-return')?.click();}
 restoreBossName(doc.getElementById('boss-hud'));const main=readBattleSession(doc);if(main?.selectWeapon)main.selectWeapon(weapon);else doc.querySelector('#menu .weapon[data-weapon="'+weapon+'"]')?.click();if(!isCurrent())return null;
 if(boss==='kwon'){if(main?.start)main.start(weapon);else start.click();return;}
 const module=await (boss==='dice'?loadDice():loadClown());if(!isCurrent())return null;if(start.disabled)throw Error('Arena is not ready');
 const close=()=>{onClose();if(isCurrent()){if(main?.menu)main.menu();else doc.getElementById('change')?.click();}};
 const view=boss==='dice'?module.launchDiceBattle({weapon,onClose:close}):module.launchClownBattle({weapon,practice:true,onClose:close});if(!view)throw Error('Battle already open');return view;
}
export function takeIntro(seen,boss,active){if(!active||seen.has(boss))return false;seen.add(boss);return true;}
const INTRO_LINES={kwon:'틈을 읽고, 대검을 피해 파고드세요.',clown:'공연이 시작됩니다.',dice:'눈금이 켜진 칸을 벗어나고, 착지 후 반격하세요.'},installations=new WeakMap();
export function installGameUi(doc=globalThis.document,win=globalThis.window,{loadScreenFx=()=>import('./screen-fx.mjs'),playIntro=playBossIntro,loadClown=()=>import('./clown-battle.mjs'),loadDice=()=>import('./dice-battle.mjs')}={}){
 if(!doc||!win)return null;if(installations.has(doc))return installations.get(doc);
 const safe=fn=>{try{return fn();}catch(error){console.warn('Game UI cleanup failed',error);}},scope=createDisposerScope(error=>console.warn('Game UI cleanup failed',error)),roots=new Map(),seen=new Set(),battles=new Set(),noisy=new Set(['hp-value','stamina-value','boss-value','skill-text','skill-name','weapon-label','flasks','phase-label','boss-action','notice','damage-layer']);
 let closing=false,navigating=false,rafId=null,screenFx=null,completion=null;const alive=()=>!closing&&!scope.disposed;
 const text=(el,value)=>{if(el&&el.textContent!==value)el.textContent=value;};
 function schedule(){if(!alive()||rafId!==null)return;rafId=win.requestAnimationFrame(()=>{rafId=null;if(alive())apply();});}
 function attr(entry,el,key,value){if(!el)return;let keys=entry.attrs.get(el);if(!keys){keys=new Set();entry.attrs.set(el,keys);}if(!keys.has(key)){keys.add(key);const old=el.getAttribute(key);entry.scope.add(()=>{if(old===null)el.removeAttribute(key);else el.setAttribute(key,old);});}if(value===null)el.removeAttribute(key);else if(el.getAttribute(key)!==value)el.setAttribute(key,value);}
 function label(entry,el,value){if(!el||el.textContent===value)return;if(!entry.labels.has(el)){entry.labels.add(el);const old=el.textContent;entry.scope.add(()=>text(el,old));}text(el,value);}
 function watch(root){
  if(roots.has(root))return roots.get(root);const local=createDisposerScope(error=>console.warn('UI root cleanup failed',error)),entry={scope:local,attrs:new WeakMap(),labels:new WeakSet(),brands:new WeakSet()};roots.set(root,entry);entry.untrack=scope.add(()=>local.dispose());
  const style=doc.createElement('style');style.textContent=CLEAN_UI_CSS;(root.head||root).appendChild(style);local.add(()=>style.remove());
  const observer=new win.MutationObserver(records=>{if(records.some(r=>{const el=r.target.nodeType===1?r.target:r.target.parentElement;return r.type==='attributes'&&r.attributeName==='style'?el?.id==='arena':!noisy.has(el?.closest?.('[id]')?.id);}))schedule();});
  local.add(()=>observer.disconnect());observer.observe(root===doc?doc.body:root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-stage','style']});return entry;
 }
 function open(root,entry){
  if(doc.body?.dataset?.journey){win.dispatchEvent(new win.CustomEvent('oibung:home'));return;}
  if(!alive()||entry.scope.disposed||navigating||doc.querySelector('.boss-secret[open]'))return;
  const resume=pauseForChooser(root),weapon=readWeapon(root,doc),d=doc.createElement('dialog');d.className='boss-secret';d.setAttribute('aria-label','보스 선택');d.innerHTML='<h2>보스 선택</h2>'+SECRET_BOSSES.map(b=>'<button data-boss="'+b.id+'">'+b.name+'</button>').join('')+'<p role="status"></p><button data-close>닫기</button>';doc.body.appendChild(d);
  let selected=false,closed=false,cancelled=false,untrack=()=>{};const current=()=>alive()&&!entry.scope.disposed&&!cancelled;
  const finish=()=>{if(closed)return;closed=true;if(!selected)cancelled=true;for(const b of d.querySelectorAll('button'))b.onclick=null;safe(()=>d.close());d.remove();untrack();if(!selected)safe(resume);};untrack=entry.scope.add(finish);
  d.querySelector('[data-close]').onclick=finish;d.addEventListener('cancel',e=>{e.preventDefault();if(!navigating)finish();});d.addEventListener('keydown',e=>e.stopPropagation());
  for(const b of d.querySelectorAll('[data-boss]')){b.disabled=Boolean(doc.getElementById('start')?.disabled);b.onclick=async()=>{if(!current()||closed||navigating)return;navigating=true;for(const x of d.querySelectorAll('button'))x.disabled=true;text(d.querySelector('p'),'불러오는 중…');let view=null,ended=false;try{view=await enterBoss(b.dataset.boss,weapon,doc,loadClown,loadDice,{isCurrent:current,onClose:()=>{ended=true;battles.delete(view);}});if(!current()){safe(()=>view?.close?.());return;}if(!ended&&view)battles.add(view);selected=true;finish();const battle=doc.getElementById('dice-battle')||doc.getElementById('clown-battle');(battle?.firstElementChild?.shadowRoot||doc).getElementById('world')?.focus();}catch(error){if(current()&&!closed){console.error(error);text(d.querySelector('p'),'전투를 불러오지 못했습니다.');for(const x of d.querySelectorAll('button'))x.disabled=false;}}finally{navigating=false;}};}
  try{d.showModal();d.querySelector('[data-boss]')?.focus();}catch(error){finish();console.error(error);}
 }
 function showLine(entry,arena,boss){if(!alive()||entry.scope.disposed||!arena.isConnected)return;const p=doc.createElement('p');p.className='game-intro';p.textContent=INTRO_LINES[boss];arena.appendChild(p);let untrack=()=>{};const id=win.setTimeout(()=>{p.remove();untrack();},3500);untrack=entry.scope.add(()=>{win.clearTimeout(id);p.remove();});}
 function startIntro(entry,root,arena,boss){
  const resume=pauseForChooser(root),pauseScreen=root.getElementById('pause-screen'),old=pauseScreen?.style.visibility;let done=false,view=null,untrack=()=>{};
  function finish(line){if(done)return;done=true;if(pauseScreen)pauseScreen.style.visibility=old;untrack();safe(resume);if(line)showLine(entry,arena,boss);}
  try{if(pauseScreen)pauseScreen.style.visibility='hidden';view=playIntro(doc,arena,boss,{reduced:reducedMotion()});untrack=entry.scope.add(()=>{try{view.skip();}finally{finish(false);}});Promise.resolve(view.finished).then(ok=>finish(ok!==false),()=>finish(false));}catch(error){finish(false);console.error(error);}
 }
 function polish(root,boss){
  const entry=watch(root),arena=root.getElementById('arena');if(!arena)return;attr(entry,arena,'data-clean-ui','');
  const brand=arena.querySelector('.brand');label(entry,brand?.querySelector('div>span'),'');if(doc.body?.dataset?.journey)label(entry,brand?.querySelector('strong'),'오든링');if(brand&&!entry.brands.has(brand)){entry.brands.add(brand);const click=brand.onclick,key=brand.onkeydown;attr(entry,brand,'role','button');attr(entry,brand,'tabindex','0');attr(entry,brand,'aria-label',doc.body?.dataset?.journey?'오든링':'오이붕');brand.onclick=()=>open(root,entry);brand.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open(root,entry);}};entry.scope.add(()=>{brand.onclick=click;brand.onkeydown=key;});}
  for(const el of [...arena.querySelectorAll('.prototype'),...arena.querySelectorAll('#menu button')].filter(el=>el.classList?.contains('prototype')||el.textContent.trim()==='보스 전환 연출 미리보기')){const parent=el.parentNode,next=el.nextSibling;el.remove();entry.scope.add(()=>parent?.insertBefore(el,next?.parentNode===parent?next:null));}
  const status=root.getElementById('load-status');if(status){const value=status.textContent.trim();if(value.startsWith('준비 완료')){attr(entry,status,'data-ready-hidden','');label(entry,status,'');}else if(value)attr(entry,status,'data-ready-hidden',null);}
  for(const id of ['retry','change','quit','resume','pause']){const b=root.getElementById(id);if(b)label(entry,b,compactLabel(id,b.textContent));}
  const panel=root.getElementById('pause-screen')?.querySelector('.small-panel');if(panel){let settings=panel.querySelector('.pause-settings');if(!settings){settings=doc.createElement('div');settings.className='pause-settings';settings.setAttribute('aria-label','설정');panel.insertBefore(settings,root.getElementById('quit'));entry.scope.add(()=>settings.remove());}for(const id of ['theme','sound']){const b=root.getElementById(id);if(b&&b.parentNode!==settings){const parent=b.parentNode,next=b.nextSibling;settings.appendChild(b);entry.scope.add(()=>parent?.insertBefore(b,next?.parentNode===parent?next:null));}}}
  const active=combatActive(root);if(takeIntro(seen,boss,!doc.body?.dataset?.journey&&active&&!(root===doc&&doc.getElementById('boss-transition')?.open)))startIntro(entry,root,arena,boss);else if(!active)arena.querySelector('.game-intro')?.remove();
 }
 function apply(){
  if(!alive())return;const active=new Map([[doc,'kwon']]);for(const [id,boss] of [['clown-battle','clown'],['dice-battle','dice']]){const root=doc.getElementById(id)?.firstElementChild?.shadowRoot;if(root)active.set(root,boss);}
  for(const [root,entry] of [...roots])if(!active.has(root)){entry.scope.dispose();entry.untrack();roots.delete(root);}for(const [root,boss] of active)polish(root,boss);
  const d=doc.getElementById('boss-transition');if(d){const button=d.querySelector('.bt-confirm'),back=d.querySelector('.bt-return'),note=d.querySelector('.bt-note');text(d.querySelector('.bt-choice h3'),'무기 선택');if(button){text(button,'서커스 입장');const hidden=d.dataset.stage!=='ready';if(button.hidden!==hidden)button.hidden=hidden;if(note&&button.parentNode!==note)note.insertBefore(button,back);}for(const status of d.querySelectorAll('.bt-selection,.bt-note>span'))if(/실패|못했|불러옵니다|로딩 중/.test(status.textContent))status.setAttribute('data-ui-status','');else status.removeAttribute('data-ui-status');}
 }
 const control={dispose(){if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});closing=true;if(rafId!==null)safe(()=>win.cancelAnimationFrame(rafId));rafId=null;scope.dispose();roots.clear();const pending=[...battles].map(view=>settleCleanup(()=>view.close?.(),'Game UI battle'));battles.clear();pending.push(settleCleanup(()=>screenFx?.dispose(),'Game UI screen effects'));screenFx=null;installations.delete(doc);Promise.all(pending).then(reports=>finish(combineCleanupReports(reports)));return completion;},get disposed(){return !alive();}};
 const pagehide=e=>{if(!e.persisted)control.dispose();};installations.set(doc,control);scope.add(()=>win.removeEventListener?.('pagehide',pagehide,true));
 try{win.addEventListener?.('pagehide',pagehide,{capture:true});apply();}catch(error){control.dispose();throw error;}
 Promise.resolve().then(()=>alive()?loadScreenFx():null).then(module=>{if(alive()&&module)screenFx=module.installScreenFx(doc,win);}).catch(error=>{if(alive())console.error('Screen effects unavailable',error);});return control;
}
