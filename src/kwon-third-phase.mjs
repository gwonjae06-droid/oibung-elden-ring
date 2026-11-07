// Third-act Kwon: the jaw sword has seized control of its wielder.
// This module is pure combat data. The arena renderer consumes the *same*
// travelling fracture objects as hit detection; nothing here draws HUD zones.
export const KWON_THREE=Object.freeze({
 first:2/3,second:1/3,
 transition:5.2,
 closeRange:5.4,
 fractureWidth:1.05,
 fractureSpeed:19,
 fractureReach:24,
 releaseDelay:.34,
});

export const KWON_THIRD_PATTERNS=Object.freeze({
 puppetLunge:{name:'역검보',wind:1.12,active:.62,recover:1.62,damage:29},
 skyRend:{name:'천지절단',wind:1.85,active:.74,recover:2.25,damage:39},
 earthRend:{name:'균열 검로',wind:1.72,active:.72,recover:2.05,damage:36},
 falseGap:{name:'거짓 빈틈',wind:1.34,active:.40,recover:1.78,damage:30},
 reverseGrip:{name:'주종 역전',wind:1.26,active:.62,recover:1.82,damage:34},
 heavenSplit:{name:'하늘 가르기',wind:2.14,active:.83,recover:2.5,damage:46},
});

// Every entry is an *opening*, not a standalone pattern pool. Follow-ups
// preserve the authored sword windup/recovery and the shared distance gate.
export const KWON_THIRD_COMBOS=Object.freeze({
 puppetHunt:['puppetLunge','reverseGrip','skyRend'],
 skyRend:['skyRend'],
 earthRend:['earthRend'],
 falseGap:['falseGap','reverseGrip'],
 reverseGrip:['reverseGrip'],
 heavenSplit:['heavenSplit'],
 swordRoad:['puppetLunge','earthRend'],
 kingFinale:['skyRend','reverseGrip','heavenSplit'],
 judgement:['puppetLunge','skyRend'],
});
export const KWON_THIRD_FAR=Object.freeze(['puppetHunt','skyRend','earthRend','heavenSplit','kingFinale','swordRoad','judgement']);
export const KWON_THIRD_CLOSE=Object.freeze(['falseGap','reverseGrip','puppetHunt','swordRoad','kingFinale','judgement']);

const sat=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth=n=>{const t=sat(n);return t*t*(3-2*t);};
export const KWON_POSSESSION=Object.freeze({
 swordScale:1.38, screenMaxOffset:.023,screenMaxWidth:.016,
 betrayalStart:1.68,betrayalContact:2.18,
});
export function kwonThirdTransition(t){
 const time=Math.max(0,Number.isFinite(t)?t:0);
 const bladeWake=smooth((time-.9)/1.12),betrayal=smooth((time-1.68)/.50),
  collapse=smooth((time-.15)/1.35)*(1-smooth((time-2.9)/1.2));
 return Object.freeze({
  collapse,bladeWake,bladeGrowth:smooth((time-.9)/1.5),
  bladeHover:smooth((time-1.18)/.95),betrayal,
  betrayalSwing:smooth((time-1.72)/.42)*(1-smooth((time-2.22)/.65)),
  impact:smooth((time-2.08)/.10)*(1-smooth((time-2.42)/.32)),
  bodyPulled:smooth((time-2.1)/1.65),slump:smooth((time-2.22)/1.23),
  skyScar:smooth((time-3.75)/.78),
  split:smooth((time-3.85)/.38)*(1-smooth((time-4.55)/.54)),
 });
}
// The detached blade leads; a physically damped, drooping body follows it.
export function kwonThirdBodyDrag(b){
 if(b?.phase!==3||b.state==='dead')return {x:0,z:0,y:0,tilt:0,slump:0};
 const cut=b.state==='transition'?kwonThirdTransition(b.t):null;
 const slump=cut?cut.slump:1;
 const active=b.state==='active'?1:b.state==='windup'?.35:.12;
 const yaw=b.yaw||0;
 const drag=slump*(cut?cut.betrayalSwing*.7:(.55+active*.45));
 return {x:-Math.sin(yaw)*drag*.22,z:-slump*(1.25+active*.60),
  y:-slump*(.48+active*.12),tilt:slump*(.32+active*.12),slump};
}
// The screen-space cut never resolves damage. It follows the physical rift.
export function kwonThirdScreenRift(g){
 const b=g?.boss;if(b?.phase!==3)return {amount:0,width:0,angle:0};
 if(b.state==='transition'){const c=kwonThirdTransition(b.t);
  return {amount:c.impact*.52+c.split*.62,width:KWON_POSSESSION.screenMaxWidth,angle:-.34,source:'cutscene'};
 }
 const q=g?.kwonFractures?.find(v=>['heavenSplit','skyRend','earthRend'].includes(v.pattern)&&v.age>v.delay);
 if(!q)return {amount:0,width:0,angle:0};
 const progress=(q.age-q.delay)*q.speed;
 const after=Math.max(0,(q.age-q.delay-q.length/q.speed));
 const emerge=smooth(progress/4),fade=1-smooth(after/.70);
 return {amount:Math.min(.78,emerge*fade*.68),width:KWON_POSSESSION.screenMaxWidth,
  angle:Math.max(-.45,Math.min(.45,Math.sin(q.yaw||0)*.23)),source:q.pattern};
}

