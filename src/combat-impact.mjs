// Unified, presentation-only impact response. Never changes combat clocks,
// damage, player velocity, collision checks, input handling or invulnerability.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const IMPACT_FEEL=Object.freeze({
 kwon:Object.freeze({recoil:.24,squash:.025,tilt:.095}),
 clown:Object.freeze({recoil:.36,squash:.17,tilt:.11}),
 dice:Object.freeze({recoil:.105,squash:.04,tilt:.04}),
 blood:Object.freeze({recoil:.31,squash:.085,tilt:.10})
});
export const BOSS_IMPACT_SECONDS=Object.freeze({light:.115,heavy:.205,player:.29});
export const hitstopSeconds=(amount=0,big=false,weapon='sword')=>big||weapon==='hammer'||amount>=180?.075:amount>=55?.046:.028;

export function createCombatImpact({shell=null,root=null,boss='kwon',reduced=false}={}){
 let disposed=false,freeze=0,flash=0,lastHp={boss:null,player:null};
 const recoil={boss:{left:0,total:0,dx:0,dz:0,amp:0},player:{left:0,total:0,dx:0,dz:0,amp:0}};
 const trails={boss:{value:null,current:null,max:1,wait:0},player:{value:null,current:null,max:1,wait:0}};
 const doc=shell?.ownerDocument,layer=doc?.createElement?.('div')??null,meters=[];
 if(layer){
  layer.className='oden-impact-light';
  layer.setAttribute('aria-hidden','true');
  layer.style.cssText='position:absolute;inset:0;z-index:36;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(255,247,210,.07),transparent 52%),linear-gradient(90deg,rgba(255,241,210,.06),transparent 22%,transparent 78%,rgba(255,241,210,.06));';
  shell.appendChild(layer);
 }
 for(const [kind,id,color] of [['player','hp-fill','#ffe3a6'],['boss','boss-fill','#f7d7a1']]){
  const bar=root?.getElementById?.(id)||doc?.getElementById?.(id);
  if(!bar?.parentElement||!doc?.createElement)continue;
  const parent=bar.parentElement,position=parent.style.position,overlay=doc.createElement('span');
  if(!position||position==='static')parent.style.position='relative';
  overlay.className='oden-damage-trail';
  overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText='position:absolute;top:0;bottom:0;left:0;width:0;pointer-events:none;z-index:6;background:'+color+';opacity:.82;box-shadow:0 0 5px rgba(255,210,156,.65);';
  parent.appendChild(overlay);meters.push({kind,parent,position,overlay});
 }
 function hit(e,g){
  if(disposed||!g||!e)return false;
  const handHit=boss==='dice'&&e.type==='dice-giant-hand-hit';
  const kind=e.type==='boss-hit'||handHit?'boss':['player-hit','hurt','player-crushed'].includes(e.type)?'player':null;
  if(!kind)return false;
  const raw=Number(e.amount),amount=Number.isFinite(raw)?Math.max(0,raw):0;
  if(amount<=0&&e.type!=='player-crushed')return false;
  const hp=g[kind==='boss'?'boss':'player'];
  if(!hp)return false;
  const max=Math.max(1,Number(hp.maxHp)||100),current=clamp(Number(hp.hp)||0,0,max);
  const old=lastHp[kind]===null?clamp(current+amount,0,max):clamp(Math.max(lastHp[kind],current+amount),0,max);
  if(!handHit){
   lastHp[kind]=current;
   const trail=trails[kind];trail.max=max;trail.current=current;trail.value=Math.max(trail.value??old,old);trail.wait=.13;
  }
  const b=g.boss,p=g.player,dx=(kind==='boss'?b.x-p.x:p.x-b.x)||0,dz=(kind==='boss'?b.z-p.z:p.z-b.z)||0,length=Math.hypot(dx,dz)||1;
  const heavy=Boolean(e.big)||(handHit&&amount>=60)||amount>=max*.11||g.weapon==='hammer'&&kind==='boss';
  const style=IMPACT_FEEL[boss]||IMPACT_FEEL.kwon,weight=clamp(.65+amount/max*4,.65,1.5);
  const state=recoil[kind];state.total=kind==='boss'?(heavy?BOSS_IMPACT_SECONDS.heavy:BOSS_IMPACT_SECONDS.light):BOSS_IMPACT_SECONDS.player;
  state.left=state.total;state.dx=dx/length;state.dz=dz/length;state.amp=kind==='boss'?style.recoil*weight:.48*weight;
  if(kind==='boss'){freeze=Math.max(freeze,hitstopSeconds(amount,heavy,g.weapon));flash=Math.max(flash,reduced?.055:.12);}
  else flash=Math.max(flash,reduced?.08:.22);
  return true;
 }
 const factor=kind=>{const s=recoil[kind];if(s.left<=0)return 0;const u=1-s.left/s.total;return Math.exp(-u*5)*(1+Math.sin(u*Math.PI*3)*.24);};
 function update(dt,active=true){
  if(disposed)return 0;
  const h=active?clamp(Number(dt)||0,0,.075):0;
  if(h){for(const state of Object.values(recoil))state.left=Math.max(0,state.left-h);
   freeze=Math.max(0,freeze-h);flash=Math.max(0,flash-h*2.5);
   for(const trail of Object.values(trails)){if(trail.value===null||trail.current===null)continue;
    trail.wait=Math.max(0,trail.wait-h);
    if(!trail.wait){trail.value=trail.current+(trail.value-trail.current)*Math.exp(-h*8);}
   }
  }
  if(layer){layer.style.opacity=String(flash*.6);layer.style.background=(!reduced&&recoil.player.left>0)?'radial-gradient(ellipse at 50% 50%,transparent 46%,rgba(190,21,26,.24) 100%)':'radial-gradient(ellipse at center,rgba(255,247,210,.10),transparent 64%)';}
  for(const {kind,overlay} of meters){const t=trails[kind];if(t.value===null||t.current===null)continue;
   const left=clamp(t.current/t.max,0,1),right=clamp(t.value/t.max,0,1);
   overlay.style.left=(left*100).toFixed(3)+'%';overlay.style.width=(Math.max(0,right-left)*100).toFixed(3)+'%';
   overlay.style.opacity=String(clamp((right-left)*15,0,.88));
  }
  return h;
 }
 function bossPose(mesh){
  if(disposed||!mesh)return;
  const k=factor('boss');if(k<=0)return;
  const s=recoil.boss,style=IMPACT_FEEL[boss]||IMPACT_FEEL.kwon;
  mesh.position.x+=s.dx*s.amp*k;mesh.position.z+=s.dz*s.amp*k;
  mesh.rotation.z+=s.dx*style.tilt*k;
  mesh.rotation.x-=s.dz*style.tilt*k;
  mesh.scale.y*=1-style.squash*k;
  mesh.scale.x*=1+style.squash*.45*k;
 }
 function playerPose(mesh){
  if(disposed||!mesh)return;
  const k=factor('player');if(k<=0)return;const s=recoil.player;
  mesh.position.x+=s.dx*s.amp*k;mesh.position.z+=s.dz*s.amp*k;
  mesh.rotation.x-=s.dz*.17*k;mesh.rotation.z+=s.dx*.13*k;
 }
 function camera(camera){
  if(disposed||reduced||!camera)return;
  const p=recoil.player,b=recoil.boss,kp=factor('player'),kb=factor('boss');
  camera.position.x+=p.dx*.44*kp+b.dx*.15*kb;
  camera.position.z+=p.dz*.44*kp+b.dz*.15*kb;
  camera.position.y+=.13*kp+.055*kb;
 }
 function reset(){
  freeze=flash=0;lastHp={boss:null,player:null};
  for(const s of Object.values(recoil)){s.left=s.total=s.dx=s.dz=s.amp=0;}
  for(const s of Object.values(trails)){s.value=s.current=null;s.wait=0;}
  if(layer)layer.style.opacity='0';
  for(const {overlay} of meters)overlay.style.width='0';
 }
 function dispose(){
  if(disposed)return;reset();disposed=true;layer?.remove();
  for(const {parent,position,overlay} of meters){overlay.remove();parent.style.position=position;}
 }
 return {event:hit,update,bossPose,playerPose,camera,reset,dispose,
  get frozen(){return freeze>0;},get trails(){return trails;}};
}
