import {attackZone,inZone,rolling} from './combat.mjs';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));

// Read-only pre-impact warning: uses the *same* zone as the actual boss damage.
// Sword blade contact and flying projectiles remain animation-led, never guessed.
export function kwonDangerLevel(game){
 const b=game?.boss,p=game?.player;
 if(game?.status!=='playing'||!b||!p||b.state!=='windup'||p.invuln>0||rolling(p))return 0;
 const z=attackZone(b);
 if(!z||z.kind==='push'||!inZone(z,p))return 0;
 const r=Math.max(.001,z.r||1),distance=Math.hypot(p.x-z.x,p.z-z.z);
 const depth=clamp((r-distance)/Math.min(r*.35,2.5));
 return (.22+.78*clamp(z.progress))*(.65+.35*depth);
}
export function createKwonDangerVeil(host=globalThis.document?.body,{reduced=false}={}){
 if(!host?.ownerDocument)return {element:null,update:()=>{},clear:()=>{},dispose:()=>{}};
 const el=host.ownerDocument.createElement('div');
 el.id='kwon-danger-veil';
 el.setAttribute('aria-hidden','true');
 Object.assign(el.style,{
  position:'fixed',inset:'0',pointerEvents:'none',zIndex:'7',opacity:'0',
  background:'radial-gradient(ellipse 78% 74% at 50% 50%, transparent 39%, rgba(16,11,22,.10) 68%, rgba(10,8,17,.44) 100%)',
  willChange:'opacity'
 });
 host.appendChild(el);
 let level=0,disposed=false;
 function clear(){level=0;el.style.opacity='0';}
 function update(game,dt,enabled=true){
  if(disposed)return;
  const target=enabled?kwonDangerLevel(game):0;
  const t=clamp(dt,0,.05),rate=target>level?9:13;
  level+=(target-level)*(1-Math.exp(-t*rate));
  if(Math.abs(target-level)<.002)level=target;
  el.style.opacity=(level*(reduced?.37:.57)).toFixed(3);
 }
 function dispose(){if(disposed)return;disposed=true;clear();el.remove();}
 return {element:el,update,clear,dispose};
}
