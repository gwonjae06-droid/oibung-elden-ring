import {createBloodGame} from '../src/blood-combat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,newRun,newFlameRun,latestUnlockedStage,consumeFlameSkip,finishAttempt,advanceJourney,configureJourney,loadProfile,saveProfile,SAVE_KEY,BOSSES} from '../src/journey-state.mjs';
import {buyForgeTier,forgedEvolutions} from '../src/purification-forge.mjs';
import {BOSS_REGISTRY} from '../src/boss-registry.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';

test('flame shortcut targets the highest consecutively unlocked playable boss',()=>{
 const p=freshProfile();p.flames=5;
 assert.equal(latestUnlockedStage(p),0);assert.equal(newFlameRun(p),null);
 for(let count=1;count<=BOSSES.length;count++){
  p.defeated=BOSSES.slice(0,count);
  const stage=Math.min(count,BOSSES.length-1),r=newFlameRun(p,'cards');
  assert.equal(latestUnlockedStage(p),stage);assert.equal(r.stage,stage);assert.equal(r.startStage,stage);
  assert.equal(p.flames,5,'reserving must not spend');assert.deepEqual(r.splits,[]);
 }
 p.defeated=['clown','dice','blood','gyuwon'];assert.equal(newFlameRun(p),null);
 p.defeated=['kwon','blood'];assert.equal(newFlameRun(p).stage,1);
 p.flames=0;assert.equal(newFlameRun(p),null);
});
test('a shortcut pays once, validates the gate again, and remains session-only',()=>{
 const p=freshProfile();p.flames=2;p.defeated=['kwon','clown'];const r=newFlameRun(p);
 assert.equal(consumeFlameSkip(p,{...r,stage:3,startStage:3}),false);
 assert.equal(consumeFlameSkip(p,{...r,secret:true}),false);
 assert.equal(consumeFlameSkip(p,newRun()),false);
 assert.equal(consumeFlameSkip(p,r),true);assert.equal(p.flames,1);
 assert.equal(consumeFlameSkip(p,r),false);assert.equal(p.flames,1);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 p.run=r;saveProfile(storage,p);const loaded=loadProfile(storage);
 assert.equal(loaded.run,null);assert.equal(loaded.flames,1);assert.equal(latestUnlockedStage(loaded),2);
});
test('skipped victories record actual time and never count as a full campaign clear',()=>{
 const p=freshProfile();p.flames=3;p.defeated=['kwon'];p.run=newFlameRun(p,'hammer');consumeFlameSkip(p,p.run);
 assert.equal(finishAttempt(p,{won:true,time:20}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:30}),'flame');advanceJourney(p.run);
 assert.equal(finishAttempt(p,{won:true,time:40}),'flame');advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:50}),'complete');
 assert.equal(p.clears,0);assert.equal(p.flames,6);assert.equal(p.records[0].time,140);assert.equal(p.records[0].startStage,1);
 assert.deepEqual(p.memories.map(m=>m.id),['clown','dice','blood','gyuwon']);
 const loaded=loadProfile({getItem:()=>JSON.stringify(p)});
 assert.equal(loaded.records[0].startStage,1);assert.equal(loaded.clears,0);
 const isolated=loadProfile({getItem:()=>JSON.stringify({...p,defeated:[],memories:[]})});
 assert.equal(latestUnlockedStage(isolated),0,'a skip record must not fabricate skipped kills');
 const invalid=loadProfile({getItem:()=>JSON.stringify({...p,defeated:[],memories:[],records:[{...p.records[0],startStage:99}]})});
 assert.equal(invalid.records.length,0);assert.equal(latestUnlockedStage(invalid),0,'invalid skip metadata cannot become a full clear');
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
 assert.ok(buyForgeTier(p,'sword','charged-blade'));
 assert.ok(buyForgeTier(p,'sword','charged-blade'));
 assert.equal(p.flames,0);
 assert.deepEqual(forgedEvolutions(p,'sword'),['blade-wave','blade-wave','charged-blade','charged-blade']);
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
  assert.equal(g.boss.maxHp,({kwon:3572,clown:3760,dice:4230,blood:4700})[id]);
  assert.deepEqual(g.journeyBalance,{mode:'story',boss:id});
  assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.startGrace,0);assert.equal(g.introControlled,true);
  assert.deepEqual(g.evolutions,['blade-wave']);
 });
});
