// Post-800 HP playable-ending continuation. This cannot be skipped or triggered
// from the main menu: the full original final song must finish first.
export const GYUWON_LIFE_SECONDS=147;
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
 {at:140,end:147,id:'phone',label:'ODEN RING',line:''}
]);
export function gyuwonLifeFrame(seconds){
 const time=Math.min(GYUWON_LIFE_SECONDS,Math.max(0,Number.isFinite(seconds)?seconds:0));
 const shot=GYUWON_LIFE_SHOTS.find(s=>time>=s.at&&time<s.end)||GYUWON_LIFE_SHOTS.at(-1);
 const progress=Math.max(0,Math.min(1,(time-shot.at)/(shot.end-shot.at)));
 const zoom=shot.id==='phone'?progress:shot.id==='answer'?progress*.11:0;
 return {time,shot:shot.id,progress,line:shot.line,label:shot.label,zoom,complete:time>=GYUWON_LIFE_SECONDS};
}
const stageCss=`
.gy-life-film{position:absolute;inset:0;z-index:90;pointer-events:auto;overflow:hidden;color:#fff5e0;background:#0d1520;font-family:system-ui,sans-serif}
.gy-life-film[hidden]{display:none!important}
.gy-life-vista{position:absolute;inset:0;transition:background 2s ease;overflow:hidden;background:linear-gradient(#28334d 0%,#bc827c 55%,#dfb88e 100%)}
.gy-life-film[data-shot="realization"] .gy-life-vista{background:linear-gradient(#121626,#323956 60%,#766876)}
.gy-life-film[data-shot="study"] .gy-life-vista,.gy-life-film[data-shot="work"] .gy-life-vista{background:linear-gradient(#345a79,#98bdcb 64%,#e7c794)}
.gy-life-film[data-shot="parttime"] .gy-life-vista{background:linear-gradient(#111b36,#3c4467 65%,#626577)}
.gy-life-film[data-shot="love"] .gy-life-vista,.gy-life-film[data-shot="wedding"] .gy-life-vista{background:linear-gradient(#655276,#c9859c 60%,#ffe1b6)}
.gy-life-film[data-shot="family"] .gy-life-vista,.gy-life-film[data-shot="child"] .gy-life-vista,.gy-life-film[data-shot="answer"] .gy-life-vista,.gy-life-film[data-shot="phone"] .gy-life-vista{background:linear-gradient(#253c4a,#6e8190 54%,#af9b86)}
.gy-life-sun{position:absolute;width:23vmin;height:23vmin;left:13%;top:16%;border-radius:50%;background:#ffe5a3;box-shadow:0 0 7vmin 3vmin #fff3bd55;animation:gy-life-sun 8s ease-in-out infinite alternate}
.gy-life-buildings{position:absolute;left:-5%;right:-5%;bottom:20%;height:31%;background:repeating-linear-gradient(90deg,#2d3846 0 5%,#364456 5% 11%,#273342 11% 16%,#46566a 16% 22%);clip-path:polygon(0 57%,4% 57%,4% 12%,13% 12%,13% 30%,20% 30%,20% 4%,28% 4%,28% 45%,35% 45%,35% 15%,46% 15%,46% 34%,53% 34%,53% 7%,63% 7%,63% 42%,70% 42%,70% 16%,81% 16%,81% 48%,91% 48%,91% 6%,100% 6%,100% 100%,0 100%)}
.gy-life-floor{position:absolute;bottom:0;left:0;right:0;height:23%;background:linear-gradient(#4e504a,#242b2e)}
.gy-life-school{position:absolute;left:11%;bottom:18%;width:24%;height:41%;background:linear-gradient(110deg,#b2ad97,#7c918e);border:1vmin solid #efe3be;box-shadow:inset 0 0 0 2vmin #344960}
.gy-life-school:after{content:'';position:absolute;inset:11%;background:repeating-linear-gradient(90deg,#273d4c 0 18%,#a8b8ba 18% 24%,#273d4c 24% 43%,#c9c6b1 43% 50%)}
.gy-life-person{position:absolute;bottom:19%;left:44%;width:8vmin;height:30vmin;transform-origin:center bottom;filter:drop-shadow(0 1vmin 1.5vmin #13131b88);animation:gy-life-breathe 2.4s ease-in-out infinite}
.gy-life-person:before{content:'';position:absolute;width:7vmin;height:7vmin;top:0;left:.6vmin;border-radius:48%;background:#d6a98b;box-shadow:inset -1.6vmin 1.8vmin #3a3037}
.gy-life-person:after{content:'';position:absolute;top:6.5vmin;left:0;width:8vmin;height:23vmin;background:linear-gradient(90deg,#384458,#596b7f);clip-path:polygon(12% 0,87% 0,100% 47%,74% 51%,79% 100%,54% 100%,49% 57%,44% 100%,18% 100%,23% 53%,0 47%)}
.gy-life-person.partner{left:57%;transform:scale(.9);animation-delay:.3s}
.gy-life-person.partner:after{background:linear-gradient(90deg,#d4a4a9,#e3c8a8)}
.gy-life-person.child{left:69%;transform:scale(.55);animation-delay:.45s}
.gy-life-person.child:after{background:linear-gradient(90deg,#759bb1,#a4c6c9)}
.gy-life-film[data-shot="realization"] .partner,.gy-life-film[data-shot="realization"] .child,
.gy-life-film[data-shot="youth"] .partner,.gy-life-film[data-shot="youth"] .child,
.gy-life-film[data-shot="study"] .partner,.gy-life-film[data-shot="study"] .child,
.gy-life-film[data-shot="work"] .partner,.gy-life-film[data-shot="work"] .child,
.gy-life-film[data-shot="parttime"] .partner,.gy-life-film[data-shot="parttime"] .child,
.gy-life-film[data-shot="love"] .child,.gy-life-film[data-shot="wedding"] .child{display:none}
.gy-life-film[data-shot="youth"] .gy-life-person{animation:gy-life-dance .6s ease-in-out infinite alternate}
.gy-life-film[data-shot="study"] .gy-life-school,.gy-life-film[data-shot="work"] .gy-life-school,.gy-life-film[data-shot="parttime"] .gy-life-school{opacity:1}
.gy-life-film:not([data-shot="study"]):not([data-shot="work"]):not([data-shot="parttime"]) .gy-life-school{display:none}
.gy-life-film[data-shot="study"] .gy-life-person{left:55%;transform:rotate(8deg)}
.gy-life-film[data-shot="love"] .gy-life-person,.gy-life-film[data-shot="wedding"] .gy-life-person{left:42%}
.gy-life-film[data-shot="love"] .partner,.gy-life-film[data-shot="wedding"] .partner{left:52%}
.gy-life-film[data-shot="family"] .gy-life-person,.gy-life-film[data-shot="child"] .gy-life-person,.gy-life-film[data-shot="answer"] .gy-life-person,.gy-life-film[data-shot="phone"] .gy-life-person{left:24%}
.gy-life-film[data-shot="family"] .partner,.gy-life-film[data-shot="child"] .partner,.gy-life-film[data-shot="answer"] .partner,.gy-life-film[data-shot="phone"] .partner{left:37%}
.gy-life-film[data-shot="family"] .child,.gy-life-film[data-shot="child"] .child,.gy-life-film[data-shot="answer"] .child,.gy-life-film[data-shot="phone"] .child{left:51%}
.gy-life-table{position:absolute;bottom:13%;left:42%;width:32%;height:8%;border-radius:12px;background:linear-gradient(#ae8659,#624331);box-shadow:0 3vmin #332b2b}
.gy-life-film:not([data-shot="family"]):not([data-shot="child"]):not([data-shot="answer"]):not([data-shot="phone"]) .gy-life-table{display:none}
.gy-life-phone{position:absolute;left:55%;bottom:22%;width:min(16vmin,120px);height:min(25vmin,188px);padding:1vmin;border:.8vmin solid #12171d;border-radius:1.8vmin;background:#050607;transform:perspective(55vmin) rotateX(25deg) rotateZ(-9deg) scale(var(--zoom,1));box-shadow:0 2vmin 3vmin #0008}
.gy-life-screen{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:linear-gradient(#0c1521aa,#15212c88),url("${new URL('../assets/art/temple-wall-v1.jpg',import.meta.url).href}") center / cover;color:#f9e4b6;text-shadow:0 2px 5px #000;gap:7px}
.gy-life-screen strong{font:900 clamp(9px,1.8vmin,18px)/1.3 Georgia,serif;letter-spacing:.14em}
.gy-life-screen small{font:600 clamp(5px,.9vmin,11px) system-ui}
.gy-life-film:not([data-shot="family"]):not([data-shot="child"]):not([data-shot="answer"]):not([data-shot="phone"]) .gy-life-phone{display:none}
.gy-life-label{position:absolute;top:11%;width:100%;text-align:center;font:600 clamp(14px,2vw,25px) Georgia,serif;letter-spacing:.35em;color:#f5e0bd;text-shadow:0 2px 9px #000}
.gy-life-caption{position:absolute;left:8%;right:8%;bottom:7%;text-align:center;font:600 clamp(18px,2.8vw,37px)/1.6 "Malgun Gothic",system-ui;color:#fff9ee;text-shadow:0 2px 12px #000,0 0 22px #000a}
.gy-life-film[data-shot="phone"] .gy-life-caption{opacity:0}
.gy-life-film[data-shot="phone"] .gy-life-label{opacity:0}
.gy-life-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 52% 55%,transparent 15%,#060917aa 100%);pointer-events:none}
@keyframes gy-life-sun{to{transform:translate(3vw,-3vh);filter:brightness(1.12)}}
@keyframes gy-life-breathe{50%{translate:0 -.7vmin}}
@keyframes gy-life-dance{to{transform:rotate(-14deg) translateX(3vmin)}}
@media(prefers-reduced-motion:reduce){.gy-life-person,.gy-life-sun{animation:none}}
`;
export function createGyuwonLifeEpilogue(doc,shell,{onComplete=()=>{}}={}){
 const style=doc.createElement('style');style.textContent=stageCss;shell.appendChild(style);
 const layer=doc.createElement('div');layer.className='gy-life-film';layer.hidden=true;layer.setAttribute('aria-live','off');
 layer.innerHTML='<div class="gy-life-vista"><div class="gy-life-sun"></div><div class="gy-life-buildings"></div><div class="gy-life-school"></div><div class="gy-life-floor"></div><div class="gy-life-person"></div><div class="gy-life-person partner"></div><div class="gy-life-person child"></div><div class="gy-life-table"></div><div class="gy-life-phone"><div class="gy-life-screen"><strong>ODEN RING</strong><small>오든링 · 메인화면</small></div></div></div><div class="gy-life-vignette"></div><div class="gy-life-label"></div><div class="gy-life-caption"></div>';
 const label=layer.querySelector('.gy-life-label'),caption=layer.querySelector('.gy-life-caption'),phone=layer.querySelector('.gy-life-phone');
 shell.appendChild(layer);
 let time=0,active=false,ended=false,priorShot='';
 function start(){time=0;active=true;ended=false;priorShot='';layer.hidden=false;update(0);}
 function update(dt){
  if(!active||ended)return false;
  time+=Math.max(0,Math.min(.08,Number.isFinite(dt)?dt:0));
  const f=gyuwonLifeFrame(time);if(priorShot!==f.shot){layer.dataset.shot=f.shot;label.textContent=f.label;caption.textContent=f.line;priorShot=f.shot;}
  phone.style.setProperty('--zoom',String(1+f.zoom*13));
  if(f.complete){ended=true;active=false;onComplete();return true;}
  return false;
 }
 return {start,update,reset(){time=0;active=false;ended=false;layer.hidden=true;},dispose(){style.remove();layer.remove();},get active(){return active;},frame:()=>gyuwonLifeFrame(time)};
}
