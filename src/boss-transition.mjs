import {buildEntrance} from './clown-entrance.mjs';
import {bindBattleSession,readBattleSession} from './battle-session.mjs';
import {createAudio} from './audio.mjs';
import {bindBossName} from './boss-ui-chain.mjs';
import {transitionPose,advanceTransition,WEAPON_NAMES,chooseWeapon,makeClownLoadout} from './transition-data.mjs';
import {encounterStore} from './encounter-state.mjs';
import {createProgressionGate} from './progression-gate.mjs';

export {buildEntrance} from './clown-entrance.mjs';

export function installBossTransition(){
 if(document.getElementById('boss-transition'))return;
 const result=document.getElementById('result'),menu=document.getElementById('menu'),change=document.getElementById('change');
 if(!result||!menu||!change)throw new Error('Transition requires the arena result/menu controls');
 const gate=createProgressionGate('kwon',()=>readBattleSession(document)?.encounter||encounterStore.read());
 const dialog=document.createElement('dialog');dialog.id='boss-transition';dialog.setAttribute('aria-label','이권재 토벌과 광대 오슬우 등장');
 dialog.innerHTML='<div class="bt-shade"></div><canvas aria-label="공 위에서 인사하는 광대 오슬우"></canvas><div class="bt-title" role="status">이권재가 토벌되었다</div><section class="bt-next"><small>즐거운 공연 · 거구의 곡예사</small><h2>광대 오슬우</h2><div class="bt-fullbar" aria-hidden="true"></div></section><section class="bt-choice" hidden aria-labelledby="bt-choice-title"><h3 id="bt-choice-title">광대전 무기 재선택</h3><p>무기를 고른 뒤 선택을 확정하세요.</p><div class="bt-weapons" role="group" aria-label="광대전 무기"></div><button class="bt-confirm">선택 확정</button><p class="bt-selection" role="status"></p></section><div class="bt-note"><span>다음 공연이 시작됩니다.</span><br><button class="bt-return" hidden>메인 메뉴로</button></div>';
 document.body.appendChild(dialog);
 const shade=dialog.querySelector('.bt-shade'),canvas=dialog.querySelector('canvas'),title=dialog.querySelector('.bt-title'),next=dialog.querySelector('.bt-next'),note=dialog.querySelector('.bt-note span'),back=dialog.querySelector('.bt-return'),choice=dialog.querySelector('.bt-choice'),confirm=dialog.querySelector('.bt-confirm'),selection=dialog.querySelector('.bt-selection');
 const audio=createAudio(),reduced=false,STORAGE='oibung.clown.loadout';
 const muted=()=>{try{return localStorage.getItem('oibung-muted')==='1';}catch(e){return false;}};
 const unlock=()=>{if(!muted()&&!audio.enabled)audio.setEnabled(true);};addEventListener('pointerdown',unlock,{passive:true});
 const play=name=>{if(!muted())audio.play(name);};
 let active=false,disposed=false,time=0,last=0,frameId=0,entrance=null,stage='',fromVictory=false,weapon='sword',transitionTicket=null,submitted=false;
 let nameBinding=null;const buttons=[];
 function pick(key){weapon=chooseWeapon(key);for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.weapon===weapon));confirm.disabled=false;selection.textContent=WEAPON_NAMES[weapon]+' 선택 중';}
 for(const [key,name] of Object.entries(WEAPON_NAMES)){const b=document.createElement('button');b.type='button';b.className='bt-weapon';b.dataset.weapon=key;b.textContent=name;b.onclick=()=>{pick(key);play('ui');};dialog.querySelector('.bt-weapons').appendChild(b);buttons.push(b);}
 confirm.onclick=()=>{if(!active||stage!=='ready'||confirm.disabled)return;if(fromVictory&&!submitted&&!gate.valid(transitionTicket)){close(false);return;}const loadout=makeClownLoadout(weapon,fromVictory);if(fromVictory){try{sessionStorage.setItem(STORAGE,JSON.stringify(loadout));}catch(e){console.warn('Clown loadout storage unavailable',e);}}submitted=true;dialog.dispatchEvent(new CustomEvent('oibung:clown-weapon-selected',{bubbles:true,detail:{...loadout,preview:!fromVictory}}));selection.textContent=WEAPON_NAMES[weapon]+' 선택 확정 · 광대전 로딩 중입니다.';confirm.disabled=true;play('ui');};
 function close(returnToMenu=true){if(!active)return;active=false;cancelAnimationFrame(frameId);gate.end(transitionTicket);transitionTicket=null;nameBinding?.restore();nameBinding=null;entrance?.dispose();entrance=null;audio.ambience(false);dialog.close();if(fromVictory&&returnToMenu){const main=readBattleSession(document);if(main?.menu)main.menu();else change.click();}}
 back.onclick=()=>close();
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(stage==='ready')close();});
 dialog.addEventListener('keydown',e=>{e.stopPropagation();if(stage==='ready'&&['1','2','3','4'].includes(e.key)){e.preventDefault();pick(Object.keys(WEAPON_NAMES)[Number(e.key)-1]);play('ui');}});
 function frame(now){if(!active)return;const dt=last?(now-last)/1000:0;last=now;time=advanceTransition(time,dt,document.hidden);const p=transitionPose(time);dialog.dataset.stage=p.stage;
 if(stage!==p.stage){stage=p.stage;if(stage==='declare')play('victory');else if(stage==='bind')play('stagger');else if(stage==='pull')play('boss-slam');else if(stage==='enter')play('ui');else if(stage==='bow')note.textContent='광대 오슬우가 관객에게 인사합니다.';else if(stage==='reveal')play('ui');else if(stage==='ready'){note.textContent='무기를 선택하면 광대 오슬우 전투가 시작됩니다.';choice.hidden=false;back.hidden=false;buttons.find(b=>b.dataset.weapon===weapon)?.focus();}}
 title.style.opacity=String(p.title);shade.style.opacity=String(.15+.85*p.entry);canvas.style.opacity=String(p.entry);nameBinding?.update(p.bind,p.pull);next.style.opacity=String(p.ui);
 if(p.entry>0){if(!entrance){try{entrance=buildEntrance(canvas);}catch(e){console.error(e);note.textContent='3D 입장 장면을 불러오지 못했습니다.';}}entrance?.render(p,time);}frameId=requestAnimationFrame(frame);
 }
 function start(victory,ticket=null){if(active||disposed||(victory&&!gate.valid(ticket,!result.hidden)))return false;transitionTicket=ticket;submitted=false;fromVictory=victory;active=true;time=0;last=0;stage='';back.hidden=true;choice.hidden=true;note.textContent='다음 공연이 시작됩니다.';let saved=null;if(victory){try{const v=JSON.parse(sessionStorage.getItem(STORAGE)||'null');if(v?.bossId==='clown'&&v.unlocked)saved=v.weapon;}catch(e){saved=null;}}pick(chooseWeapon(menu.querySelector('.weapon.selected')?.dataset.weapon,saved));try{dialog.showModal();if(victory)nameBinding=bindBossName(document.getElementById('boss-hud'),true,dialog);}catch(e){active=false;if(dialog.open)dialog.close();console.error(e);return false;}if(victory)result.hidden=true;frameId=requestAnimationFrame(frame);return true;}
 function check(){if(active||disposed||document.body?.dataset?.journey)return;const ticket=gate.automatic(!result.hidden);if(ticket&&!start(true,ticket))gate.end(ticket);}
 result.addEventListener('oibung:result-ready',check);
 const preview=document.createElement('button');preview.type='button';preview.textContent='보스 전환 연출 미리보기';preview.style.marginTop='10px';preview.onclick=()=>start(false);menu.querySelector('.menu-panel').appendChild(preview);check();
 const unbindTransition=bindBattleSession(dialog,()=>({close:()=>close()}));return {start:()=>start(false),dispose(){disposed=true;unbindTransition();result.removeEventListener('oibung:result-ready',check);close();removeEventListener('pointerdown',unlock);preview.remove();dialog.remove();}};
}
