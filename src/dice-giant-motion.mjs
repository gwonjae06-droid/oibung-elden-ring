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

const lerp=(a,b,u)=>a+(b-a)*u;
const finite=v=>Number.isFinite(v)?v:0;
export function giantThrowTimeline(state,h){
 if(!state||!h||!(h.warn>0))return null;
 const index=h.handIndex,impact=h.start+h.warn;
 // Real multi-second ballistic flight, not the former 0.11-second blur.
 // Schedule pickup after the previous release, not after its projectile lands:
 // several objects may be in flight while only one is held by each hand.
 const flight=Math.min(h.flightSeconds??.11,Math.max(.11,h.warn-.25));
 const preceding=(state.hazards||[]).filter(q=>q!==h&&q.handIndex===index&&!q.cancelled&&q.start<h.start)
  .reduce((latest,q)=>{
   const duration=Math.min(q.flightSeconds??.11,Math.max(.11,q.warn-.25));
   return Math.max(latest,q.start+q.warn-duration+.025);
  },0);
 const plannedRelease=impact-flight;
 const ready=Math.min(plannedRelease-.13,Math.max(h.start,preceding));
 const release=Math.max(ready+.13,plannedRelease);
 const pickupEnd=ready+Math.min(.19,(release-ready)*.31);
 return {ready,pickupEnd,release,impact,age:state.t-h.start,phase:state.t<ready?'rest':state.t<pickupEnd?'pickup':state.t<release?'grip':state.t<impact?'flight':'impact'};
}
// Smooth critically-damped spring, independent of frame rate and safe across pattern changes.
// Simulated hand position and the attackable palm collider use the same spring result.
export function giantSpringStep(position,velocity,target,dt,frequency=14){
 const x=finite(position)-finite(target),v=finite(velocity),h=Math.max(0,Math.min(.1,finite(dt))),w=Math.max(1,frequency);
 const ex=Math.exp(-w*h),temp=(v+w*x)*h;
 return {position:finite(target)+(x+temp)*ex,velocity:(v-w*temp)*ex};
}
// The hand picks the physical object off the table, grips it until release,
// and then its *captured* palm origin defines a ballistic flight to the real impact centre.
export function giantThrownPropPose(state,h,type,grip,launch){
 const timing=giantThrowTimeline(state,h);if(!timing)return null;
 const side=h.handIndex===1?-1:1,restX=h.handIndex===1?22:-22,restZ=-64;
 const from={x:restX+side*3,y:1.9,z:restZ+9};
 if(state.t<timing.ready||state.t>=timing.impact||h.cancelled)return {visible:false,phase:timing.phase};
 const current=grip||from;
 if(state.t<timing.pickupEnd){
  const a=ease((state.t-timing.ready)/Math.max(.01,timing.pickupEnd-timing.ready));
  return {visible:true,phase:'pickup',x:lerp(from.x,current.x,a),y:lerp(from.y,current.y,a),z:lerp(from.z,current.z,a),spin:0,flight:0,blend:a};
 }
 if(state.t<timing.release)return {visible:true,phase:'grip',x:current.x,y:current.y,z:current.z,spin:0,flight:0};
 const start=launch||current,u=clamp01((state.t-timing.release)/(timing.impact-timing.release));
 const travel=Math.hypot(h.x-start.x,h.z-start.z),height=Math.min(19,Math.max(type==='chess'?7:5,travel*.19));
 const spin=(type==='coin'?Math.PI*4:type==='dice'?Math.PI*2.5:type==='chip'?Math.PI*1.8:Math.PI)*u;
 // Smooth horizontal acceleration/deceleration and a visibly arcing descent.
 // Both endpoints are identical to the gameplay's actual launch/impact.
 const flight=ease(u);
 return {visible:true,phase:'flight',x:lerp(start.x,h.x,flight),y:lerp(start.y,Math.max(1.4,type==='chess'?4:2),u)+Math.sin(u*Math.PI)*height,z:lerp(start.z,h.z,flight),spin,flight:u};
}
// Grip -> shoulder wind-up -> release -> recoil. Pure curves; the hand collider uses
// giantHandPose (same positional trajectory), while wrist and fingers follow this gesture.
export function giantThrowGesture(state,h){
 const t=giantThrowTimeline(state,h),idle={anticipation:0,impact:0,followThrough:0,curl:0,wristPitch:0,wristYaw:0,wristRoll:0,elbowLift:0,elbowOut:0,release:0};
 if(!t||t.phase==='rest'||t.phase==='impact')return idle;
 const pickup=ease((state.t-t.ready)/Math.max(.01,t.pickupEnd-t.ready));
 const wind=ease((state.t-t.pickupEnd)/Math.max(.01,t.release-t.pickupEnd));
 const flick=ease((state.t-t.release+.11)/.11);
 const opened=ease((state.t-t.release)/.09);
 const recoil=ease((state.t-t.release)/.32);
 const settle=1-ease((state.t-t.release)/Math.max(.18,t.impact-t.release));
 const side=h.handIndex===1?-1:1,force=state.temperament==='feral'?1.2:1;
 return {anticipation:wind*settle*(1-flick),impact:flick*(1-recoil),followThrough:recoil*settle,
  curl:clamp01((.87*pickup+.16*wind)*(1-opened))*settle,release:opened,
  wristPitch:force*(-.40*wind*settle+.79*flick*(1-recoil)),
  wristYaw:side*force*(.23*wind*settle-.30*flick*(1-recoil)),
  wristRoll:side*force*(.22*wind*settle+.17*flick*(1-recoil)),
  elbowLift:force*(2.5*wind*settle+1.7*flick*(1-recoil)),elbowOut:force*(1.5*settle+2.4*wind*settle)};
}

export function giantFeralHeadMotion(state){
 if(!state||state.state!=='attack'||state.temperament!=='feral')return null;
 let lean=0,weight=0,x=0,z=-106,bodyX=0;
 for(const h of state.hazards||[]){
  if(!h.headSlam||h.cancelled)continue;
  const age=state.t-h.start,rapid=Boolean(h.rapid),lead=rapid?.28:.35,tail=rapid?.25:.65;
  if(age< -lead||age>h.warn+h.active+tail)continue;
  const dropTime=rapid?.10:.14,drop0=h.warn-dropTime;
  const wind=ease((age+(rapid?.28:0))/Math.max(.25,drop0+(rapid?.28:0)));
  const drop=ease((age-drop0)/dropTime);
  const withdraw=ease((age-h.warn-h.active)/(rapid?.24:.62));
  const k=(.40*wind+.60*drop)*(1-withdraw);
  const mass=(.32*wind*(1-drop)+.86*drop)*(1-withdraw);
  lean+=k;weight+=mass;x+=h.x*k;z+=(h.z+106)*k;bodyX+=h.x*.65*k;
 }
 // The 5-hit sequence's initial trembling smoothly gives way to the first wind-up.
 const tremor=state.slot===7?ease(state.t/.65)*(1-ease((state.t-.72)/.55)):0;
 if(lean<.00001&&tremor<.00001)return null;
 const shake=Math.sin(state.t*76)*.85*tremor,poseLean=clamp01(lean);
 return {lean:poseLean+.13*tremor*(1-poseLean),weight:clamp01(weight),
  bodyX:Math.max(-27,Math.min(27,bodyX+shake*.6)),
  x:Math.max(-28,Math.min(28,x+shake*2)),
  y:58-51*poseLean+Math.sin(state.t*98)*1.25*tremor,
  z:Math.max(-106,Math.min(-30,z+Math.cos(state.t*70)*1.2*tremor))};
}
