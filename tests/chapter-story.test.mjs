import test from 'node:test';
import assert from 'node:assert/strict';
import {sanctuaryPose} from '../src/sanctuary.mjs';
import {freshProfile,newRun,finishAttempt,loadProfile,saveProfile,SAVE_KEY} from '../src/journey-state.mjs';
test('old three-boss saves retain their checkpoint and gain an empty memory collection',()=>{
 const old={version:1,clears:2,records:[],run:{...newRun('bow'),stage:2,relics:['heavy','vital']}};
 const loaded=loadProfile({getItem:()=>JSON.stringify(old)});assert.equal(loaded.run,null);assert.equal(loaded.clears,2);assert.deepEqual(loaded.memories,[]);
});
test('first victory grants a persistent memory once and remembers an unread checkpoint',()=>{
 const p=freshProfile();p.run=newRun();finishAttempt(p,{won:false,time:1});assert.equal(p.memories.length,0);
 finishAttempt(p,{won:true,time:10});assert.equal(p.memories.length,1);assert.equal(p.run.memoryRead,false);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};saveProfile(storage,p);const loaded=loadProfile(storage);assert.equal(loaded.memories[0].id,'kwon');assert.equal(loaded.run,null);
 loaded.run=newRun();finishAttempt(loaded,{won:true,time:1});assert.equal(loaded.memories.length,1);
});
test('sanctuary falls only in phase two and silence dims the defeated arena',()=>{
 assert.equal(sanctuaryPose(1,100).fall,0);assert.equal(sanctuaryPose(2,0).fall,0);assert.equal(sanctuaryPose(2,3).fall,1);assert.equal(sanctuaryPose(2,3,true).silence,1);assert.equal(sanctuaryPose(1,0).gold,0);
});
