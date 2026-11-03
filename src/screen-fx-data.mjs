const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const LOW_START=.4;
export const LOW_FULL=.15;
export const HEAL_MIN=15;
export const HEAL_TIME=.7;
export function hpRatio(hp,max){return Number.isFinite(hp)&&Number.isFinite(max)&&max>0?clamp(hp/max,0,1):1;}
export function lowHealthLevel(ratio){const r=Number.isFinite(ratio)?clamp(ratio,0,1):1;return clamp((LOW_START-r)/(LOW_START-LOW_FULL),0,1);}
export function heartbeat(time,level){if(!(level>0))return 0;const rate=1.1+level*1.5,x=Math.sin(Math.PI*2*rate*(Number.isFinite(time)?time:0));return .3+.7*Math.pow(Math.max(0,x),4);}
export function healGain(prev,hp,max){return Number.isFinite(prev)&&Number.isFinite(hp)&&Number.isFinite(max)&&prev>0&&hp-prev>=HEAL_MIN&&hp<=max+1e-9;}
export function healFade(since,now){const t=(now-since)/1000;return Number.isFinite(t)&&t>=0&&t<HEAL_TIME?1-t/HEAL_TIME:0;}
