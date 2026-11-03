import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,newRun,finishAttempt,chooseRelic,configureJourney,loadProfile,saveProfile,SAVE_KEY} from '../src/journey-state.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
test('three victories record individual kills and one complete run without resuming after reload',()=>{
 const p=freshProfile();p.run=newRun();assert.equal(finishAttempt(p,{won:true,time:32}),'reward');assert.equal(finishAttempt(p,{won:true,time:999}),null);chooseRelic(p.run,'blade-wave');finishAttempt(p,{won:true,time:45});chooseRelic(p.run,'charged-blade');assert.equal(finishAttempt(p,{won:true,time:60}),'complete');assert.deepEqual(p.defeated,['kwon','clown','dice']);assert.equal(p.records[0].time,137);assert.equal(p.run,null);assert.equal(finishAttempt(p,{won:true,time:1}),null);
});
test('active runs are never written; v1 checkpoint evidence migrates into permanent lights only',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},p=freshProfile();p.run=newRun();finishAttempt(p,{won:true,time:10});saveProfile(storage,p);assert.equal(JSON.parse(data.get(SAVE_KEY)).run,null);const restored=loadProfile(storage);assert.equal(restored.run,null);assert.deepEqual(restored.defeated,['kwon']);
 const legacy={version:1,clears:0,records:[],run:{stage:1,pending:false}};const migrated=loadProfile({getItem:()=>JSON.stringify(legacy)});assert.deepEqual(migrated.defeated,['kwon']);assert.equal(migrated.run,null);
});
test('evolution choice is weapon-specific and accepts repeated paths once per defeated boss',()=>{
 const r=newRun();r.pending=true;assert.throws(()=>chooseRelic(r,'twin-arrow'));chooseRelic(r,'blade-wave');assert.throws(()=>chooseRelic(r,'charged-blade'));r.pending=true;chooseRelic(r,'blade-wave');assert.deepEqual(r.relics,['blade-wave','blade-wave']);assert.equal(r.stage,2);
});
test('invalid saves recover and unavailable storage never crashes',()=>{
 for(const value of ['null','{','{"version":99}'])assert.equal(loadProfile({getItem:()=>value}).run,null);assert.equal(saveProfile({setItem(){throw Error('quota');}},freshProfile()),false);assert.deepEqual(loadProfile(undefined),freshProfile());assert.throws(()=>newRun('invalid'));assert.throws(()=>newRun('sword','invalid'));
});
test('all real boss engines receive increasing health, grace and no-heal rules',()=>{
 const factories=[w=>createGame(w,{register:false}),w=>createClownGame(w,{register:false}),createDicePlayerGame];let last=0;
 factories.forEach((make,stage)=>{const r=newRun('sword','noheal');r.stage=stage;r.relics=['blade-wave'];const g=make('sword');configureJourney(g,r);assert.equal(g.player.potions,0);assert.ok(g.boss.maxHp>last);last=g.boss.maxHp;assert.equal(g.boss.hp,g.boss.maxHp);assert.equal(g.startGrace,1.6);assert.deepEqual(g.evolutions,['blade-wave']);});
});
