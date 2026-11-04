import test from 'node:test';
import assert from 'node:assert/strict';
import {installJourney} from '../src/journey.mjs';
import {bindBattleSession} from '../src/battle-session.mjs';
import {SAVE_KEY} from '../src/journey-state.mjs';
import {BOSS_REGISTRY} from '../src/boss-registry.mjs';
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
function rig({holdClown=false,failScene=null}={}){
 const listeners=new Map(),timers=[],data=new Map(),modals={},releases=[],states=[];
 const root=()=>({addEventListener(){},removeEventListener(){},getElementById:id=>id==='result'?{hidden:false}:id==='battle-preparation'?{style:{},hidden:true}:{focus(){}}});
 const dialog={...root(),open:true,html:'',set innerHTML(v){this.html=v;},querySelector:()=>({focus(){}}),showModal(){this.open=true;},close(){this.open=false;},addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 let current,lastLaunch;
 const doc={...root(),hidden:false,getElementById:id=>id==='journey'?dialog:modals[id]||root().getElementById(id)};
 const win={localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},addEventListener(){},removeEventListener(){}};
 const makeGame=()=>({status:'playing',time:10,weapon:'sword',player:{maxHp:120,hp:120,potions:3},boss:{hp:100,maxHp:100}});
 releases.push(bindBattleSession(doc,()=>({game:current,start(w,configure){current=makeGame();current.weapon=w;configure(current);},menu(){},pause(){}})));
 const loadBattle=async boss=>{const launch=options=>{lastLaunch=options;current=makeGame();options.configure(current);const child=root();modals[boss+'-battle']={firstElementChild:{shadowRoot:child}};releases.push(bindBattleSession(child,()=>({game:current,active:true})));return {close(){delete modals[boss+'-battle'];options.onClose();}};};return {launchClownBattle:launch,launchDiceBattle:launch,launchBloodBattle:launch};};
 let releaseClown;const scenes=[];const api=installJourney(doc,win,{loadBattle,playPull:()=>{scenes.push('pull');return {finished:Promise.resolve(true),dispose(){}};},playTransition:boss=>{if(failScene===boss)throw Error('cinematic exploded');scenes.push(boss);return {finished:boss==='clown'&&holdClown?new Promise(r=>releaseClown=r):Promise.resolve(true),dispose(){releaseClown?.(false);}};},makeMusic:()=>({unlock(){},update:on=>states.push(on),dispose(){}})});
 const click=(action,extra={})=>listeners.get('click')({target:{closest:()=>({dataset:{j:action,...extra}})}});
 return {api,dialog,data,states,scenes,finishScene:()=>releaseClown(true),click,poll:()=>timers[0](),game:()=>current,lastLaunch:()=>lastLaunch,release:()=>releases.forEach(fn=>fn())};
}
test('controller traverses all real result stages, saves choices and records the final clear without any challenge modes',async()=>{
 const f=rig();await f.click('new');await f.click('begin');assert.equal(f.dialog.open,false);assert.equal(f.states.at(-1),false);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/검사가 되지 못한 자/);await f.click('memory-next');assert.match(f.dialog.html,/진화를 두 가지/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run,null);
 f.poll();assert.deepEqual(JSON.parse(f.data.get(SAVE_KEY)).defeated,['kwon']);
 await f.click('relic',{relic:'blade-wave'});assert.match(f.dialog.html,/다음 도전/);assert.equal(f.dialog.open,true);await f.click('next');assert.deepEqual(f.game().evolutions,['blade-wave']);assert.equal(f.dialog.open,false);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/영원한 마지막 공연/);await f.click('memory-next');await f.click('relic',{relic:'charged-blade'});await f.click('next');assert.deepEqual(f.game().evolutions,['blade-wave','charged-blade']);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/운명의 마지막 판돈/);await f.click('memory-next');assert.equal(JSON.parse(f.data.get(SAVE_KEY)).clears,0);assert.match(f.dialog.html,/성혈 대성당/);await f.click('next');assert.deepEqual(f.game().evolutions,['blade-wave','charged-blade']);assert.equal(f.game().boss.maxHp,BOSS_REGISTRY.blood.maxHp);f.game().status='won';await f.poll();assert.match(f.dialog.html,/영원하지 못한 생명/);await f.click('memory-next');assert.match(f.dialog.html,/네 지배자를 넘어섰다/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).clears,1);assert.deepEqual(JSON.parse(f.data.get(SAVE_KEY)).memories.map(m=>m.id),['kwon','clown','dice','blood']);assert.deepEqual(f.scenes,['kwon','pull','clown','pull','dice','pull','blood','complete']);
 assert.doesNotMatch(f.dialog.html,/도전 시련|연속 격파|무회복/);await f.click('home');assert.doesNotMatch(f.dialog.html,/도전 시련/);
 await f.api.dispose();f.release();
});
test('loss and home discard the run while permanent kill records remain',async()=>{
 const f=rig();await f.click('new');await f.click('begin');f.game().status='lost';f.poll();assert.match(f.dialog.html,/처음부터 다시 도전/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run,null);
 await f.click('restart');assert.equal(f.game().status,'playing');await f.click('home');assert.doesNotMatch(f.dialog.html,/여정 이어가기/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run,null);
 await f.api.dispose();f.release();
});

