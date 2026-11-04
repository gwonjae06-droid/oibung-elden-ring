import test from 'node:test';
import assert from 'node:assert/strict';
import {createChapterClock} from '../src/chapter-environment.mjs';
import {CHAPTER_MEMORIES,rememberBoss} from '../src/chapter-story.mjs';
import {freshProfile,newRun,finishAttempt,chooseRelic,loadProfile} from '../src/journey-state.mjs';
test('phase hush and collapse do not advance when simulation time is paused',()=>{
 const clock=createChapterClock();clock.update(20,1);const first=clock.update(21,2);
 assert.equal(first.hush,true);assert.equal(first.collapse,0);
 assert.deepEqual(clock.update(21,2,false,0),first);
 assert.equal(clock.update(22,2).hush,false);assert.equal(clock.update(24,2).collapse,1);
 const reset=clock.update(0,1);assert.equal(reset.collapse,0);assert.equal(reset.hush,false);
});
test('death fades after combat time stops but respects pause and restart',()=>{
 const clock=createChapterClock();clock.update(20,2,true,0);
 for(let i=0;i<30;i++)clock.update(20,2,true,.05);
 const paused=clock.update(20,2,true,0);assert.ok(paused.silence>.8);assert.deepEqual(clock.update(20,2,true,0),paused);
 for(let i=0;i<10;i++)clock.update(20,2,true,.05);
 assert.equal(clock.update(20,2,true,0).silence,1);assert.equal(clock.update(0,1,false,0).silence,0);
});
test('all three victories grant unique permanent memories before rewards or completion',()=>{
 const p=freshProfile();p.run=newRun();
 finishAttempt(p,{won:true,time:10});chooseRelic(p.run,'blade-wave');finishAttempt(p,{won:true,time:20});chooseRelic(p.run,'charged-blade');finishAttempt(p,{won:true,time:30});
 assert.deepEqual(p.memories.map(m=>m.id),['kwon','clown','dice']);
 const first=p.memories[1].firstClear;rememberBoss(p,'clown','2099-01-01');assert.equal(p.memories[1].firstClear,first);
 const saved=loadProfile({getItem:()=>JSON.stringify(p)});assert.deepEqual(saved.memories,p.memories);assert.equal(saved.run,null);
 assert.ok(Object.values(CHAPTER_MEMORIES).every(m=>m.last&&m.oath&&m.text));
});
test('memory migration removes duplicates and malformed dates without losing valid old memories',()=>{
 const p=freshProfile();p.memories=[{id:'kwon',firstClear:null},{id:'clown',firstClear:'2026-11-04T00:00:00Z'},{id:'kwon',firstClear:null},{id:'dice',firstClear:'invalid'},{id:'mirror',firstClear:null}];
 const result=loadProfile({getItem:()=>JSON.stringify(p)});assert.deepEqual(result.memories,p.memories.slice(0,2));
});
