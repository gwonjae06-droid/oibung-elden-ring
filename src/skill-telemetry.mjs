import {gyuwonDisplayYear} from './gyuwon-musical-route.mjs';
// Aggregate gameplay only. No raw keys, pointer coordinates, or device fingerprints.
const collectors=new WeakMap();
const finite=v=>Number.isFinite(v)?Math.max(0,v):0;
const round=v=>Math.round(finite(v)*100)/100;
const label=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(v)?v:'unknown';
export const SKILL_BUILD='skill-v1-20261111';
export function noteSkillHit(game,source){collectors.get(game)?.hit(source?.source||source);}
export function createSkillTelemetry(game,{boss,device='unknown',attemptId=globalThis.crypto.randomUUID()}={}){
 let closed=false,lastTime=finite(game.time),lastKind=null,lastPhase=null,revision=0,lastHurt='unknown';
 const attacks=new WeakSet(),landed=new WeakSet(),phases=Object.create(null),patterns=Object.create(null);
 let attackCount=0,connected=0,hitCount=0,damageTaken=0,heals=0,rolls=0,combatSeconds=0,performanceSeconds=0,maxPhase=1,minBossRatio=1;
 const initialPotions=finite(game.player?.potions),initialDamage=finite(game.stats?.damage),initialHits=finite(game.stats?.hits);
 const phaseKey=()=>game.gyuwon?.years?'year-'+(game.gyuwon.years.musical?.finishing?'ending':gyuwonDisplayYear(game.gyuwon.years.year)):'phase-'+(game.boss?.phase||1);
 const musical=()=>!!game.gyuwon?.years?.musical;
 const bucket=()=>{const k=phaseKey();if(!phases[k]&&Object.keys(phases).length<12)phases[k]={seconds:0,hits:0,damage:0,score:0};return phases[k];};
 function sample(){
  if(closed)return;
  const now=finite(game.time),delta=Math.max(0,now-lastTime);lastTime=now;
  const kind=musical()?'performance':game.boss?.state==='transition'?'cinematic':'combat',key=phaseKey();
  // Simulation time stops while paused. Attribute the boundary interval to its prior phase.
  if(delta<=2&&lastKind&&lastKind!=='cinematic'){
   if(lastKind==='combat')combatSeconds+=delta;else performanceSeconds+=delta;
   if(phases[lastPhase])phases[lastPhase].seconds+=delta;
  }
  lastKind=kind;lastPhase=key;bucket();
  maxPhase=Math.max(maxPhase,finite(game.gyuwon?.years?gyuwonDisplayYear(game.gyuwon.years.year):game.boss?.phase||1));
  if(game.boss?.maxHp>0)minBossRatio=Math.min(minBossRatio,Math.max(0,game.boss.hp/game.boss.maxHp));
 }
 function attack(action){if(!action||typeof action!=='object'||action.basic!==true||attacks.has(action)||musical())return;attacks.add(action);attackCount++;}
 const collector={hit(action){if(closed||musical()||!action||typeof action!=='object'||action.basic!==true)return;attack(action);if(!landed.has(action)){landed.add(action);connected++;}}};
 function event(e){
  if(closed)return;sample();
  if(['swing','shot'].includes(e.type))attack(game.player?.action);
    if(e.type==='roll')rolls++;
  if(e.type==='healed')heals++;
  if(e.type==='gyuwon-musical-hit'){const b=bucket();if(b)b.score+=finite(e.points);}
  if(['player-hit','hurt'].includes(e.type)&&e.amount>0){
   hitCount++;damageTaken+=finite(e.amount);const b=bucket();if(b){b.hits++;b.damage+=finite(e.amount);}
   const current=game.gyuwon?.pattern||game.blood?.pattern||game.boss?.pattern||game.dice?.giant?.pattern||game.clown?.pattern;
   lastHurt=label(e.source||current||(musical()?phaseKey():null));
   const k=Object.hasOwn(patterns,lastHurt)||Object.keys(patterns).length<24?lastHurt:'other';
   const row=patterns[k]||(patterns[k]={hits:0,damage:0});row.hits++;row.damage+=finite(e.amount);
  }
 }
 const events=game.events,original=events.push,ownPush=Object.getOwnPropertyDescriptor(events,'push');
 const push=function(...items){const result=original.apply(this,items);for(const e of items)try{event(e);}catch{}return result;};
 events.push=push;collectors.set(game,collector);sample();
 function snapshot(outcome='playing'){
  sample();revision++;
  return {attempt_id:attemptId,revision,boss,weapon:game.weapon,device,build:SKILL_BUILD,ruleset:game.journeyBalance?.mode==='story'?'story':'standalone',
   forge:(game.evolutions||[]).slice(0,4).map(label).sort().join(','),outcome,
   combat_seconds:round(combatSeconds),performance_seconds:round(performanceSeconds),
   damage_dealt:round(finite(game.stats?.damage)-initialDamage),confirmed_hits:Math.max(0,finite(game.stats?.hits)-initialHits),
   attacks:attackCount,connected_attacks:connected,hits_taken:hitCount,damage_taken:round(damageTaken),rolls,
   potions_used:Math.max(0,initialPotions-finite(game.player?.potions)),heals_completed:heals,
   remaining_hp:round(game.player?.hp),max_hp:round(game.player?.maxHp),max_phase:maxPhase,best_boss_progress:round((1-minBossRatio)*100),
   death_pattern:outcome==='lost'?lastHurt:null,
   phases:Object.fromEntries(Object.entries(phases).map(([k,v])=>[k,{...v,seconds:round(v.seconds),damage:round(v.damage)}])),
   patterns:Object.fromEntries(Object.entries(patterns).map(([k,v])=>[k,{...v,damage:round(v.damage)}]))};
 }
 return {sample,snapshot,dispose(){if(closed)return;closed=true;if(events.push===push){if(ownPush)Object.defineProperty(events,'push',ownPush);else delete events.push;}if(collectors.get(game)===collector)collectors.delete(game);}};
}
