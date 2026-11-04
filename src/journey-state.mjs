import {rememberBoss} from './chapter-story.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
export const BOSSES=['kwon','clown','dice','blood'];
export const BOSS_NAMES=['긴턱의 이권재','광대 오슬우','거대 주사위 박성원','영원한 혈왕 배서준'];
export const MODES={story:'서약의 도전',rush:'연속 격파',time:'시간의 시련',noheal:'무회복 시련'};
export const RELICS=[]; // Compatibility export; rewards are now weapon-specific evolutions.
export const SAVE_KEY='oibung.journey.v1';
export function freshProfile(){return {version:3,clears:0,records:[],memories:[],defeated:[],run:null};}
export function newRun(weapon='sword',mode='story'){
 if(!Object.hasOwn(EVOLUTIONS,weapon)||!Object.hasOwn(MODES,mode))throw Error('Invalid journey');
 return {weapon,mode,stage:0,relics:[],elapsed:0,deaths:0,pending:false,splits:[]};
}
export function loadProfile(storage){try{
 const p=JSON.parse(storage.getItem(SAVE_KEY));if(![1,2,3].includes(p?.version))return freshProfile();const validTime=n=>Number.isFinite(n)&&n>=0&&n<1e8;
 const records=Array.isArray(p.records)?p.records.filter(r=>validTime(r.time)&&Object.hasOwn(MODES,r.mode)&&Object.hasOwn(EVOLUTIONS,r.weapon)&&Number.isInteger(r.deaths)&&r.deaths>=0).slice(-40).map(r=>({...r,bossCount:p.version<3?3:r.bossCount===4?4:3})):[];
 const available=p.version<3?BOSSES.slice(0,3):BOSSES;
 const memories=Array.isArray(p.memories)?p.memories.filter(m=>available.includes(m?.id)&&(m.firstClear===null||typeof m.firstClear==='string'&&Number.isFinite(Date.parse(m.firstClear)))).filter((m,i,a)=>a.findIndex(n=>n.id===m.id)===i).slice(0,BOSSES.length):[];
 const known=new Set((p.defeated||[]).filter?.(x=>available.includes(x))||[]);
 if(p.clears>0||records.length)BOSSES.slice(0,records.some(r=>r.bossCount===4)?4:3).forEach(x=>known.add(x));
 if(p.version===1&&Number.isInteger(p.run?.stage))BOSSES.slice(0,Math.min(3,p.run.stage+(p.run.pending?1:0))).forEach(x=>known.add(x));
 memories.forEach(m=>known.add(m.id));
 return {version:3,clears:Number.isInteger(p.clears)&&p.clears>=0?p.clears:0,records,memories,defeated:[...known],run:null};
 }catch{return freshProfile();}}
// Active runs deliberately never survive reload or browser closure.
export function saveProfile(storage,profile){try{storage.setItem(SAVE_KEY,JSON.stringify({...profile,run:null}));return true;}catch{return false;}}
export function finishAttempt(profile,{won,time=0}){
 const r=profile.run;if(!r||r.pending)return null;if(r.secret)return won?'secret-won':'secret-lost';r.elapsed+=Number.isFinite(time)?Math.max(0,time):0;
 if(!won){r.deaths++;return 'lost';}
 profile.defeated??=[];if(!profile.defeated.includes(BOSSES[r.stage]))profile.defeated.push(BOSSES[r.stage]);
 r.splits.push(Math.max(0,time));rememberBoss(profile,BOSSES[r.stage]);r.memoryRead=false;
 if(r.stage<BOSSES.length-1){r.pending=true;return r.stage<2?'reward':'advance';}
 profile.clears++;profile.records.push({weapon:r.weapon,mode:r.mode,time:r.elapsed,deaths:r.deaths,bossCount:BOSSES.length,date:new Date().toISOString()});profile.records=profile.records.slice(-40);profile.run=null;return 'complete';
}
export function advanceJourney(run){if(!run?.pending||run.stage!==2)throw Error('Invalid chapter advance');run.stage++;run.pending=false;}
export function chooseRelic(run,id){if(!run?.pending||run.stage>=2||!EVOLUTIONS[run.weapon]?.some(r=>r.id===id))throw Error('Invalid evolution');run.relics.push(id);run.stage++;run.pending=false;}
export function configureJourney(game,run){
 game.evolutions=[...run.relics];game.startGrace=1.6;
 game.boss.maxHp=[2100,3400,5200,6400][run.stage];game.boss.hp=game.boss.maxHp;
 if(run.mode==='noheal')game.player.potions=0;
}
