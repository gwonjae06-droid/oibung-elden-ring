import {reducedMotion} from './display-preferences.mjs';
export function playRewardPull(doc,win,dialog){
 const chains=doc.createElement('div');chains.className='reward-chains';chains.setAttribute('aria-hidden','true');
 for(const side of ['left','right']){const track=doc.createElement('div');track.className='reward-chain '+side;for(let i=0;i<40;i++){const link=doc.createElement('i');track.appendChild(link);}chains.appendChild(track);}dialog.appendChild(chains);
 const old=dialog.style.transform;let raf=0,last=null,t=0,done=false,resolve;const finished=new Promise(r=>resolve=r),duration=reducedMotion()?.65:1.25;
 function end(ok){if(done)return;done=true;win.cancelAnimationFrame(raf);dialog.style.transform=old;chains.remove();resolve(ok);}
 function frame(now){if(done)return;const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;if(!doc.hidden)t+=dt;const p=Math.min(1,t/duration),u=p*p*(3-2*p);dialog.style.transform=`translateY(${u*110}dvh)`;if(p===1){end(true);return;}raf=win.requestAnimationFrame(frame);}
 raf=win.requestAnimationFrame(frame);return {finished,dispose:()=>end(false)};
}
