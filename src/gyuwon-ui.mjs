import {usesReference2d} from './gyuwon-reference-rules.mjs';
import {ACT_FIVE_INK_UI} from './gyuwon-act-five-ink-ui.mjs';



import {loadBattleStyles} from './runtime/battle-styles.mjs';
import {renderSharedHud} from './battle-hud.mjs';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';
import {gyuwonYearTitle} from './gyuwon-years.mjs';
import {createGyuwonYearsHud} from './gyuwon-years-hud.mjs';
import {createGyuwonMusicalHud} from './gyuwon-musical-hud.mjs';
export function createGyuwonUi({coarse=false,doc=globalThis.document}={}){
 const source=doc.getElementById('arena');if(!source)throw Error('Shared arena UI missing');
 const d=doc.createElement('dialog');d.id='gyuwon-battle';d.setAttribute('aria-label',R.name+' 전투');d.style.cssText='position:fixed;inset:0;margin:0;padding:0;width:100vw;height:100dvh;max-width:none;max-height:none;border:0;background:#050608';
 const host=doc.createElement('div');host.style.height='100%';d.appendChild(host);const root=host.attachShadow({mode:'open'}),shell=source.cloneNode(true);shell.style.cssText='position:relative;width:100%;height:100%;min-height:0;visibility:hidden';shell.querySelectorAll('script,.boss-screen-chain-layer,.boss-name-chain-layer,.bt-chain,.boss-name-bind').forEach(n=>n.remove());root.appendChild(shell);const $=id=>root.getElementById(id);
 shell.dataset.cleanUi='';const css=doc.createElement('style');css.textContent='@media(max-height:500px) and (pointer:fine){#boss-hud{bottom:10px;max-height:95px;font-size:12px}#boss-hud h2{font-size:20px;margin:0 0 3px}}@media(max-height:500px){#controls{display:none!important}#boss-action{margin:2px 0;font-size:11px}#phase-label{font-size:10px}}';root.appendChild(css);$('damage-layer').replaceChildren();$('notice').textContent='';$('notice').classList.remove('visible');$('hit-flash').classList.remove('visible');$('world').setAttribute('aria-label','심야 자습실 전투 화면');$('boss-hud').querySelector('h2').textContent=R.name;shell.querySelector('.brand span').textContent='다섯 번째 시련 · 심야 자습실';$('start').disabled=false;$('load-status').textContent='';
 $('boss-hud').style.maxWidth='90%';$('quit').textContent=$('change').textContent='메인으로';

 const loadingCard=doc.createElement('div');loadingCard.textContent='기억을 불러오는 중…';loadingCard.style.cssText='position:absolute;inset:0;z-index:30;display:grid;place-content:center;background:#080e17;color:#ded8c9;font:16px serif;letter-spacing:.15em';shell.appendChild(loadingCard);
 const yearsHud=createGyuwonYearsHud(doc,shell);
 const musicalHud=createGyuwonMusicalHud(doc,shell);
 const musicStyle=doc.createElement('style');
 musicStyle.textContent='[data-musical="on"] .touch-actions{display:none!important}[data-musical="on"] #reticle{display:none!important}[data-musical="on"] #skill-hud,[data-musical="on"] #lock-label{display:none!important}[data-musical="on"] #player-hud{max-width:250px;padding:10px}[data-musical="on"] .brand{max-width:220px}@media(max-height:500px){[data-musical="on"] #player-hud{max-width:180px;font-size:10px}}[data-musical-ending="on"] #world{opacity:0}[data-musical-ending="on"] .brand,[data-musical-ending="on"] #pause{visibility:hidden}';
 musicStyle.textContent+='[data-reference2d="on"] #world,[data-reference2d="on"] #player-hud,[data-reference2d="on"] #boss-hud,[data-reference2d="on"] #controls{display:none!important}[data-reference-turn="on"] #player-hud,[data-reference-turn="on"] #boss-hud,[data-reference-turn="on"] #touch{display:none!important}[data-reference2d="on"] .brand,[data-reference-turn="on"] .brand{display:none!important}[data-reference2d="on"] .brand span{display:none}[data-reference2d="on"] #pause{top:12px;right:12px;padding:8px;font-size:11px}[data-reference2d="on"] #touch{z-index:28}[data-reference2d="on"][data-reference-year="6"] #touch,[data-reference2d="on"][data-reference-year="7"] #touch,[data-reference2d="on"][data-reference-year="8"] #touch,[data-reference2d="on"][data-reference-year="10"] #touch{display:none!important}';
 // No low-HP red heartbeat during the noncombat curtain call or dedication.
 musicStyle.textContent+='[data-curtain-call="on"] #vignette{--lowhp:0!important;--beat:0!important}[data-curtain-call="on"] #vignette[data-fx]::after{background:none!important}[data-curtain-call="on"] #hit-flash,[data-curtain-call="on"] .oden-hit-overlay,[data-curtain-call="on"] .oden-impact-light{display:none!important}';
 shell.appendChild(musicStyle);
 musicStyle.textContent+=ACT_FIVE_INK_UI;
 let disposed=false;const styles=loadBattleStyles(root,doc,['../style.css?v=ui-safe-layout-v2-20261107','../skills.css?v=ui-refine-20261107'].map(path=>new URL(path,import.meta.url))),ready=styles.ready.then(ok=>{if(!disposed)shell.style.visibility='';return ok;});doc.body.appendChild(d);
 function mode(value){$('menu').hidden=true;$('pause-screen').hidden=value!=='paused';$('result').hidden=value!=='result';for(const id of['player-hud','boss-hud','controls'])$(id).hidden=false;$('touch').hidden=!coarse||value!=='playing';$('pause').disabled=!['playing','paused'].includes(value);}
 function render(g,sv,weaponName,lock){const b=g.boss,s=g.gyuwon;renderSharedHud(root,g,sv,{weaponName,lockLabel:lock?'카메라 록온 · Q':'카메라 자유 · Q'});if(s.years){$('boss-hud').querySelector('h2').textContent=R.name;$('phase-label').textContent=gyuwonYearTitle(s.years.year)+(s.years.musical?' · '+s.years.musical.title:'');$('boss-action').textContent='';$('boss-action').removeAttribute('data-critical');$('notice').textContent='';$('notice').classList.remove('visible');yearsHud.update(g);musicalHud.update(g);
   const fill=$('boss-fill');
   fill.style.background=s.years.musical?s.years.musical.color:'';
   const musical=!!s.years.musical;
   shell.dataset.inkUi=s.years.musical?.giantRaid&&!s.years.musical?.finishing?'on':'off';shell.dataset.reverie=s.years.mode==='reverie'?'on':'off';shell.dataset.musical=musical?'on':'off';shell.dataset.curtainCall=musical&&s.years.year>=11?'on':'off';shell.dataset.reference2d=usesReference2d(s.years.musical)?'on':'off';shell.dataset.referenceTurn=s.years.musical?.reference&&s.years.year===5?'on':'off';shell.dataset.referenceYear=String(s.years.year);shell.dataset.musicalEnding=musical&&g.status==='won'?'on':'off';shell.style.background=musical&&g.status==='won'?'#000':'';
   $('controls').hidden=musical;
   const closing=s.years.musical?.finishing,fade=closing?Math.max(0,1-(s.years.musical.curtain-27)/9):1;
   $('boss-hud').style.opacity=$('player-hud').style.opacity=String(fade);
   return;}$('boss-hud').querySelector('h2').textContent=b.phase>=2?R.phaseName:R.name;$('phase-label').textContent=b.phase===3?'세 번째 단계 · 황금의 기억':b.phase===2?'두 번째 단계 · '+(s.space==='white'?'백지':'암전'):'첫 번째 단계 · 존재의 시험';$('boss-action').textContent='';$('boss-action').removeAttribute('data-critical');$('notice').textContent='';$('notice').classList.remove('visible');yearsHud.update(g);}
 return {d,root,shell,$,canvas:$('world'),ready,mode,render,onMusicalAction(fn){musicalHud.onAction(fn);},loading(value){loadingCard.hidden=!value;if(!value)loadingCard.remove();},dispose(){if(disposed)return;disposed=true;styles.dispose();yearsHud.dispose();musicalHud.dispose();musicStyle.remove();if(d.open)d.close();d.remove();}};
}
