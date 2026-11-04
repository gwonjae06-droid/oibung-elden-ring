import {diceEntrancePose} from './dice-data.mjs';
import {playBossCue,stopBossCue} from './boss-cues.mjs';
const DOTS={1:[[50,50]],2:[[27,27],[73,73]],3:[[27,27],[50,50],[73,73]],4:[[27,27],[73,27],[27,73],[73,73]],5:[[27,27],[73,27],[50,50],[27,73],[73,73]],6:[[27,27],[27,50],[27,73],[73,27],[73,50],[73,73]]};
export function playDiceCrushEntrance(doc,shell,{impact=()=>{},win=doc.defaultView}={}){
 const dialog=doc.createElement('dialog');dialog.setAttribute('aria-label','박성원 주사위 화면 압착 연출');dialog.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:hidden;background:transparent;color:#ffe7ad';
 const make=(tag,css,text)=>{const e=doc.createElement(tag);e.style.cssText=css;if(text)e.textContent=text;return e;};
 const stage=make('div','position:absolute;inset:0;perspective:1000px;background:radial-gradient(ellipse at center,transparent,rgba(8,2,10,.45))');
 const cube=make('div','position:absolute;top:48%;width:var(--edge);height:var(--edge);transform-style:preserve-3d;--edge:min(46vw,48vh);--half:calc(var(--edge)/2)');
 const faces=['translateZ(var(--half))','rotateY(180deg) translateZ(var(--half))','rotateY(90deg) translateZ(var(--half))','rotateY(-90deg) translateZ(var(--half))','rotateX(90deg) translateZ(var(--half))','rotateX(-90deg) translateZ(var(--half))'];
 faces.forEach((transform,i)=>{const f=make('div','position:absolute;inset:0;background:linear-gradient(135deg,#382027,#08080b 70%);border:clamp(3px,.8vw,10px) solid #be9853;box-shadow:inset 0 0 35px #000;backface-visibility:hidden');f.style.transform=transform;for(const [x,y] of DOTS[i+1]){const p=make('i','position:absolute;width:14%;height:14%;border-radius:50%;background:#fff1c8;box-shadow:0 0 12px #d5a548;transform:translate(-50%,-50%)');p.style.left=x+'%';p.style.top=y+'%';f.appendChild(p);}cube.appendChild(f);});
 const title=make('div','position:absolute;left:0;right:0;top:8%;text-align:center;font:600 clamp(24px,4vw,48px) serif;text-shadow:0 2px 12px #000','거대 주사위 박성원');
 const skip=make('button','position:absolute;bottom:24px;right:24px;padding:12px 20px;border:1px solid #d5b375;background:#130a14;color:#fff1cf;border-radius:5px','건너뛰기');
 stage.appendChild(cube);dialog.appendChild(stage);dialog.appendChild(title);dialog.appendChild(skip);doc.body.appendChild(dialog);
 const saved={transform:shell.style.transform,transformOrigin:shell.style.transformOrigin,filter:shell.style.filter};
 let done=false,playedCue=false,frameId=0,last=null,elapsed=0,turn=0,resolve;const finished=new Promise(r=>resolve=r);
 const reduced=Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
 function end(ok){if(done)return;done=true;win.cancelAnimationFrame(frameId);stopBossCue('start');Object.assign(shell.style,saved);try{dialog.close();}catch{}dialog.remove();resolve(ok);}
 skip.onclick=()=>end(true);dialog.addEventListener('cancel',e=>{e.preventDefault();end(true);});dialog.addEventListener('keydown',e=>e.stopPropagation());
 function frame(now){
  if(done)return;
  try{
   if(!shell.isConnected){end(false);return;}
   const dt=last===null?0:Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(!doc.hidden)elapsed+=dt;
   if(!playedCue&&elapsed>=.15){playedCue=true;playBossCue('start');}
   const p=diceEntrancePose(elapsed),k=Math.floor(p.travel*6),x=-60+p.travel*220;
   cube.style.left=x+'%';cube.style.transform='translate(-50%,-50%) rotateX(-18deg) rotateY(-22deg) rotateZ('+(reduced?0:p.travel*540)+'deg)';
   if(k!==turn){turn=k;try{impact();}catch(error){console.warn('Dice entrance audio failed',error);}}
   shell.style.transformOrigin='50% 100%';shell.style.transform='scaleY('+p.screenScaleY+')';shell.style.filter='brightness('+(1-p.press*.65)+')';
   stage.style.backgroundColor='rgba(10,3,12,'+(p.press*.88)+')';title.style.opacity=String(Math.min(1,elapsed/.5));
   if(p.ready){end(true);return;}frameId=win.requestAnimationFrame(frame);
  }catch(error){console.error('Dice entrance failed',error);end(false);}
 }
 try{dialog.showModal();skip.focus({preventScroll:true});frameId=win.requestAnimationFrame(frame);}catch(error){console.error('Dice entrance could not open',error);end(false);}
 return {finished,dispose:()=>end(false)};
}
