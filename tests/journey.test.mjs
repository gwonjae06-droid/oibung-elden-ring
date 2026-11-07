import {createBloodGame} from '../src/blood-combat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,newRun,newTravelRun,canTravelTo,latestUnlockedStage,finishAttempt,advanceJourney,configureJourney,loadProfile,saveProfile,SAVE_KEY,BOSSES} from '../src/journey-state.mjs';
import {buyForgeTier,forgedEvolutions} from '../src/purification-forge.mjs';
import {BOSS_REGISTRY} from '../src/boss-registry.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';

test('only consecutively unlocked boss destinations are free and repeatable',()=>{
 const p=freshProfile();assert.equal(latestUnlockedStage(p),0);assert.equal(canTravelTo(p,0),true);
 assert.equal(newTravelRun(p,'sword',0).startStage,0);assert.equal(newTravelRun(p,'sword',1),null);
 for(let count=1;count<=BOSSES.length;count++){
  p.defeated=BOSSES.slice(0,count);
  const stage=Math.min(count,BOSSES.length-1);
  assert.equal(latestUnlockedStage(p),stage);
  for(let target=0;target<=stage;target++){
   const r=newTravelRun(p,'cards',target);
   assert.equal(r.stage,target);assert.equal(r.startStage,target);
   assert.equal(r.weapon,'cards');assert.deepEqual(r.splits,[]);
  }
  assert.equal(p.flames,0,'travel costs no purification flames');
 }
 p.defeated=['clown','dice','blood','gyuwon'];
 assert.equal(latestUnlockedStage(p),0);assert.equal(newTravelRun(p,'bow',2),null);
 p.defeated=['kwon','blood'];assert.equal(latestUnlockedStage(p),1);
 for(const stage of [-1,2,5,1.2,'1',null,NaN]){
  assert.equal(newTravelRun(p,'bow',stage),null,'invalid destination '+stage);
 }
 assert.equal(newTravelRun(p,'missing',0),null);
});
test('travel does not spend flames, and saved journeys never resume active runs',()=>{
 const p=freshProfile();p.flames=2;p.defeated=['kwon','clown'];
 const r=newTravelRun(p,'hammer',2);assert.equal(r.stage,2);assert.equal(r.startStage,2);
 const another=newTravelRun(p,'hammer',1);assert.equal(another.stage,1);
 assert.equal(p.flames,2);assert.deepEqual(p.defeated,['kwon','clown']);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 p.run=r;saveProfile(storage,p);const loaded=loadProfile(storage);
 assert.equal(loaded.run,null);assert.equal(loaded.flames,2);assert.equal(latestUnlockedStage(loaded),2);
});
test('selected-boss journeys only reward actual kills and use a separate completion record',()=>{
 const p=freshProfile();p.defeated=['kwon'];p.run=newTravelRun(p,'hammer',1);
 assert.equal(finishAttempt(p,{won:true,time:20}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:30}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:40}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:50}),'complete');
 assert.equal(p.clears,0);assert.equal(p.flames,4);assert.equal(p.records[0].time,140);assert.equal(p.records[0].startStage,1);
 assert.deepEqual(p.memories.map(m=>m.id),['clown','dice','blood','gyuwon']);
 const loaded=loadProfile({getItem:()=>JSON.stringify(p)});
 assert.equal(loaded.records[0].startStage,1);assert.equal(loaded.clears,0);
 const isolated=loadProfile({getItem:()=>JSON.stringify({...p,defeated:[],memories:[]})});
 assert.equal(latestUnlockedStage(isolated),0,'a travel record must not invent skipped kills');
 const invalid=loadProfile({getItem:()=>JSON.stringify({...p,defeated:[],memories:[],records:[{...p.records[0],startStage:99}]})});
 assert.equal(invalid.records.length,0);assert.equal(latestUnlockedStage(invalid),0);
});
test('five victories each award a flame and one run completion with persistent records',()=>{
 const p=freshProfile();p.run=newRun();
 assert.equal(finishAttempt(p,{won:true,time:32}),'flame');
 assert.equal(finishAttempt(p,{won:true,time:999}),null);
 advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:45}),'flame');
 advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:60}),'flame');
 advanceJourney(p.run);
 assert.equal(p.run.stage,3);
 assert.equal(finishAttempt(p,{won:true,time:70}),'flame');advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:80}),'complete');
 assert.deepEqual(p.defeated,['kwon','clown','dice','blood','gyuwon']);
 assert.equal(p.flames,5);assert.equal(p.earnedFlames,5);
 assert.equal(p.records[0].time,287);assert.equal(p.run,null);
 assert.equal(finishAttempt(p,{won:true,time:1}),null);
});
test('active runs are never written; v1 checkpoint evidence migrates into permanent lights only',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},p=freshProfile();
 p.run=newRun();finishAttempt(p,{won:true,time:10});saveProfile(storage,p);
 assert.equal(JSON.parse(data.get(SAVE_KEY)).run,null);
 const restored=loadProfile(storage);
 assert.equal(restored.run,null);assert.equal(restored.flames,1);
 assert.deepEqual(restored.defeated,['kwon']);
 const legacy={version:1,clears:0,records:[],run:{stage:1,pending:false}};
 const migrated=loadProfile({getItem:()=>JSON.stringify(legacy)});
 assert.deepEqual(migrated.defeated,['kwon']);assert.equal(migrated.run,null);assert.equal(migrated.flames,0);
});
test('records of removed challenge modes are dropped while basic-trial records survive',()=>{
 const base={weapon:'sword',time:100,deaths:0,bossCount:4,date:'2026-11-04T00:00:00.000Z'};
 const saved={version:3,clears:2,records:[{...base,mode:'story'},{...base,mode:'rush'},{...base,mode:'time'},{...base,mode:'noheal'},{...base}],memories:[],defeated:[],run:null};
 const p=loadProfile({getItem:()=>JSON.stringify(saved)});
 assert.equal(p.version,4);assert.equal(p.records.length,2);
 assert.ok(p.records.every(r=>r.mode===undefined||r.mode==='story'));
});
test('evolution choices are permanent forge purchases, not post-boss relic selections',()=>{
 const p=freshProfile();p.flames=4;
 assert.ok(buyForgeTier(p,'sword','blade-wave'));
 assert.ok(buyForgeTier(p,'sword','blade-wave'));
 assert.equal(buyForgeTier(p,'sword','charged-blade'),false);
 assert.equal(p.flames,2);
 assert.deepEqual(forgedEvolutions(p,'sword'),['blade-wave','blade-wave']);
 const r=newRun();r.pending=true;
 assert.equal(advanceJourney(r),undefined);
 assert.equal(r.stage,1);
 assert.throws(()=>advanceJourney(r));
});
test('invalid saves recover and unavailable storage never crashes',()=>{
 for(const value of ['null','{','{"version":99}'])assert.equal(loadProfile({getItem:()=>value}).run,null);
 assert.equal(saveProfile({setItem(){throw Error('quota');}},freshProfile()),false);
 assert.deepEqual(loadProfile(undefined),freshProfile());
 assert.throws(()=>newRun('invalid'));
});
test('real boss engines receive the registry health curve, grace and forged upgrades',()=>{
 const factories=[w=>createGame(w,{register:false}),w=>createClownGame(w,{register:false}),createDicePlayerGame,createBloodGame];
 const p=freshProfile();p.flames=2;buyForgeTier(p,'sword','blade-wave');
 factories.forEach((make,stage)=>{
  const r=newRun('sword');r.stage=stage;const g=make('sword');
  configureJourney(g,r,p);
  assert.equal(g.player.potions,3);
  const id=BOSSES[stage],baseHp=BOSS_REGISTRY[id].maxHp;
  assert.equal(g.boss.maxHp,({kwon:4822,clown:5076,dice:5711,blood:6345})[id]);
  assert.deepEqual(g.journeyBalance,{mode:'story',boss:id});
  assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.startGrace,0);assert.equal(g.introControlled,true);
  assert.deepEqual(g.evolutions,['blade-wave']);
 });
});

test('recorded cumulative damage sums each boss once and old records stay unknown',()=>{
 const p=freshProfile();p.run=newRun('sword');
 assert.equal(finishAttempt(p,{won:true,time:12,damage:121.5}),'flame');
 assert.equal(finishAttempt(p,{won:true,time:12,damage:5000}),null);
 advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:13,damage:12.25}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:14,damage:-3}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:15,damage:5}),'flame');advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:16,damage:0}),'complete');
 assert.equal(p.records[0].damage,139);
 const data=new Map(),store={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(saveProfile(store,p),true);assert.equal(loadProfile(store).records[0].damage,139);
 const old={...p,records:[{weapon:'sword',time:54,deaths:0,bossCount:4,startStage:0}]};
 assert.equal(loadProfile({getItem:()=>JSON.stringify(old)}).records[0].damage,null);
});
