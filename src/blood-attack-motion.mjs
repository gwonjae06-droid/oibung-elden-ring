import {BLOOD_PATTERNS} from './blood-data.mjs';
import {BLOOD_WHIP} from './blood-whip.mjs';
import {poseAlpha} from './boss-animation-continuity.mjs';
import {smooth} from './blood-transformation.mjs';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const pulse=(x,w)=>Math.exp(-Math.pow(x/Math.max(.01,w),2));

// These are authored body-language silhouettes, not modifications to hitboxes.
// The two hand channels are always [left, right]. Values are dimensional poses
// rather than one-size-fits-all "cast" amplitudes.
export const BLOOD_ATTACK_GESTURES=Object.freeze({
 wave:    {style:'surge',       lean:.34,twist:0,    arms:[1.12,1.12],open:[.7,.7],elbow:[.22,.22],head:-.2,  wing:0,   fold:0,   sweep:0,   cape:.6},
 fountain:{style:'summon',      lean:-.24,twist:.08, arms:[1.72,1.48],open:[.9,.8],elbow:[-.42,-.3],head:-.3,wing:0,   fold:0,   sweep:0,   cape:.25},
 burst:   {style:'detonate',    lean:-.32,twist:0,   arms:[1.3,1.3],open:[1.2,1.2],elbow:[.6,.6],head:.25,wing:0,fold:0,sweep:0,cape:1},
 orbs:    {style:'throw',       lean:.25,twist:.2,   arms:[.22,1.8],open:[.2,.6],elbow:[.3,-.6],head:-.08,wing:0,fold:0,sweep:0,cape:.45},
 chain:   {style:'snare',       lean:.3,twist:-.3,   arms:[1.35,.18],open:[.65,.05],elbow:[-.75,.4],head:-.16,wing:0,fold:0,sweep:0,cape:.35},
 orbit:   {style:'spiral',      lean:-.12,twist:.68, arms:[1.55,.25],open:[.8,.65],elbow:[-.3,.3],head:-.1,wing:0,fold:0,sweep:0,cape:.8},
 vortex:  {style:'constrict',   lean:.42,twist:-.45, arms:[.6,1.4],open:[-.1,.3],elbow:[.85,.75],head:.24,wing:0,fold:0,sweep:0,cape:1},
 dive:    {style:'spear-dive',  lean:.65,twist:0,    arms:[1.55,1.55],open:[-.1,-.1],elbow:[-.45,-.45],head:-.23,wing:-.22,fold:.95,sweep:0,cape:1.2},
 eclipse: {style:'eclipse',     lean:-.28,twist:0,   arms:[1.5,1.5],open:[1,1],elbow:[-.3,-.3],head:-.42,wing:1,fold:-.2,sweep:0,cape:.55},
 rain:    {style:'rainmaker',   lean:-.16,twist:.14, arms:[1.75,1.75],open:[.85,.85],elbow:[-.5,-.5],head:-.37,wing:.58,fold:-.1,sweep:0,cape:.7},
 wing:    {style:'wing-scythe', lean:.32,twist:.75,  arms:[.4,1.1],open:[.65,1],elbow:[.2,-.3],head:-.2,wing:.7,fold:.12,sweep:1,cape:1.1},
 pulse:   {style:'heartbeat',   lean:-.34,twist:0,   arms:[.6,.6],open:[.1,.1],elbow:[1,1],head:.3,wing:.8,fold:-.15,sweep:0,cape:.9},
 pursuit: {style:'predator',    lean:.64,twist:-.2,  arms:[1.4,1.55],open:[-.15,-.15],elbow:[-.6,-.6],head:-.26,wing:-.26,fold:.86,sweep:.2,cape:1.25},
 tide:    {style:'blood-tide',  lean:-.12,twist:.44, arms:[1.5,1.5],open:[1.1,1.1],elbow:[-.4,-.4],head:-.33,wing:.95,fold:-.16,sweep:.3,cape:1.15},
 lances:  {style:'martyr-lances',lean:-.3,twist:.22,arms:[1.8,1.35],open:[.4,.9],elbow:[-.6,-.2],head:-.35,wing:0,fold:0,sweep:0,cape:.8},
 cross:   {style:'part-the-nave',lean:.2,twist:.5,arms:[1.6,1.6],open:[1.3,1.3],elbow:[.1,.1],head:-.15,wing:0,fold:0,sweep:0,cape:1},
 judgement:{style:'heavenly-execution',lean:.5,twist:-.6,arms:[1.9,.8],open:[.2,.8],elbow:[-.8,.5],head:-.3,wing:.9,fold:.2,sweep:.75,cape:1.3},
 ritual:  {style:'cathedral-consecration',lean:-.4,twist:.25,arms:[1.85,1.85],open:[1.25,1.25],elbow:[-.45,-.45],head:-.45,wing:1.3,fold:-.3,sweep:.2,cape:1.3},
 // Each profile interpolates through the original damage-marker envelopes.
 bloodScissors:{style:'sweeping-scissors',lean:.27,twist:.73,arms:[1.1,1.65],open:[.7,.9],elbow:[-.35,.45],head:-.18,wing:0,fold:0,sweep:0,cape:.95},
 heartCage:{style:'heart-cage',lean:-.22,twist:.24,arms:[1.65,1.65],open:[1.2,1.2],elbow:[-.4,-.4],head:-.3,wing:0,fold:0,sweep:0,cape:.8},
 wingShear:{style:'crossed-wings',lean:.43,twist:.83,arms:[.65,1.3],open:[.8,.8],elbow:[.16,-.3],head:-.2,wing:1,fold:.1,sweep:1.25,cape:1.15},
 rosary:{style:'rosary-procession',lean:-.25,twist:.35,arms:[1.4,1.7],open:[1.1,.85],elbow:[-.45,-.2],head:-.35,wing:.5,fold:0,sweep:.3,cape:1.0},
 reverseFlow:{style:'undertow',lean:-.3,twist:.4,arms:[.35,.35],open:[-.8,-.8],elbow:[.8,.8],head:.2,wing:0,fold:0,sweep:.4,cape:1.1},
 bloodStatues:{style:'sculptor',lean:-.23,twist:.5,arms:[1.7,1.35],open:[1.1,1.1],elbow:[-.6,.3],head:-.33,wing:0,fold:0,sweep:.6,cape:.8},
 wingGenesis:{style:'scarlet-unfurl',lean:-.42,twist:.16,arms:[1.6,1.6],open:[1,1],elbow:[-.55,-.55],head:-.4,wing:1.5,fold:-.5,sweep:1.15,cape:1.3},
 heartFeast:{style:'heart-sacrament',lean:-.35,twist:.15,arms:[1.8,1.8],open:[1.15,1.15],elbow:[-.45,-.45],head:-.45,wing:.9,fold:-.15,sweep:.4,cape:1.1},
 requiem:{style:'sea-requiem',lean:-.46,twist:.32,arms:[1.95,1.95],open:[1.3,1.3],elbow:[-.6,-.6],head:-.55,wing:1.48,fold:-.28,sweep:.52,cape:1.5},
});
// All keyframe envelopes share actual hazard warning times from combat state.
// Persistent marker snapshots are owned by the presentation controller because
// the combat engine removes expired hazard objects before the attack finishes.
const sortMarkers=(hazards,duration)=>{
 const out=(hazards||[]).map(h=>typeof h==='number'?h:h?.warn)
  .filter(t=>Number.isFinite(t)&&t>=0&&t<=duration+.05).sort((a,b)=>a-b);
 return out.filter((t,i)=>!i||Math.abs(t-out[i-1])>.035);
};
const idle=()=>({
 style:'idle',stage:'idle',weight:0,beatIndex:0,
 body:{lean:0,twist:0,roll:0,bob:0,chest:0},
 arms:[{raise:0,open:0,elbow:0,hand:0},{raise:0,open:0,elbow:0,hand:0}],
 head:{pitch:0,yaw:0,roll:0},
 wings:{lift:0,fold:0,sweep:0,curl:0,downbeat:0},
 cape:0,impact:0,anticipation:0,release:0,followThrough:0
});
function beatEnvelopes(elapsed,markers){
 let wind=0,release=0,follow=0,impact=0,index=0,closest=Infinity;
 for(let i=0;i<markers.length;i++){
  const at=markers[i],prior=i===0?0:markers[i-1];
  const lead=i===0?0:Math.min(at-.17,prior+.08);
  const enter=Math.max(lead+.025,at-.11);
  const before=smooth(lead,enter,elapsed)*(1-smooth(at-.10,at+.035,elapsed));
  const strike=smooth(at-.16,at+.06,elapsed)*(1-smooth(at+.12,at+.42,elapsed));
  const after=smooth(at+.025,at+.23,elapsed)*(1-smooth(at+.44,at+.88,elapsed));
  const hit=pulse(elapsed-at,.105);
  wind=Math.max(wind,before);release=Math.max(release,strike);
  follow=Math.max(follow,after);impact=Math.max(impact,hit);
  const distance=Math.abs(elapsed-at);
  if(distance<closest){closest=distance;index=i;}
 }
 return {wind:clamp(wind),release:clamp(release),follow:clamp(follow),impact:clamp(impact),index};
}
export function bloodAttackMotion(game,{markers=null}={}){
 const b=game?.boss,s=game?.blood,pose=idle();
 if(!b||!s||game.status!=='playing'||b.state==='dead')return pose;
 if(b.state==='transition'){
  const t=Math.max(0,s.t||0),grow=smooth(.75,2.3,t),unfurl=smooth(2.4,3.75,t);
  pose.style='transfiguration';pose.stage='transform';pose.weight=1;
  pose.body.lean=-.12*grow+.15*unfurl;pose.body.chest=.7*grow+.4*unfurl;
  pose.head.pitch=-.35*grow+.32*unfurl;
  pose.arms=[{raise:1.5*grow,open:.6*unfurl,elbow:-.4*grow,hand:0},{raise:1.5*grow,open:.6*unfurl,elbow:-.4*grow,hand:0}];
  pose.wings={lift:.8*unfurl,fold:.8*(1-unfurl),sweep:0,curl:-.24*unfurl,downbeat:pulse(t-3.55,.24)};
  pose.cape=.6*grow+.3*unfurl;
  return pose;
 }
 const spec=BLOOD_PATTERNS[s.pattern],profile=BLOOD_ATTACK_GESTURES[s.pattern];
 if(!spec||!profile)return pose;
 pose.style=profile.style;
 if(b.state==='recovery'){
  const remaining=clamp((s.recover||0)/Math.max(.001,spec.recover));
  const easing=smooth(0,.85,remaining);
  pose.stage='recover';pose.weight=.13*easing;
  pose.body.lean=profile.lean*.045*easing;
  pose.body.twist=profile.twist*.045*easing;
  pose.head.pitch=profile.head*.07*easing;
  pose.cape=profile.cape*.13*easing;
  return pose;
 }
 if(b.state!=='pattern')return pose;
 const elapsed=Math.max(0,Number.isFinite(s.t)?s.t:0);
 const liveMarkers=sortMarkers(s.hazards,spec.duration);
 const beats=sortMarkers(markers??liveMarkers,spec.duration);
 // The fallback is only used when a caller supplies a mid-attack snapshot
 // after combat has already retired every hazard. Real views cache actual warns.
 const times=beats.length?beats:[Math.min(1,spec.duration*.4)];
 const {wind,release,follow,impact,index}=beatEnvelopes(elapsed,times);
 const first=times[0],tail=1-smooth(Math.max(first+.35,spec.duration-.35),spec.duration,elapsed);
 const loaded=wind*tail,thrust=release*tail,aftermath=follow*tail,hit=impact*tail;
 const hold=.15*smooth(0,Math.max(.18,first*.65),elapsed)*(1-smooth(Math.max(first+.2,spec.duration-.65),spec.duration,elapsed));
 const a=clamp(loaded*.34+thrust*.92+aftermath*.52+hold);
 pose.stage=loaded>=Math.max(thrust,aftermath)?'windup':thrust>=aftermath?'release':'follow';
 pose.weight=a;pose.anticipation=loaded;pose.release=thrust;pose.followThrough=aftermath;
 pose.beatIndex=index;pose.impact=hit;
 const curlBack=loaded*.36,drive=thrust+.38*aftermath;
 const recoil=hit*(profile.lean>=0?.075:-.07);
 // Physically readable squash/stretch: reverse-lean before release,
 // a weighted snap into the damage frame and a small returning overshoot.
 pose.body.lean=profile.lean*(drive-curlBack)+recoil-profile.lean*aftermath*.12;
 pose.body.twist=profile.twist*(drive-loaded*.23)+Math.sin(elapsed*2.4)*hold*.065;
 pose.body.roll=profile.sweep*.14*(drive-loaded*.45);
 pose.body.chest=(profile.style==='heartbeat'?.75:.17)*loaded+
                 (profile.style==='detonate'?.48:.24)*thrust+hit*.12-aftermath*.06;
 pose.body.bob=(profile.style==='spear-dive'?-.21:profile.style==='summon'?.12:0)*drive
               +loaded*.045-aftermath*.035;
 pose.head.pitch=profile.head*(drive+loaded*.6)-hit*.07+aftermath*.06;
 pose.head.yaw=-profile.twist*(loaded*.14+drive*.23);
 pose.head.roll=-profile.sweep*.085*(drive-loaded*.4);
 pose.arms=profile.arms.map((raise,i)=>({
  raise:raise*(loaded*.51+thrust+aftermath*.57)+hit*.15,
  open:profile.open[i]*(loaded*.47+thrust+aftermath*.8),
  elbow:profile.elbow[i]*(loaded*.73+thrust*.85+aftermath*.51)-hit*.11,
  hand:(i===0?-1:1)*profile.twist*(thrust*.24+aftermath*.14)+hit*.25
 }));
 // A different hand leads on every legitimate sequential hazard. Do not
 // visually invent extra shots for hazards sharing the same warning instant.
 if(times.length>1){
  const sign=index%2===0?-1:1,leadArm=sign<0?0:1;
  const accent=hit*.42+thrust*.12;
  pose.arms[leadArm].raise+=accent;
  pose.arms[1-leadArm].raise-=accent*.24;
  pose.body.twist+=sign*hit*.095;
  pose.head.yaw+=sign*hit*.045;
 }
 if(s.pattern==='orbit')pose.body.twist+=Math.sin(elapsed*3.1)*a*.12;
 if(s.pattern==='wing'){
  // Counter-rotate the leading wing on windup, then slash as the cone fires.
  pose.wings.sweep=-loaded*.24+thrust*.95+aftermath*.35;
 }
 pose.wings.lift=profile.wing*(loaded*.52+thrust+aftermath*.71);
 pose.wings.fold=profile.fold*(loaded+thrust*.95+aftermath*.63);
 pose.wings.sweep+=(profile.sweep===0?0:profile.sweep*.08*thrust);
 pose.wings.curl=(profile.fold>.4?.52:-.17)*(loaded*.7+drive);
 pose.wings.downbeat=hit*(profile.wing!==0||profile.fold!==0?1:.27)+aftermath*.09;
 pose.cape=profile.cape*(loaded*.25+thrust*.54+aftermath*.96)+hit*.13;
 return pose;
}
// The warning is embodied by a real right-arm cock and release, not text
// or a free-floating attack that starts before the caster moves.
function layerBloodWhip(pose,whip){
 if(!whip)return pose;
 const charge=clamp(whip.age/BLOOD_WHIP.warning);
 const strike=clamp((whip.age-BLOOD_WHIP.warning)/BLOOD_WHIP.extension);
 const releasing=whip.age>=BLOOD_WHIP.warning;
 const intensity=releasing?1-.45*strike:charge;
 pose.style='blood-whip';pose.stage=releasing?'release':'windup';
 pose.weight=Math.max(pose.weight,.28+.72*intensity);
 pose.anticipation=Math.max(pose.anticipation,releasing?0:charge);
 pose.release=Math.max(pose.release,releasing?1-strike*.4:0);
 pose.body.twist+=-.31*intensity;
 pose.body.lean+=releasing?.18*(1-strike):-.16*charge;
 pose.arms[1].raise+=1.48*intensity;
 pose.arms[1].open+=.56*intensity;
 pose.arms[1].elbow-=.51*intensity;
 pose.arms[0].raise+=.19*intensity;
 pose.head.yaw+=.11*intensity;pose.cape+=.22*intensity;
 return pose;
}
const blendNumber=(from,to,alpha)=>from+(to-from)*alpha;
const blendObject=(from,to,alpha)=>Object.fromEntries(Object.keys(to).map(key=>[key,blendNumber(from?.[key]??0,to[key],alpha)]));
/**
 * Render-only continuity. It retains the original warning schedule even after
 * combat prunes its hazard objects, and smooths keyframe transitions without
 * touching simulation state or introducing a separate wall-clock timer.
 */
