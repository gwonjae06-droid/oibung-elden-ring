import {INTRO_CARDS,introDuration,introFrame} from './boss-intro-data.mjs';
export function playBossIntro(doc,arena,bossId,{reduced=false,raf=cb=>globalThis.requestAnimationFrame(cb),caf=id=>globalThis.cancelAnimationFrame(id),now=()=>globalThis.performance.now()}={}){
 const card=INTRO_CARDS[bossId];
 if(!doc||!arena||!card)return {finished:Promise.resolve(false),skip(){}};
 const el=(tag,css,text)=>{const e=doc.createElement(tag);e.style.cssText=css;if(text!==undefined)e.textContent=text;return e;};
 const overlay=el('div','position:absolute;inset:0;z-index:40;pointer-events:auto;overflow:hidden;font-family:var(--font-display,serif);color:#f5e8ce');
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',card.name+' 등장');
 const veil=el('div','position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.25),#000);opacity:0');
 const top=el('div','position:absolute;left:0;right:0;top:0;height:12vh;background:#000;transform:translateY(-100%)');
 const bottom=el('div','position:absolute;left:0;right:0;bottom:0;height:12vh;background:#000;transform:translateY(100%)');
 const box=el('div','position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;padding:0 5vw');
 const epithet=el('p','margin:0 0 .6rem;font-size:clamp(.9rem,2vw,1.25rem);letter-spacing:.35em;opacity:0;color:'+card.accent,card.epithet);
 const name=el('h2','margin:0;font-size:clamp(2rem,7vw,4.5rem);font-weight:600;opacity:0;text-shadow:0 0 28px '+card.accent+'66,0 4px 14px #000',card.name);
 const line=el('p','margin:1rem 0 0;font-size:clamp(.95rem,2.2vw,1.35rem);opacity:0;color:#e7dcc2',card.line);
 const skip=el('button','position:absolute;right:20px;bottom:calc(12vh + 14px);min-height:40px;padding:6px 16px;background:rgba(0,0,0,.55);color:#f5e8ce;border:1px solid rgba(245,232,206,.45);border-radius:4px;cursor:pointer','건너뛰기');
 box.appendChild(epithet);box.appendChild(name);box.appendChild(line);
 for(const c of [veil,top,bottom,box,skip])overlay.appendChild(c);
 arena.appendChild(overlay);
 let elapsed=0,last=null,handle=0,done=false,resolve;
 const finished=new Promise(r=>resolve=r);
 function finish(ok){if(done)return;done=true;caf(handle);overlay.remove();resolve(ok);}
 function apply(f){
  veil.style.opacity=String(f.veil);
  if(reduced){top.style.opacity=bottom.style.opacity=String(f.bars);top.style.transform=bottom.style.transform='none';}
  else{top.style.transform='translateY('+(-(1-f.bars)*100)+'%)';bottom.style.transform='translateY('+((1-f.bars)*100)+'%)';}
  epithet.style.opacity=String(f.epithet);epithet.style.transform=reduced?'none':'translateY('+((1-f.epithet)*10)+'px)';
  name.style.opacity=String(f.name);name.style.letterSpacing=f.spacing.toFixed(3)+'em';
  line.style.opacity=String(f.line);
 }
 function frame(){
  if(done)return;
  if(!arena.isConnected){finish(false);return;}
  const t=now(),dt=last===null?0:Math.min(.1,Math.max(0,(t-last)/1000));last=t;
  if(!doc.hidden)elapsed+=dt;
  const f=introFrame(elapsed,reduced);
  if(f.done){finish(true);return;}
  apply(f);handle=raf(frame);
 }
 skip.onclick=()=>finish(true);
 apply(introFrame(0,reduced));
 skip.focus({preventScroll:true});
 handle=raf(frame);
 return {finished,skip:()=>finish(true),duration:introDuration(reduced)};
}
