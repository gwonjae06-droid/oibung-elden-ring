export const INTRO_CARDS=Object.freeze({
 kwon:Object.freeze({epithet:'첫 번째 시련',name:'긴턱의 이권재',line:'턱날로 전장을 가르는 집념의 검객. 연격이 끝난 순간 반격하라.',accent:'#c5b281'}),
 clown:Object.freeze({epithet:'두 번째 시련',name:'광대 오슬우',line:'웃음과 폭탄으로 무대를 지배하는 광대. 공연의 박자를 읽어라.',accent:'#e5b64d'}),
 dice:Object.freeze({epithet:'세 번째 시련',name:'거대 주사위 박성원',line:'사진이 새겨진 주사위. 몸체를 피하고 드러나는 약점을 노려라.',accent:'#ff2d95'}),
 blood:Object.freeze({epithet:'네 번째 시련 · 성혈 대성당',name:'영원한 혈왕 배서준',line:'피를 무기이자 생명으로 삼는 혈왕. 내려온 순간을 놓치지 마라.',accent:'#ee7791'}),
 gyuwon:Object.freeze({epithet:'다섯 번째 시련 · 심야 자습실',name:'정답을 찾지 못한 자 최규원',line:'너는 여기까지 오면 답이 있을 줄 알았어?',accent:'#cbe2ed'})
});
export const INTRO_DURATION=2;
export const INTRO_DURATION_REDUCED=1.7;
const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const ease=v=>{const t=sat(v);return t*t*(3-2*t);};
export function introDuration(reduced=false){return reduced?INTRO_DURATION_REDUCED:INTRO_DURATION;}
export function introFrame(t,reduced=false){
 const d=introDuration(reduced),time=Number.isFinite(t)?Math.max(0,t):0;
 if(time>=d)return {done:true,bars:0,veil:0,epithet:0,name:0,spacing:0,line:0};
 const out=1-ease((time-(d-.32))/.32);
 return {done:false,bars:ease(time/.22)*out,veil:.64*ease(time/.24)*out,epithet:ease((time-.12)/.22)*out,name:ease((time-.24)/.22)*out,spacing:reduced?0:.18*(1-ease((time-.24)/.72)),line:ease((time-.44)/.24)*out};
}
