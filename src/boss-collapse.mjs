const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export const COLLAPSE_DURATION=1.1;
export function collapsePose(elapsed){const u=sat((elapsed-.12)/.98),fall=u*u*(3-2*u);return {fall,roll:.9*fall,sink:-.6*fall,done:Number.isFinite(elapsed)&&elapsed>=COLLAPSE_DURATION};}
export function createCollapseClock(){let boss=null,time=0;return {step(next,dt,hidden=false){if(next!==boss){boss=next;time=0;}if(next?.state!=='dead'){time=0;return null;}if(!hidden)time+=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;return collapsePose(time);}};}
