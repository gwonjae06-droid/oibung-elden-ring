const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
// A casino die keeps its volume and edges: anticipation uses light and small rigid tremors.
export function diceMotion(d,time=0){
 const out={sy:1,sxz:1,glow:0,shake:0};
 if(!d||typeof d.state!=='string')return out;
 const clock=Number.isFinite(time)?time:0,t=Number.isFinite(d.t)?Math.max(0,d.t):0;
 if(d.state==='charge-warning'){
  const combo=Number.isFinite(d.chargeWarnTime),p=sat(t/(combo?d.chargeWarnTime:1.12));
  out.glow=(combo?.55:.35)*p*(.75+.25*Math.sin(clock*(combo?26:18)));
  out.shake=(combo?.045:.025)*p;
 }else if(d.state==='jump-warning'){
  const p=sat(t/1.3);out.glow=.3*p;out.shake=.025*p;
 }else if(['warning','frenzy-windup','pip-warning'].includes(d.state)){
  // Heavy casino dice remain solid and readable: a rising light in the
  // pips and a restrained rigid tremor instead of an arcade squash effect.
  const total=d.state==='pip-warning'?(d.pips?.warn||1.35):
   d.state==='frenzy-windup'?1.1:(d.warningTime||1.08);
  const p=sat(t/total),frenzy=d.state==='frenzy-windup';
  out.glow=(frenzy?.45:.28)*p;
  out.shake=(frenzy?.038:.018)*p*(.8+.2*Math.sin(clock*9));
 }else if(d.state==='charge')out.glow=.5;
 return out;
}
