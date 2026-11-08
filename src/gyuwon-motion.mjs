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
 tsunami:[-.52,.2,.5,1.5],chalk:[-.25,.52,-.5,1.25]
});
// Distinct articulated casting silhouettes for every question, judgment and memory.
export const GYUWON_GESTURES=Object.freeze({
 line:[.34,1.36,-.10],mark:[1.38,.42,.16],repeat:[1.14,1.18,-.10],
 choice:[1.20,.72,.09],contradiction:[.80,1.32,.12],timetable:[1.34,.36,.20],blank:[.66,.60,-.25],
 negate:[.82,1.28,-.18],verdict:[1.27,1.31,-.24],mirror:[1.39,.50,.20],axiom:[1.20,1.20,-.20],
 reverse:[.62,1.39,.24],stop:[1.28,.38,-.22],paradox:[1.18,1.30,.18],erasure:[1.42,.52,-.16],counterproof:[.40,1.44,.23],
 sword:[1.32,1.42,-.35],circus:[.58,1.48,.27],gamble:[.45,1.55,-.20],tsunami:[1.48,1.42,-.30],chalk:[1.36,.54,.20]
});
// Phase one is the frightened student, not yet a god: trembling wrists, hurried
// page-flicks and nervous glances. Purely cosmetic; ramps in from t=0 so idle poses are unchanged.
function annualExamMotion(g){
 const e=g?.gyuwon?.years,b=g?.boss;if(!e||!b)return null;
 const t=e.castT||0,charge=e.cast?Math.min(1,t/1.15):0;
 if(e.mode==='exam'){
  const hand=Math.sin(g.time*17)*.14;
  return {lean:-.64,twist:-.05,headPitch:.45,headYaw:Math.sin(g.time*2)*.035,
   leftArm:-1.45,rightArm:-1.34+hand,leftElbow:-.84,rightElbow:-.65+hand*.35,
   leftWrist:.13,rightWrist:.18+hand*.7,weightShift:0,book:-.23};
 }
 if(e.mode==='result')return {lean:-.25,twist:Math.sin(e.gradeT*5)*.12,
  headPitch:e.grade==='failure'?.6:-.28,headYaw:0,leftArm:-.6,rightArm:-.25,
  leftElbow:-.28,rightElbow:-.18,leftWrist:0,rightWrist:0,weightShift:0,book:-.6};
 const id=e.cast||'',dance=e.year===7,floppy=e.year===5,octo=e.year===8;
 const beat=Math.sin(g.time*(dance?8:4)),power=charge*(1-Math.min(1,Math.max(0,t-3)*.5));
 if(id==='bike'||id==='scooter')return {lean:-.86,twist:0,headPitch:.34,headYaw:0,
  leftArm:-1.06,rightArm:-1.06,leftElbow:-.43,rightElbow:-.43,
  leftWrist:.2,rightWrist:.2,weightShift:0,book:-.75};
 if(id==='smoke'){
  const inhale=ease(t/.78)*(1-ease((t-1.42)/.72));
  return {lean:-.09,twist:.13*inhale,headPitch:-.18*inhale,headYaw:0,
   leftArm:-.38,rightArm:-.35-1.95*inhale,
   leftElbow:-.2,rightElbow:-.22-1.0*inhale,
   leftWrist:.08,rightWrist:.32*inhale,weightShift:0,book:-.6};
 }
 if(id==='sniper'||id==='crossfire'){
  const fire=ease(t/1.0),kick=Math.max(0,...(g.gyuwon?.hazards||[])
   .filter(h=>h.visual==='year-bullet').map(h=>pulse(h.age-h.warn,.12)));
  return {lean:-.18-kick*.12,twist:.04,headPitch:.10,headYaw:0,
   leftArm:-.58-1.10*fire,rightArm:-.45-1.15*fire+kick*.19,
   leftElbow:-.45-.28*fire,rightElbow:-.35-.37*fire,
   leftWrist:.07,rightWrist:.18-kick*.25,weightShift:-.10,book:-.6};
 }
 if(id==='archery'){
  const pull=ease(t/1.12),release=(g.gyuwon?.hazards||[]).some(h=>h.visual==='year-arrow'&&h.fired);
  return {lean:-.22,twist:-.12,headPitch:.06,headYaw:0,
   leftArm:-.42-1.0*pull,rightArm:-.4-.89*pull+(release?.32:0),
   leftElbow:-.22-.26*pull,rightElbow:-.17-.98*pull+(release?.45:0),
   leftWrist:-.12,rightWrist:.48*pull,weightShift:.11,book:-.6};
 }
 if(id==='donation'){
  const spin=ease(t/.8),react=ease((t-3.0)/.35);
  return {lean:-.24+react*.45,twist:beat*.2,headPitch:-react*.24,headYaw:0,
   leftArm:-.55-1.26*spin,rightArm:-.55-1.6*spin+beat*.22*react,
   leftElbow:-.3-.26*spin,rightElbow:-.3-.40*spin,
   leftWrist:.1,rightWrist:.12,weightShift:react*.30,book:-.6};
 }
 if(dance)return {lean:beat*.28,twist:Math.sin(g.time*5)*.58,headPitch:-.15+beat*.17,
  headYaw:Math.cos(g.time*6)*.22,leftArm:-.9-beat*.7,rightArm:-.9+beat*.7,
  leftElbow:-.45,rightElbow:-.45,leftWrist:.2,rightWrist:-.2,
  weightShift:beat*.85,book:-.6};
 if(floppy)return {lean:beat*.4,twist:Math.sin(g.time*2.3)*.47,headPitch:beat*.3,
  headYaw:Math.sin(g.time*.9)*.3,leftArm:-.8-power*.52,rightArm:-.7-power*.8,
  leftElbow:-.8,rightElbow:-.72,leftWrist:.38,rightWrist:-.32,
  weightShift:beat*.32,book:-.65};
 if(octo)return {lean:-.22,twist:beat*.14,headPitch:-.25,headYaw:0,
  leftArm:-1.6,rightArm:-1.6,leftElbow:-.9,rightElbow:-.9,
  leftWrist:.34,rightWrist:-.34,weightShift:beat*.18,book:-.6};
 if(e.year===4)return {lean:-.17,twist:.15*power,headPitch:.26,
  headYaw:0,leftArm:-1.45*power-.43,rightArm:-1.5*power-.2,
  leftElbow:-.6,rightElbow:-.6,leftWrist:.08,rightWrist:0,
  weightShift:0,book:-.6};
 return {lean:-.14-power*.3,twist:beat*.12,headPitch:power*.17,headYaw:0,
  leftArm:-.5-power*1.05,rightArm:-power*.95,leftElbow:-.16-power*.42,
  rightElbow:-.16-power*.55,leftWrist:.04,rightWrist:power*.2,
  weightShift:beat*.06,book:-.6+power*.23};
}
function anxiety(g,m){
 const b=g?.boss,s=g?.gyuwon,t=g?.time;
 if(!b||!s||s.years||b.phase!==1||b.state==='dead'||b.state==='transition'||!Number.isFinite(t))return m;
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
 if(s.years)return annualExamMotion(g);
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
