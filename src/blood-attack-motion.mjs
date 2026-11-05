import {BLOOD_PATTERNS} from './blood-data.mjs';
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
});
const idle=()=>({
 style:'idle',weight:0,body:{lean:0,twist:0,roll:0,bob:0,chest:0},
 arms:[{raise:0,open:0,elbow:0,hand:0},{raise:0,open:0,elbow:0,hand:0}],
 head:{pitch:0,yaw:0,roll:0},wings:{lift:0,fold:0,sweep:0,curl:0,downbeat:0},
 cape:0,impact:0,anticipation:0
});
export function bloodAttackMotion(game){
 const b=game?.boss,s=game?.blood;
 const pose=idle();
 if(!b||!s||game.status!=='playing'||b.state==='dead')return pose;
 if(b.state==='transition'){
  const t=Math.max(0,s.t||0),grow=smooth(.75,2.3,t),unfurl=smooth(2.4,3.75,t);
  pose.style='transfiguration';pose.weight=1;
  pose.body.lean=-.12*grow+.15*unfurl;pose.body.chest=.7*grow+.4*unfurl;
  pose.head.pitch=-.35*grow+.32*unfurl;
  pose.arms=[{raise:1.5*grow,open:.6*unfurl,elbow:-.4*grow,hand:0},{raise:1.5*grow,open:.6*unfurl,elbow:-.4*grow,hand:0}];
  pose.wings={lift:.8*unfurl,fold:.8*(1-unfurl),sweep:0,curl:-.24*unfurl,downbeat:pulse(t-3.55,.24)};
  pose.cape=.6*grow+.3*unfurl;
  return pose;
 }
 const spec=BLOOD_PATTERNS[s.pattern],profile=BLOOD_ATTACK_GESTURES[s.pattern];
 if(!spec||!profile)return pose;
 const elapsed=Math.max(0,s.t||0),active=b.state==='pattern';
 let prep=0,attack=0,impact=0,rhythm=0;
 if(active){
  const hazards=s.hazards||[];
  const first=hazards.length?Math.min(...hazards.map(h=>h.warn)):Math.min(1,spec.duration*.45);
  prep=smooth(0,Math.max(.2,first*.82),elapsed);
  attack=smooth(Math.max(.02,first-.12),first+.19,elapsed);
  // Recovery fades out before the simulation's actual attack ends.
  const exit=1-smooth(Math.max(first+.25,spec.duration-.52),spec.duration,elapsed);
  rhythm=hazards.reduce((m,h)=>Math.max(m,pulse(h.age-h.warn,.16)),0);
  impact=clamp(rhythm);
  const hold=prep*((1-attack)*.65+attack)*exit;
  pose.anticipation=prep*(1-attack);pose.weight=hold;
 }else if(b.state==='recovery'){
  const ratio=clamp(1-(s.recover||0)/Math.max(.001,spec.recover));
  pose.weight=.35*(1-smooth(0,.75,ratio));
 }
 const a=pose.weight,k=active?attack:0;
 pose.style=profile.style;
 const recoil=impact*(active?1:0);
 pose.impact=impact;
 pose.body.lean=profile.lean*a+(profile.lean>0?.055:-.045)*recoil;
 pose.body.twist=profile.twist*a;
 pose.body.roll=profile.sweep*.13*a;
 pose.body.chest=(profile.style==='heartbeat'?.8:.16)*a+recoil*.18;
 pose.body.bob=(profile.style==='spear-dive'?-.18:profile.style==='summon'?.14:0)*a;
 pose.head.pitch=profile.head*a-recoil*.08;
 pose.head.yaw=-profile.twist*.22*a;
 pose.head.roll=-profile.sweep*.08*a;
 pose.arms=profile.arms.map((raise,i)=>({
  raise:raise*a+recoil*.16,
  open:profile.open[i]*a,
  elbow:profile.elbow[i]*a,
  hand:(i===0?-1:1)*profile.twist*.25*a+recoil*.25
 }));
 // Multi-shot patterns alternate or gather at the next hazard, never fly from
 // a static "idle" pose while the hit geometry is active.
 if(active&&['orbs','fountain','rain','tide','pulse'].includes(s.pattern)){
  let nearest=0,best=Infinity;
  (s.hazards||[]).forEach((h,i)=>{const delta=Math.abs(h.age-h.warn);if(delta<best){best=delta;nearest=i;}});
  const stagger=s.pattern==='orbs'||s.pattern==='rain'?nearest%2===0?-1:1:0;
  if(stagger){pose.arms[stagger<0?0:1].raise+=impact*.42;pose.body.twist+=stagger*impact*.08;}
  else pose.arms.forEach(x=>x.raise+=impact*.15);
 }
 if(s.pattern==='orbit'&&active)pose.body.twist+=Math.sin(elapsed*3.1)*a*.16;
 if(s.pattern==='wing'&&active){
  // The wing itself swings only across the game's cone hit window.
  pose.wings.sweep=clamp((k-.08)*1.4)*profile.sweep;
 }
 pose.wings.lift=profile.wing*a;
 pose.wings.fold=profile.fold*a;
 pose.wings.sweep+=profile.sweep===0?0:profile.sweep*.15*a;
 pose.wings.curl=(profile.fold>.4?.52:-.17)*a;
 pose.wings.downbeat=recoil*(profile.wing!==0||profile.fold!==0?1:.25);
 pose.cape=profile.cape*a+recoil*.2;
 return pose;
}
