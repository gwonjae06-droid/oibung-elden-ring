import {bloodTransformation} from './blood-transformation.mjs';
export function createBloodCinematicUi(shell,doc){
 const style=doc.createElement('style'),overlay=doc.createElement('div');
 style.textContent=`.blood-cinema{position:absolute;inset:0;z-index:39;pointer-events:none;border-top:6vh solid #080409;border-bottom:8vh solid #080409;box-sizing:border-box}.blood-cinema[hidden]{display:none}.blood-cinema p{position:absolute;bottom:7%;left:15%;width:70%;text-align:center;letter-spacing:.15em;font-family:serif;color:#edc9bb;text-shadow:0 2px 12px #000;font-size:clamp(16px,2.4vw,32px)}.blood-cinema small{display:block;font-size:.42em;letter-spacing:.36em;margin-bottom:12px;color:#bd9294}@media(max-width:600px){.blood-cinema p{left:7%;width:86%;bottom:10%}}`;
 overlay.className='blood-cinema';overlay.hidden=true;overlay.setAttribute('aria-live','polite');
 const title=doc.createElement('p'),kicker=doc.createElement('small'),text=doc.createTextNode('');title.append(kicker,text);overlay.append(title);shell.append(style,overlay);let stage=-1;
 return {update(g){const c=bloodTransformation(g);overlay.hidden=!c.active;const next=!c.active?-1:c.t<.6?0:c.t<1.8?1:c.t<2.6?2:c.t<3.8?3:4;
  if(stage!==next){stage=next;if(next>=0){kicker.textContent=['마지막 박동','마지막 기도','성당의 종','인간의 끝에서','영원한 피의 서약'][next];text.textContent=['…','내 피는, 나보다 오래 살아 있으리라.','죽음이여, 나를 기억하라.','피로 다시 태어나리라.','혈익의 대천사 배서준'][next];}}
  for(const id of ['player-hud','boss-hud','controls']){const el=shell.querySelector('#'+id);if(el)el.style.visibility=c.active?'hidden':'';}
 },dispose(){overlay.remove();style.remove();}};
}
