import test from 'node:test';
import assert from 'node:assert/strict';
import {EVOLUTIONS,evolutionCount} from '../src/weapon-evolution.mjs';
import {freshProfile,newRun,finishAttempt,advanceJourney,configureJourney,loadProfile,saveProfile,SAVE_KEY} from '../src/journey-state.mjs';
import {forgeTier,flameBalance,investedFlames,buyForgeTier,refundForgeWeapon,forgedEvolutions,sanitizeForge,grantForgeDeveloperFlames,isForgeDeveloperShortcut,MAX_FLAMES,consumeRevivalFlame} from '../src/purification-forge.mjs';
import {forgeScreen,flameRewardScreen} from '../src/forge-view.mjs';
import {createGame} from '../src/combat.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';

const buy=(p,weapon,id)=>assert.equal(buyForgeTier(p,weapon,id),true);
test('cached pre-shortcut modules can import the retired revival name without spending flames',()=>{
 const p=freshProfile();p.flames=2;p.run=newRun();
 const before=JSON.stringify(p);
 assert.equal(consumeRevivalFlame(p,p.run),false);
 assert.equal(JSON.stringify(p),before);
});
const view={button:(id,text,attrs='')=>'<button data-j="'+id+'" '+attrs+'>'+text+'</button>',back:()=>'<button data-j="home">닫기</button>',warning:()=>''};

test('four weapons expose two mutually exclusive paths with two tiers',()=>{
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
 advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:4}),'flame');advanceJourney(p.run);assert.equal(finishAttempt(p,{won:true,time:3}),'complete');
 assert.equal(p.flames,5);assert.equal(p.earnedFlames,5);assert.equal(p.run,null);
 p.run=newRun();assert.equal(finishAttempt(p,{won:true,time:1}),'flame');
 assert.equal(p.flames,6);assert.equal(p.earnedFlames,6);
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
 buy(p,'sword',a.id);buy(p,'sword',a.id);
 assert.equal(buyForgeTier(p,'sword',b.id),false,'opposite path is locked after a purchase');
 assert.equal(p.flames,2);assert.equal(investedFlames(p),2);
 assert.equal(forgeTier(p,'sword',a.id),2);
 assert.equal(buyForgeTier(p,'sword',a.id),false,'cannot exceed two tiers');
 assert.deepEqual(forgedEvolutions(p,'sword'),[a.id,a.id]);
 assert.equal(refundForgeWeapon(p,'sword'),2);
 assert.equal(p.flames,4);assert.equal(investedFlames(p),0);assert.equal(refundForgeWeapon(p,'sword'),0);
 buy(p,'sword',b.id);assert.equal(forgeTier(p,'sword',b.id),1,'refunded weapon can switch paths');
 assert.equal(refundForgeWeapon(p,'sword'),1);
 buy(p,'bow',EVOLUTIONS.bow[0].id);
 assert.equal(p.flames,3);assert.equal(forgeTier(p,'bow',EVOLUTIONS.bow[0].id),1);
 assert.equal(p.earnedFlames,4,'refund does not inflate lifetime earn count');
});
test('forge tiers follow the weapon into every boss without being a run-specific reward',()=>{
 const p=freshProfile();p.flames=10;
 buy(p,'sword','blade-wave');assert.equal(buyForgeTier(p,'sword','charged-blade'),false);
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
  assert.equal(evolutionCount(g,'charged-blade'),0);
  assert.equal(g.startGrace,0);
  assert.equal(g.introControlled,true);
 });
 const other=createGame('hammer',{register:false});configureJourney(other,newRun('hammer'),p);
 assert.equal(evolutionCount(other,'blade-wave'),0,'forged swords cannot leak into hammer');
});
test('legacy dual-path purchases retain the stronger rank and refund the other on load',()=>{
 const legacy=freshProfile();legacy.flames=1;legacy.earnedFlames=5;
 legacy.forge.sword['blade-wave']=1;legacy.forge.sword['charged-blade']=2;
 const restored=loadProfile({getItem:()=>JSON.stringify(legacy)});
 assert.equal(forgeTier(restored,'sword','blade-wave'),0);
 assert.equal(forgeTier(restored,'sword','charged-blade'),2);
 assert.equal(restored.flames,2,'one displaced tier is returned');
 assert.equal(restored.earnedFlames,5,'migration does not invent earned flames');
 const second=loadProfile({getItem:()=>JSON.stringify(restored)});
 assert.equal(second.flames,2,'migration is idempotent');
});
test('v4 save keeps forge and earned flames per browser but not active run',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const p=freshProfile();p.flames=4;p.earnedFlames=4;buy(p,'cards','wide-deck');p.run=newRun('cards');
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
 const first=freshProfile();first.flames=2;buy(first,'sword','blade-wave');
 const locked=forgeScreen(first,'sword',view);
 assert.match(locked,/반대 계열 각인됨/);
 assert.match(locked,/data-evolution="charged-blade"[^>]+disabled/);
 assert.match(html,/data-j="forge-refund"/);
 assert.match(html,/data-weapon="cards"/);
 const gained=flameRewardScreen(p,'영원한 혈왕 배서준',{...view,complete:true});
 assert.match(gained,/정화의 불꽃을 획득했습니다/);
 assert.match(gained,/data-j="flame-next"/);
 assert.doesNotMatch(gained,/data-j="relic"/);
 assert.match(gained,/해금한 보스에게는 시련 시작 화면에서 자유롭게 이동할 수 있습니다/);
 assert.doesNotMatch(gained,/해금된 마지막 보스로 건너뛸/);
 assert.doesNotMatch(gained,/부활/);
});

test('semicolon developer Easter egg grants exactly two saved flames and honors the balance cap',()=>{
 const p=freshProfile();
 assert.equal(grantForgeDeveloperFlames(p),2);
 assert.equal(p.flames,2);assert.equal(p.earnedFlames,2);
 assert.equal(grantForgeDeveloperFlames(p),2);
 assert.equal(p.flames,4);
 p.flames=MAX_FLAMES-1;
 assert.equal(grantForgeDeveloperFlames(p),0,'partial grants would violate the explicit +2 promise');
 assert.equal(p.flames,MAX_FLAMES-1);
 assert.equal(grantForgeDeveloperFlames(null),0);
});
test('developer shortcut accepts only a non-repeating, unmodified semicolon key away from form fields',()=>{
 const event={code:'Semicolon',key:';',repeat:false,ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,target:{closest:()=>null}};
 assert.equal(isForgeDeveloperShortcut(event),true);
 assert.equal(isForgeDeveloperShortcut({...event,key:'ㅁ'}),true,'physical key should work across keyboard layouts');
 for(const field of ['repeat','ctrlKey','altKey','metaKey','shiftKey']){
  assert.equal(isForgeDeveloperShortcut({...event,[field]:true}),false,field);
 }
 assert.equal(isForgeDeveloperShortcut({...event,code:'KeyA',key:'a'}),false);
 assert.equal(isForgeDeveloperShortcut({...event,target:{closest:()=>({tagName:'INPUT'})}}),false);
 const html=forgeScreen(freshProfile(),'sword',view);
 assert.doesNotMatch(html,/개발자용 이스터에그|data-forge-dev-easter-egg|<kbd>;<\/kbd>|j-forge-dev-result/,'hidden shortcut must not be advertised in forge markup');
});