test('story and reward precede the chain pull and next boss cinematic',async()=>{
 const f=rig({holdClown:true});await f.click('new');await f.click('begin');const defeated=f.game();defeated.status='won';await f.poll();assert.match(f.dialog.html,/검사가 되지 못한 자/);await f.click('memory-next');assert.match(f.dialog.html,/진화를 두 가지/);assert.deepEqual(f.scenes,['kwon']);await f.click('relic',{relic:'blade-wave'});assert.equal(f.game(),defeated);const pending=f.click('next');assert.deepEqual(f.scenes,['kwon','pull']);await flush();assert.deepEqual(f.scenes,['kwon','pull','clown']);f.finishScene();await pending;assert.notEqual(f.game(),defeated);await f.api.dispose();f.release();
});

test('a failing boss cinematic is switched off for good and the battle still starts',async()=>{
 const f=rig({failScene:'clown'});await f.click('new');await f.click('begin');f.game().status='won';await f.poll();await f.click('memory-next');await f.click('relic',{relic:'blade-wave'});
 const defeated=f.game();await f.click('next');
 assert.notEqual(f.game(),defeated,'the clown battle opened even though its cinematic threw');assert.equal(f.api.transitionsEnabled,false);
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('relic',{relic:'charged-blade'});
 const before=[...f.scenes];await f.click('next');assert.deepEqual(f.scenes,before,'no cinematic runs after the first failure');assert.equal(f.dialog.open,false);
 await f.api.dispose();f.release();
});

test('closing during the victory animation still preserves the defeated boss but never the active run',async()=>{const f=rig();await f.click('new');await f.click('begin');f.game().status='won';await f.api.dispose();const saved=JSON.parse(f.data.get(SAVE_KEY));assert.deepEqual(saved.defeated,['kwon']);assert.equal(saved.run,null);f.release();});

test('hidden title route launches selected boss and retries without journey rewards or records',async()=>{
 const f=rig();for(let i=0;i<5;i++)await f.click('secret-tap');assert.match(f.dialog.html,/봉인 밖의 문/);
 await f.click('secret-weapon',{weapon:'bow'});await f.click('secret-enter',{boss:'dice'});assert.equal(f.game().boss.maxHp,BOSS_REGISTRY.dice.maxHp);assert.deepEqual(f.game().evolutions,[]);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/같은 보스 재도전/);assert.doesNotMatch(f.dialog.html,/진화를 두 가지/);
 await f.click('secret-retry');assert.equal(f.game().boss.maxHp,BOSS_REGISTRY.dice.maxHp);f.game().status='lost';await f.poll();assert.match(f.dialog.html,/다른 보스로 이동/);
 await f.click('secret-menu');assert.match(f.dialog.html,/봉인 밖의 문/);await f.click('secret-enter',{boss:'clown'});assert.equal(f.game().boss.maxHp,BOSS_REGISTRY.clown.maxHp);
 f.game().status='won';await f.api.dispose();const saved=JSON.parse(f.data.get(SAVE_KEY));assert.deepEqual(saved.defeated,[]);assert.deepEqual(saved.memories,[]);assert.equal(saved.clears,0);assert.equal(saved.run,null);f.release();
});

test('hidden possession entry keeps phase two on retry without affecting journey records',async()=>{const f=rig();for(let i=0;i<5;i++)await f.click('secret-tap');assert.match(f.dialog.html,/육체 강탈부터/);await f.click('secret-giant');assert.equal(f.lastLaunch().startPhase,2);f.game().status='lost';await f.poll();await f.click('secret-retry');assert.equal(f.lastLaunch().startPhase,2);await f.api.dispose();assert.equal(JSON.parse(f.data.get(SAVE_KEY)).clears,0);f.release();});
