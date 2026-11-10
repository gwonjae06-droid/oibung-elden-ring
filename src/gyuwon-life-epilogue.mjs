import {renderJourneyArt} from './journey-art.mjs';
import {createGyuwonLifeStage3d,GYUWON_LIFE_SCENE} from './gyuwon-life-stage-3d.mjs';
// The family film follows the actual 800HP finale and cannot be skipped.
// The main mural is replaced only AFTER the split/reveal sequence completes.
export const GYUWON_LIFE_SECONDS=164;
export const GYUWON_LIFE_SHOTS=Object.freeze([
 {at:0,end:18,id:'realization',label:'돌아온 현실',line:'다양한 것들을 경험해보니 알꺼같아. 지금 내가 살아가는 삶이 목적이 없더라도 열심히 살아보자'},
 {at:18,end:30,id:'youth',label:'청춘의 한낮',line:'있는 힘껏 놀고, 새로운 사람을 만나고, 마음껏 웃었다.'},
 {at:30,end:42,id:'study',label:'배움의 시간',line:'열심히 공부했다. 모르는 것이 생기면 다시 물었다.'},
 {at:42,end:53,id:'work',label:'처음 맡은 일',line:'열심히 일했다. 서툰 첫날에도 끝까지 해냈다.'},
 {at:53,end:64,id:'parttime',label:'밤의 아르바이트',line:'열심히 아르바이트했다. 손님에게 마지막까지 웃으며 인사했다.'},
 {at:64,end:80,id:'love',label:'사랑하는 법',line:'열심히 사랑했다. 그 사람과 나란히 걷기 시작했다.'},
 {at:80,end:95,id:'wedding',label:'우리의 약속',line:'두 사람은 서로의 내일을 함께 살아가기로 했다.'},
 {at:95,end:113,id:'family',label:'다시 시작되는 삶',line:'가정을 꾸리고 아이를 낳았다. 평범한 하루가 가장 큰 모험이 되었다.'},
 {at:113,end:129,id:'child',label:'어느 평범한 저녁',line:'아빠, 이게 뭐야?'},
 {at:129,end:140,id:'answer',label:'잊고 있었던 이야기',line:'아~ 이거? 이건 말이야, 아빠가 옛날에.....'},
 {at:140,end:147,id:'phone',label:'ODEN RING',line:''},
 {at:147,end:154,id:'portal',label:'',line:''},
 {at:154,end:164,id:'title',label:'',line:''}
]);
const clamp=n=>Math.max(0,Math.min(1,n));
export function gyuwonLifeFrame(seconds){
 const time=Math.max(0,Math.min(GYUWON_LIFE_SECONDS,Number.isFinite(seconds)?seconds:0));
 const shot=GYUWON_LIFE_SHOTS.find(x=>time>=x.at&&time<x.end)||GYUWON_LIFE_SHOTS.at(-1);
 const progress=clamp((time-shot.at)/(shot.end-shot.at));
 const zoom=shot.id==='phone'?progress:shot.id==='answer'?progress*.11:shot.id==='portal'||shot.id==='title'?1:0;
 const split=shot.id==='portal'?clamp((time-147.8)/4.7):shot.id==='title'?1:0;
 const titleOpacity=shot.id==='title'?clamp((time-154)/1.6)*clamp((164-time)/2.2):0;
 return {time,shot:shot.id,sceneKey:GYUWON_LIFE_SCENE[shot.id],progress,line:shot.line,label:shot.label,zoom,split,titleOpacity,complete:time>=GYUWON_LIFE_SECONDS};
}
const CSS=[
 '[data-life-cinema="on"] #world{opacity:1!important;visibility:visible!important;display:block!important}',
 '[data-life-cinema="on"] #pause,[data-life-cinema="on"] #pause-screen,[data-life-cinema="on"] .brand,[data-life-cinema="on"] .top-actions,[data-life-cinema="on"] #player-hud,[data-life-cinema="on"] #boss-hud,[data-life-cinema="on"] #controls,[data-life-cinema="on"] #touch,[data-life-cinema="on"] .gy-musical-layer,[data-life-cinema="on"] .gy-dday,[data-life-cinema="on"] .gy-reference-canvas{display:none!important}',
 '.gy-life-film{position:absolute;inset:0;z-index:90;pointer-events:none;overflow:hidden;color:#fff5e0;font-family:system-ui,sans-serif}.gy-life-film[hidden]{display:none!important}',
 '.gy-life-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,transparent 30%,#080b19aa 100%)}',
 '.gy-life-bars:before,.gy-life-bars:after{content:"";position:absolute;left:0;right:0;height:6%;background:#010103;z-index:4}.gy-life-bars:before{top:0}.gy-life-bars:after{bottom:0}',
 '.gy-life-label{position:absolute;z-index:5;left:0;right:0;top:10%;text-align:center;font:500 clamp(12px,1.4vw,22px) Georgia,serif;letter-spacing:.26em;color:#f8e5c7;text-shadow:0 2px 12px #000}',
 '.gy-life-caption{position:absolute;z-index:5;left:7%;right:7%;bottom:10%;text-align:center;font:500 clamp(15px,2.3vw,30px)/1.65 "Malgun Gothic",system-ui,sans-serif;color:#fff9ed;text-shadow:0 2px 10px #000,0 0 18px #000}',
 '.gy-life-shade{position:absolute;z-index:3;inset:0;background:#060914;opacity:0;pointer-events:none}',
 '.gy-ending-gate{position:absolute;z-index:6;inset:0;background:radial-gradient(ellipse at 50% 53%,#23131b 2%,#05050a 70%);overflow:hidden}.gy-ending-gate[hidden]{display:none!important}',
 '.gy-ending-half{position:absolute;inset:0;will-change:transform;overflow:hidden}.gy-ending-half.left{clip-path:polygon(0 0,50% 0,50.9% 16%,49.6% 33%,50.5% 51%,49.4% 67%,50.3% 85%,50% 100%,0 100%);transform:translateX(calc(-47% * var(--split,0)))}.gy-ending-half.right{clip-path:polygon(50% 0,100% 0,100% 100%,50% 100%,50.3% 85%,49.4% 67%,50.5% 51%,49.6% 33%,50.9% 16%);transform:translateX(calc(47% * var(--split,0)))}',
 '.gy-ending-half .j-scene{position:absolute;inset:0;width:100%;height:100%;background:#131824}.gy-ending-half svg.j-wall-wide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.gy-ending-half svg.j-wall-tall{display:none}.gy-ending-half .j-light-shafts,.gy-ending-half .j-haze,.gy-ending-half .j-embers,.gy-ending-half .j-ash{display:none}',
 '.gy-ending-seam{position:absolute;left:50%;top:-10%;bottom:-10%;width:min(1.6vw,20px);transform:translateX(-50%) scaleX(calc(1 + 10 * var(--split,0)));opacity:calc(1 - var(--split,0));filter:blur(5px);background:linear-gradient(90deg,transparent,#fff1ba,#e58c5c,transparent);box-shadow:0 0 70px 9px #f6b36b9c}',
 '.gy-ending-reveal{position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:14px;opacity:var(--ending-opacity,0);transform:scale(calc(.88 + .12 * var(--ending-opacity,0)));color:#fce2b1;text-shadow:0 0 30px #e0aa7d77,0 3px 22px #000}.gy-ending-reveal strong{font:600 clamp(34px,7.5vw,110px)/1.16 Georgia,"Noto Serif KR",serif;letter-spacing:.1em}.gy-ending-reveal span{font:500 clamp(13px,2.5vw,33px)/1.3 Georgia,serif;letter-spacing:.28em}.gy-ending-reveal i{height:1px;width:65%;justify-self:center;background:linear-gradient(90deg,transparent,#d7ae7c,transparent)}',
 '.gy-ending-dust{position:absolute;inset:0;opacity:calc(.75 * var(--split,0));background:radial-gradient(circle at 47% 44%,#ead5b744 0 1px,transparent 2px),radial-gradient(circle at 56% 54%,#f4d5a755 0 2px,transparent 4px);background-size:37px 43px,87px 71px;animation:gy-ending-drift 9s linear infinite}@keyframes gy-ending-drift{to{background-position:160px 270px,-200px -350px}}',
 '@media(prefers-reduced-motion:reduce){.gy-ending-dust{animation:none}}@media(max-height:500px){.gy-life-caption{bottom:8%;font-size:15px}.gy-life-label{top:7%;font-size:12px}}'
].join('');
export function createGyuwonLifeEpilogue(doc,shell,{source=null,coarse=false,onComplete=()=>{}}={}){
 const style=doc.createElement('style');style.textContent=CSS;shell.appendChild(style);
 const layer=doc.createElement('div');layer.className='gy-life-film';layer.hidden=true;layer.setAttribute('aria-live','off');
 layer.innerHTML='<div class="gy-life-vignette"></div><div class="gy-life-bars"></div><div class="gy-life-shade"></div><div class="gy-life-label"></div><div class="gy-life-caption"></div><div class="gy-ending-gate" hidden><div class="gy-ending-reveal"><strong>오든링 엔딩</strong><i></i><span>ODEN RING · THE END</span></div><div class="gy-ending-half left">'+renderJourneyArt('ending-split-left')+'</div><div class="gy-ending-half right">'+renderJourneyArt('ending-split-right')+'</div><div class="gy-ending-dust"></div><div class="gy-ending-seam"></div></div>';
 shell.appendChild(layer);
 const label=layer.querySelector('.gy-life-label'),caption=layer.querySelector('.gy-life-caption'),shade=layer.querySelector('.gy-life-shade'),gate=layer.querySelector('.gy-ending-gate');
 const stage=source?createGyuwonLifeStage3d({doc,source,coarse}):null;
 let time=0,active=false,ended=false,priorShot='',frame=gyuwonLifeFrame(0);
 function start(){time=0;active=true;ended=false;priorShot='';layer.hidden=false;shell.dataset.lifeCinema='on';update(0);}
 function update(dt){
  if(!active||ended)return false;
  time+=Math.max(0,Math.min(.08,Number.isFinite(dt)?dt:0));
  frame=gyuwonLifeFrame(time);
  if(priorShot!==frame.shot){layer.dataset.shot=frame.shot;label.textContent=frame.label;caption.textContent=frame.line;priorShot=frame.shot;}
  const cinematic=frame.sceneKey!=='portal';
  gate.hidden=cinematic;
  label.hidden=caption.hidden=!cinematic;
  if(cinematic){
   const fade=frame.shot==='realization'?Math.max(0,1-frame.time/.9):Math.max(0,1-frame.progress/.055,1-(1-frame.progress)/.055);
   shade.style.opacity=String(Math.min(.93,fade));
  }else{
   shade.style.opacity='0';
   gate.style.setProperty('--split',String(frame.split));
   gate.style.setProperty('--ending-opacity',String(frame.titleOpacity));
  }
  if(frame.complete){ended=true;active=false;onComplete();return true;}
  return false;
 }
 function render(renderer,canvas){
  if(!active||!stage||frame.sceneKey==='portal')return;
  stage.update(frame,canvas?.width||1280,canvas?.height||720);
  stage.render(renderer);
 }
 return {start,update,render,reset(){time=0;active=false;ended=false;layer.hidden=true;delete shell.dataset.lifeCinema;gate.hidden=true;},dispose(){stage?.dispose();style.remove();layer.remove();delete shell.dataset.lifeCinema;},get active(){return active;},frame:()=>frame,stage};
}
