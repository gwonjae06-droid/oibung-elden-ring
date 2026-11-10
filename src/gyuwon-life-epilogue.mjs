import {createGyuwonLifeStage3d,GYUWON_LIFE_SCENE} from './gyuwon-life-stage-3d.mjs';
import {playJourneyFinale,JOURNEY_FINALE_SECONDS} from './journey-finale.mjs';
export const GYUWON_LIFE_CORRIDOR_AT=147;
export const GYUWON_LIFE_SECONDS=GYUWON_LIFE_CORRIDOR_AT+JOURNEY_FINALE_SECONDS;
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
 {at:147,end:157.2,id:'portal',label:'',line:''},
 {at:157.2,end:175.2,id:'corridor',label:'',line:''},
 {at:175.2,end:181,id:'title',label:'',line:''}
]);

const clamp=n=>Math.max(0,Math.min(1,n));
export function gyuwonLifeFrame(seconds){
 const time=Math.max(0,Math.min(GYUWON_LIFE_SECONDS,Number.isFinite(seconds)?seconds:0));
 const shot=GYUWON_LIFE_SHOTS.find(x=>time>=x.at&&time<x.end)||GYUWON_LIFE_SHOTS.at(-1);
 const progress=clamp((time-shot.at)/(shot.end-shot.at)),tail=Math.max(0,time-GYUWON_LIFE_CORRIDOR_AT);
 const q=clamp((tail-3.8)/6.4),split=q*q*(3-2*q);
 return {time,shot:shot.id,sceneKey:GYUWON_LIFE_SCENE[shot.id],progress,line:shot.line,label:shot.label,
  zoom:shot.id==='phone'?progress:time>=GYUWON_LIFE_CORRIDOR_AT?1:0,split,
  titleOpacity:time>=175.2?clamp((time-175.2)/2.5):0,complete:time>=GYUWON_LIFE_SECONDS};
}
const CSS=`
[data-life-cinema="on"] #world{opacity:1!important;visibility:visible!important;display:block!important}
[data-life-cinema="on"] #pause,[data-life-cinema="on"] #pause-screen,[data-life-cinema="on"] .brand,[data-life-cinema="on"] .top-actions,[data-life-cinema="on"] #player-hud,[data-life-cinema="on"] #boss-hud,[data-life-cinema="on"] #controls,[data-life-cinema="on"] #touch,[data-life-cinema="on"] .gy-musical-layer,[data-life-cinema="on"] .gy-dday,[data-life-cinema="on"] .gy-reference-canvas{display:none!important}
.gy-life-film{position:absolute;inset:0;z-index:90;pointer-events:none;overflow:hidden;color:#fff5e0;font-family:system-ui,sans-serif}.gy-life-film[hidden]{display:none!important}
.gy-life-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 52%,transparent 45%,#080b1970 100%)}
.gy-life-bars:before,.gy-life-bars:after{content:"";position:absolute;left:0;right:0;height:6%;background:#010103;z-index:4}.gy-life-bars:before{top:0}.gy-life-bars:after{bottom:0}
.gy-life-label{position:absolute;z-index:5;left:0;right:0;top:10%;text-align:center;font:500 clamp(12px,1.4vw,22px) Georgia,serif;letter-spacing:.26em;color:#f8e5c7;text-shadow:0 2px 12px #000}
.gy-life-caption{position:absolute;z-index:5;left:7%;right:7%;bottom:10%;text-align:center;font:500 clamp(15px,2.3vw,30px)/1.65 "Malgun Gothic",system-ui,sans-serif;color:#fff9ed;text-shadow:0 2px 10px #000,0 0 18px #000}
.gy-life-shade{position:absolute;z-index:3;inset:0;background:#060914;opacity:0;pointer-events:none}
@media(max-height:500px){.gy-life-caption{bottom:8%;font-size:15px}.gy-life-label{top:7%;font-size:12px}}`;
export function createGyuwonLifeEpilogue(doc,shell,{source=null,coarse=false,onComplete=()=>{},onError=()=>{},finaleFactory=playJourneyFinale}={}){
 const style=doc.createElement('style');style.textContent=CSS;shell.appendChild(style);
 const layer=doc.createElement('div');layer.className='gy-life-film';layer.hidden=true;layer.setAttribute('aria-live','off');
 layer.innerHTML='<div class="gy-life-vignette"></div><div class="gy-life-bars"></div><div class="gy-life-shade"></div><div class="gy-life-label"></div><div class="gy-life-caption"></div>';
 shell.appendChild(layer);
 const label=layer.querySelector('.gy-life-label'),caption=layer.querySelector('.gy-life-caption'),shade=layer.querySelector('.gy-life-shade');
 const stage=source?createGyuwonLifeStage3d({doc,source,coarse}):null;
 let time=0,active=false,ended=false,disposed=false,priorShot='',frame=gyuwonLifeFrame(0),corridor=null,generation=0,clockGap=false;
 function visibility(){clockGap=true;}
 doc.addEventListener('visibilitychange',visibility);
 function finish(){if(!active||ended||disposed)return;ended=true;active=false;onComplete();}
 function cancelCorridor(){generation++;corridor?.dispose();corridor=null;}
 function start(){cancelCorridor();time=0;active=true;ended=false;priorShot='';layer.hidden=false;shell.dataset.lifeCinema='on';update(0);}
 function update(dt){
  if(!active||ended||disposed)return false;
  if(clockGap){dt=0;clockGap=false;}
  time+=Math.max(0,Number.isFinite(dt)?dt:0);frame=gyuwonLifeFrame(time);
  if(time>=GYUWON_LIFE_CORRIDOR_AT){
   layer.hidden=true;
   if(!corridor){
    const ticket=++generation;
    try{
     // Reuse the original mural opening, physical corridor, relics and coda.
     corridor=finaleFactory(doc,doc.defaultView);
     corridor.finished.then(ok=>{if(ticket!==generation||disposed||!active)return;if(ok)finish();else{active=false;onError();}}).catch(()=>{if(ticket===generation&&!disposed){active=false;onError();}});
    }catch(error){active=false;onError(error);}
   }
   return false;
  }
  if(priorShot!==frame.shot){layer.dataset.shot=frame.shot;label.textContent=frame.label;caption.textContent=frame.line;priorShot=frame.shot;}
  const opening=frame.shot==='realization';
  const fade=opening?Math.max(0,1-frame.time/2.5):Math.max(0,1-frame.progress/.055,1-(1-frame.progress)/.055);
  const familyCut=frame.shot==='family'?Math.max(0,1-Math.abs(frame.progress-.48)/.035):0;
  shade.style.background=opening?'#fff6e6':'#060914';shade.style.opacity=String(Math.max(Math.min(.94,fade),familyCut));
  label.style.opacity=caption.style.opacity=opening?String(clamp((frame.time-4)/2)):'1';
  return false;
 }
 function render(renderer,canvas){if(!active||!stage||corridor)return;stage.update(frame,canvas?.width||1280,canvas?.height||720);stage.render(renderer);}
 return {start,update,render,reset(){cancelCorridor();time=0;active=false;ended=false;layer.hidden=true;delete shell.dataset.lifeCinema;},
  dispose(){if(disposed)return;disposed=true;active=false;doc.removeEventListener('visibilitychange',visibility);cancelCorridor();stage?.dispose();style.remove();layer.remove();delete shell.dataset.lifeCinema;},
  get active(){return active;},frame:()=>frame,stage};
}
