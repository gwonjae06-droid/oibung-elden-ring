import {rememberKwon} from './chapter-story.mjs';
export const BOSSES=['kwon','clown','dice'];
export const BOSS_NAMES=['긴턱의 이권재','광대 오슬우','거대 주사위 박성원'];
export const MODES={story:'시련의 여정',rush:'연속 격파',time:'시간의 시련',noheal:'무회복 시련'};
export const RELICS=[
 {id:'swift',name:'바람의 서약',text:'기본 공격 동작 시간 15% 감소. 기본 공격 피해 10% 감소.'},
 {id:'heavy',name:'파괴의 서약',text:'기본 공격 피해 25% 증가. 공격 기력 소모 +6.'},
 {id:'vital',name:'생명의 서약',text:'최대 생명 +25. 회피 기력 소모 5 감소.'},
];
export const SAVE_KEY='oibung.journey.v1';
export function freshProfile(){return {version:1,clears:0,records:[],memories:[],run:null};}
export function newRun(weapon='sword',mode='story'){
 if(!['sword','hammer','bow','cards'].includes(weapon)||!Object.hasOwn(MODES,mode))throw Error('Invalid journey');
 return {weapon,mode,stage:0,relics:[],elapsed:0,deaths:0,pending:false,splits:[]};
}
export function loadProfile(storage){
 try{const p=JSON.parse(storage.getItem(SAVE_KEY));if(p?.version!==1)return freshProfile();
 const validTime=n=>Number.isFinite(n)&&n>=0&&n<1e8;
 const validRun=r=>r&&['sword','hammer','bow','cards'].includes(r.weapon)&&Object.hasOwn(MODES,r.mode)&&Number.isInteger(r.stage)&&r.stage>=0&&r.stage<3&&Array.isArray(r.relics)&&r.relics.length<=2&&r.relics.every(x=>RELICS.some(y=>y.id===x))&&validTime(r.elapsed)&&Number.isInteger(r.deaths)&&r.deaths>=0&&typeof r.pending==='boolean'&&Array.isArray(r.splits)&&r.splits.every(validTime);
 return {version:1,memories:Array.isArray(p.memories)?p.memories.filter(m=>m?.id==='kwon'&&(typeof m.firstClear==='string'||m.firstClear===null)).slice(0,1):[],clears:Number.isInteger(p.clears)&&p.clears>=0?p.clears:0,records:Array.isArray(p.records)?p.records.filter(r=>validTime(r.time)&&Object.hasOwn(MODES,r.mode)&&['sword','hammer','bow','cards'].includes(r.weapon)&&Number.isInteger(r.deaths)&&r.deaths>=0).slice(-40):[],run:validRun(p.run)?p.run:null};
 }catch{return freshProfile();}
}
export function saveProfile(storage,profile){try{storage.setItem(SAVE_KEY,JSON.stringify(profile));return true;}catch{return false;}}
export function finishAttempt(profile,{won,time=0}){
 const r=profile.run;if(!r||r.pending)return null;
 r.elapsed+=Number.isFinite(time)?Math.max(0,time):0;
 if(!won){r.deaths++;if(r.mode==='rush'){r.stage=0;r.relics=[];r.splits=[];}return 'lost';}
 r.splits.push(Math.max(0,time));if(r.stage===0){rememberKwon(profile);r.memoryRead=false;}
 if(r.stage<2){r.pending=true;return 'reward';}
 profile.clears++;profile.records.push({weapon:r.weapon,mode:r.mode,time:r.elapsed,deaths:r.deaths,date:new Date().toISOString()});profile.records=profile.records.slice(-40);profile.run=null;return 'complete';
}
export function chooseRelic(run,id){if(!run?.pending||run.stage>=2||!RELICS.some(r=>r.id===id))throw Error('Invalid reward');run.relics.push(id);run.stage++;run.pending=false;}
export function configureJourney(game,run){
 const count=id=>run.relics.filter(x=>x===id).length;
 game.journey={damage:Math.pow(.9,count('swift'))*Math.pow(1.25,count('heavy')),speed:Math.pow(.85,count('swift')),cost:6*count('heavy'),rollCost:Math.max(15,25-5*count('vital'))};
 game.player.maxHp+=25*count('vital');game.player.hp=game.player.maxHp;
 if(run.mode==='noheal')game.player.potions=0;
}
