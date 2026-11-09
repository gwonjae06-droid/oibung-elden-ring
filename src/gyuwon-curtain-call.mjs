// A continuous, non-combat curtain call for the last original musical song.
// Time is read from the original audio; no timer or enemy can end this act.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
export const GYUWON_CURTAIN_CREDITS_START=.52;
export const GYUWON_CURTAIN_CAST=Object.freeze([
 Object.freeze({id:'kwon',name:'이권재',part:'거미',start:0,end:.1,
  scenes:Object.freeze([
   {phase:1,prop:'sword',response:'dodge'},
   {phase:2,prop:'jaw',response:'close'},
   {phase:3,prop:'moon',response:'roll'}])}),
 Object.freeze({id:'oslu',name:'오슬우',part:'광대',start:.1,end:.2,
  scenes:Object.freeze([
   {phase:1,prop:'circus',response:'roll'},
   {phase:2,prop:'puppets',response:'guard'},
   {phase:3,prop:'spotlight',response:'bow'}])}),
 Object.freeze({id:'sungwon',name:'박성원',part:'주사위',start:.2,end:.3,
  scenes:Object.freeze([
   {phase:1,prop:'die',response:'dodge'},
   {phase:2,prop:'roulette',response:'guard'},
   {phase:3,prop:'table',response:'strike'}])}),
 Object.freeze({id:'baeseojun',name:'배서준',part:'혈왕',start:.3,end:.4,
  scenes:Object.freeze([
   {phase:1,prop:'wave',response:'roll'},
   {phase:2,prop:'wings',response:'guard'},
   {phase:3,prop:'halo',response:'bow'}])}),
 Object.freeze({id:'gyuwon',name:'최규원',part:'수험생',start:.4,end:.52,
  scenes:Object.freeze([
   {phase:1,prop:'exam',response:'pause'},
   {phase:2,prop:'years',response:'stand'},
   {phase:3,prop:'theater',response:'bow'}])})
]);
export const GYUWON_FINALE_CREDITS=Object.freeze([
 'ODEN RING','THE GREATEST SHOW OF MY LIFE','마지막 무대 · 11수',
 '거미의 검과 갈라진 달','광대의 서커스와 멈춘 박수',
 '주사위의 선택과 뒤집힌 운명','혈왕의 붉은 바다와 날개',
 '끝없이 이어진 시험지','그리고 그 모든 순간을 지나온 플레이어',
 'CAST CURTAIN CALL','THE END OF THE ELEVENTH ACT',
 '끝까지 함께해 주셔서 감사합니다'
]);
export const GYUWON_END_DEDICATION=Object.freeze([
 '거미 배역 이권재',
 '광대 배역 오슬우',
 '주사위 배역 박성원',
 '혈왕 배역 배서준',
 '수험생 최규원',
 '이 게임을 최규원의 27수능에 바칩니다',
 '규원아 수능 응원한다'
]);
// One line at a time, fading on actual end-song audio time.
export function gyuwonDedicationAt(time){
 const t=Math.max(0,Number.isFinite(time)?time:0);
 const interval=10,begin=3,slot=Math.floor((t-begin)/interval);
 if(slot<0||slot>=GYUWON_END_DEDICATION.length)return null;
 const local=t-begin-slot*interval;
 const enter=clamp(local/1.6),leave=clamp((interval-local)/1.8);
 return {index:slot,line:GYUWON_END_DEDICATION[slot],opacity:Math.min(enter,leave)};
}
export function gyuwonCurtainCallAt(time,duration=180){
 const d=Number.isFinite(duration)&&duration>0?duration:180;
 const progress=clamp(time/d);
 if(progress>=GYUWON_CURTAIN_CREDITS_START){
  const t=clamp((progress-GYUWON_CURTAIN_CREDITS_START)/(1-GYUWON_CURTAIN_CREDITS_START));
  return {mode:'credits',progress,creditsProgress:t,actorIndex:-1,phase:0,response:'bow',beat:0};
 }
 const actorIndex=GYUWON_CURTAIN_CAST.findIndex((a,i)=>progress>=a.start&&progress<a.end);
 const index=Math.max(0,actorIndex);
 const actor=GYUWON_CURTAIN_CAST[index];
 const local=clamp((progress-actor.start)/(actor.end-actor.start));
 const phaseIndex=Math.min(actor.scenes.length-1,Math.floor(local*actor.scenes.length));
 const beat=local*actor.scenes.length-phaseIndex;
 return {mode:'recollection',progress,actorIndex:index,phase:phaseIndex+1,
  actor:actor.id,name:actor.name,part:actor.part,
  prop:actor.scenes[phaseIndex].prop,response:actor.scenes[phaseIndex].response,
  beat,creditsProgress:0};
}
export function isGyuwonCurtainCall(m){
 return Boolean(m&&m.year===11&&m.kind==='finale'&&!m.finishing);
}