export function kwonThirdSwordDrive(b){
 if(b?.phase!==3||b.state==='dead')return {lead:0,pull:0,weight:0};
 if(b.state==='transition'){
  const c=kwonThirdTransition(b.t);
  return {lead:c.bladeWake*(1-c.skyScar)+.16*c.skyScar,
   pull:c.bodyPulled*(1-c.skyScar)+.12*c.skyScar,weight:c.collapse};
 }
 const cfg=KWON_THIRD_PATTERNS[b.pattern];
 if(!cfg||!['windup','active','recovery'].includes(b.state))return {lead:.16,pull:.12,weight:0};
 const w=b.state==='windup'?smooth(b.t/cfg.wind):
  b.state==='active'?1:1-smooth(b.t/Math.max(.01,b.recovery||cfg.recover));
 return {lead:.36+.64*w,pull:.2+.70*w,weight:.25+.55*w};
}

// Fractures are travelling *fronts* with an authored release delay. The
// crack is visible along the swept ground, but old cracks are never damaging.
// A sideways dodge clears the narrow front. Each lane may hit at most once.
export function makeKwonFractures(b,pattern,nextId){
 const angles=pattern==='earthRend'?[-.40,.40]:
  pattern==='heavenSplit'?[-.12,.12]:[0];
 return angles.map((offset,i)=>{
  const yaw=b.yaw+offset;
  return {
   id:nextId+i,kind:'kwon-earth-sky-rift',x:b.x+Math.sin(yaw)*4.1,
   z:b.z+Math.cos(yaw)*4.1,yaw,age:0,
   delay:KWON_THREE.releaseDelay+(pattern==='heavenSplit'?i*.15:0),
   length:pattern==='heavenSplit'?KWON_THREE.fractureReach:20,
   speed:pattern==='heavenSplit'?17:KWON_THREE.fractureSpeed,
   width:pattern==='heavenSplit'?1.25:KWON_THREE.fractureWidth,
   damage:pattern==='heavenSplit'?34:pattern==='skyRend'?27:24,
   hit:false,pattern,phase:3,
  };
 });
}
export function kwonFractureFront(q,time=q.age){
 return Math.max(0,Math.min(q.length,Math.max(0,time-q.delay)*q.speed));
}
export function kwonFractureContact(q,p,prev=kwonFractureFront(q,Math.max(0,q.age-1/60))){
 if(q.hit||q.age<=q.delay||!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
 const dx=p.x-q.x,dz=p.z-q.z,c=Math.cos(q.yaw),s=Math.sin(q.yaw);
 const forward=dx*s+dz*c,lateral=dx*c-dz*s;
 const current=kwonFractureFront(q);
 return Math.abs(lateral)<=q.width&&forward>=Math.max(0,prev-q.width)
   &&forward<=current+q.width&&forward>=0&&forward<=q.length+q.width;
}
export function advanceKwonFractures(g,dt,onHit){
 if(!Array.isArray(g.kwonFractures)||!g.kwonFractures.length)return;
 for(const q of g.kwonFractures){
  const prev=kwonFractureFront(q);
  q.age+=dt;
  if(kwonFractureContact(q,g.player,prev)){
   // Callback resolves invulnerability/rolls using the authoritative engine.
   q.hit=true;
   onHit(q.damage);
  }
 }
 // Ground scars and high sky tears linger very briefly after the attack.
 g.kwonFractures=g.kwonFractures.filter(q=>q.age<q.delay+q.length/q.speed+1.35);
}
