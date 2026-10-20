export const CUES={bind:2,pull:3.4,enter:4.7,ready:8.2};
export const clamp=t=>Math.max(0,Math.min(1,t));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export function transitionPose(time){
 const t=Number.isFinite(time)?Math.max(0,time):0;
 const stage=t<CUES.bind?'declare':t<CUES.pull?'bind':t<CUES.enter?'pull':t<CUES.ready?'enter':'ready';
 return {stage,bind:smooth((t-CUES.bind)/(CUES.pull-CUES.bind)),pull:smooth((t-CUES.pull)/(CUES.enter-CUES.pull)),entry:smooth((t-CUES.enter)/(CUES.ready-CUES.enter)),title:clamp(t/.6)*(1-clamp((t-2.3)/1.1))};
}
export function shouldStartTransition(resultVisible,kicker){return Boolean(resultVisible)&&String(kicker).trim()==='승리';}
export function advanceTransition(time,dt,hidden=false){return hidden?time:time+Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));}
