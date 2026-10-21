const bindings=new WeakMap();
export function restoreBossName(hud){bindings.get(hud)?.restore();}
const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const ease=t=>{t=sat(t);return t*t*(3-2*t);};
export function chainPose(bind,pull=0){const b=sat(bind),p=b>=1?ease(pull):0;return {reach:ease(b/.24),wraps:Array.from({length:4},(_,i)=>sat((b-.24-i*.16)/.16)),pull:p,tension:ease((b-.88)/.12)};}
export function bindBossName(hud,ownPull=true,host=null){
 restoreBossName(hud);
 const name=hud?.querySelector('h2');if(!name)return null;
 const doc=hud.ownerDocument,win=doc.defaultView,rect=name.getBoundingClientRect(),parent=name.parentNode,anchor=doc.createComment('boss-name-position'),old=name.getAttribute('style');
 const computed=win.getComputedStyle(name),font={font:computed.font,color:computed.color,lineHeight:computed.lineHeight,letterSpacing:computed.letterSpacing,textShadow:computed.textShadow,textAlign:computed.textAlign};
 parent.insertBefore(anchor,name);
 const layer=doc.createElement('div');layer.className='boss-name-chain-layer';layer.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:1000;overflow:hidden';
 const root=hud.getRootNode();(host||(root===doc?doc.body:root)).appendChild(layer);
 const svg=()=>{const s=doc.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('aria-hidden','true');s.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible';layer.appendChild(s);return s;};
 const back=svg();back.style.zIndex='1';layer.appendChild(name);Object.assign(name.style,font,{position:'absolute',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',margin:'0',maxWidth:'none',zIndex:'2',transformOrigin:'center',pointerEvents:'none'});
 const front=svg();front.style.zIndex='3';
 function strand(target){const group=doc.createElementNS(back.namespaceURI,'g');target.appendChild(group);const paths=[];for(let i=0;i<2;i++){const p=doc.createElementNS(back.namespaceURI,'path');p.setAttribute('fill','none');p.setAttribute('stroke',i?'#c6b99d':'#211b13');p.setAttribute('stroke-width',i?'4':'8');p.setAttribute('stroke-linecap','round');p.setAttribute('pathLength','100');group.appendChild(p);paths.push(p);}return {group,paths};}
 const ends=[strand(front),strand(front)],coils=Array.from({length:4},()=>({back:strand(back),front:strand(front)}));
 const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);let restored=false;
 function draw(s,d,k){for(let i=0;i<s.paths.length;i++){const p=s.paths[i];p.setAttribute('d',d);p.setAttribute('stroke-dasharray',i?'3 2':'100');p.setAttribute('stroke-dashoffset',i?'0':String(100*(1-k)));}s.group.style.opacity=k>0?'1':'0';s.paths[1].style.opacity=String(k);}
 function update(bind,pull=0){
  if(restored)return;const pose=chainPose(bind,ownPull?pull:0),w=win.innerWidth,h=win.innerHeight,dy=(h-rect.top+rect.height+60)*pose.pull,shake=reduced?0:Math.sin(pose.tension*31)*2*pose.tension*(1-pose.pull),cx=rect.left+rect.width/2+shake,cy=rect.top+rect.height/2+dy;
  layer.style.opacity=String(1-Math.max(0,(pose.pull-.7)/.3));
  name.style.transform='translate3d('+shake+'px,'+dy+'px,0)';name.style.opacity=String(1-pose.pull*.15);
  for(const s of[back,front])s.setAttribute('viewBox','0 0 '+w+' '+h);
  const left=cx-rect.width*.42,right=cx+rect.width*.42;
  draw(ends[0],'M 0 '+(rect.top-50)+' Q '+(left*.5)+' '+(cy+25)+' '+(left*pose.reach)+' '+(rect.top-50+(cy-rect.top+50)*pose.reach),pose.reach);
  draw(ends[1],'M '+w+' '+(rect.top+rect.height+50)+' Q '+((w+right)*.5)+' '+(cy-25)+' '+(w+(right-w)*pose.reach)+' '+(rect.top+rect.height+50+(cy-rect.top-rect.height-50)*pose.reach),pose.reach);
  for(let i=0;i<4;i++){const x=cx+(i-1.5)*rect.width*.2,rx=Math.max(14,rect.width*.17),ry=Math.max(16,rect.height*.85),k=pose.wraps[i];draw(coils[i].back,'M '+(x-rx)+' '+cy+' A '+rx+' '+ry+' 0 0 1 '+(x+rx)+' '+cy,Math.min(1,k*2));draw(coils[i].front,'M '+(x+rx)+' '+cy+' A '+rx+' '+ry+' 0 0 1 '+(x-rx)+' '+cy,Math.max(0,k*2-1));}
 }
 function restore(){if(restored)return;restored=true;bindings.delete(hud);if(anchor.parentNode){anchor.parentNode.insertBefore(name,anchor);anchor.remove();}else parent.appendChild(name);if(old===null)name.removeAttribute('style');else name.setAttribute('style',old);layer.remove();}
 update(0);const control={update,restore};bindings.set(hud,control);return control;
}
