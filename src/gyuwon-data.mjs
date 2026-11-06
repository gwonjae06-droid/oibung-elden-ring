import {bossMaxHp} from './balance.mjs';
export const GYUWON_RULES=Object.freeze({name:'정답을 찾지 못한 자 최규원',phaseName:'무두의 사유 최규원',radius:22,hp:bossMaxHp(4),transition:3});
export const GYUWON_PATTERNS=Object.freeze({
 line:{name:'명제의 선',duration:2.2,recover:2.2},
 mark:{name:'오답 노트',duration:2.8,recover:2.4},
 repeat:{name:'다시 풀어',duration:3.1,recover:2.8}
});
export const gyuwonPool=()=>['line','repeat','mark','repeat'];
// Shared collision geometry also drives the warning meshes.
export {hazardContains,hazardPosition} from './blood-data.mjs';
