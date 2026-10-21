import {chainPose,screenChainPose} from './screen-chain-data.mjs';
export {chainPose};
const bindings=new WeakMap();
export function restoreBossName(hud){bindings.get(hud)?.restore();}
export function bindBossName(hud,ownPull=true,host=null){
 if(!hud)return null;
 restoreBossName(hud);
 // Only the Kwon-to-clown transition supplies a host. The final clown victory must not loop.
 if(!host)return {update(){},restore(){}};
 const arena=hud.closest('#arena');if(!arena||arena.contains(host))return null;
 const doc=hud.ownerDocument,win=doc.defaultView,parent=arena.parentNode,anchor=doc.createComment('arena-before-screen-chain'),old=arena.getAttribute('style');
 const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches),mobile=Boolean(win.matchMedia?.('(pointer:coarse)').matches),count=reduced?20:mobile?36:64;
 const layer=doc.createElement('div');layer.className='boss-screen-chain-layer';layer.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1000;background:#101114;isolation:isolate';layer.setAttribute('aria-hidden','true');
 const sheet=doc.createElement('style');sheet.textContent='.boss-screen-chain-layer #controls,.boss-screen-chain-layer #touch,.boss-screen-chain-layer #reticle,.boss-screen-chain-layer #result,.boss-screen-chain-layer #pause-screen{visibility:hidden!important}.boss-screen-chain-layer #arena{pointer-events:none!important}';layer.appendChild(sheet);
 parent.insertBefore(anchor,arena);layer.appendChild(arena);host.appendChild(layer);
 arena.style.cssText+=';position:absolute;inset:0;width:100%;height:100%;margin:0;max-width:none;transform-origin:50% 100%;pointer-events:none';
 const label=doc.createElement('div');label.textContent='이권재가 토벌되었다';label.style.cssText='position:absolute;top:40%;left:0;right:0;text-align:center;color:#ddd4b9;font:clamp(22px,4vw,52px) serif;letter-spacing:.12em;text-shadow:0 3px 14px #000;z-index:2';layer.appendChild(label);
 const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg');svg.setAttribute('preserveAspectRatio','none');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:3';layer.appendChild(svg);
 const chains=Array.from({length:count},(_,i)=>{const g=doc.createElementNS(ns,'g');svg.appendChild(g);const links=Array.from({length:24},(_,j)=>{const e=doc.createElementNS(ns,'ellipse');e.setAttribute('fill','none');e.setAttribute('stroke',j%2?'#41454b':'#292d33');e.setAttribute('stroke-width','3.5');g.appendChild(e);return e;});return {g,links};});
 let restored=false;
 function update(bind,pull=0){if(restored)return;const q=chainPose(bind,ownPull?pull:0),w=win.innerWidth||1,h=win.innerHeight||1;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);layer.style.visibility=q.pull>=1?'hidden':'visible';
 const shake=reduced?0:Math.sin(q.tension*38)*q.tension*(1-q.pull)*2;
 arena.style.transform=`translate3d(${shake}px,${q.pull*120}%,0) rotate(${reduced?0:q.pull*1.8}deg)`;
 label.style.transform=`translateY(${q.pull*h*1.2}px)`;label.style.opacity=String(1-Math.min(1,Math.max(0,bind)*2));
 for(let i=0;i<count;i++){const p=screenChainPose(bind,ownPull?pull:0,i,count),x=p.x*w,anchorY=h*(.08+(i*13%17)/30),start=h+60,end=start+(anchorY-start)*p.reach+q.pull*h*1.2,dx=(i%2?1:-1)*(18+(i%5)*12)*(1-q.tension);chains[i].g.style.opacity=p.reach>0?String(p.opacity):'0';
 for(let j=0;j<24;j++){const t=j/23,e=chains[i].links[j],y=end+(start-end)*t,bend=Math.sin(t*Math.PI)*dx;e.setAttribute('cx',String(x+bend));e.setAttribute('cy',String(y));e.setAttribute('rx',String(j%2?3.5:8));e.setAttribute('ry','12');e.setAttribute('transform',`rotate(${(i%2?1:-1)*(1-q.tension)*8} ${x+bend} ${y})`);}}
 }
 function restore(){if(restored)return;restored=true;bindings.delete(hud);if(anchor.parentNode){anchor.parentNode.insertBefore(arena,anchor);anchor.remove();}else parent.appendChild(arena);if(old===null)arena.removeAttribute('style');else arena.setAttribute('style',old);layer.remove();}
 const control={update,restore};bindings.set(hud,control);update(0);return control;
}
