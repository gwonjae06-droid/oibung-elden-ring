import {loadBattleStyles} from './runtime/battle-styles.mjs';
import {renderBattleMeter,renderSharedHud} from './battle-hud.mjs';
import {DICE_RULES as R} from './dice-data.mjs';
export function diceUiVisibility(mode,coarse=false){const fight=['playing','paused','ending','result'].includes(mode);return {menu:mode==='menu',pause:mode==='paused',result:mode==='result',fight,touch:coarse&&['playing','ending'].includes(mode),pauseEnabled:['playing','paused'].includes(mode)};}
export function createDiceUi({coarse=false,doc=globalThis.document}={}){
 const source=doc.getElementById('arena');if(!source)throw Error('Shared arena UI missing');const d=doc.createElement('dialog');d.id='dice-battle';d.setAttribute('aria-label',R.name+' 전투');d.style.cssText='position:fixed;inset:0;margin:0;padding:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;background:#050608';const host=doc.createElement('div');host.style.height='100%';d.appendChild(host);const root=host.attachShadow({mode:'open'}),shell=source.cloneNode(true);shell.style.cssText='position:relative;width:100%;height:100%;visibility:hidden';shell.setAttribute('aria-label',R.name+' 전투');shell.querySelectorAll('script,.boss-screen-chain-layer,.boss-name-chain-layer,.bt-chain,.boss-name-bind').forEach(n=>n.remove());root.appendChild(shell);const $=id=>root.getElementById(id);
 $('damage-layer').replaceChildren();$('notice').textContent='';$('notice').classList.remove('visible');$('hit-flash').classList.remove('visible');$('world').setAttribute('aria-label',R.name+' 전투 화면');$('boss-hud').querySelector('h2').textContent=R.name;$('boss-hud').setAttribute('aria-label',R.name+' 상태');$('phase-label').textContent='세 번째 시련 · 거대 주사위';shell.querySelector('.brand span').textContent='전투 실험실 · 03';$('menu-title').textContent=R.name;shell.querySelector('#menu .eyebrow').textContent='세 번째 시련';const tips=shell.querySelectorAll('#menu details p');if(tips.length)tips[tips.length-1].textContent='사진 면은 피해를 온전히 받고, 다른 면은 1페이즈에서 피해를 절반만 받습니다.';shell.querySelector('.intro').textContent='거대한 손님들이 내려다보는 룰렛 탁자. 다음 칸을 읽고, 착지한 뒤 반격하세요.';$('load-status').textContent='착지 후 한 번 공격하고 옆으로 이탈하세요.';$('start').disabled=false;$('start').textContent='박성원 전투 시작';$('quit').textContent='무기 선택으로';$('change').textContent='무기 변경';
 const panel=doc.createElement('section');panel.id='giant-hud';panel.style.cssText='display:none';const cue=doc.createElement('p');cue.id='giant-cue';panel.appendChild(cue);shell.appendChild(panel);panel.hidden=true;
 const exits=[];for(const target of[$('quit'),$('change')]){const b=doc.createElement('button');b.textContent='광대전 결과로';target.after(b);exits.push(b);}
 let disposed=false;const styles=loadBattleStyles(root,doc,['../style.css','../skills.css'].map(path=>new URL(path,import.meta.url))),ready=styles.ready.then(ok=>{if(!disposed)shell.style.visibility='';return ok;});doc.body.appendChild(d);
 function mode(value){const v=diceUiVisibility(value,coarse);$('menu').hidden=!v.menu;$('pause-screen').hidden=!v.pause;$('result').hidden=!v.result;for(const id of['player-hud','boss-hud','controls'])$(id).hidden=!v.fight;$('touch').hidden=!v.touch;$('pause').disabled=!v.pauseEnabled;}
 function bar(id,value,max){renderBattleMeter($(id),value,max);}
 function render(g,sv,weaponName,lock){
  const giant=g.dice.giant;panel.hidden=true;cue.textContent='';
  $('boss-hud').querySelector('h2').textContent=!giant||giant.state==='transition'&&giant.t<4.5?R.name:giant.temperament==='feral'?'이성을 잃은 박성원':'운명의 찬탈자 박성원';
  $('phase-label').textContent=g.boss.phase===3?'세 번째 단계 · 광기 붕괴':g.boss.phase===2?'두 번째 단계 · 육체 강탈':'첫 번째 단계 · 거대 주사위';
  renderSharedHud(root,g,sv,{weaponName,lockLabel:lock?'카메라 록온 · Q':'카메라 자유 · Q'});
  $('boss-action').textContent=giant?'':g.status==='won'?'박성원이 토벌되었다':g.status==='lost'?'주사위에 깔렸습니다':g.dice.stun>0?'기절':g.dice.state==='warning'?'다음 칸으로 굴러옵니다':g.dice.state==='rolling'?'압사 주의':'빈틈 — 지금 반격하세요';
  $('boss-action').toggleAttribute('data-critical',!giant&&/압사|즉사|약점|경직/.test($('boss-action').textContent));
  if(giant)$('result-text').textContent='';
 }
 return {d,root,shell,$,canvas:$('world'),ready,exits,mode,bar,render,chipDocument:{getElementById:$,createElement:tag=>doc.createElement(tag),defaultView:doc.defaultView},dispose(){if(disposed)return;disposed=true;styles.dispose();try{if(d.open)d.close();}finally{d.remove();}}};
}
