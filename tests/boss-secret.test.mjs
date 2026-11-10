import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,newRun,finishAttempt,saveProfile,loadProfile} from '../src/journey-state.mjs';
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
