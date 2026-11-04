// Pure animation curves. Combat hitboxes and hazard timing remain authoritative.
// Values are derived from the current pattern so pause, retry and replay are deterministic.
const clamp01=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
const ease=value=>{const t=clamp01(value);return t*t*(3-2*t);};
export function giantHandGesture(state,index){
 const feral=state?.temperament==='feral',disabled=Boolean(state?.destroyed?.[index]||state?.revive?.[index]>0);
 const idle={anticipation:0,impact:0,followThrough:0,curl:disabled?0:feral?.67:.07,wristPitch:0,wristYaw:0,wristRoll:0,elbowLift:0,elbowOut:0};
 if(!state||disabled||state.state!=='attack')return idle;
 let selected=null,nearest=Infinity;
 for(const hazard of state.hazards||[]){
  if(hazard.handIndex!==index||hazard.cancelled||hazard.headSlam)continue;
  const age=state.t-hazard.start,warning=hazard.warn,active=hazard.active;
  if(!Number.isFinite(age)||!(warning>0)||age<-.55||age>warning+active+.45)continue;
  const distance=Math.abs(age-warning);
  if(distance<nearest){nearest=distance;selected={age,warning,active};}
 }
 if(!selected)return idle;
 const {age,warning,active}=selected;
 const anticipation=ease((age+.55)/(warning+.43))*(1-ease((age-warning+.12)/.22));
 const impact=ease((age-warning+.1)/.12)*(1-ease((age-warning)/.3));
 const followThrough=ease((age-warning+.06)/.16)*(1-ease((age-warning-active)/.4));
 const force=feral?1.22:1;
 return {
  anticipation,impact,followThrough,
  curl:clamp01((feral?.6:.12)+anticipation*.48+followThrough*.45),
  wristPitch:force*(-.35*anticipation+.46*followThrough+.17*impact),
  wristYaw:(index?1:-1)*force*(.1*anticipation-.12*followThrough),
  wristRoll:(index?1:-1)*force*(.18*anticipation+.27*followThrough),
  elbowLift:force*(3.5*anticipation+1.4*followThrough),
  elbowOut:force*(2.6*anticipation+2*followThrough)
 };
}
// A visual pulse only after the same authoritative moment that causes damage.
// This does not create a second hit, damage window or wider warning area.
export function giantHeadImpactPulse(hazard){
 if(!hazard?.headSlam||!(hazard.warn>0)||!Number.isFinite(hazard.age)||hazard.age<hazard.warn)return 0;
 return 1-ease((hazard.age-hazard.warn)/Math.min(.44,Math.max(.12,hazard.active)));
}
