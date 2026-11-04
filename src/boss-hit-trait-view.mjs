import * as THREE from 'three';
import {BOSS_HIT_TRAITS as R} from './boss-hit-traits.mjs';

// No text nodes, labels, timers or tooltips: only compact drawn symbols.
export const TRAIT_SYMBOLS=Object.freeze({
 bleed:'<path fill="#fa5364" d="M12 3C9 8 5 11 5 15a7 7 0 0014 0c0-4-4-7-7-12Z"/><path fill="none" stroke="#7ce0aa" stroke-width="2" d="m15 8 3-3 3 3m-3-3v8"/>',
 stun:'<path fill="#ffe18b" d="m12 3 2.5 5.7 6.2.6-4.7 4.2 1.4 6.1-5.4-3.2-5.4 3.2 1.4-6.1-4.7-4.2 6.2-.6Z"/>',
 crush:'<path fill="#d8dae1" d="M4 7h16v4H4zM8 15h8l3 5H5z"/><path fill="none" stroke="#f2b785" stroke-width="2" d="M12 2v4m-3-2 3 3 3-3M3 13l3 1m15-1-3 1"/>',
 drain:'<path fill="#f3577b" d="M12 20 4.8 13C-1 7 7 1 12 7c5-6 13 0 7.2 6Z"/><path fill="none" stroke="#ffe4dc" stroke-width="2" d="M8 12h9m-3-3 3 3-3 3"/>'
});
export function activeBossTrait(g){
 if(g.status!=='playing')return null;const t=g.player.traits;
 return t?.crush>0?'crush':t?.stun>0?'stun':t?.bleed>0?'bleed':t?.drain>0?'drain':null;
}
export function createBossHitTraitView(scene,body,shell,{reduced=false}={}){
 const root=new THREE.Group();scene.add(root);
 const geo=new THREE.SphereGeometry(.06,5,4),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false});
 const drops=new THREE.InstancedMesh(geo,mat,18);drops.frustumCulled=false;root.add(drops);drops.count=0;
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.5,.025,4,32),new THREE.MeshBasicMaterial({color:0x8fe4b2,transparent:true,opacity:.3,depthWrite:false}));halo.rotation.x=Math.PI/2;root.add(halo);halo.visible=false;
 const doc=shell?.ownerDocument,icon=doc?.createElement?.('div'),base=body.scale.clone(),baseY=body.position.y;
 // Nested arenas clone the main HUD; discard its copied status overlay first.
 for(const copied of shell?.querySelectorAll?.('.boss-hit-trait-icon')||[])copied.remove();
 if(icon){icon.className='boss-hit-trait-icon';icon.setAttribute('aria-hidden','true');icon.style.cssText='position:absolute;left:0;top:0;width:22px;height:22px;z-index:37;pointer-events:none;background:#1b1723e8;border:1px solid #f0dfbd88;border-radius:50%;box-shadow:0 1px 5px #0008;display:none';shell.appendChild(icon);}
 const dummy=new THREE.Object3D(),world=new THREE.Vector3(),color=new THREE.Color();let last=null,disposed=false;
 function clear(){drops.count=0;halo.visible=false;if(icon)icon.style.display='none';body.scale.copy(base);if(last==='crush')body.position.y=baseY;last=null;}
 function update(g,camera){
  if(disposed)return;const kind=activeBossTrait(g),p=g.player,b=g.boss;
  if(!kind){clear();return;}
  body.scale.copy(base);if(kind==='crush'){body.scale.set(base.x*1.3,base.y*.32,base.z*1.2);body.position.y=baseY*.32;}else if(last==='crush')body.position.y=baseY;
  if(icon){if(last!==kind)icon.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">'+TRAIT_SYMBOLS[kind]+'</svg>';
   camera.updateMatrixWorld();world.set(p.x,kind==='crush'?1.25:2.9,p.z).project(camera);
   const w=shell.clientWidth||globalThis.innerWidth||1,h=shell.clientHeight||globalThis.innerHeight||1;
   icon.style.display=world.z>=-1&&world.z<=1&&Math.abs(world.x)<1&&Math.abs(world.y)<1?'block':'none';icon.style.transform=`translate(${(world.x*.5+.5)*w}px,${(-world.y*.5+.5)*h}px) translate(-50%,-100%)`;
  }
  const time=reduced?0:g.time,amount=kind==='stun'?5:kind==='crush'?12:kind==='drain'?8:10;
  color.setHex(kind==='stun'?0xffda78:kind==='crush'?0xd1c4ab:0xbd123d);drops.count=amount;
  for(let i=0;i<amount;i++){
   const a=i*2.4+time*(kind==='stun'?3:.5),u=(time*1.6+i*.17)%1;
   if(kind==='drain'){const v=Math.min(1,(R.drainDuration-p.traits.drain)/R.drainDuration+i*.045);dummy.position.set(p.x+(b.x-p.x)*v,1.3+Math.sin(v*Math.PI)*1.4,p.z+(b.z-p.z)*v);dummy.scale.set(.8,1.5,.8);}
   else if(kind==='stun'){dummy.position.set(p.x+Math.sin(a)*.45,2.5+Math.cos(a)*.1,p.z+Math.cos(a)*.45);dummy.scale.setScalar(.8);}
   else if(kind==='crush'){dummy.position.set(p.x+Math.sin(a)*(.4+u*.65),.08+Math.sin(u*Math.PI)*.16,p.z+Math.cos(a)*(.4+u*.65));dummy.scale.set(1.6*(1-u),.5,1.6*(1-u));}
   else {dummy.position.set(p.x+Math.sin(a)*.35,.12+(1-u)*1.4,p.z+Math.cos(a)*.35);dummy.scale.set(.6,1.6,.6);}
   dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);drops.setColorAt(i,color);
  }
  drops.instanceMatrix.needsUpdate=true;if(drops.instanceColor)drops.instanceColor.needsUpdate=true;
  halo.visible=kind==='bleed'||kind==='crush';halo.material.color.setHex(kind==='bleed'?0x6bc98f:0xd7bf98);halo.position.set(p.x,.04,p.z);halo.scale.setScalar(kind==='crush'?1.2:1+(reduced?0:Math.sin(time*5)*.12));
  last=kind;
 }
 return {update,clear,dispose(){if(disposed)return;clear();disposed=true;icon?.remove();root.removeFromParent();drops.dispose();geo.dispose();mat.dispose();halo.geometry.dispose();halo.material.dispose();}};
}
