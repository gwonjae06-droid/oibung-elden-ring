import {createBossSecret} from './boss-secret.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
import {flameBalance,buyForgeTier,refundForgeWeapon,consumeRevivalFlame,investedFlames} from './purification-forge.mjs';
import {forgeScreen,flameRewardScreen,flameCounter} from './forge-view.mjs';
import {playRewardPull} from './reward-pull.mjs';
import {CHAPTER_MEMORIES} from './chapter-story.mjs';
import {playJourneyTransition} from './journey-transition.mjs';
import {readBattleSession} from './battle-session.mjs';
import {BOSSES,BOSS_NAMES,TRIAL_NAME,newRun,loadProfile,saveProfile,finishAttempt,advanceJourney,configureJourney} from './journey-state.mjs';
import {BOSS_REGISTRY} from './boss-registry.mjs';
import {JOURNEY_ART} from './journey-art.mjs?art=dice-giant-v3-crashfix';
import {createMenuTheme} from './menu-theme.mjs';
import {AUDIO_CHANNELS,readAudioVolume,writeAudioVolume} from './audio-preferences.mjs';
import {MOBILE_LANDSCAPE_GATE_HTML} from './mobile-landscape.mjs';
const WEAPONS={sword:'검',hammer:'망치',bow:'활',cards:'카드'};
const DESCRIPTIONS={sword:'짧은 틈을 가르는 질풍검',hammer:'네 번의 적중, 흡혈의 강타',bow:'거리를 지배하는 관통 화살',cards:'세 가지 색으로 바꾸는 운명'};
const AUDIO_LABELS={master:'전체 음량',music:'BGM',effects:'효과음',ambient:'환경음',ui:'UI 음량'};
// A cinematic that throws or never finishes must not block the fight: it is skipped and every later one is switched off.
const TRANSITION_LIMIT_MS=20000;
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function installJourney(doc=globalThis.document,win=globalThis.window,{loadBattle=id=>BOSS_REGISTRY[id].load(),makeMusic=createMenuTheme,playTransition=(boss,shell)=>playJourneyTransition(doc,win,boss,shell),playPull=panel=>playRewardPull(doc,win,panel)}={}){
 const dialog=doc.getElementById('journey');if(!dialog)return null;
 let storage;try{storage=win.localStorage;}catch{}let profile=loadProfile(storage),screen='home',weapon='sword',view=null,root=doc,game=null,busy=false,disposed=false,suppressClose=false,focused=true,saveFailed=false;
 let transition=null,memoryComplete=false,transitionsOn=true,forgeWeapon='sword',pendingReward=null;const secret=createBossSecret();
 const music=makeMusic(win),seen=new WeakSet(),roots=new Map();
 const audioSliders=()=>AUDIO_CHANNELS.map(channel=>`<label class="j-setting">${AUDIO_LABELS[channel]} <input type="range" data-audio-channel="${channel}" min="0" max="1" step=".05" value="${readAudioVolume(channel,storage)}" aria-label="${AUDIO_LABELS[channel]}"></label>`).join('');
 const pref=(key,fallback)=>{try{return storage.getItem(key)??fallback;}catch{return fallback;}};
 const put=(key,value)=>{try{storage.setItem(key,value);}catch{saveFailed=true;}};
 const persist=()=>{saveFailed=!saveProfile(storage,profile);};
 if(doc.body?.dataset){doc.body.dataset.motion='auto';doc.body.dataset.quality='auto';}
 let volume=Number(pref('oibung.menu.volume','.55'));if(!Number.isFinite(volume))volume=.55;
 function syncMusic(){const muted=pref('oibung-muted','0')==='1';music.update(dialog.open&&screen!=='transition'&&screen!=='loading'&&!doc.hidden&&focused&&!muted,volume,{immediateStop:muted||doc.hidden||!focused});}
 function unlock(){music.unlock();syncMusic();}
 function show(content){
  if(dialog.dataset){dialog.dataset.screen=screen;dialog.dataset.defeated=(profile.defeated||[]).join(' ');}
  dialog.innerHTML=JOURNEY_ART+`<div class="j-shell"><header class="j-top"><span>다섯 소망. 하나의 서약.</span>${flameCounter(profile)}</header><main class="j-main">${content}</main></div>`+MOBILE_LANDSCAPE_GATE_HTML;
  if(!dialog.open)dialog.showModal();syncMusic();dialog.querySelector('button:not(:disabled)')?.focus();
 }
 const button=(action,label,extra='')=>`<button data-j="${action}" ${extra}>${label}</button>`;
 const back=()=>button('home','← 메인으로','class="j-back"');
 function route(){return `<div class="j-route">${BOSS_NAMES.map((n,i)=>`<span class="${profile.run&&(i<profile.run.stage||i===profile.run.stage&&profile.run.pending)?'done':''}">${n}</span>`).join('')}</div>`;}
 function warning(){return saveFailed?'<p class="j-status" role="alert">저장 공간에 접근할 수 없습니다. 새로고침하면 현재 진행이 사라질 수 있습니다.</p>':'';}
 function home(){secret.reset();screen='home';profile.run=null;persist();
  show(`<div class="j-copy"><h1 class="j-title" data-j="secret-tap" style="user-select:none">오든링</h1><p class="j-subtitle">두상의 서약</p><p class="j-prose">소망을 이루기 위해, 무엇을 바칠 것인가.<br>얼굴 없는 회랑에서, 잃어버린 이름을 마주하십시오.</p><div class="j-menu">${button('new','시련 시작','class="j-primary"')}${button('forge','대장간 · 무기 진화','class="j-forge-entry"')}</div><div class="j-links">${button('records','기록실')}${button('settings','설정')}</div>${route()}${warning()}</div>`);
 }
 function select(){screen='select';show(`<div class="j-panel"><h1>${TRIAL_NAME}</h1><p>대장간에서 각인한 무기 진화를 유지하며 ${BOSSES.length}명의 보스에게 도전합니다.<br>패배·중단·새로고침 시 여정은 처음부터 시작하지만, 정화의 불꽃과 무기 각인은 이 브라우저에 남습니다.</p><div class="j-cards j-weapon">${Object.entries(WEAPONS).map(([id,name],i)=>button('weapon',`<strong>0${i+1}</strong><b>${name}</b><small>${DESCRIPTIONS[id]}</small>`,`data-weapon="${id}" class="${weapon===id?'selected':''}" aria-pressed="${weapon===id}"`)).join('')}</div>${profile.run?'<p>출정하면 기존 여정이 새 여정으로 교체됩니다. 처치 기록은 유지됩니다.</p>':''}${button('begin','선택한 무기로 출정','class="j-primary"')}${back()}</div>`);}
 function secretMenu(){screen='secret';secret.reset();show(`<div class="j-panel"><h1>봉인 밖의 문</h1><p>숨겨진 길을 발견했습니다. 무기를 선택하고 원하는 보스에게 이동하세요.<br>이 이동 전투는 서약의 기억·완수 기록에 반영되지 않습니다. 보스를 쓰러뜨리면 정화의 불꽃 1개를 획득합니다.</p><div class="j-links" role="group" aria-label="이동 전투 무기">${Object.entries(WEAPONS).map(([id,name])=>button('secret-weapon',name,`data-weapon="${id}" class="${weapon===id?'selected':''}" aria-pressed="${weapon===id}"`)).join('')}</div><div class="j-cards">${BOSSES.map((id,i)=>button('secret-enter',`<strong>0${i+1}</strong><b>${BOSS_NAMES[i]}</b><small>바로 이동</small>`,`data-boss="${id}"`)).join('')}</div><div class="j-links">${BOSSES.filter(id=>BOSS_REGISTRY[id].secret).map(id=>button('secret-phase',BOSS_REGISTRY[id].secret.label,`data-boss="${id}" data-phase="${BOSS_REGISTRY[id].secret.phase}"`)).join('')}</div>${back()}</div>`);}
 function secretRun(stage,phase=1){const run=newRun(weapon);run.stage=stage;run.secret=true;run.secretPhase=phase;return run;}
 function memory(boss='kwon',complete=false){memoryComplete=complete;const m=CHAPTER_MEMORIES[boss];screen='memory';const nextBoss=BOSS_NAMES[(profile.run?.stage??0)+1];show(`<div class="j-panel j-memory"><p class="j-kicker">서약의 기억</p><div class="j-memory-art" data-memory="${boss}" aria-hidden="true"></div><h1>${m.title}</h1><p class="j-memory-last">${m.last}</p><p>${m.text}</p><p>${BOSS_NAMES[BOSSES.indexOf(boss)]}의 서약 · ${m.oath}</p>${button('memory-next','정화의 불꽃 확인','class="j-primary"')}${back()}</div>`);}
 function forge(){screen='forge';show(forgeScreen(profile,forgeWeapon,{button,back,warning}));}
 function flameReward(){if(!pendingReward)return;screen='flame';show(flameRewardScreen(profile,pendingReward.name,{button,back,warning,complete:pendingReward.complete}));}
 function records(){screen='records';const rows=[...profile.records].reverse();
  show(`<div class="j-panel"><h1>기록실</h1><p>전체 클리어 ${profile.clears}회</p>${rows.length?`<table class="j-table"><thead><tr><th>시련</th><th>무기</th><th>시간</th><th>패배</th><th>달성</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${TRIAL_NAME} · ${r.bossCount||3}보스</td><td>${WEAPONS[r.weapon]}</td><td>${clock(r.time)}</td><td>${r.deaths}회</td><td>${r.deaths===0?'불굴의 도전자':(r.bossCount||3)+'지배자 토벌'}</td></tr>`).join('')}</tbody></table>`:`<p>여정 완수 기록은 아직 없습니다. ${BOSSES.length}명의 보스를 쓰러뜨리면 완수 기록이 남습니다.</p>`}${profile.memories?.length?profile.memories.map(entry=>{const m=CHAPTER_MEMORIES[entry.id];return `<details class="j-memory-record"><summary>${BOSS_NAMES[BOSSES.indexOf(entry.id)]} · ${m.title}</summary><section><div class="j-memory-art" data-memory="${entry.id}" aria-hidden="true"></div><div><h2>${BOSS_NAMES[BOSSES.indexOf(entry.id)]} · ${m.title}</h2><p>${m.last}</p><p>${m.text}</p><p>서약 · ${m.oath} · 첫 토벌 ${entry.firstClear?new Date(entry.firstClear).toLocaleDateString('ko-KR'):'이전 기록'}</p></div></section></details>`;}).join(''):'<p>보스를 토벌하면 서약의 기억과 첫 토벌 날짜가 기록됩니다.</p>'}${back()}</div>`);
 }
 function settings(){screen='settings';show(`<div class="j-panel"><h1>설정</h1><label class="j-setting"><input type="checkbox" id="j-muted" ${pref('oibung-muted','0')==='1'?'checked':''}> 모든 소리 끄기</label><label class="j-setting">메인 테마 개별 음량 <input id="j-volume" type="range" min="0" max="1" step=".05" value="${volume}"></label>${audioSliders()}<details><summary>조작법</summary><p>WASD / 방향키 이동 · J / 좌클릭 공격 · L / 우클릭 스킬<br>Space 회피 · E 회복약 · Q 록온 · Esc 일시정지<br>모바일에서는 화면 조이스틱과 행동 버튼을 사용합니다.</p></details>${back()}${warning()}</div>`);}
 async function closeBattle(){suppressClose=true;try{await view?.close?.();view=null;if(root!==doc&&roots.has(root)){root.removeEventListener('click',roots.get(root),true);roots.delete(root);}readBattleSession(doc)?.menu?.();}finally{suppressClose=false;}game=null;root=doc;}
 function accountInterrupted(){if(game?.status==='won'&&!seen.has(game)&&profile.run){seen.add(game);finishAttempt(profile,{won:true,time:game.time});}persist();}
 async function goHome(){if(busy)return;await poll(true);busy=true;try{if(game?.status==='playing')readBattleSession(root)?.pause?.();accountInterrupted();await closeBattle();home();}finally{busy=false;}}
 // Runs one cinematic. Any error or a run longer than the limit switches all cinematics off and the game simply carries on.
 async function play(make){
  if(!transitionsOn)return false;
  let t=null,timer=null;
  try{
   t=make();transition=t;
   const limit=new Promise(resolve=>{timer=(win.setTimeout||globalThis.setTimeout)(()=>resolve('timeout'),TRANSITION_LIMIT_MS);});
   if(await Promise.race([t.finished,limit])==='timeout')throw Error('Cinematic timed out');
   return true;
  }catch(error){
   console.error('Journey cinematics disabled after a failure',error);transitionsOn=false;return false;
  }finally{
   if(timer!==null)(win.clearTimeout||globalThis.clearTimeout)(timer);
   try{t?.dispose?.();}catch{}
   if(transition===t)transition=null;
  }
 }
 async function scene(boss){if(!transitionsOn)return;screen='transition';dialog.close();syncMusic();await play(()=>playTransition(boss,root.getElementById('arena')));}
 function nextReady(){screen='ready';const r=profile.run,place=BOSS_REGISTRY[BOSSES[r.stage]].place||'다음 시련';show(`<div class="j-panel"><p class="j-kicker">${place} · THE NEXT OATH</p><h1>${BOSS_NAMES[r.stage]}</h1><p>정화의 불꽃은 보관되었습니다. 대장간에서 영구 각인한 ${WEAPONS[r.weapon]}의 무기 진화는 다음 전투에도 유지됩니다.</p>${button('next','다음 도전','class="j-primary"')}${back()}${warning()}</div>`);}
 async function launch(){
  if(busy||!profile.run)return;busy=true;screen='loading';show(`<div class="j-panel"><h1>${BOSS_NAMES[profile.run.stage]}</h1><p role="status">전장을 준비합니다…</p></div>`);
  try{await closeBattle();if(disposed)return;const r=profile.run,entry=BOSS_REGISTRY[BOSSES[r.stage]],configure=g=>configureJourney(g,r,profile);
   if(entry.kind==='arena'){readBattleSession(doc).start(r.weapon,configure);root=doc;}
   else{const m=await loadBattle(entry.id);if(disposed)return;const onClose=()=>{if(!suppressClose&&!disposed){accountInterrupted();view=null;game=null;home();}};view=entry.launch(m,{weapon:r.weapon,configure,onClose,startPhase:r.secret?r.secretPhase||1:1});if(!view)throw Error('Battle unavailable');root=doc.getElementById(entry.dialogId).firstElementChild.shadowRoot;}
   game=readBattleSession(root)?.game;if(!game)throw Error('Battle session unavailable');if(entry.kind==='arena'&&transitionsOn){const session=readBattleSession(root);session.pause?.();const pause=root.getElementById('pause-screen');const old=pause?.style?.visibility;if(pause?.style)pause.style.visibility='hidden';try{await scene(entry.id);}finally{if(pause?.style)pause.style.visibility=old;}if(disposed)return;session.resume?.();}screen='battle';dialog.close();syncMusic();watchRoot(root);root.getElementById('world')?.focus();
  }catch(error){console.error('Journey launch failed',error);await closeBattle();show(`<div class="j-panel"><h1>전장을 열지 못했습니다</h1><p>인터넷 연결과 WebGL 지원을 확인한 뒤 다시 시도해 주세요. 저장된 여정은 유지됩니다.</p>${button('continue','다시 시도')}${back()}</div>`);}finally{busy=false;}
 }
 function watchRoot(target){if(roots.has(target))return;const listener=e=>{const b=e.target.closest?.('button');if(!b||screen!=='battle')return;if(b.id==='retry'){e.preventDefault();e.stopImmediatePropagation();const r=profile.run;if(!r||busy)return;(async()=>{await poll(true);profile.run=r.secret?secretRun(r.stage,r.secretPhase):newRun(r.weapon);await launch();})();return;}if(['quit','change'].includes(b.id)){e.preventDefault();e.stopImmediatePropagation();goHome();}};target.addEventListener('click',listener,true);roots.set(target,listener);}
 async function poll(force=false){if(disposed||screen!=='battle'||!game||busy)return;const arena=root.getElementById('arena');let prep=root.getElementById('battle-preparation');if(!prep&&arena?.appendChild&&doc.createElement){prep=doc.createElement('p');prep.id='battle-preparation';prep.setAttribute('role','status');prep.style.cssText='position:absolute;top:28%;left:0;width:100%;text-align:center;z-index:30;color:#fff0ba;font:600 22px serif;text-shadow:0 2px 10px #000;pointer-events:none';arena.appendChild(prep);}if(prep?.style){prep.hidden=!(game.startGrace>0||game.player.action?.kind==='charging');prep.textContent=game.startGrace>0?'봉인이 풀립니다 · '+Math.ceil(game.startGrace):game.player.action?.kind==='charging'?'차징 · '+Math.min(100,Math.round(game.player.action.t/.9*100))+'%':'';}const result=root.getElementById('result');if(game.status==='playing'||!result||(!force&&result.hidden)||seen.has(game))return;
  seen.add(game);const r=profile.run;if(!r)return;
  const name=BOSS_NAMES[r.stage],won=game.status==='won',outcome=finishAttempt(profile,{won,time:game.time});persist();
  if(r.secret){
   screen='secret-result';
   show('<div class="j-panel"><p class="j-kicker">BEYOND THE OATH</p><h1>'+name+' · '+(won?'격파':'재도전')+'</h1><p>숨겨진 전투는 여정의 기록에 남지 않습니다. '+(won?'정화의 불꽃 +1 · 현재 '+flameBalance(profile)+'개':'획득한 불꽃은 없습니다.')+'</p>'+button('secret-retry','같은 보스 재도전','class="j-primary"')+' '+button('secret-menu','다른 보스로 이동')+back()+'</div>');
   return;
  }
  if(outcome==='flame'||outcome==='complete'){
   pendingReward={name,complete:outcome==='complete'};
   memory(BOSSES[r.stage],outcome==='complete');return;
  }
  screen='result';
  const canRevive=flameBalance(profile)>0&&!r.reviveUsed;
  show('<div class="j-panel j-death-ember"><p class="j-kicker">ONE EMBER REMAINS</p><h1>아직, 끝나지 않았다</h1><p>'+name+
   '에게 쓰러졌습니다. 부활하면 정화의 불꽃 1개를 소모하여 현재 보스부터 다시 도전합니다. 부활은 한 여정에 단 한 번만 가능합니다.</p>'+
   '<div class="j-result"><div><b>'+Math.ceil(game.boss.hp/game.boss.maxHp*100)+'%</b><span>남은 보스 생명</span></div><div><b>'+clock(game.time)+
   '</b><span>이번 전투</span></div><div><b>'+r.deaths+'회</b><span>누적 패배</span></div></div><p>'+
   BOSS_REGISTRY[BOSSES[r.stage]].hint(game)+'</p>'+
   (canRevive?'<div class="j-revive-offer">'+flameCounter(profile)+button('revive','정화의 불꽃 1개로 부활','class="j-primary j-revive-action"')+'</div>':
    '<p class="j-status">'+(r.reviveUsed?'이번 여정의 부활을 이미 사용했습니다.':'부활에 필요한 정화의 불꽃이 없습니다.')+'</p>')+
   button('restart','처음부터 다시 도전')+back()+warning()+'</div>');

 }
 async function completeJourney(){busy=true;try{await scene('complete');if(disposed)return;screen='result';const record=profile.records.at(-1),best=Math.min(...profile.records.filter(x=>x.weapon===record.weapon&&x.bossCount===record.bossCount).map(x=>x.time));show(`<div class="j-panel"><div class="j-seal" aria-hidden="true">♜</div><h1>네 지배자를 넘어섰다</h1><p>긴턱의 그림자가 걷히고, 공연이 끝나고, 주사위가 멈추고 성당의 마지막 심장이 고요해졌습니다.<br>최규원으로 이어지는 마지막 문은 아직 봉인되어 있습니다.<br>당신의 이름이 시련의 기록에 새겨집니다.</p><div class="j-result"><div><b>${clock(record.time)}</b><span>누적 전투 시간</span></div><div><b>${record.deaths}회</b><span>패배</span></div><div><b>${WEAPONS[record.weapon]}</b><span>${TRIAL_NAME}</span></div></div><p>${record.time===best?'이 무기의 최고 기록입니다.':'이 무기의 최고 기록 '+clock(best)}</p>${button('records','기록실','class="j-primary"')}${back()}${warning()}</div>`);
}finally{busy=false;}}
 async function click(e){const b=e.target.closest('[data-j]');if(!b||busy||disposed)return;const action=b.dataset.j;
  if(action==='secret-tap'&&screen==='home'){if(secret.tap(performance.now()))secretMenu();return;}
  if(action==='secret-weapon'&&screen==='secret'){if(Object.hasOwn(WEAPONS,b.dataset.weapon)){weapon=b.dataset.weapon;secretMenu();}return;}
  if(action==='secret-phase'&&screen==='secret'){const stage=BOSSES.indexOf(b.dataset.boss),phase=Number(b.dataset.phase);if(stage>=0&&phase>=1){profile.run=secretRun(stage,phase);await launch();}return;}
  if(action==='secret-enter'&&screen==='secret'){const stage=BOSSES.indexOf(b.dataset.boss);if(stage>=0){profile.run=secretRun(stage);await launch();}return;}
  if(action==='secret-retry'&&screen==='secret-result'&&profile.run?.secret){profile.run=secretRun(profile.run.stage,profile.run.secretPhase);await launch();return;}
  if(action==='secret-menu'&&screen==='secret-result'){busy=true;try{await closeBattle();profile.run=null;secretMenu();}finally{busy=false;}return;}
  if(action==='home'){await goHome();return;}
  if(action==='forge'&&screen==='home'){forgeWeapon=weapon;forge();return;}
  if(action==='forge-weapon'&&screen==='forge'){
   if(Object.hasOwn(WEAPONS,b.dataset.weapon)){forgeWeapon=b.dataset.weapon;forge();}return;
  }
  if(action==='forge-buy'&&screen==='forge'){
   if(buyForgeTier(profile,forgeWeapon,b.dataset.evolution)){persist();forge();}return;
  }
  if(action==='forge-refund'&&screen==='forge'){
   if(refundForgeWeapon(profile,forgeWeapon)){persist();forge();}return;
  }
  if(action==='revive'&&screen==='result'&&profile.run&&!profile.run.secret&&game?.status==='lost'){
   if(!consumeRevivalFlame(profile,profile.run))return;
   persist();await launch();return;
  }
  if(action==='new')select();
  else if(action==='weapon'){weapon=b.dataset.weapon;select();}
  else if(action==='begin'){pendingReward=null;profile.run=newRun(weapon);persist();await launch();}
  else if(action==='restart'){pendingReward=null;profile.run=newRun(profile.run.weapon);await launch();}
  else if(action==='continue'){if(screen==='loading'&&profile.run)await launch();}
  else if(action==='memory-next'&&screen==='memory'){flameReward();}
  else if(action==='flame-next'&&screen==='flame'&&pendingReward){
   const complete=pendingReward.complete;pendingReward=null;
   if(complete)await completeJourney();
   else if(profile.run?.pending){advanceJourney(profile.run);persist();nextReady();}
  }
  else if(action==='next'){
   if(!profile.run||profile.run.pending||screen!=='ready')return;
   busy=true;try{screen='transition';syncMusic();await play(()=>playPull(dialog));if(disposed)return;await scene(BOSSES[profile.run.stage]);}
   finally{busy=false;}if(!disposed)await launch();
  }
  else if(action==='records')records();
  else if(action==='settings')settings();
 }
 const input=e=>{if(e.target.id==='j-muted'){put('oibung-muted',e.target.checked?'1':'0');syncMusic();}if(e.target.id==='j-volume'){volume=Number(e.target.value);put('oibung.menu.volume',String(volume));syncMusic();}if(e.target.dataset?.audioChannel){writeAudioVolume(e.target.dataset.audioChannel,e.target.value,storage);syncMusic();}};
 const cancel=e=>{e.preventDefault();if(!busy&&screen!=='home')goHome();};
 const secretKey=e=>{if(disposed||busy||screen!=='home'||!dialog.open||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;if(secret.key(e.code,performance.now())){e.preventDefault();secretMenu();}};
 const requestHome=()=>goHome(),focus=()=>{focused=true;syncMusic();},blur=()=>{focused=false;syncMusic();};
 dialog.addEventListener('click',click);dialog.addEventListener('input',input);dialog.addEventListener('cancel',cancel);dialog.addEventListener('keydown',e=>e.stopPropagation());
 win.addEventListener('keydown',secretKey,true);win.addEventListener('pointerdown',unlock,true);win.addEventListener('keydown',unlock,true);win.addEventListener('focus',focus);win.addEventListener('blur',blur);win.addEventListener('oibung:home',requestHome);doc.addEventListener('visibilitychange',syncMusic);
 const timer=win.setInterval(poll,150);if(dialog.open)dialog.close();home();
 return {get transitionsEnabled(){return transitionsOn;},async dispose(){accountInterrupted();disposed=true;transition?.dispose();win.clearInterval(timer);for(const [target,fn] of roots)target.removeEventListener('click',fn,true);roots.clear();win.removeEventListener('keydown',secretKey,true);win.removeEventListener('pointerdown',unlock,true);win.removeEventListener('keydown',unlock,true);win.removeEventListener('focus',focus);win.removeEventListener('blur',blur);win.removeEventListener('oibung:home',requestHome);doc.removeEventListener('visibilitychange',syncMusic);dialog.removeEventListener('click',click);dialog.removeEventListener('input',input);dialog.removeEventListener('cancel',cancel);await closeBattle();dialog.close();await music.dispose();}};
}
