import {annualDisplay} from './gyuwon-annual-progress.mjs';
import {gyuwonYearTitle} from './gyuwon-years.mjs';

// Diegetic time/identity/grade display, no instructions or attack text.
export function createGyuwonYearsHud(doc,shell){
 const style=doc.createElement('style');style.textContent="\n.gy-dday{position:absolute;z-index:24;top:12px;left:50%;transform:translateX(-50%);pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:230px}\n.gy-dday-clock{font:800 clamp(18px,2.7vw,33px)/1.15 Consolas,'Courier New',monospace;padding:8px 20px 7px;border:2px solid rgba(188,227,224,.57);border-radius:8px;color:#bff8e7;letter-spacing:.075em;background:linear-gradient(165deg,#131c23f2,#080e14ef);box-shadow:inset 0 0 16px #0f76634a,0 5px 24px #000a,0 0 11px #89dbbd3c;text-shadow:0 0 10px #9bf7d08c;white-space:nowrap;font-variant-numeric:tabular-nums}\n.gy-dday-subject{color:#fff6db;background:#121920d9;padding:4px 13px;border-radius:16px;font:600 13px/1.3 system-ui,sans-serif;letter-spacing:.09em}\n.gy-dday-center{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);pointer-events:none;z-index:30;text-align:center;white-space:nowrap;font-family:system-ui,sans-serif}\n.gy-dday-hero{font-weight:950;font-size:clamp(44px,7vw,103px);letter-spacing:.06em;color:#eaf5f1;text-shadow:0 5px 9px #000b,0 0 30px #8ffed0a6;animation:gy-dday-enter 1s ease both}\n.gy-dday-hero.great{color:#ffe09a;text-shadow:0 3px 6px #000b,0 0 43px #ffcf5e}\n.gy-dday-hero.normal{color:#c2e6f1;text-shadow:0 3px 6px #000b,0 0 30px #98cef8}\n.gy-dday-hero.failure{color:#ec8194;text-shadow:0 3px 6px #000b,0 0 30px #b71943}\n@keyframes gy-dday-enter{0%{opacity:0;transform:scale(.64);filter:blur(5px)}30%{opacity:1;transform:scale(1.09);filter:blur(0)}100%{opacity:1;transform:scale(1);filter:blur(0)}}\n.gy-dday-chat{position:absolute;right:14px;top:24%;width:min(236px,21vw);border:1px solid #8591a88c;border-radius:12px;background:#090d18a9;z-index:23;pointer-events:none;padding:12px;color:#d9eeff;font:600 12px/1.35 system-ui,sans-serif;box-shadow:0 6px 19px #0009;backdrop-filter:blur(7px)}\n.gy-dday-chat-head{border-bottom:1px solid #bbc6e142;margin-bottom:8px;padding-bottom:6px;color:#b9d6ec;letter-spacing:.11em}\n.gy-dday-chat-line{margin:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.gy-dday-chat-line:nth-child(odd){color:#8ff0bd}\n@media(max-width:650px){.gy-dday{top:7px;min-width:0}.gy-dday-clock{font-size:17px;padding:4px 11px}.gy-dday-subject{font-size:10px;padding:2px 8px}.gy-dday-center{top:40%}.gy-dday-chat{right:5px;top:21%;width:120px;padding:6px;font-size:10px}.gy-dday-chat-head{margin-bottom:3px}}\n";shell.appendChild(style);
 style.textContent+='\n.gy-dday-clock{position:relative}.gy-dday-clock:before{content:attr(data-echo);position:absolute;inset:6px 0;opacity:.13;transform:translate(4px,-3px);pointer-events:none}.gy-dday-clock.gy-dday-pressure{color:#fff5c6;border-color:#efbf76;box-shadow:inset 0 0 18px #d78b4966,0 0 19px #e9a64e91;text-shadow:0 0 13px #ffe9a1}';
 const clock=doc.createElement('div');clock.className='gy-dday';
 const readout=doc.createElement('div');readout.className='gy-dday-clock';
 const subject=doc.createElement('div');subject.className='gy-dday-subject';
 clock.append(readout,subject);
 const center=doc.createElement('div');center.className='gy-dday-center';
 const hero=doc.createElement('div');hero.className='gy-dday-hero';center.appendChild(hero);
 const chat=doc.createElement('div');chat.className='gy-dday-chat';
 const chatHead=doc.createElement('div');chatHead.className='gy-dday-chat-head';chatHead.textContent='LIVE · 실시간 채팅';
 chat.appendChild(chatHead);const chatRows=Array.from({length:5},()=>{const el=doc.createElement('div');el.className='gy-dday-chat-line';chat.appendChild(el);return el;});
 shell.append(clock,center,chat);
 let previous='';
 const viewers=['규원님 오늘도 응원해요','와 춤 실화냐','후원 리액션 가자','수능 화이팅','방송 텐션 미쳤다','1000원 후원!','오늘 클립 땄어요','ㅋㅋㅋㅋㅋㅋㅋ'];
 function update(g){
  const e=g?.gyuwon?.years;
  if(!e||g.status!=='playing'){clock.hidden=center.hidden=chat.hidden=true;return;}
  clock.hidden=false;readout.classList.toggle('gy-dday-pressure',e.mode==='combat'&&g.time-(e.lastPressureAt??-1000)<.22);const visual=annualDisplay(g);if(readout.dataset)readout.dataset.echo=visual.echo===null?'':String(visual.echo);if(readout.style)readout.style.opacity=String(1-visual.glitch*.2);const value=e.mode==='exam'?'수능 당일':e.mode==='result'?'채점 완료':'수능까지 D-'+visual.day;
  if(readout.textContent!==value)readout.textContent=value;
  const detail=e.mode==='exam'?e.subjectLabel:gyuwonYearTitle(e.year);
  if(subject.textContent!==detail)subject.textContent=detail;
  const selected=e.mode==='result'
   ?{great:'수능 대성공',normal:'수능 평타',failure:'수능 폭망'}[e.grade]
   :g.time<e.bannerUntil?gyuwonYearTitle(e.year):'';
  center.hidden=!selected;
  const cls=e.mode==='result'?e.grade:'';
  if(selected&&previous!==selected+cls){hero.textContent=selected;hero.className='gy-dday-hero '+cls;
   hero.style.animation='none';void hero.offsetWidth;hero.style.animation='';previous=selected+cls;}
  chat.hidden=e.year!==7||e.mode!=='combat';
  if(!chat.hidden){
   const shift=Math.floor(g.time/1.55);const messages=viewers.slice();
   if(e.cast==='donation')messages.unshift('5,000원 후원 감사합니다!');
   for(let i=0;i<chatRows.length;i++){
    const message=messages[(shift+i)%messages.length];
    if(chatRows[i].textContent!==message)chatRows[i].textContent=message;
   }
  }
 }
 return {update,dispose(){style.remove();clock.remove();center.remove();chat.remove();}};
}
