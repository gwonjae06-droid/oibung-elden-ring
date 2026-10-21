import {chainPose,screenChainPose} from './screen-chain-data.mjs';
import {chainRevealPose} from './chain-reveal-data.mjs';
export {chainPose};
const bindings=new WeakMap();
export function restoreBossName(hud){bindings.get(hud)?.restore();}
export function bindBossName(hud,ownPull=true,host=null,{loadVisuals=()=>import('./chain-visuals.mjs')}={}){
 if(!hud)return null;restoreBossName(hud);if(!host)return {update(){},restore(){}};
 const arena=hud.closest('#arena');if(!arena||arena.contains(host))return null;
 const doc=hud.ownerDocument,win=doc.defaultView,parent=arena.parentNode,anchor=doc.createComment('arena-before-screen-chain'),old=arena.getAttribute('style');
 const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches),mobile=Boolean(win.matchMedia?.('(pointer:coarse)').matches),count=reduced?20:mobile?36:64;
 const layer=doc.createElement('div');layer.className='boss-screen-chain-layer';layer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1000;background:#101114;isolation:isolate';layer.setAttribute('aria-hidden','true');
 const sheet=doc.createElement('style');sheet.textContent='.boss-screen-chain-layer #controls,.boss-screen-chain-layer #touch,.boss-screen-chain-layer #reticle,.boss-screen-chain-layer #result,.boss-screen-chain-layer #pause-screen{visibility:hidden!important}.boss-screen-chain-layer #arena{pointer-events:none!important}';layer.appendChild(sheet);
 parent.insertBefore(anchor,arena);layer.appendChild(arena);host.appendChild(layer);
 arena.style.cssText+=';position:absolute;inset:0;width:100%;height:100%;margin:0;max-width:none;transform-origin:50% 50%;pointer-events:none';
 const label=doc.createElement('div');label.textContent='이권재가 토벌되었다';label.style.cssText='position:absolute;top:40%;left:0;right:0;text-align:center;color:#ddd4b9;font:clamp(22px,4vw,52px) serif;letter-spacing:.12em;text-shadow:0 3px 14px #000;z-index:4';layer.appendChild(label);
 const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');svg.setAttribute('preserveAspectRatio','none');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:3;filter:drop-shadow(4px 7px 4px #000)';layer.appendChild(svg);
 const chains=Array.from({length:count},()=>{const g=doc.createElementNS(ns,'g');svg.appendChild(g);const links=Array.from({length:24},(_,j)=>{const e=doc.createElementNS(ns,'ellipse');e.setAttribute('fill','none');e.setAttribute('stroke',j%2?'#242830':'#111318');e.setAttribute('stroke-width','9');g.appendChild(e);return e;});return {g,links};});
 let visual=null,restored=false,visualDone=false;
 Promise.resolve().then(()=>restored||visualDone?null:loadVisuals()).then(module=>{if(!module||restored||visualDone)return;visual=module.createChainVisuals(layer,{mobile,reduced,count});if(visual)svg.style.display='none';}).catch(error=>{if(!restored)console.warn('3D chains unavailable; using SVG',error);});
 function update(bind,pull=0){if(restored)return;const q=chainPose(bind,ownPull?pull:0),r=chainRevealPose(q.pull),w=win.innerWidth||1,h=win.innerHeight||1;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);layer.style.visibility=q.pull>=1?'hidden':'visible';
 const shake=reduced?0:Math.sin(q.tension*38)*q.tension*(1-q.pull)*2;
 arena.style.transform=`translate3d(${shake}px,${(r.y-.5)*h}px,0) scale(${r.scale})`;arena.style.opacity=String(r.screenOpacity);arena.style.borderRadius=(r.gather*48)+'%';arena.style.overflow=r.gather>0?'hidden':'';
 label.textContent=q.pull>.3?'광대 오슬우':'이권재가 토벌되었다';label.style.top=q.pull>.3?'12%':'40%';label.style.opacity=String(q.pull>.3?r.headOpacity:1-Math.min(1,Math.max(0,bind)*2));
 if(q.pull>=1&&!visualDone){visualDone=true;visual?.dispose();}else if(visual&&!visualDone)visual.update(q,q.pull,w,h);
 if(!visual)for(let i=0;i<chains.length;i++){const p=screenChainPose(bind,ownPull?pull:0,i,count),x=p.x*w+(w*.5-p.x*w)*r.gather*.85,anchorY=h*(.08+(i*13%17)/30),start=h+60,end=start+(anchorY-start)*p.reach+(r.y-.5)*h,dx=(i%2?1:-1)*30*(1-q.tension);chains[i].g.style.opacity=p.reach>0?String(p.opacity):'0';for(let j=0;j<24;j++){const t=j/23,e=chains[i].links[j];e.setAttribute('cx',String(x+Math.sin(t*Math.PI)*dx));e.setAttribute('cy',String(end+(start-end)*t));e.setAttribute('rx',String(j%2?6:13));e.setAttribute('ry','20');}}
 }
 function restore(){if(restored)return;restored=true;bindings.delete(hud);if(!visualDone)visual?.dispose();visualDone=true;if(anchor.parentNode){anchor.parentNode.insertBefore(arena,anchor);anchor.remove();}else parent.appendChild(arena);if(old===null)arena.removeAttribute('style');else arena.setAttribute('style',old);layer.remove();}
 const control={update,restore};bindings.set(hud,control);update(0);return control;
}
