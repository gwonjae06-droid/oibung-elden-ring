export const BLOOD_RULES=Object.freeze({name:'영원한 혈왕 배서준',phaseName:'혈익의 대천사 배서준',radius:28,hp:6400,transition:4.6});
// Every damaging shape is also consumed by the renderer. Delays use simulation time.
export const BLOOD_PATTERNS=Object.freeze({
 wave:{name:'피의 파도',phase:1,duration:3.2,recover:2},
 fountain:{name:'피의 분수',phase:1,duration:3.4,recover:2},
 burst:{name:'피폭발',phase:1,duration:2.2,recover:2.4},
 orbs:{name:'피의 구체',phase:1,duration:3.4,recover:2},
 chain:{name:'피의 사슬',phase:1,duration:3.5,recover:2},
 orbit:{name:'혈류 회전',phase:1,duration:3.2,recover:2},
 vortex:{name:'피의 소용돌이',phase:1,duration:3.2,recover:2.2},
 dive:{name:'혈익 강하',phase:2,duration:2.8,recover:2.8,air:true},
 eclipse:{name:'피의 일식',phase:2,duration:3.4,recover:2.8,air:true},
 rain:{name:'혈우',phase:2,duration:4.2,recover:2.6,air:true},
 wing:{name:'붉은 날개 베기',phase:2,duration:2.4,recover:2.6},
 pulse:{name:'심장 파동',phase:2,duration:3.8,recover:2.4},
 pursuit:{name:'혈익 추격',phase:2,duration:3.5,recover:2.8,air:true},
 tide:{name:'종말의 혈조',phase:2,duration:4.4,recover:3,air:true},
});
export const bloodPool=phase=>Object.keys(BLOOD_PATTERNS).filter(id=>BLOOD_PATTERNS[id].phase===phase);
export function hazardPosition(h){const t=Math.max(0,h.age-h.warn);return {x:h.x+(h.vx||0)*t,z:h.z+(h.vz||0)*t,r:h.r+(h.grow||0)*t};}
export function hazardContains(h,p){
 const c=hazardPosition(h),dx=p.x-c.x,dz=p.z-c.z;
 if(h.shape==='ring')return Math.abs(Math.hypot(dx,dz)-c.r)<=h.width+.55;
 if(h.shape==='lane'){const s=Math.sin(h.yaw),c=Math.cos(h.yaw);return Math.abs(dx*c-dz*s)<=h.width+.55&&Math.abs(dx*s+dz*c)<=h.length/2+.55;}
 if(h.shape==='cone'){const angle=Math.atan2(dx,dz)-h.yaw;return Math.hypot(dx,dz)<=h.r+.55&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=h.arc;}
 return Math.hypot(dx,dz)<=c.r+.55;
}
