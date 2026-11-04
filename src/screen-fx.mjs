import {hpRatio,lowHealthLevel,heartbeat,healGain,healFade} from './screen-fx-data.mjs';
import {createFrameLoop} from './runtime/frame-loop.mjs';
import {readBattleSession} from './battle-session.mjs';
import {BATTLE_DIALOGS} from './battle-dialogs.mjs';
const installed=new WeakMap();
export function installScreenFx(doc=globalThis.document,win=globalThis.window,{raf=cb=>win.requestAnimationFrame(cb),caf=id=>win.cancelAnimationFrame(id),now=()=>win.performance.now()}={}){
 if(!doc||!win)return null;if(installed.has(doc))return installed.get(doc);
 const states=new WeakMap(),owned=new Set();let last=null,clock=0,disposed=false;
 function clear(vig){delete vig.dataset.fx;for(const key of ['--lowhp','--beat','--heal'])vig.style.removeProperty(key);}
 function roots(){for(const {id} of BATTLE_DIALOGS){const m=doc.getElementById(id);if(m?.open&&m.firstElementChild?.shadowRoot)return [m.firstElementChild.shadowRoot];}if(doc.getElementById('boss-transition')?.open)return [];return [doc];}
 function active(root){if(root.getElementById('boss-hud')?.hidden===true)return false;return ['menu','pause-screen','result'].every(id=>root.getElementById(id)?.hidden!==false);}
 function frame(){
  const stamp=now(),dt=last===null?0:Math.max(0,stamp-last);last=stamp;if(doc.hidden)return;clock+=dt;
  const visited=new Set(),reduced=false;
  for(const root of roots()){
   const hpEl=root.getElementById('hp-value'),vig=root.getElementById('vignette');if(!hpEl||!vig)continue;
   visited.add(vig);owned.add(vig);const session=readBattleSession(root),player=session?.game?.player,meter=hpEl.parentElement?.querySelector?.('.meter'),hp=player?player.hp:parseFloat(hpEl.textContent),max=player?player.maxHp:Number(meter?.getAttribute('aria-valuemax'))||120;
   const state=states.get(vig)||{prev:hp,heal:-1e9,active:false};
   if(!Number.isFinite(hp)||!(session?session.active:active(root))){state.prev=hp;state.heal=-1e9;state.active=false;states.set(vig,state);clear(vig);continue;}
   if(state.active&&healGain(state.prev,hp,max))state.heal=clock;
   state.prev=hp;state.active=true;states.set(vig,state);
   const level=lowHealthLevel(hpRatio(hp,max)),heal=healFade(state.heal,clock);
   if(level>0||heal>0){vig.dataset.fx='';vig.style.setProperty('--lowhp',level.toFixed(3));vig.style.setProperty('--beat',(reduced?.45:heartbeat(clock/1000,level)).toFixed(3));vig.style.setProperty('--heal',heal.toFixed(3));}else clear(vig);
  }
  for(const vig of [...owned])if(!visited.has(vig)||vig.isConnected===false){clear(vig);const state=states.get(vig);if(state){state.active=false;state.heal=-1e9;}owned.delete(vig);}
 }
 const loop=createFrameLoop({request:raf,cancel:caf,update:frame,onError:error=>{control.dispose();console.error('Screen effects stopped',error);}});
 const visibility=()=>{last=null;},pagehide=e=>{if(!e.persisted)control.dispose();};
 const control={dispose(){if(disposed)return;disposed=true;loop.stop();for(const vig of owned)clear(vig);owned.clear();doc.removeEventListener?.('visibilitychange',visibility);win.removeEventListener?.('pagehide',pagehide);installed.delete(doc);delete doc.documentElement.dataset.screenFx;}};
 installed.set(doc,control);doc.documentElement.dataset.screenFx='1';doc.addEventListener?.('visibilitychange',visibility);win.addEventListener?.('pagehide',pagehide);try{loop.start();}catch(error){control.dispose();throw error;}return control;
}
