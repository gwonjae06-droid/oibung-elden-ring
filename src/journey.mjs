import {createBossSecret} from './boss-secret.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
import {weaponStats} from './weapon-stats.mjs';
import {weaponStatChart} from './weapon-stat-chart.mjs';
import {flameBalance,buyForgeTier,refundForgeWeapon,investedFlames,grantForgeDeveloperFlames,isForgeDeveloperShortcut} from './purification-forge.mjs';
import {forgeScreen,flameRewardScreen,flameCounter} from './forge-view.mjs';
import {playRewardPull} from './reward-pull.mjs';
import {CHAPTER_MEMORIES} from './chapter-story.mjs';
import {playJourneyTransition} from './journey-transition.mjs?art=home-seam-v2-20261107';
import {readBattleSession} from './battle-session.mjs';
import {BOSSES,BOSS_NAMES,TRIAL_NAME,newRun,newTravelRun,latestUnlockedStage,canTravelTo,loadProfile,saveProfile,finishAttempt,advanceJourney,configureJourney} from './journey-state.mjs';
import {BOSS_REGISTRY} from './boss-registry.mjs';
import {JOURNEY_ART} from './journey-art.mjs?art=home-crimson-fill-20261107';
import {createMenuTheme} from './menu-theme.mjs';
import {AUDIO_CHANNELS,readAudioVolume,writeAudioVolume} from './audio-preferences.mjs';
import {MOBILE_LANDSCAPE_GATE_HTML} from './mobile-landscape.mjs';
const WEAPONS={sword:'검',hammer:'망치',bow:'활',cards:'카드'};
const DESCRIPTIONS={sword:'검기 또는 사거리 2배',hammer:'피해 저장 또는 돌아오는 철추',bow:'후퇴 2연사 또는 화상 화살',cards:'삼중 문양 폭발 또는 흡혈'};
const AUDIO_LABELS={master:'전체 음량',music:'BGM',effects:'효과음',ambient:'환경음',ui:'UI 음량'};
const statPercent=v=>Math.round(v*100)+'%';
export function weaponStatLabel(id){const s=weaponStats(id);return `HP ${s.maxHp} · 받는 피해 ${statPercent(s.incomingDamage)} · 이동 ${statPercent(s.walkSpeed)} · 회피 ${statPercent(s.rollDistance)} · 기력 회복 ${statPercent(s.staminaRegen)}`;}
// A cinematic that throws or never finishes must not block the fight: it is skipped and every later one is switched off.
const TRANSITION_LIMIT_MS=20000;
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function installJourney(doc=globalThis.document,win=globalThis.window,{loadBattle=id=>BOSS_REGISTRY[id].load(),makeMusic=createMenuTheme,playTransition=(boss,shell)=>playJourneyTransition(doc,win,boss,shell),playPull=panel=>playRewardPull(doc,win,panel)}={}){
 const dialog=doc.getElementById('journey');if(!dialog)return null;
 let storage;try{storage=win.localStorage;}catch{}let profile=loadProfile(storage),screen='home',weapon='sword',view=null,root=doc,game=null,busy=false,disposed=false,suppressClose=false,focused=true,saveFailed=false;
 let transition=null,memoryComplete=false,transitionsOn=true,forgeWeapon='sword',pendingReward=null,selectedStage=0,refundConfirmWeapon=null;const secret=createBossSecret();
 const music=makeMusic(win),seen=new WeakSet(),roots=new Map();
 const audioSliders=()=>AUDIO_CHANNELS.map(channel=>`<label class="j-setting">${AUDIO_LABELS[channel]} <input type="range" data-audio-channel="${channel}" min="0" max="1" step=".05" value="${readAudioVolume(channel,storage)}" aria-label="${AUDIO_LABELS[channel]}"></label>`).join('');
 const pref=(key,fallback)=>{try{return storage.getItem(key)??fallback;}catch{return fallback;}};
 const put=(key,value)=>{try{storage.setItem(key,value);}catch{saveFailed=true;}};
 const persist=()=>{saveFailed=!saveProfile(storage,profile);};
 if(doc.body?.dataset){doc.body.dataset.motion='auto';doc.body.dataset.quality='auto';}
 let volume=Number(pref('oibung.menu.volume','.55'));if(!Number.isFinite(volume))volume=.55;
 function syncMusic(){const muted=pref('oibung-muted','0')==='1';music.update(dialog.open&&screen!=='transition'&&screen!=='loading'&&!doc.hidden&&focused&&!muted,volume,{immediateStop:muted||doc.hidden||!focused});}
 function unlock(){music.unlock();syncMusic();}
 function show(content,{preserve=false}={}){
  const active=doc.activeElement;
  const focusKey=preserve&&dialog.contains?.(active)&&active?.dataset?.j?
   ['j','weapon','stage','evolution','tier'].map(key=>active.dataset[key]??''):null;
  const scroll=preserve?dialog.scrollTop:0;
  if(dialog.dataset){dialog.dataset.screen=screen;dialog.dataset.defeated=(profile.defeated||[]).join(' ');}
  dialog.innerHTML=JOURNEY_ART+`<div class="j-shell"><header class="j-top">${screen==='ready'?back():'<span>다섯 소망. 하나의 서약.</span>'}${flameCounter(profile)}</header><main class="j-main">${content}</main></div>`+MOBILE_LANDSCAPE_GATE_HTML;
  if(!dialog.open)dialog.showModal();
  syncMusic();
  const buttons=Array.from(dialog.querySelectorAll?.('[data-j]')||[]);
  let same=focusKey&&buttons.find(el=>
   ['j','weapon','stage','evolution','tier'].every((key,i)=>(el.dataset[key]??'')===focusKey[i]));
  // A purchased tier becomes disabled: move keyboard focus to the next
  // purchasable tier of the same path, or back to the active weapon tab.
  if(same?.disabled){
   same=buttons.find(el=>el.dataset.j==='forge-buy'&&el.dataset.evolution===focusKey?.[3]&&!el.disabled)||
    buttons.find(el=>el.dataset.j==='forge-weapon'&&el.dataset.weapon===forgeWeapon)||null;
  }
  const target=same||(preserve?null:screen==='ready'?dialog.querySelector('[data-j="next"]'):dialog.querySelector('button:not(:disabled)'));
  target?.focus?.({preventScroll:true});
  if(Number.isFinite(scroll))dialog.scrollTop=scroll;
 }
 const button=(action,label,extra='')=>`<button data-j="${action}" ${extra}>${label}</button>`;
 const back=()=>button('home','← 메인으로','class="j-back"');
 function route(){return `<div class="j-route">${BOSS_NAMES.map((n,i)=>`<span class="${profile.run&&(i<profile.run.stage||i===profile.run.stage&&profile.run.pending)?'done':''}">${n}</span>`).join('')}</div>`;}
 function warning(){return saveFailed?'<p class="j-status" role="alert">저장 공간에 접근할 수 없습니다. 새로고침하면 현재 진행이 사라질 수 있습니다.</p>':'';}
 function bossChooser(){
  const latest=latestUnlockedStage(profile);
  const cards=BOSSES.map((id,i)=>button('boss-target',
   '<span class="j-boss-number">0'+(i+1)+'</span><b>'+BOSS_NAMES[i]+'</b><small>'+(i<=latest?'해금됨 · 자유 이동':'잠김 · 앞의 보스 토벌 필요')+'</small>',
   'data-stage="'+i+'" class="j-boss-target '+(i===selectedStage?'selected':'')+'" aria-pressed="'+(i===selectedStage)+'" '+(i>latest?'disabled':'')
  )).join('');
  return '<section class="j-boss-chooser" aria-label="도전할 보스 선택"><div class="j-boss-chooser-head"><h2>도전할 보스</h2><p>해금한 보스는 비용 없이 언제든 다시 선택할 수 있습니다.</p></div>'+
   '<div class="j-boss-targets" role="group" aria-label="출발할 보스">'+cards+'</div>'+
   '<p class="j-boss-note">'+BOSS_NAMES[selectedStage]+'부터 도전합니다. 선택 지점 이후의 보스는 순서대로 이어집니다.</p></section>';
 }
 function home(resetSelection=true,bonus=0){secret.reset();screen='home';profile.run=null;if(resetSelection)selectedStage=0;persist();
  show(`<div class="j-copy"><h1 class="j-title" data-j="secret-tap" style="user-select:none">오든링</h1><p class="j-subtitle">두상의 서약</p>${bonus?`<p class="j-status" role="status">정화의 불꽃 +${bonus}개 · 보유 ${flameBalance(profile)}개</p>`:''}<p class="j-prose">소망을 이루기 위해, 무엇을 바칠 것인가.<br>얼굴 없는 회랑에서, 잃어버린 이름을 마주하십시오.</p><div class="j-menu">${button('new','시련 시작 · 보스 선택','class="j-primary"')}${button('forge','대장간 · 무기 진화','class="j-forge-entry"')}</div><div class="j-links">${button('records','기록실')}${button('settings','설정')}</div>${route()}${warning()}</div>`);
 }
 function select(preserve=false){
  if(!canTravelTo(profile,selectedStage))selectedStage=0;
  screen='select';
  show(`<div class="j-panel j-select"><div class="j-select-heading"><h1>${TRIAL_NAME}</h1><p>해금된 보스를 선택하고 무기를 정해 출정하세요. 보스 해금과 대장간 각인은 영구 유지됩니다.</p></div><div class="j-select-layout"><div class="j-select-left">${bossChooser()}<section class="j-select-weapons"><h2 class="j-select-subtitle">무기 선택</h2><div class="j-cards j-weapon">${Object.entries(WEAPONS).map(([id,name],i)=>button('weapon',`<strong>0${i+1}</strong><b>${name}</b><small>${DESCRIPTIONS[id]}</small>`,`data-weapon="${id}" class="${weapon===id?'selected':''}" aria-pressed="${weapon===id}"`)).join('')}</div></section></div><div class="j-select-right">${weaponStatChart(weapon,{profile})}</div></div><div class="j-select-actions"><span class="j-selected-route" role="status">${BOSS_NAMES[selectedStage]} · ${WEAPONS[weapon]}</span>${button('begin','선택한 보스로 출정','class="j-primary j-begin"')}</div>${back()}${warning()}</div>`,{preserve});
 }
 function memory(boss='kwon',complete=false){memoryComplete=complete;const m=CHAPTER_MEMORIES[boss];screen='memory';const nextBoss=BOSS_NAMES[(profile.run?.stage??0)+1];show(`<div class="j-panel j-memory"><p class="j-kicker">서약의 기억</p><div class="j-memory-art" data-memory="${boss}" aria-hidden="true"></div><h1>${m.title}</h1><p class="j-memory-last">${m.last}</p><p>${m.text}</p><p>${BOSS_NAMES[BOSSES.indexOf(boss)]}의 서약 · ${m.oath}</p>${button('memory-next','정화의 불꽃 확인','class="j-primary"')}${back()}</div>`);}
 function forge(preserve=false){
  screen='forge';
  show(forgeScreen(profile,forgeWeapon,{button,back,warning,confirmRefund:refundConfirmWeapon===forgeWeapon}),{preserve});
  if(refundConfirmWeapon===forgeWeapon){
   const cancelButton=dialog.querySelector?.('[data-j="forge-refund-cancel"]');
   cancelButton?.focus?.({preventScroll:true});
   cancelButton?.scrollIntoView?.({block:'nearest'});
  }
 }
 function flameReward(){if(!pendingReward)return;screen='flame';show(flameRewardScreen(profile,pendingReward.name,{button,back,warning,complete:pendingReward.complete}));}
 function records(){
  screen='records';
  const rows=[...profile.records].reverse();
  const recordFields=r=>{
   const route=r.startStage?`보스 선택 · ${BOSS_NAMES[r.startStage]}부터`:TRIAL_NAME;
   return {route:route+' · '+((r.bossCount||3)-(r.startStage||0))+'보스',
    weapon:WEAPONS[r.weapon],time:clock(r.time),
    damage:Number.isFinite(r.damage)?Math.round(r.damage).toLocaleString('ko-KR'):'—',
    deaths:r.deaths+'회',
    result:r.startStage?'선택 보스 토벌':r.deaths===0?'불굴의 도전자':(r.bossCount||3)+'지배자 토벌'};
  };
  const cols=['route','weapon','time','damage','deaths','result'];
  const heads=['시련','무기','시간','누적 피해','패배','달성'];
  const table=rows.length?`<table class="j-table"><thead><tr>${heads.map(label=>'<th>'+label+'</th>').join('')}</tr></thead><tbody>${rows.map(r=>{const record=recordFields(r);return '<tr>'+cols.map(k=>'<td>'+record[k]+'</td>').join('')+'</tr>';}).join('')}</tbody></table>`:'';
  const cards=rows.length?'<div class="j-record-cards">'+rows.map(r=>{
   const record=recordFields(r);
   return `<article class="j-record-card"><h2>${record.route}</h2><p>${record.result}</p><dl>${cols.slice(1,5).map((key,i)=>'<div><dt>'+heads[i+1]+'</dt><dd>'+record[key]+'</dd></div>').join('')}</dl></article>`;
  }).join('')+'</div>':'';
  show(`<div class="j-panel j-records"><h1>기록실</h1><p>전체 클리어 ${profile.clears}회 · 선택 보스부터 시작한 기록은 별도로 표시합니다.</p>${rows.length?table+cards:`<p>여정 완수 기록은 아직 없습니다. ${BOSSES.length}명의 보스를 쓰러뜨리면 완수 기록이 남습니다.</p>`}${profile.memories?.length?profile.memories.map(entry=>{const m=CHAPTER_MEMORIES[entry.id];return `<details class="j-memory-record"><summary>${BOSS_NAMES[BOSSES.indexOf(entry.id)]} · ${m.title}</summary><section><div class="j-memory-art" data-memory="${entry.id}" aria-hidden="true"></div><div><h2>${BOSS_NAMES[BOSSES.indexOf(entry.id)]} · ${m.title}</h2><p>${m.last}</p><p>${m.text}</p><p>서약 · ${m.oath} · 첫 토벌 ${entry.firstClear?new Date(entry.firstClear).toLocaleDateString('ko-KR'):'이전 기록'}</p></div></section></details>`;}).join(''):'<p>보스를 토벌하면 서약의 기억과 첫 토벌 날짜가 기록됩니다.</p>'}${back()}</div>`);
 }
 function settings(){screen='settings';show(`<div class="j-panel"><h1>설정</h1><label class="j-setting"><input type="checkbox" id="j-muted" ${pref('oibung-muted','0')==='1'?'checked':''}> 모든 소리 끄기</label><label class="j-setting">메인 테마 개별 음량 <input id="j-volume" type="range" min="0" max="1" step=".05" value="${volume}"></label>${audioSliders()}<details><summary>조작법</summary><p>WASD / 방향키 이동 · J / 좌클릭 공격 · L / 우클릭 스킬<br>Space 회피 · E 회복약 · Q 록온 · Esc 일시정지<br>모바일에서는 화면 조이스틱과 행동 버튼을 사용합니다.</p></details>${back()}${warning()}</div>`);}
 async function closeBattle(){suppressClose=true;try{await view?.close?.();view=null;if(root!==doc&&roots.has(root)){root.removeEventListener('click',roots.get(root),true);roots.delete(root);}readBattleSession(doc)?.menu?.();}finally{suppressClose=false;}game=null;root=doc;}
 function accountInterrupted(){if(game?.status==='won'&&!seen.has(game)&&profile.run){seen.add(game);finishAttempt(profile,{won:true,time:game.time,damage:game.stats?.damage});}persist();}
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
 function nextReady(){screen='ready';const r=profile.run,place=BOSS_REGISTRY[BOSSES[r.stage]].place||'다음 시련';show(`<div class="j-panel"><p class="j-kicker">${place} · THE NEXT OATH</p><h1>${BOSS_NAMES[r.stage]}</h1><p>정화의 불꽃은 보관되었습니다. 대장간에서 영구 각인한 ${WEAPONS[r.weapon]}의 무기 진화는 다음 전투에도 유지됩니다.</p>${button('next','다음 도전','class="j-primary"')}${warning()}</div>`);}
 async function launch(){
  if(busy||!profile.run)return;busy=true;screen='loading';show(`<div class="j-panel"><h1>${BOSS_NAMES[profile.run.stage]}</h1><p role="status">전장을 준비합니다…</p></div>`);
  try{await closeBattle();if(disposed)return;const r=profile.run,entry=BOSS_REGISTRY[BOSSES[r.stage]],configure=g=>configureJourney(g,r,profile);
   if(entry.kind==='arena'){readBattleSession(doc).start(r.weapon,configure);root=doc;}
   else{const m=await loadBattle(entry.id);if(disposed)return;const onClose=()=>{if(!suppressClose&&!disposed){accountInterrupted();view=null;game=null;home();}};view=entry.launch(m,{weapon:r.weapon,configure,onClose,startPhase:r.secret?r.secretPhase||1:1});if(!view)throw Error('Battle unavailable');root=doc.getElementById(entry.dialogId).firstElementChild.shadowRoot;}
   game=readBattleSession(root)?.game;if(!game)throw Error('Battle session unavailable');
   
   if(entry.kind==='arena'&&transitionsOn){const session=readBattleSession(root);session.pause?.();const pause=root.getElementById('pause-screen');const old=pause?.style?.visibility;if(pause?.style)pause.style.visibility='hidden';try{await scene(entry.id);}finally{if(pause?.style)pause.style.visibility=old;}if(disposed)return;session.resume?.();}screen='battle';dialog.close();readBattleSession(root)?.intro?.();syncMusic();watchRoot(root);root.getElementById('world')?.focus();
  }catch(error){console.error('Journey launch failed',error);await closeBattle();show(`<div class="j-panel"><h1>전장을 열지 못했습니다</h1><p>인터넷 연결과 WebGL 지원을 확인한 뒤 다시 시도해 주세요. 저장된 여정은 유지됩니다.</p>${button('continue','다시 시도')}${back()}</div>`);}finally{busy=false;}
 }
 function watchRoot(target){if(roots.has(target))return;const listener=e=>{const b=e.target.closest?.('button');if(!b||screen!=='battle')return;if(b.id==='retry'){e.preventDefault();e.stopImmediatePropagation();const r=profile.run;if(!r||busy)return;(async()=>{await poll(true);profile.run=newTravelRun(profile,r.weapon,r.startStage||0)??newRun(r.weapon);await launch();})();return;}if(['quit','change'].includes(b.id)){e.preventDefault();e.stopImmediatePropagation();goHome();}};target.addEventListener('click',listener,true);roots.set(target,listener);}
 async function poll(force=false){if(disposed||screen!=='battle'||!game||busy)return;const arena=root.getElementById('arena');let prep=root.getElementById('battle-preparation');if(!prep&&arena?.appendChild&&doc.createElement){prep=doc.createElement('p');prep.id='battle-preparation';prep.setAttribute('role','status');prep.style.cssText='position:absolute;top:28%;left:0;width:100%;text-align:center;z-index:30;color:#fff0ba;font:600 22px serif;text-shadow:0 2px 10px #000;pointer-events:none';arena.appendChild(prep);}if(prep?.style){prep.hidden=game.player.action?.kind!=='charging';prep.textContent=game.player.action?.kind==='charging'?'차징 · '+Math.min(100,Math.round(game.player.action.t/.9*100))+'%':'';}const result=root.getElementById('result');if(game.status==='playing'||!result||(!force&&result.hidden)||seen.has(game))return;
  seen.add(game);const r=profile.run;if(!r)return;
  const name=BOSS_NAMES[r.stage],won=game.status==='won',outcome=finishAttempt(profile,{won,time:game.time,damage:game.stats?.damage});persist();
  if(r.secret){
   screen='secret-result';
   show('<div class="j-panel"><p class="j-kicker">BEYOND THE OATH</p><h1>'+name+' · '+(won?'격파':'재도전')+'</h1><p>숨겨진 전투는 여정의 기록에 남지 않습니다. '+(won?'정화의 불꽃 +1 · 현재 '+flameBalance(profile)+'개':'획득한 불꽃은 없습니다.')+'</p>'+button('secret-retry','같은 보스 재도전','class="j-primary"')+' '+button('secret-menu','메인으로')+back()+'</div>');
   return;
  }
  if(outcome==='flame'||outcome==='complete'){
   pendingReward={name,complete:outcome==='complete'};
   memory(BOSSES[r.stage],outcome==='complete');return;
  }
  screen='result';
  show('<div class="j-panel j-death-ember"><p class="j-kicker">THE OATH AWAITS</p><h1>다시, 서약의 문으로</h1><p>'+name+
   '에게 쓰러졌습니다. 메인에서 해금한 보스를 선택해 비용 없이 다시 도전할 수 있습니다.</p>'+
   '<div class="j-result"><div><b>'+Math.ceil(game.boss.hp/game.boss.maxHp*100)+'%</b><span>남은 보스 생명</span></div><div><b>'+clock(game.time)+
   '</b><span>이번 전투</span></div><div><b>'+r.deaths+'회</b><span>누적 패배</span></div></div><p>'+
   BOSS_REGISTRY[BOSSES[r.stage]].hint(game)+'</p>'+
   button('restart',r.startStage?'선택 보스부터 다시 도전':'처음부터 다시 도전')+back()+warning()+'</div>');

 }
 async function completeJourney(){busy=true;try{await scene('complete');if(disposed)return;screen='result';const record=profile.records.at(-1),selectedRoute=record.startStage>0,best=Math.min(...profile.records.filter(x=>x.weapon===record.weapon&&x.bossCount===record.bossCount&&(x.startStage||0)===(record.startStage||0)).map(x=>x.time));show(`<div class="j-panel"><div class="j-seal" aria-hidden="true">♜</div><h1>${selectedRoute?'마지막 시련을 넘어섰다':'다섯 지배자를 넘어섰다'}</h1><p>${selectedRoute?`${BOSS_NAMES[record.startStage]}부터 시작한 선택 보스 여정을 완수했습니다. 전체 연속 클리어와 별도로 기록됩니다.`:'긴턱의 그림자가 걷히고, 공연이 끝나고, 주사위가 멈추고 성당의 마지막 심장이 고요해졌습니다.'}<br>멈춰 있던 자습실의 초침이 다시 움직입니다.<br>당신의 이름이 시련의 기록에 새겨집니다.</p><div class="j-result"><div><b>${clock(record.time)}</b><span>누적 전투 시간</span></div><div><b>${record.deaths}회</b><span>패배</span></div><div><b>${WEAPONS[record.weapon]}</b><span>${TRIAL_NAME}</span></div></div><p>${record.time===best?'같은 출발점·무기의 최고 기록입니다.':'같은 출발점·무기의 최고 기록 '+clock(best)}</p>${button('records','기록실','class="j-primary"')}${back()}${warning()}</div>`);
}finally{busy=false;}}
 async function click(e){const b=e.target.closest('[data-j]');if(!b||busy||disposed)return;const action=b.dataset.j;
  if(action==='secret-tap'&&screen==='home'){if(secret.tap(performance.now()))home(false,grantForgeDeveloperFlames(profile));return;}
  if(action==='home'){await goHome();return;}
  if(action==='forge'&&screen==='home'){forgeWeapon=weapon;refundConfirmWeapon=null;forge();return;}
  if(action==='forge-weapon'&&screen==='forge'){
   if(Object.hasOwn(WEAPONS,b.dataset.weapon)){forgeWeapon=b.dataset.weapon;refundConfirmWeapon=null;forge(true);}return;
  }
  if(action==='forge-buy'&&screen==='forge'){
   if(buyForgeTier(profile,forgeWeapon,b.dataset.evolution)){refundConfirmWeapon=null;persist();forge(true);}return;
  }
  if(action==='forge-refund'&&screen==='forge'){
   if(investedFlames(profile,forgeWeapon)>0){refundConfirmWeapon=forgeWeapon;forge(true);}
   return;
  }
  if(action==='forge-refund-cancel'&&screen==='forge'){refundConfirmWeapon=null;forge(true);return;}
  if(action==='forge-refund-confirm'&&screen==='forge'){
   if(refundConfirmWeapon===forgeWeapon&&refundForgeWeapon(profile,forgeWeapon)){persist();}
   refundConfirmWeapon=null;forge(true);return;
  }
  if(action==='boss-target'&&screen==='select'){
   const stage=Number(b.dataset.stage);
   if(canTravelTo(profile,stage)){selectedStage=stage;select(true);}
   return;
  }
  if(action==='new'&&screen==='home'){selectedStage=0;select();return;}
  else if(action==='weapon'&&screen==='select'&&Object.hasOwn(WEAPONS,b.dataset.weapon)){weapon=b.dataset.weapon;select(true);}
  else if(action==='begin'&&screen==='select'){
   pendingReward=null;
   profile.run=newTravelRun(profile,weapon,selectedStage);
   if(!profile.run){selectedStage=0;select();return;}
   persist();await launch();
  }
  else if(action==='restart'&&screen==='result'&&profile.run){pendingReward=null;profile.run=newTravelRun(profile,profile.run.weapon,profile.run.startStage||0)??newRun(profile.run.weapon);await launch();}
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
 const forgeDeveloperKey=e=>{
  if(disposed||busy||screen!=='forge'||!dialog.open||!isForgeDeveloperShortcut(e))return;
  e.preventDefault();
  const amount=grantForgeDeveloperFlames(profile);
  if(amount)persist();
  forge();
 };
 const requestHome=()=>goHome(),focus=()=>{focused=true;syncMusic();},blur=()=>{focused=false;syncMusic();};
 dialog.addEventListener('click',click);dialog.addEventListener('input',input);dialog.addEventListener('cancel',cancel);dialog.addEventListener('keydown',e=>e.stopPropagation());
 win.addEventListener('keydown',forgeDeveloperKey,true);win.addEventListener('pointerdown',unlock,true);win.addEventListener('keydown',unlock,true);win.addEventListener('focus',focus);win.addEventListener('blur',blur);win.addEventListener('oibung:home',requestHome);doc.addEventListener('visibilitychange',syncMusic);
 const timer=win.setInterval(poll,150);if(dialog.open)dialog.close();home();
 return {get transitionsEnabled(){return transitionsOn;},async dispose(){accountInterrupted();disposed=true;transition?.dispose();win.clearInterval(timer);for(const [target,fn] of roots)target.removeEventListener('click',fn,true);roots.clear();win.removeEventListener('keydown',forgeDeveloperKey,true);win.removeEventListener('pointerdown',unlock,true);win.removeEventListener('keydown',unlock,true);win.removeEventListener('focus',focus);win.removeEventListener('blur',blur);win.removeEventListener('oibung:home',requestHome);doc.removeEventListener('visibilitychange',syncMusic);dialog.removeEventListener('click',click);dialog.removeEventListener('input',input);dialog.removeEventListener('cancel',cancel);await closeBattle();dialog.close();await music.dispose();}};
}
