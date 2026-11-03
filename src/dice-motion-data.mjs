const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const ease=v=>{const t=sat(v);return t*t*(3-2*t);};
export function diceMotion(d,time=0){
 const out={sy:1,sxz:1,glow:0,shake:0};
 if(!d||typeof d.state!=='string')return out;
 const clock=Number.isFinite(time)?time:0,t=Number.isFinite(d.t)?Math.max(0,d.t):0;
 if(d.state==='charge-warning'){
  const combo=Number.isFinite(d.chargeWarnTime),p=sat(t/(combo?d.chargeWarnTime:.9));
  out.sy=1-.07*ease(p);out.sxz=1+.035*ease(p);
  out.glow=(combo?.55:.35)*p*(.75+.25*Math.sin(clock*(combo?26:18)));
  out.shake=(combo?.19:.12)*p;
 }else if(d.state==='jump-warning'){
  const p=sat(t/1.1);out.sy=1-.09*ease(p);out.sxz=1+.045*ease(p);out.glow=.3*p;out.shake=.1*p;
 }else if(d.state==='charge'){
  out.glow=.5;
 }else if(d.state==='recovery'){
  const q=sat(t/.45),w=Math.sin(q*Math.PI*3)*(1-q);out.sy=1+.05*w;out.sxz=1-.025*w;
 }
 return out;
}
