import test from 'node:test';
import assert from 'node:assert/strict';
import {installJourney} from '../src/journey.mjs';
import {bindBattleSession} from '../src/battle-session.mjs';
import {SAVE_KEY} from '../src/journey-state.mjs';
function rig({holdClown=false}={}){
 const listeners=new Map(),timers=[],data=new Map(),modals={},releases=[],states=[];
 const root=()=>({addEventListener(){},removeEventListener(){},getElementById:id=>id==='result'?{hidden:false}:{focus(){}}});
 const dialog={...root(),open:true,html:'',set innerHTML(v){this.html=v;},querySelector:()=>({focus(){}}),showModal(){this.open=true;},close(){this.open=false;},addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 let current;
 const doc={...root(),hidden:false,getElementById:id=>id==='journey'?dialog:modals[id]||root().getElementById(id)};
 const win={localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},addEventListener(){},removeEventListener(){}};
 const makeGame=()=>({status:'playing',time:10,weapon:'sword',player:{maxHp:120,hp:120,potions:3},boss:{hp:100,maxHp:100}});
 releases.push(bindBattleSession(doc,()=>({game:current,start(w,configure){current=makeGame();current.weapon=w;configure(current);},menu(){},pause(){}})));
 const loadBattle=async boss=>{const launch=options=>{current=makeGame();options.configure(current);const child=root();modals[boss+'-battle']={firstElementChild:{shadowRoot:child}};releases.push(bindBattleSession(child,()=>({game:current,active:true})));return {close(){delete modals[boss+'-battle'];options.onClose();}};};return {launchClownBattle:launch,launchDiceBattle:launch};};
 let releaseClown;const scenes=[];const api=installJourney(doc,win,{loadBattle,playTransition:boss=>{scenes.push(boss);return {finished:boss==='clown'&&holdClown?new Promise(r=>releaseClown=r):Promise.resolve(true),dispose(){releaseClown?.(false);}};},makeMusic:()=>({unlock(){},update:on=>states.push(on),dispose(){}})});
 const click=(action,extra={})=>listeners.get('click')({target:{closest:()=>({dataset:{j:action,...extra}})}});
 return {api,dialog,data,states,scenes,finishScene:()=>releaseClown(true),click,poll:()=>timers[0](),game:()=>current,release:()=>releases.forEach(fn=>fn())};
}
test('controller traverses all real result stages, saves choices, records final clear and unlocks challenges',async()=>{
 const f=rig();await f.click('new');await f.click('begin');assert.equal(f.dialog.open,false);assert.equal(f.states.at(-1),false);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/검사가 되지 못한 자/);await f.click('memory-next');assert.match(f.dialog.html,/서약을 선택/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run.pending,true);
 f.poll();assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run.splits.length,1);
 await f.click('relic',{relic:'heavy'});assert.match(f.dialog.html,/다음 도전/);assert.equal(f.dialog.open,true);await f.click('next');assert.equal(f.game().journey.damage,1.25);assert.equal(f.dialog.open,false);
 f.game().status='won';await f.poll();await f.click('relic',{relic:'vital'});await f.click('next');assert.equal(f.game().player.maxHp,145);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/세 지배자를 넘어섰다/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).clears,1);assert.deepEqual(f.scenes,['kwon','clown','dice','complete']);
 await f.click('challenges');assert.doesNotMatch(f.dialog.html,/ disabled/);await f.click('challenge',{mode:'noheal'});await f.click('begin');assert.equal(f.game().player.potions,0);
 await f.api.dispose();f.release();
});
test('loss offers retry without losing the checkpoint, and home pauses and persists the active attempt',async()=>{
 const f=rig();await f.click('new');await f.click('begin');f.game().status='lost';f.poll();assert.match(f.dialog.html,/다시 일어서기/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run.deaths,1);
 await f.click('continue');assert.equal(f.game().status,'playing');await f.click('home');assert.match(f.dialog.html,/여정 이어가기/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run.elapsed,20);
 await f.api.dispose();f.release();
});

test('victory transition finishes before reward and selecting a relic waits for Next challenge',async()=>{
 const f=rig({holdClown:true});await f.click('new');await f.click('begin');const defeated=f.game();defeated.status='won';await f.poll();assert.match(f.dialog.html,/검사가 되지 못한 자/);const pending=f.click('memory-next');assert.equal(f.dialog.open,false);await f.click('relic',{relic:'heavy'});assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run.relics.length,0);f.finishScene();await pending;assert.match(f.dialog.html,/서약을 선택/);await f.click('relic',{relic:'heavy'});assert.equal(f.game(),defeated);assert.match(f.dialog.html,/다음 도전/);await f.click('next');assert.notEqual(f.game(),defeated);await f.api.dispose();f.release();
});
