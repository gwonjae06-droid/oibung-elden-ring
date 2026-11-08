import {GYUWON_PATTERNS} from './gyuwon-data.mjs';
import {poseAlpha,createPoseContinuity} from './boss-animation-continuity.mjs';
const sat=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const ease=x=>{const t=sat(x);return t*t*(3-2*t);};
const pulse=(x,w)=>Math.exp(-Math.pow(x/Math.max(.05,w),2));
const NEUTRAL=Object.freeze({lean:0,twist:0,headPitch:0,headYaw:0,leftArm:-.5,rightArm:0,leftElbow:-.16,rightElbow:-.16,leftWrist:.04,rightWrist:0,weightShift:0,book:-.6});
// All 15 patterns have distinctive silhouettes. Timings read actual live hazard warnings.
export const GYUWON_MOTION_STYLE=Object.freeze({
 line:[-.18,0,.18,1.0],mark:[.25,-.2,-.35,.65],repeat:[-.28,.15,.10,1.2],
 choice:[-.12,.32,-.23,.9],contradiction:[.13,-.4,.18,1.0],timetable:[-.32,.13,.10,.8],blank:[-.4,0,-.35,.45],
 negate:[.33,-.25,.24,1.1],reverse:[-.26,.48,.37,1.1],stop:[.25,0,-.2,.85],
 // The five phase-two verdict gestures are unique: one pose definition per attack.
 verdict:[.41,-.33,-.28,1.3],mirror:[-.25,.62,.22,1.2],axiom:[-.51,-.27,.41,1.5],
 paradox:[.37,.58,-.35,1.4],erasure:[-.44,-.47,.38,1.25],
 counterproof:[.27,-.62,.36,1.37],
 sword:[.45,-.5,-.42,1.4],circus:[-.38,.7,.4,1.3],gamble:[.35,-.66,-.15,1.5],
 tsunami:[-.52,.2,.5,1.5],chalk:[-.25,.52,-.5,1.25],
 'exam-first':[-.28,.12,.38,.7],'exam-retake':[-.36,-.21,.24,1],
 'exam-third':[.21,.47,-.2,1.1],'exam-shooter':[.36,-.55,-.32,1.45],
 'exam-sewage':[-.62,.2,.49,1.65],'exam-figurines':[.27,.69,-.4,1.55]
});
// Distinct articulated casting silhouettes for every question, judgment and memory.
export const GYUWON_GESTURES=Object.freeze({
 line:[.34,1.36,-.10],mark:[1.38,.42,.16],repeat:[1.14,1.18,-.10],
 choice:[1.20,.72,.09],contradiction:[.80,1.32,.12],timetable:[1.34,.36,.20],blank:[.66,.60,-.25],
 negate:[.82,1.28,-.18],verdict:[1.27,1.31,-.24],mirror:[1.39,.50,.20],axiom:[1.20,1.20,-.20],
 reverse:[.62,1.39,.24],stop:[1.28,.38,-.22],paradox:[1.18,1.30,.18],erasure:[1.42,.52,-.16],counterproof:[.40,1.44,.23],
 sword:[1.32,1.42,-.35],circus:[.58,1.48,.27],gamble:[.45,1.55,-.20],tsunami:[1.48,1.42,-.30],chalk:[1.36,.54,.20],
 'exam-first':[1.24,.56,-.21],'exam-retake':[1.4,.72,.2],
 'exam-third':[1.45,1.17,-.2],'exam-shooter':[.35,1.48,-.3],
 'exam-sewage':[1.5,1.27,.18],'exam-figurines':[.72,1.6,-.18]
});
// Phase one is the frightened student, not yet a god: trembling wrists, hurried
// page-flicks and nervous glances. Purely cosmetic; ramps in from t=0 so idle poses are unchanged.
function anxiety(g,m){
 const b=g?.boss,s=g?.gyuwon,t=g?.time;
 if(!b||!s||b.phase!==1||b.state==='dead'||b.state==='transition'||!Number.isFinite(t))return m;
 const ramp=Math.min(1,t/.5),calm=(b.state==='pattern'?.45:1)*ramp;
 const tremor=(Math.sin(t*37)+Math.sin(t*23.3+1.3))*.5*.022*calm;
 const flip=Math.pow(Math.max(0,Math.sin(t*5.2)),3)*.14*calm;
 const glance=Math.sin(t*1.7)*Math.max(0,Math.sin(t*.43))*.07*calm;
 return {...m,leftWrist:m.leftWrist+tremor,rightWrist:m.rightWrist-tremor*1.2,
  rightElbow:m.rightElbow-flip*.5,book:m.book+flip,
  headYaw:m.headYaw+glance,headPitch:m.headPitch+Math.abs(tremor)*1.5};
}
function baseMotion(g){
 const b=g?.boss,s=g?.gyuwon;if(!b||!s||b.state==='dead')return {...NEUTRAL};
 if(b.state==='transition'){
  const r=ease((s.t||0)/2.8);
  return {lean:-.18*r,twist:.15*r,headPitch:-.25*r,headYaw:0,
   leftArm:-.5-1.25*r,rightArm:-.7*r,leftElbow:-.16-.45*r,rightElbow:-.16-.33*r,
   leftWrist:.04+.13*r,rightWrist:.08*r,weightShift:.14*r,book:-.6+.25*r};
 }
 const spec=GYUWON_PATTERNS[s.pattern],style=GYUWON_MOTION_STYLE[s.pattern];
 if(!spec||!style)return {...NEUTRAL};
 // Preserve a low-energy follow-through throughout recovery instead of snapping to idle.
 if(b.state==='recovery'){
  const settling=.18*ease(Math.max(0,(s.recover||0)/Math.max(.01,spec.recover)));
  const [lean,twist,head,force]=style;
  return {lean:lean*settling,twist:twist*settling,headPitch:head*settling,
   headYaw:-twist*settling*.15,leftArm:-.5-force*settling*.3,
   rightArm:-force*settling*.25,leftElbow:-.16-force*settling*.12,
   rightElbow:-.16-force*settling*.20,leftWrist:.04+twist*settling*.1,
   rightWrist:twist*settling*.16,weightShift:twist*settling*.15,
   book:-.6+force*settling*.1};
 }
 if(b.state!=='pattern')return {...NEUTRAL};
 // Live hazards are removed after impact. Keep their original timing for the entire pose.
 const t=Math.max(0,s.t||0),warns=(s.motionBeats?.length?s.motionBeats:(s.hazards||[]).map(h=>h.warn))
  .filter(w=>Number.isFinite(w)&&w>=0).sort((a,b)=>a-b);
 const first=warns[0]??Math.min(1,spec.duration*.35);
 const prep=ease(t/Math.max(.22,first-.12))*(1-ease((t-first+.02)/.24));
 const strike=Math.max(0,...warns.map(w=>pulse(t-w,.16)));
 const after=Math.max(0,...warns.map(w=>pulse(t-w-.27,.26)));
 const tail=1-ease((t-(spec.duration-spec.recover*.40))/.38);
 const [lean,twist,head,force]=style,[lBias,rBias,hBias]=GYUWON_GESTURES[s.pattern];
 const power=(prep*.38+strike+after*.48)*tail,left=force*lBias,right=force*rBias;
 const alt=warns.filter(w=>w<t+.04).length%2;
 return {lean:lean*(power-prep*.22),twist:twist*(prep*.32+power*.75),
  headPitch:head*(prep*.48+power*.70)+hBias*(prep*.20+strike*.15),headYaw:-twist*(prep*.15+power*.12),
  leftArm:-.5-left*(prep*.42+power*(alt?.48:.85)),
  rightArm:-right*(prep*.50+power*(alt?.95:.62)),
  leftElbow:-.16-left*(prep*.28+strike*(alt?.24:.42)+after*.16),
  rightElbow:-.16-right*(prep*.34+strike*(alt?.52:.29)+after*.22),
  leftWrist:.04+twist*(prep*.14+strike*.24),
  rightWrist:twist*(prep*.22+strike*.3),
  weightShift:twist*(prep*.11+power*.24),
  book:-.6+left*(prep*.18+strike*.28)};
}
export function gyuwonRawMotion(g){return anxiety(g,baseMotion(g));}
export function createGyuwonMotionDirector(){
 const pose=createPoseContinuity();let owner=null,lastPos=null,speed=0,facing=0;
 function reset(){pose.reset();owner=null;lastPos=null;speed=0;facing=0;}
 function update(g,dt=0){
  if(owner!==g){reset();owner=g;facing=Number.isFinite(g?.boss?.yaw)?g.boss.yaw:0;}
  const b=g.boss,h=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  const delta=lastPos?Math.hypot(b.x-lastPos.x,b.z-lastPos.z):0;
  if(h>0||!lastPos)lastPos={x:b.x,z:b.z};
  const velocity=h>0?Math.min(1,delta/Math.max(.01,h)/8):speed;
  speed+=(velocity-speed)*poseAlpha(9,h);
  const target=b.state==='pattern'||b.state==='transition'?b.yaw:Math.atan2(g.player.x-b.x,g.player.z-b.z);
  facing+=Math.atan2(Math.sin(target-facing),Math.cos(target-facing))*poseAlpha(8,h);
  const out=pose.step(gyuwonRawMotion(g),h,{owner:g,time:g.time,rate:b.state==='pattern'?22:11});
  return {...out,steps:speed,facing};
 }
 return {update,reset};
}
