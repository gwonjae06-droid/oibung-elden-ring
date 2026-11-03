import {PATTERNS,patternConfig} from './combat.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(Number.isFinite(t)?t:0,0,1);return t*t*(3-2*t);};
const ZERO={lean:0,sink:0,sway:0};
export const MOTION_STYLE={
 sweep:[{lean:-.06,sink:-.1,sway:-.08},{lean:.08,sink:0,sway:.1}],
 reverse:[{lean:-.05,sink:-.1,sway:.08},{lean:.08,sink:0,sway:-.1}],
 thrust:[{lean:-.18,sink:-.3,sway:0},{lean:.2,sink:-.1,sway:0}],
 slam:[{lean:-.25,sink:.15,sway:0},{lean:.22,sink:-.5,sway:0}],
 cross:[{lean:-.05,sink:-.15,sway:-.1},{lean:.1,sink:-.05,sway:.12}],
 leap:[{lean:-.1,sink:-.6,sway:0},{lean:.1,sink:.3,sway:0}],
 whirl:[{lean:-.05,sink:-.2,sway:-.12},{lean:0,sink:-.05,sway:.12}],
 rise:[{lean:.1,sink:-.4,sway:0},{lean:-.2,sink:.25,sway:0}],
 jab:[{lean:-.06,sink:-.1,sway:0},{lean:.12,sink:-.05,sway:0}],
 rush:[{lean:.05,sink:-.55,sway:0},{lean:.25,sink:-.35,sway:0}],
 retreat:[{lean:-.1,sink:-.2,sway:.04},{lean:-.18,sink:-.1,sway:-.04}],
 wave:[{lean:-.12,sink:.1,sway:0},{lean:.12,sink:-.05,sway:0}],
 stomp:[{lean:-.12,sink:.25,sway:0},{lean:.1,sink:-.4,sway:0}],
 backsweep:[{lean:-.05,sink:-.1,sway:.1},{lean:.05,sink:0,sway:-.14}],
 shove:[{lean:-.1,sink:-.15,sway:0},{lean:.15,sink:-.05,sway:0}]
};
const mix=(a,b,t)=>({lean:a.lean+(b.lean-a.lean)*t,sink:a.sink+(b.sink-a.sink)*t,sway:a.sway+(b.sway-a.sway)*t});
export function bossMotion(b){
 if(!b||b.state==='dead'||b.state==='transition')return {...ZERO};
 const t=Number.isFinite(b.t)?Math.max(0,b.t):0;
 if(b.state==='stagger'){const k=ease(t/.2);return {lean:-.14*k,sink:-.15*k,sway:Math.sin(t*30)*.04};}
 if(b.stun>0)return {lean:-.05,sink:-.1,sway:Math.sin(t*40)*.05};
 const s=MOTION_STYLE[b.pattern];
 if(!s||!PATTERNS[b.pattern]||!['windup','active','recovery'].includes(b.state))return {...ZERO};
 const cfg=patternConfig(b),power=b.phase===2?1.2:1;
 let m;
 if(b.state==='windup')m=mix(ZERO,s[0],ease(t/cfg.wind));
 else if(b.state==='active')m=mix(s[0],s[1],ease(t/cfg.active));
 else if(b.queue&&b.queue.length)m=s[1];
 else m=mix(s[1],ZERO,ease(t/Math.max(.01,b.recovery||cfg.recover)));
 return {lean:clamp(m.lean*power,-.35,.35),sink:clamp(m.sink*power,-.8,.5),sway:clamp(m.sway*power,-.2,.2)};
}
