import {JOURNEY_ART} from './journey-art.mjs';
import {playDiceCrushEntrance} from './dice-entrance-view.mjs';
import {reducedMotion} from './display-preferences.mjs';
export function playJourneyTransition(doc,win,boss,shell){
 if(boss==='dice')return playDiceCrushEntrance(doc,shell,{win});
 const d=doc.createElement('dialog');d.className='journey-transition';d.setAttribute('aria-label',boss==='kwon'?'검기로 열리는 첫 번째 시련':boss==='clown'?'광대 오슬우 전환 연출':boss==='blood'?'성혈 대성당으로':'네 시련의 종결');
 d.innerHTML=boss==='kwon'?`<div class="jt-half jt-left">${JOURNEY_ART}</div><div class="jt-half jt-right">${JOURNEY_ART}</div><div class="jt-slash"></div>`:boss==='clown'?'<canvas aria-label="공 위에서 등장해 인사하는 광대 오슬우"></canvas>':boss==='blood'?'<div class="jt-ending" style="color:#dd5478">♜　♥　♜</div>':'<div class="jt-ending">◇　◇　◇　◇</div>';
 const title=doc.createElement('div');title.className='jt-title';title.textContent=boss==='kwon'?'긴턱의 이권재':boss==='clown'?'광대 오슬우':boss==='blood'?'성혈 대성당 · 영원한 혈왕 배서준':'네 지배자가 토벌되었다';d.appendChild(title);
 const skip=doc.createElement('button');skip.textContent='건너뛰기';d.appendChild(skip);doc.body.appendChild(d);
 let done=false,raf=0,last=null,t=0,scene=null,resolve,loading=boss==='clown';const finished=new Promise(r=>resolve=r),calm=reducedMotion();
 function end(ok){if(done)return;done=true;win.cancelAnimationFrame(raf);try{scene?.dispose();}finally{d.close();d.remove();resolve(ok);}}
 skip.onclick=()=>end(true);d.addEventListener('cancel',e=>{e.preventDefault();end(true);});d.addEventListener('keydown',e=>e.stopPropagation());
 if(boss==='clown')import('./clown-entrance.mjs').then(m=>{if(done)return;scene=m.buildEntrance(d.querySelector('canvas'));loading=false;}).catch(error=>{console.error('Clown entrance unavailable',error);loading=false;title.textContent='광대 오슬우 · 공연의 막이 오른다';});
 function frame(now){if(done)return;try{const dt=last===null?0:Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!doc.hidden&&!loading)t+=dt;
  if(boss==='kwon'){const cut=Math.min(1,Math.max(0,(t-.45)/1.4));for(const [i,el] of [...d.querySelectorAll('.jt-half')].entries())el.style.transform=calm?'none':`translateX(${(i?-1:1)*-cut*105}%)`;const slash=d.querySelector('.jt-slash');slash.style.opacity=String(t<.8?Math.sin(Math.min(1,t/.25)*Math.PI/2):Math.max(0,1-(t-.8)*3));d.style.backgroundColor=`rgba(4,8,10,${1-cut})`;title.style.opacity=String(Math.min(1,Math.max(0,(t-1)*2)));}
  else if(scene){const entry=Math.min(1,t/2.5),bow=Math.max(0,Math.sin(Math.min(1,Math.max(0,(t-2.5)/2))*Math.PI));scene.render({entry,bow,stage:bow>0?'bow':'entry'},calm?0:t);}
  if(t>=(calm?1.4:boss==='kwon'?2.5:boss==='clown'?5.4:2.5)){end(true);return;}raf=win.requestAnimationFrame(frame);
 }catch(error){console.error('Journey transition failed',error);end(true);}}
 try{d.showModal();skip.focus();raf=win.requestAnimationFrame(frame);}catch(error){end(false);}
 return {finished,dispose:()=>end(false)};
}