export function createBloodMotionDirector(){
 let previous=null,pattern=null,markers=null,lastClock=null,lastPatternTime=null;
 function reset(){previous=null;pattern=null;markers=null;lastClock=null;lastPatternTime=null;}
 function update(g,dt){
  const s=g?.blood,b=g?.boss;
  const clock=g?.time??0,validDt=Number.isFinite(dt)?clamp(dt,0,.1):0;
  if(lastClock!==null&&clock<lastClock-.001)reset();
  lastClock=clock;
  if(b?.state==='pattern'&&s){
   const key=b.phase+':'+s.pattern;
   const restarted=key!==pattern||(lastPatternTime!==null&&s.t<lastPatternTime-.001);
   if(restarted){pattern=key;markers=null;}
   if(!markers||!markers.length){
    const spec=BLOOD_PATTERNS[s.pattern];
    if(spec)markers=sortMarkers(s.hazards,spec.duration);
   }
   lastPatternTime=s.t;
  }else if(b?.state==='transition'){
   pattern=null;markers=null;lastPatternTime=null;
  }
  const next=layerBloodWhip(bloodAttackMotion(g,{markers}),s?.whip);
  if(!previous){previous=next;return next;}
  if(validDt===0)return previous;
  // Quicker on strikes, slower in follow-through and recovery. No overshoot
  // is accumulated at pause, so frame-rate variance cannot amplify recoil.
  const rate=next.impact>.35?27:next.release>.18?19:next.anticipation>.25?11:8;
  const alpha=poseAlpha(rate,validDt);
  const out={...next,weight:blendNumber(previous.weight,next.weight,alpha),
   body:blendObject(previous.body,next.body,alpha),
   arms:next.arms.map((a,i)=>blendObject(previous.arms?.[i],a,alpha)),
   head:blendObject(previous.head,next.head,alpha),
   wings:blendObject(previous.wings,next.wings,alpha),
   cape:blendNumber(previous.cape,next.cape,alpha)};
  previous=out;return out;
 }
 return {update,reset};
}
