const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
// A casino die keeps its volume and edges: anticipation uses light and small rigid tremors.
export function diceMotion(d,time=0){
 const out={sy:1,sxz:1,glow:0,shake:0};
 if(!d||typeof d.state!=='string')return out;
 const clock=Number.isFinite(time)?time:0,t=Number.isFinite(d.t)?Math.max(0,d.t):0;
 if(d.state==='charge-warning'){
  const combo=Number.isFinite(d.chargeWarnTime),p=sat(t/(combo?d.chargeWarnTime:.9));
  out.glow=(combo?.55:.35)*p*(.75+.25*Math.sin(clock*(combo?26:18)));
  out.shake=(combo?.045:.025)*p;
 }else if(d.state==='jump-warning'){
  const p=sat(t/1.1);out.glow=.3*p;out.shake=.02*p;
 }else if(d.state==='charge')out.glow=.5;
 return out;
}
