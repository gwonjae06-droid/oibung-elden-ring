const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const ease=v=>{const t=sat(v);return t*t*(3-2*t);};
export function chainPose(bind,pull=0){const b=sat(bind),p=b>=1?ease(pull):0;return {reach:ease(b/.24),wraps:Array.from({length:4},(_,i)=>sat((b-.24-i*.16)/.16)),pull:p,tension:ease((b-.88)/.12)};}
export function screenChainPose(bind,pull=0,index=0,count=48){const q=chainPose(bind,pull),delay=(index%7)*.035,reach=ease((sat(bind)-delay)/.72);return {x:(index+.5)/Math.max(1,count),reach,pull:q.pull,tension:q.tension,opacity:1-ease((q.pull-.84)/.16),offset:120*q.pull};}
