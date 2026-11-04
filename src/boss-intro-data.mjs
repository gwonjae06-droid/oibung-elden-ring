export const INTRO_CARDS=Object.freeze({
 kwon:Object.freeze({epithet:'첫 번째 시련',name:'긴턱의 이권재',line:'여덟 다리, 두 자루의 턱.',accent:'#c5b281'}),
 clown:Object.freeze({epithet:'두 번째 시련',name:'광대 오슬우',line:'즐거운 공연이 시작됩니다.',accent:'#e5b64d'}),
 dice:Object.freeze({epithet:'세 번째 시련',name:'거대 주사위 박성원',line:'운명은 굴러간다. 눈금을 읽어라.',accent:'#ff2d95'}),
 blood:Object.freeze({epithet:'네 번째 시련 · 성혈 대성당',name:'영원한 혈왕 배서준',line:'내 피가 흐르는 한, 죽음은 나를 찾지 못한다.',accent:'#ee7791'})
});
export const INTRO_DURATION=3.4;
export const INTRO_DURATION_REDUCED=1.8;
const sat=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const ease=v=>{const t=sat(v);return t*t*(3-2*t);};
export function introDuration(reduced=false){return reduced?INTRO_DURATION_REDUCED:INTRO_DURATION;}
export function introFrame(t,reduced=false){
 const d=introDuration(reduced),time=Number.isFinite(t)?Math.max(0,t):0;
 if(time>=d)return {done:true,bars:0,veil:0,epithet:0,name:0,spacing:0,line:0};
 const u=time/d*INTRO_DURATION,out=1-ease((u-(INTRO_DURATION-.5))/.5);
 return {done:false,bars:ease(u/.6)*out,veil:.55*ease(u/.5)*out,epithet:ease((u-.5)/.5)*out,name:ease((u-.9)/.7)*out,spacing:reduced?0:.6*(1-ease((u-.9)/.9)),line:ease((u-1.8)/.6)*out};
}
