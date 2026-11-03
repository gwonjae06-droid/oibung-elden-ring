import {hpRatio,lowHealthLevel,heartbeat,healGain,healFade} from './screen-fx-data.mjs';
export function installScreenFx(doc=globalThis.document,win=globalThis.window,{raf=cb=>win.requestAnimationFrame(cb),now=()=>win.performance.now()}={}){
 if(!doc||!win||doc.documentElement.dataset.screenFx)return null;
 doc.documentElement.dataset.screenFx='1';
 const state=new WeakMap();let stopped=false;
 const roots=()=>{const list=[doc];for(const id of ['clown-battle','dice-battle']){const s=doc.getElementById(id)?.firstElementChild?.shadowRoot;if(s)list.push(s);}return list;};
 function read(root){
  const hpEl=root.getElementById('hp-value'),vig=root.getElementById('vignette');
  if(!hpEl||!vig)return null;
  const hp=parseFloat(hpEl.textContent),meter=hpEl.parentElement&&hpEl.parentElement.querySelector?hpEl.parentElement.querySelector('.meter'):null,max=Number(meter&&meter.getAttribute('aria-valuemax'))||120;
  return Number.isFinite(hp)?{vig,hp,max}:null;
 }
 function clear(vig){delete vig.dataset.fx;vig.style.removeProperty('--lowhp');vig.style.removeProperty('--beat');vig.style.removeProperty('--heal');}
 function frame(){
  if(stopped)return;
  if(!doc.hidden){
   const t=now();
   for(const root of roots()){
    const r=read(root);if(!r)continue;
    const s=state.get(r.vig)||{prev:r.hp,heal:-1e9};
    if(healGain(s.prev,r.hp,r.max))s.heal=t;
    s.prev=r.hp;state.set(r.vig,s);
    const level=lowHealthLevel(hpRatio(r.hp,r.max)),heal=healFade(s.heal,t);
    if(level>0||heal>0){
     r.vig.dataset.fx='';
     r.vig.style.setProperty('--lowhp',level.toFixed(3));
     r.vig.style.setProperty('--beat',heartbeat(t/1000,level).toFixed(3));
     r.vig.style.setProperty('--heal',heal.toFixed(3));
    }else if('fx' in r.vig.dataset)clear(r.vig);
   }
  }
  raf(frame);
 }
 raf(frame);
 return {dispose(){stopped=true;delete doc.documentElement.dataset.screenFx;}};
}
