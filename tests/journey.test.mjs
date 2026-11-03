import test from 'node:test';
import assert from 'node:assert/strict';
import {freshProfile,newRun,finishAttempt,chooseRelic,configureJourney,loadProfile,saveProfile,SAVE_KEY} from '../src/journey-state.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {actPlayer,tickPlayerAction} from '../src/player-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';

test('three boss journey saves reward checkpoints and completes once with all splits',()=>{
 const p=freshProfile();p.run=newRun('hammer');
 assert.equal(finishAttempt(p,{won:true,time:32}),'reward');
 assert.equal(p.run.stage,0);assert.equal(finishAttempt(p,{won:true,time:999}),null);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(saveProfile(storage,p),true);const restored=loadProfile(storage);
 assert.equal(restored.run.pending,true);chooseRelic(restored.run,'heavy');
 assert.equal(restored.run.stage,1);assert.throws(()=>chooseRelic(restored.run,'vital'));
 finishAttempt(restored,{won:false,time:10});assert.equal(restored.run.stage,1);assert.equal(restored.run.deaths,1);
 finishAttempt(restored,{won:true,time:45});chooseRelic(restored.run,'vital');
 assert.equal(finishAttempt(restored,{won:true,time:60}),'complete');
 assert.equal(restored.clears,1);assert.equal(restored.run,null);assert.equal(restored.records[0].time,147);assert.equal(restored.records[0].weapon,'hammer');
 assert.equal(finishAttempt(restored,{won:true,time:1}),null);assert.equal(restored.clears,1);
});
test('rush loss resets stage and relics, while time and normal preserve checkpoints',()=>{
 for(const mode of ['rush','story','time','noheal']){const p=freshProfile();p.run=newRun('bow',mode);finishAttempt(p,{won:true,time:10});chooseRelic(p.run,'swift');finishAttempt(p,{won:false,time:20});assert.equal(p.run.stage,mode==='rush'?0:1);assert.equal(p.run.relics.length,mode==='rush'?0:1);assert.equal(p.run.elapsed,30);}
});
test('invalid and unavailable saves recover without crashing; records are bounded',()=>{
 for(const value of ['null','{','{"version":2}',JSON.stringify({version:1,run:{stage:99}})])assert.equal(loadProfile({getItem:()=>value}).run,null);
 assert.equal(saveProfile({setItem(){throw Error('quota');}},freshProfile()),false);
 assert.deepEqual(loadProfile(undefined),freshProfile());
 const p=freshProfile();p.records=Array.from({length:50},()=>({mode:'story',weapon:'sword',time:100,deaths:0}));assert.equal(loadProfile({getItem:()=>JSON.stringify(p)}).records.length,40);
 assert.throws(()=>newRun('invalid'));assert.throws(()=>newRun('sword','invalid'));
});
test('no-heal and vitality apply to every real encounter engine without changing unrelated games',()=>{
 for(const make of [w=>createGame(w,{register:false}),w=>createClownGame(w,{register:false}),createDicePlayerGame]){
  const r=newRun('sword','noheal');r.relics=['vital','vital'];const g=make('sword');configureJourney(g,r);
  assert.equal(g.player.potions,0);assert.equal(g.player.maxHp,170);assert.equal(g.player.hp,170);
  assert.equal(actPlayer(g,'heal'),false);assert.equal(actPlayer(g,'roll'),true);assert.equal(g.player.stamina,85);
  assert.equal(make('sword').player.maxHp,120);
 }
});
test('damage, attack speed and stamina tradeoffs affect real melee and projectile actions',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createGame(weapon,{register:false}),r=newRun(weapon);r.relics=['swift','heavy'];configureJourney(g,r);
  assert.ok(actPlayer(g,'light'));assert.equal(g.player.stamina,100-WEAPONS[weapon].cost-6);
  assert.ok(Math.abs(g.player.action.mult-1.125)<1e-9);assert.ok(Math.abs(g.player.action.wind-WEAPONS[weapon].wind*.85)<1e-9);
  if(WEAPONS[weapon].projectile){tickPlayerAction(g,g.player.action.wind+.001,WEAPONS[weapon]);assert.ok(g.projectiles.length>0);assert.ok(Math.abs(g.projectiles[0].damage-WEAPONS[weapon].damage*1.125)<1e-8);}
 }
});
