import {BOSS_TEMPO} from './boss-tempo.mjs';
import {BLOOD_EPIC_CUTS} from './blood-epic-script.mjs';
export const BLOOD_RULES=Object.freeze({name:'영원한 혈왕 배서준',phaseName:'혈익의 대천사 배서준',radius:32,hp:6400,transition:4.6});
// Every damaging shape is also consumed by the renderer. Delays use simulation time.
const ORIGINAL_BLOOD_PATTERNS=Object.freeze({
 wave:{name:'피의 파도',phase:1,duration:3.8,recover:2.2},
 fountain:{name:'피의 분수',phase:1,duration:4,recover:2.2},
 burst:{name:'피폭발',phase:1,duration:2.6,recover:2.4},
 orbs:{name:'피의 구체',phase:1,duration:3.8,recover:2.2},
 chain:{name:'피의 사슬',phase:1,duration:4.2,recover:2.2},
 orbit:{name:'혈류 회전',phase:1,duration:3.6,recover:2.2},
 vortex:{name:'피의 소용돌이',phase:1,duration:3.6,recover:2.4},
 lances:{name:'순교자의 혈창',phase:1,duration:4.8,recover:2.8},
 cross:{name:'성혈의 십자',phase:1,duration:5,recover:2.8},
 bloodScissors:{name:'혈홍 가위날',phase:1,duration:4.8,recover:2.45},
 heartCage:{name:'심장의 가시우리',phase:1,duration:5.5,recover:2.6},
 reverseFlow:{name:'피의 역류',phase:1,duration:5.3,recover:2.65},
 bloodStatues:{name:'혈육의 조각상',phase:1,duration:5.8,recover:2.7},
 dive:{name:'혈익 강하',phase:2,duration:3.2,recover:3,air:true},
 eclipse:{name:'피의 일식',phase:2,duration:4.4,recover:3,air:true},
 rain:{name:'혈우',phase:2,duration:4.9,recover:2.8,air:true},
 wing:{name:'붉은 날개 베기',phase:2,duration:2.9,recover:2.8},
 pulse:{name:'심장 파동',phase:2,duration:4.4,recover:2.6},
 pursuit:{name:'혈익 돌진',phase:2,duration:4,recover:3,air:true},
 tide:{name:'혈해 범람',phase:2,duration:5,recover:3.2,air:true},
 judgement:{name:'붉은 성창 낙하',phase:2,duration:4.9,recover:3,air:true},
 ritual:{name:'성흔 심판',phase:2,duration:6.6,recover:3.6,air:true},
 wingShear:{name:'혈익 교차참',phase:2,duration:5.1,recover:2.5},
 rosary:{name:'붉은 묵주의 행렬',phase:2,duration:5.7,recover:2.75},
 wingGenesis:{name:'혈익 개벽',phase:2,duration:5.8,recover:3.35,air:true},
 heartFeast:{name:'심장의 성찬',phase:2,duration:7.1,recover:3.75},
 requiem:{name:'해일의 장송',phase:2,duration:10.65,recover:3.8},
});
// Compress the recovery phase, not the authored hit/animation sequence.
export const BLOOD_PATTERNS=Object.freeze(Object.fromEntries(
 Object.entries(ORIGINAL_BLOOD_PATTERNS).map(([id,s])=>[
  id,Object.freeze({...s,duration:s.duration+(BLOOD_EPIC_CUTS[id]?.lead||0),
   recover:Math.max(2.2,Math.round(s.recover*BOSS_TEMPO.recovery*100)/100)})
 ])
));
export const BLOOD_SAFE_GROUND_PATTERNS=new Set([
 'burst','vortex','dive','eclipse','tide','ritual','judgement',
 'wingGenesis','wing','pulse','pursuit','reverseFlow','heartCage','cross','requiem'
]);
export const bloodPool=phase=>Object.keys(BLOOD_PATTERNS).filter(id=>BLOOD_PATTERNS[id].phase===phase);
export function hazardPosition(h){const t=Math.max(0,h.age-h.warn);return {x:h.x+(h.vx||0)*t,z:h.z+(h.vz||0)*t,r:h.r+(h.grow||0)*t};}
// Rendered warning blood and authoritative collision share the same footprint.
// Reduced padding is deliberately forgiving for evasive melee play.
export const BLOOD_CONTACT_MARGIN=.28;
export function bloodHazardFootprint(h){
 const c=hazardPosition(h),pad=BLOOD_CONTACT_MARGIN;
 if(h.shape==='ring')return {kind:2,x:c.x,z:c.z,r:c.r,halfWidth:Math.max(.25,h.width*.72),halfLength:0,yaw:0,inner:0,arc:0};
 if(h.shape==='lane'){
  // A moving blood wall's far leading half used to damage players long
  // before the rendered wave crest reached them. This is the shared 3D
  // floor-shader and actual collision footprint, so the fix stays in sync.
  const moving=Math.hypot(h.vx||0,h.vz||0)>.01;
  return {kind:3,x:c.x,z:c.z,r:0,halfWidth:h.width+pad,
    halfLength:(moving?Math.min(h.length/2,3.0):h.length/2)+pad,
    yaw:h.yaw,inner:0,arc:0};
 }
 if(h.shape==='cone')return {kind:4,x:c.x,z:c.z,r:h.r+pad,halfWidth:0,halfLength:0,yaw:h.yaw,inner:Math.max(0,(h.innerR||0)-pad),arc:h.arc};
 return {kind:1,x:c.x,z:c.z,r:c.r+pad,halfWidth:0,halfLength:0,yaw:0,inner:0,arc:0};
}
export const BLOOD_BROAD_IMPACT_BUFFER=.22;
export function bloodHazardContactReady(h){
 // Long-range static eruptions may fill their entire footprint at once,
 // but only become damaging after their visible release has played.
 const broad=h.shape==='cone'||h.shape==='circle'&&h.r>=6;
 return h.age>=h.warn+(broad?BLOOD_BROAD_IMPACT_BUFFER:0);
}
export function hazardContains(h,p){
 const f=bloodHazardFootprint(h),dx=p.x-f.x,dz=p.z-f.z,d=Math.hypot(dx,dz);
 if(f.kind===2)return Math.abs(d-f.r)<=f.halfWidth;
 if(f.kind===3){const s=Math.sin(f.yaw),c=Math.cos(f.yaw);return Math.abs(dx*c-dz*s)<=f.halfWidth&&Math.abs(dx*s+dz*c)<=f.halfLength;}
 if(f.kind===4){const angle=Math.atan2(dx,dz)-f.yaw;return d>=f.inner&&d<=f.r&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=f.arc;}
 return d<=f.r;
}
