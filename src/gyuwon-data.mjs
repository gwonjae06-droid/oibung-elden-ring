import {bossMaxHp} from './balance.mjs';
export const GYUWON_RULES=Object.freeze({name:'정답을 찾지 못한 자 최규원',phaseName:'무두의 사유 최규원',radius:30,hp:bossMaxHp(4),transition:3});
export const GYUWON_PATTERNS=Object.freeze({
 choice:{name:'객관식의 함정',duration:3.2,recover:2.4},
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
   :['reverse','stop','paradox','erasure'])
 :MEMORY_ORDER;
// Shared collision geometry also drives the warning meshes.
import {hazardContains as ordinaryContains} from './blood-data.mjs';
export {hazardPosition} from './blood-data.mjs';
export function hazardContains(h,p){
 if(h.shape==='wave'){const z=h.z+(h.age-h.warn)*h.speed;return Math.abs(p.z-z)<h.depth+.55&&Math.abs(p.x-h.gap)>h.opening-.55;}
 return ordinaryContains(h,p);
}
