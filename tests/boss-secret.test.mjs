import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossSecret} from '../src/boss-secret.mjs';
import {freshProfile,newRun,finishAttempt,saveProfile,loadProfile} from '../src/journey-state.mjs';
test('physical ODEN sequence works once, rejects wrong order and expires',()=>{
 const s=createBossSecret();assert.equal(s.key('KeyO',0),false);s.key('KeyD',100);s.key('KeyE',200);assert.equal(s.key('KeyN',300),true);assert.equal(s.key('KeyN',400),false);
 s.key('KeyO',500);s.key('KeyD',600);s.key('KeyX',700);assert.equal(s.key('KeyN',800),false);
 s.key('KeyO',1000);assert.equal(s.key('KeyD',4000),false);s.key('KeyE',4100);assert.equal(s.key('KeyN',4200),false);
});
test('five rapid title taps unlock, with timeout and explicit reset',()=>{
 const s=createBossSecret();for(let i=0;i<4;i++)assert.equal(s.tap(i*100),false);assert.equal(s.tap(400),true);
 s.tap(500);s.tap(600);s.reset();for(let i=0;i<4;i++)assert.equal(s.tap(800+i*100),false);
 assert.equal(s.tap(3000),false);
});
test('hidden fights earn repeatable flames but do not add memories or official clears',()=>{
 const p=freshProfile();p.run={...newRun(),stage:2,secret:true};
 assert.equal(finishAttempt(p,{won:true,time:10}),'secret-won');
 assert.equal(finishAttempt(p,{won:true,time:10}),null);
 assert.equal(p.flames,1);
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};saveProfile(storage,p);
 const loaded=loadProfile(storage);assert.equal(loaded.flames,1);assert.deepEqual(loaded.defeated,[]);
 assert.deepEqual(loaded.memories,[]);assert.equal(loaded.clears,0);assert.equal(loaded.run,null);
 p.run=newRun();assert.equal(finishAttempt(p,{won:true,time:10}),'flame');
 assert.deepEqual(p.defeated,['kwon']);assert.equal(p.flames,2);
});
