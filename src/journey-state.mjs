import {rememberBoss} from './chapter-story.mjs';
import {EVOLUTIONS} from './weapon-evolution.mjs';
import {BOSS_REGISTRY,PLAYABLE_BOSSES} from './boss-registry.mjs';
import {forgeInventory,normalizeFlameProfile,awardPurificationFlame,forgedEvolutions,flameBalance} from './purification-forge.mjs';
export const BOSSES=PLAYABLE_BOSSES;
export const BOSS_NAMES=BOSSES.map(id=>BOSS_REGISTRY[id].name);
export const TRIAL_NAME='기본 시련';
export const RELICS=[]; // Legacy export; the forge owns weapon evolutions.
export const SAVE_KEY='oibung.journey.v1';
export function freshProfile(){return {
 version:4,clears:0,records:[],memories:[],defeated:[],run:null,
 flames:0,earnedFlames:0,forge:forgeInventory()
};}
export const rewardKind=run=>BOSSES[run?.stage]?'flame':null;
export function newRun(weapon='sword'){
 if(!Object.hasOwn(EVOLUTIONS,weapon))throw Error('Invalid journey');
 return {weapon,stage:0,startStage:0,elapsed:0,deaths:0,pending:false,splits:[]};
}
// Only normal, consecutive campaign victories unlock the next playable boss.
// Secret-route rewards and out-of-order kill evidence cannot jump a locked gate.
export function latestUnlockedStage(profile){
 let stage=0;
 while(stage<BOSSES.length-1&&profile?.defeated?.includes(BOSSES[stage]))stage++;
 return stage;
}
export function newFlameRun(profile,weapon='sword'){
 const stage=latestUnlockedStage(profile);
 if(stage===0||flameBalance(profile)<1)return null;
 return {...newRun(weapon),stage,startStage:stage,skipFlamePending:true};
}
// Selection reserves nothing. Charge once only after a battle session opens;
// failed loading, cancelling, and reloading the menu never consume a flame.
export function consumeFlameSkip(profile,run){
 if(!run?.skipFlamePending||run.secret||run.stage!==run.startStage||run.stage!==latestUnlockedStage(profile)||run.stage<=0||flameBalance(profile)<1)return false;
 profile.flames=flameBalance(profile)-1;
 delete run.skipFlamePending;
 return true;
}
export function loadProfile(storage){try{
 const p=JSON.parse(storage.getItem(SAVE_KEY));
 if(![1,2,3,4].includes(p?.version))return freshProfile();
 const validTime=n=>Number.isFinite(n)&&n>=0&&n<1e8;
 const records=Array.isArray(p.records)?p.records.filter(r=>validTime(r.time)&&(r.mode===undefined||r.mode==='story')&&Object.hasOwn(EVOLUTIONS,r.weapon)&&Number.isInteger(r.deaths)&&r.deaths>=0).slice(-40).map(r=>{
  const bossCount=p.version<3?3:Number.isInteger(r.bossCount)&&r.bossCount>=3&&r.bossCount<=BOSSES.length?r.bossCount:3;
  const startStage=r.startStage??0;
  return Number.isInteger(startStage)&&startStage>=0&&startStage<bossCount?{...r,bossCount,startStage}:null;
 }).filter(Boolean):[];
 const available=p.version<3?BOSSES.slice(0,3):BOSSES;
 const memories=Array.isArray(p.memories)?p.memories.filter(m=>available.includes(m?.id)&&(m.firstClear===null||typeof m.firstClear==='string'&&Number.isFinite(Date.parse(m.firstClear)))).filter((m,i,a)=>a.findIndex(n=>n.id===m.id)===i).slice(0,BOSSES.length):[];
 const known=new Set((Array.isArray(p.defeated)?p.defeated:[]).filter(x=>available.includes(x)));
 const fullRecords=records.filter(r=>r.startStage===0);
 if(p.clears>0||fullRecords.length)BOSSES.slice(0,Math.max(3,...fullRecords.map(r=>r.bossCount))).forEach(x=>known.add(x));
 if(p.version===1&&Number.isInteger(p.run?.stage))BOSSES.slice(0,Math.min(3,p.run.stage+(p.run.pending?1:0))).forEach(x=>known.add(x));
 memories.forEach(m=>known.add(m.id));
 return normalizeFlameProfile({
  version:4,clears:Number.isSafeInteger(p.clears)&&p.clears>=0?p.clears:0,
  records,memories,defeated:[...known],run:null,
  flames:p.flames,earnedFlames:p.earnedFlames,forge:p.forge
 });
 }catch{return freshProfile();}}
// Persist only the durable account state. A run is intentionally not resumed
// on reload; flame-skip selection is session-only and is never persisted.
export function saveProfile(storage,profile){try{
 storage.setItem(SAVE_KEY,JSON.stringify({...profile,version:4,run:null}));return true;
 }catch{return false;}}
export function finishAttempt(profile,{won,time=0}){
 const r=profile.run;
 if(!r||r.pending||r.secretSettled)return null;
 if(r.secret){
  r.secretSettled=true;
  if(won)awardPurificationFlame(profile);
  return won?'secret-won':'secret-lost';
 }
 if(!BOSSES[r.stage])return null;
 r.elapsed+=Number.isFinite(time)?Math.max(0,time):0;
 if(!won){r.deaths++;return 'lost';}
 // Exactly one award per settled boss encounter; pending is the idempotency
 // latch until the player explicitly advances to the next boss.
 awardPurificationFlame(profile);
 profile.defeated??=[];
 if(!profile.defeated.includes(BOSSES[r.stage]))profile.defeated.push(BOSSES[r.stage]);
 r.splits.push(Math.max(0,time));rememberBoss(profile,BOSSES[r.stage]);r.memoryRead=false;
 if(r.stage<BOSSES.length-1){r.pending=true;return 'flame';}
 if(!r.startStage)profile.clears++;
 profile.records.push({weapon:r.weapon,time:r.elapsed,deaths:r.deaths,bossCount:BOSSES.length,startStage:r.startStage||0,date:new Date().toISOString()});
 profile.records=profile.records.slice(-40);profile.run=null;
 return 'complete';
}
export function advanceJourney(run){
 if(!run?.pending||run.stage>=BOSSES.length-1)throw Error('Invalid chapter advance');
 run.stage++;run.pending=false;
}
export function configureJourney(game,run,profile){
 game.evolutions=forgedEvolutions(profile,run.weapon);
 game.startGrace=1.6;
 game.boss.maxHp=BOSS_REGISTRY[BOSSES[run.stage]].maxHp;
 game.boss.hp=game.boss.maxHp;
}
