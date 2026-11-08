import {bossMaxHp} from './balance.mjs';
export const GYUWON_RULES=Object.freeze({name:'정답을 찾지 못한 자 최규원',phaseName:'무두의 사유 최규원',radius:30,hp:bossMaxHp(4),transition:3});
export const GYUWON_PATTERNS=Object.freeze({
 choice:{name:'객관식의 함정',duration:3.7,recover:2.4},
 timetable:{name:'시간표',duration:4,recover:2.3},
 blank:{name:'백지',duration:3.8,recover:2.8},
 line:{name:'명제의 선',duration:2.2,recover:2.2},
 mark:{name:'오답 노트',duration:2.8,recover:2.4},
 repeat:{name:'다시 풀어',duration:3.1,recover:2.8},
 reverse:{name:'인과 역전',duration:4.5,recover:2.3},
 stop:{name:'사유의 중단',duration:3.8,recover:2.2},
 negate:{name:'존재의 부정',duration:3,recover:2.2},
 contradiction:{name:'모순의 형상',duration:3.5,recover:2.2},
 // Phase two's white courtroom and dark thought-world are physically distinct
 // from the exam questions in phase one and the memories in phase three.
 verdict:{name:'영원의 판결',duration:4.9,recover:2.3},
 mirror:{name:'대칭의 형벌',duration:5.2,recover:2.4},
 axiom:{name:'공리의 붕괴',duration:5.4,recover:2.5},
 paradox:{name:'참과 거짓의 역습',duration:5.0,recover:2.3},
 erasure:{name:'기억의 소거',duration:5.8,recover:2.6},
 counterproof:{name:'반례의 그림자',duration:5.1,recover:2.5},
 sword:{name:'이권재의 기억 · 천지절단',duration:5.5,recover:2.5},
 circus:{name:'오슬우의 기억 · 마지막 대공연',duration:7,recover:2.5},
 gamble:{name:'박성원의 기억 · 천상의 도박장',duration:7,recover:2.5},
 tsunami:{name:'배서준의 기억 · 수평선의 대해일',duration:8,recover:3},
 chalk:{name:'최규원의 기억 · 세계라는 칠판',duration:6.5,recover:2.8}
});
export const MEMORY_ORDER=['sword','circus','gamble','tsunami','chalk'];
export const memoryInterval=ratio=>ratio>.2?8:ratio>.1?5:ratio>.05?2.5:1;
export const gyuwonPool=(phase,space='white')=>phase===1
 ?['line','repeat','mark','choice','contradiction','timetable','blank']
 :phase===2?(space==='white'
   ?['negate','verdict','mirror','axiom']
   :['reverse','stop','paradox','erasure','counterproof'])
 :MEMORY_ORDER;
// Shared collision geometry also drives the warning meshes.
import {hazardContains as ordinaryContains,hazardPosition as ordinaryPosition} from './blood-data.mjs';
import {sampleRide,tentacleYaw} from './gyuwon-year-choreography.mjs';
export function hazardPosition(h){
 if(h.rideSegment)return sampleRide(h.rideSegment,h.age);
 if(h.topple){
  const q=Math.max(0,Math.min(1,(h.age-h.warn)/h.life));
  return {x:h.x,z:h.z,r:h.r,angle:q*Math.PI/2};
 }
 return ordinaryPosition(h);
}
export function hazardContains(h,p){
 if(h.visual==='year-tentacle'){
  const yaw=tentacleYaw(h),dx=p.x-h.originX,dz=p.z-h.originZ;
  const along=dx*Math.sin(yaw)+dz*Math.cos(yaw),q=Math.max(0,Math.min(1,along/h.length));
  const thickness=Math.min(h.width,.64*Math.pow(1-q,.82)+.14);
  return Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))<=thickness&&along>=0&&along<=h.length;
 }
 if(h.rideSegment){const c=hazardPosition(h);return Math.hypot(p.x-c.x,p.z-c.z)<=h.r+.28;}
 if(h.shape==='topple'){
  const dx=p.x-h.x,dz=p.z-h.z,s=Math.sin(h.yaw),c=Math.cos(h.yaw);
  return Math.abs(dx*c-dz*s)<=h.width&&Math.abs(dx*s+dz*c)<=h.length/2;
 }
 if(h.shape==='radialWave'){
  const c=hazardPosition(h),dx=p.x-c.x,dz=p.z-c.z;
  return Math.abs(dx*Math.cos(h.yaw)-dz*Math.sin(h.yaw))<=h.width&&
   Math.abs(dx*Math.sin(h.yaw)+dz*Math.cos(h.yaw))<=h.depth;
 }
 if(h.shape==='wave'){const z=h.z+(h.age-h.warn)*h.speed;return Math.abs(p.z-z)<h.depth+.55&&Math.abs(p.x-h.gap)>h.opening-.55;}
 return ordinaryContains(h,p);
}

