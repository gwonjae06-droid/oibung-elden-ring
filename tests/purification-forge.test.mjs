import test from 'node:test';
import assert from 'node:assert/strict';
import {EVOLUTIONS,evolutionCount} from '../src/weapon-evolution.mjs';
import {freshProfile,newRun,finishAttempt,advanceJourney,configureJourney,loadProfile,saveProfile,SAVE_KEY} from '../src/journey-state.mjs';
import {forgeTier,flameBalance,investedFlames,buyForgeTier,refundForgeWeapon,consumeRevivalFlame,forgedEvolutions,sanitizeForge} from '../src/purification-forge.mjs';
import {forgeScreen,flameRewardScreen} from '../src/forge-view.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';

const buy=(p,weapon,id)=>assert.equal(buyForgeTier(p,weapon,id),true);
const view={button:(id,text,attrs='')=>'<button data-j="'+id+'" '+attrs+'>'+text+'</button>',back:()=>'<button data-j="home">닫기</button>',warning:()=>''};

test('four weapons each expose two independent evolution paths with two tiers',()=>{
 const f=sanitizeForge(null);
 for(const [weapon,paths] of Object.entries(EVOLUTIONS)){
  assert.equal(paths.length,2);
  assert.deepEqual(Object.keys(f[weapon]),paths.map(x=>x.id));
  assert.deepEqual(Object.values(f[weapon]),[0,0]);
 }
});
test('one flame per defeat, once per boss-result, and another flame on every repeat clear',()=>{
 const p=freshProfile();
 p.run=newRun();assert.equal(finishAttempt(p,{won:true,time:10}),'flame');
 assert.equal(finishAttempt(p,{won:true,time:11}),null);
 assert.equal(p.flames,1);
 advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:8}),'flame');
 assert.equal(p.flames,2);
 advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:7}),'flame');
 advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:4}),'complete');
 assert.equal(p.flames,4);assert.equal(p.earnedFlames,4);assert.equal(p.run,null);
 p.run=newRun();assert.equal(finishAttempt(p,{won:true,time:1}),'flame');
 assert.equal(p.flames,5);assert.equal(p.earnedFlames,5);
});
test('practice/hidden bosses grant a flame every victory but never fake campaign clears',()=>{
 const p=freshProfile();
 for(let i=0;i<3;i++){
  p.run={...newRun(),secret:true,stage:2};
  assert.equal(finishAttempt(p,{won:true,time:13}),'secret-won');
  assert.equal(finishAttempt(p,{won:true,time:14}),null,'secret result awarded twice');
 }
 assert.equal(p.flames,3);
 assert.equal(p.defeated.length,0);assert.equal(p.records.length,0);
 p.run={...newRun(),secret:true};assert.equal(finishAttempt(p,{won:false,time:10}),'secret-lost');
 assert.equal(p.flames,3);
});
test('purchase, rank cap, insufficient balance and refunded flames preserve totals',()=>{
 const p=freshProfile();p.flames=4;p.earnedFlames=4;
 const [a,b]=EVOLUTIONS.sword;
 buy(p,'sword',a.id);buy(p,'sword',a.id);buy(p,'sword',b.id);buy(p,'sword',b.id);
 assert.equal(p.flames,0);assert.equal(investedFlames(p),4);
 assert.equal(forgeTier(p,'sword',a.id),2);
 assert.equal(buyForgeTier(p,'sword',a.id),false,'cannot exceed two tiers');
 assert.equal(buyForgeTier(p,'bow',EVOLUTIONS.bow[0].id),false);
 assert.deepEqual(forgedEvolutions(p,'sword'),[a.id,a.id,b.id,b.id]);
 assert.equal(refundForgeWeapon(p,'sword'),4);
 assert.equal(p.flames,4);assert.equal(investedFlames(p),0);assert.equal(refundForgeWeapon(p,'sword'),0);
 buy(p,'bow',EVOLUTIONS.bow[0].id);
 assert.equal(p.flames,3);assert.equal(forgeTier(p,'bow',EVOLUTIONS.bow[0].id),1);
 assert.equal(p.earnedFlames,4,'refund does not inflate lifetime earn count');
});
test('forge tiers follow the weapon into every boss without being a run-specific reward',()=>{
 const p=freshProfile();p.flames=10;
 buy(p,'sword','blade-wave');buy(p,'sword','charged-blade');
 const engines=[
  ()=>createGame('sword',{register:false}),
  ()=>createClownGame('sword',{register:false}),
  ()=>createDicePlayerGame('sword'),
  ()=>createBloodGame('sword')
 ];
 engines.forEach((make,stage)=>{
  const g=make(),run=newRun('sword');run.stage=stage;
  configureJourney(g,run,p);
  assert.equal(evolutionCount(g,'blade-wave'),1);
  assert.equal(evolutionCount(g,'charged-blade'),1);
  assert.equal(g.startGrace,1.6);
 });
 const other=createGame('hammer',{register:false});configureJourney(other,newRun('hammer'),p);
 assert.equal(evolutionCount(other,'blade-wave'),0,'forged swords cannot leak into hammer');
});
test('revive spends one flame, leaves the current stage, and cannot be repeated in one run',()=>{
 const p=freshProfile();p.flames=2;const r=newRun('sword');r.stage=2;
 assert.equal(consumeRevivalFlame(p,r),true);
 assert.equal(p.flames,1);assert.equal(r.reviveUsed,true);assert.equal(r.stage,2);
 assert.equal(consumeRevivalFlame(p,r),false);assert.equal(p.flames,1);
 assert.equal(consumeRevivalFlame(p,{...newRun(),secret:true}),false);
 assert.equal(consumeRevivalFlame(p,newRun()),true);assert.equal(p.flames,0);
 assert.equal(consumeRevivalFlame(p,newRun()),false);
});
test('v4 save keeps forge and earned flames per browser but not active run',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const p=freshProfile();p.flames=4;p.earnedFlames=4;buy(p,'cards','wide-deck');p.run=newRun('cards');p.run.reviveUsed=true;
 assert.equal(saveProfile(storage,p),true);
 const raw=JSON.parse(data.get(SAVE_KEY));
 assert.equal(raw.run,null);assert.equal(raw.forge.cards['wide-deck'],1);
 const loaded=loadProfile(storage);
 assert.equal(loaded.version,4);assert.equal(loaded.flames,3);assert.equal(loaded.earnedFlames,4);
 assert.equal(forgeTier(loaded,'cards','wide-deck'),1);assert.equal(loaded.run,null);
 const other=loadProfile({getItem:()=>null});
 assert.equal(other.flames,0,'browser storage is independent');
});
test('old v3 saves migrate without fabricating retroactive currency',()=>{
 const old={version:3,clears:3,defeated:['kwon'],records:[],memories:[],run:null};
 const p=loadProfile({getItem:()=>JSON.stringify(old)});
 assert.equal(p.version,4);assert.equal(p.flames,0);assert.equal(p.earnedFlames,0);
 assert.equal(investedFlames(p),0);assert.deepEqual(p.defeated,['kwon','clown','dice']);
 const poison=loadProfile({getItem:()=>JSON.stringify({...old,version:4,flames:-2,forge:{sword:{'blade-wave':999,'constructor':8}}})});
 assert.equal(poison.flames,0);assert.equal(forgeTier(poison,'sword','blade-wave'),0);
 assert.equal(forgeTier(poison,'sword','constructor'),0);
});
test('rendered Korean forge offers each tier, refund and the victory flame',()=>{
 const p=freshProfile();p.flames=3;p.earnedFlames=3;
 const html=forgeScreen(p,'sword',view);
 assert.match(html,/대장간/);assert.match(html,/정화의 불꽃/);
 assert.match(html,/data-evolution="blade-wave"/);
 assert.match(html,/data-evolution="charged-blade"/);
 assert.match(html,/data-j="forge-refund"/);
 assert.match(html,/data-weapon="cards"/);
 const gained=flameRewardScreen(p,'영원한 혈왕 배서준',{...view,complete:true});
 assert.match(gained,/정화의 불꽃을 획득했습니다/);
 assert.match(gained,/data-j="flame-next"/);
 assert.doesNotMatch(gained,/data-j="relic"/);
});
