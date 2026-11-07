


import {loadBattleStyles} from './runtime/battle-styles.mjs';
import {renderSharedHud} from './battle-hud.mjs';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';
export function createGyuwonUi({coarse=false,doc=globalThis.document}={}){
 const source=doc.getElementById('arena');if(!source)throw Error('Shared arena UI missing');
 const d=doc.createElement('dialog');d.id='gyuwon-battle';d.setAttribute('aria-label',R.name+' 전투');d.style.cssText='position:fixed;inset:0;margin:0;padding:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;background:#050608';
 const host=doc.createElement('div');host.style.height='100%';d.appendChild(host);const root=host.attachShadow({mode:'open'}),shell=source.cloneNode(true);shell.style.cssText='position:relative;width:100%;height:100%;min-height:0;visibility:hidden';shell.querySelectorAll('script,.boss-screen-chain-layer,.boss-name-chain-layer,.bt-chain,.boss-name-bind').forEach(n=>n.remove());root.appendChild(shell);const $=id=>root.getElementById(id);
 shell.dataset.cleanUi='';const css=doc.createElement('style');css.textContent='@media(max-height:500px) and (pointer:fine){#boss-hud{bottom:10px;max-height:95px;font-size:12px}#boss-hud h2{font-size:20px;margin:0 0 3px}}@media(max-height:500px){#controls{display:none!important}#boss-action{margin:2px 0;font-size:11px}#phase-label{font-size:10px}}';root.appendChild(css);$('damage-layer').replaceChildren();$('notice').textContent='';$('notice').classList.remove('visible');$('hit-flash').classList.remove('visible');$('world').setAttribute('aria-label','심야 자습실 전투 화면');$('boss-hud').querySelector('h2').textContent=R.name;shell.querySelector('.brand span').textContent='다섯 번째 시련 · 심야 자습실';$('start').disabled=false;$('load-status').textContent='';
 $('boss-hud').style.maxWidth='90%';$('quit').textContent=$('change').textContent='메인으로';

 let disposed=false;const styles=loadBattleStyles(root,doc,['../style.css?v=ui-refine-20261107','../skills.css?v=ui-refine-20261107'].map(path=>new URL(path,import.meta.url))),ready=styles.ready.then(ok=>{if(!disposed)shell.style.visibility='';return ok;});doc.body.appendChild(d);
 function mode(value){$('menu').hidden=true;$('pause-screen').hidden=value!=='paused';$('result').hidden=value!=='result';for(const id of['player-hud','boss-hud','controls'])$(id).hidden=false;$('touch').hidden=!coarse||value!=='playing';$('pause').disabled=!['playing','paused'].includes(value);}
 function render(g,sv,weaponName,lock){const b=g.boss,s=g.gyuwon;renderSharedHud(root,g,sv,{weaponName,lockLabel:lock?'카메라 록온 · Q':'카메라 자유 · Q'});$('boss-hud').querySelector('h2').textContent=b.phase>=2?R.phaseName:R.name;$('phase-label').textContent=b.phase===3?'세 번째 단계 · 황금의 기억':b.phase===2?'두 번째 단계 · '+(s.space==='white'?'백지':'암전'):'첫 번째 단계 · 존재의 시험';$('boss-action').textContent='';$('boss-action').removeAttribute('data-critical');$('notice').textContent='';$('notice').classList.remove('visible');}
 return {d,root,shell,$,canvas:$('world'),ready,mode,render,dispose(){if(disposed)return;disposed=true;styles.dispose();if(d.open)d.close();d.remove();}};
}
