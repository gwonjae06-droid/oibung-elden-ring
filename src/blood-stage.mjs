import {BLOOD_PATTERNS} from './blood-data.mjs';

// Presentation-only timeline. It reads simulation state and never changes hit timing.
export const BLOOD_STAGES=Object.freeze([
 Object.freeze({id:'ready',label:'준비',hint:'바닥에 피가 모입니다 · 붉은 범위 밖으로 이동하세요'}),
 Object.freeze({id:'start',label:'시작',hint:'피가 터져 나옵니다 · 지금 회피하세요'}),
 Object.freeze({id:'run',label:'진행',hint:'피가 천천히 번집니다 · 붉은 범위를 계속 피하세요'}),
 Object.freeze({id:'done',label:'완료',hint:'피가 가라앉습니다 · 곧 판정이 끝납니다'}),
 Object.freeze({id:'return',label:'복귀',hint:'피가 배서준에게 돌아갑니다 · 반격 기회'})
]);
const IDLE=Object.freeze({id:'idle',index:-1,label:'',hint:'',progress:0});
const DONE_WINDOW=.45;
const clamp=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const make=(id,progress)=>{const index=BLOOD_STAGES.findIndex(s=>s.id===id);return {...BLOOD_STAGES[index],index,progress:clamp(progress)};};
export const onsetTime=h=>Math.min(.3,h.life*.35);
export const settleTime=h=>Math.min(.45,h.life*.3);
export function hazardStage(h){
 if(h.age<h.warn)return {id:'ready',progress:clamp(h.age/h.warn)};
 const t=h.age-h.warn,onset=onsetTime(h),settle=settleTime(h),remain=h.life-t;
 if(t<onset)return {id:'start',progress:clamp(t/onset)};
 if(remain<=settle)return {id:'done',progress:clamp(1-remain/settle)};
 return {id:'run',progress:clamp((t-onset)/Math.max(.001,h.life-onset-settle))};
}
const memory=new WeakMap();
// A short-lived hazard may expire while later ones still wait; the pattern must not appear to restart.
function steady(s,raw){
 if(raw.id==='idle'||raw.id==='return'){memory.delete(s);return raw;}
 const m=memory.get(s);
 if(!m||m.pattern!==s.pattern||s.t<m.t){memory.set(s,{pattern:s.pattern,t:s.t,peak:raw.index});return raw;}
 m.t=s.t;
 if(raw.index<m.peak&&raw.index<2)return make('run',.5);
 m.peak=Math.max(m.peak,raw.index);return raw;
}
export const bloodStage=g=>{
 const raw=rawStage(g),s=g?.blood;
 return s&&typeof s==='object'?steady(s,raw):raw;
};
function rawStage(g){
 const b=g?.boss,s=g?.blood;
 if(!b||!s||g.status!=='playing'||b.state==='transition'||b.state==='dead')return IDLE;
 const spec=BLOOD_PATTERNS[s.pattern];if(!spec)return IDLE;
 if(b.state==='recovery'){const total=Math.max(.001,s.recover,spec.recover);return make('return',1-s.recover/total);}
 if(b.state==='maneuver')return make('return',.82+.18*(1-s.maneuver/(b.phase===3?.78:b.phase===2?1.14:1.24)));
 const remain=spec.duration-s.t;
 if(remain<=DONE_WINDOW||!s.hazards.length)return make('done',1-remain/(DONE_WINDOW*2));
 const states=s.hazards.map(hazardStage),fired=s.hazards.filter(h=>h.age>=h.warn);
 if(!fired.length)return make('ready',Math.max(...states.map(x=>x.progress)));
 const oldest=fired.reduce((a,h)=>h.age-h.warn>a.age-a.warn?h:a);
 if(oldest.age-oldest.warn<onsetTime(oldest))return make('start',(oldest.age-oldest.warn)/onsetTime(oldest));
 if(fired.length<states.length)return make('run',fired.length/states.length);
 if(states.every(x=>x.id==='done'))return make('done',states.reduce((a,x)=>a+x.progress,0)/states.length);
 return make('run',fired.reduce((a,h)=>a+(h.age-h.warn)/h.life,0)/fired.length);
}
