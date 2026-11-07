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
 puppetLunge:{name:'역검보',wind:.74,active:.53,recover:1.22,damage:29},
 skyRend:{name:'천지절단',wind:1.42,active:.58,recover:1.76,damage:39},
 earthRend:{name:'균열 검로',wind:1.30,active:.58,recover:1.70,damage:36},
 falseGap:{name:'거짓 빈틈',wind:1.05,active:.32,recover:1.42,damage:30},
 reverseGrip:{name:'주종 역전',wind:.85,active:.47,recover:1.40,damage:34},
 heavenSplit:{name:'하늘 가르기',wind:1.75,active:.66,recover:2.05,damage:46},
});

// Every entry is an *opening*, not a standalone pattern pool. Follow-ups
// preserve the authored sword windup/recovery and the shared distance gate.
export const KWON_THIRD_COMBOS=Object.freeze({
 puppetHunt:['puppetLunge','reverse','skyRend'],
 skyRend:['skyRend'],
 earthRend:['earthRend'],
 falseGap:['falseGap','reverseGrip'],
 reverseGrip:['reverseGrip','jab'],
 heavenSplit:['heavenSplit'],
 swordRoad:['puppetLunge','cross','earthRend'],
 kingFinale:['skyRend','reverseGrip','heavenSplit'],
 judgement:['puppetLunge','skyRend','slam'],
});
export const KWON_THIRD_FAR=Object.freeze(['puppetHunt','skyRend','earthRend','heavenSplit','kingFinale','swordRoad','judgement']);
export const KWON_THIRD_CLOSE=Object.freeze(['falseGap','reverseGrip','puppetHunt','swordRoad','kingFinale','judgement']);

const sat=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const smooth=n=>{const t=sat(n);return t*t*(3-2*t);};
export function kwonThirdTransition(t){
 const time=Math.max(0,Number.isFinite(t)?t:0);
 return Object.freeze({
  collapse:smooth((time-.15)/1.35)*(1-smooth((time-2.9)/1.2)),
  bladeWake:smooth((time-1.25)/1.4),
  bodyPulled:smooth((time-2.1)/1.65),
  skyScar:smooth((time-3.75)/.78),
 });
}

export function kwonThirdSwordDrive(b){
 if(b?.phase!==3||b.state==='dead')return {lead:0,pull:0,weight:0};
 if(b.state==='transition'){
  const c=kwonThirdTransition(b.t);
  return {lead:c.bladeWake,pull:c.bodyPulled,weight:c.collapse};
 }
 const cfg=KWON_THIRD_PATTERNS[b.pattern];
 if(!cfg||!['windup','active','recovery'].includes(b.state))return {lead:.16,pull:.12,weight:0};
 const w=b.state==='windup'?smooth(b.t/cfg.wind):
  b.state==='active'?1:1-smooth(b.t/Math.max(.01,b.recovery||cfg.recover));
 return {lead:.22+.78*w,pull:.14+.54*w,weight:.2*w};
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
