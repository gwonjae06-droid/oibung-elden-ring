import test from 'node:test';
import assert from 'node:assert/strict';
import {installJourney} from '../src/journey.mjs';
import {bindBattleSession} from '../src/battle-session.mjs';
import {SAVE_KEY,freshProfile} from '../src/journey-state.mjs';
import {BOSS_REGISTRY} from '../src/boss-registry.mjs';
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
function rig({holdClown=false,failScene=null,savedProfile=null,failLoadOnce=false}={}){
 const listeners=new Map(),windowListeners=new Map(),timers=[],data=new Map(),modals={},releases=[],states=[];
 if(savedProfile)data.set(SAVE_KEY,JSON.stringify(savedProfile));
 const root=()=>({addEventListener(){},removeEventListener(){},getElementById:id=>id==='result'?{hidden:false}:id==='battle-preparation'?{style:{},hidden:true}:{focus(){}}});
 const dialog={...root(),open:true,html:'',set innerHTML(v){this.html=v;},querySelector:()=>({focus(){}}),showModal(){this.open=true;},close(){this.open=false;},addEventListener:(n,fn)=>listeners.set(n,fn),removeEventListener:n=>listeners.delete(n)};
 let current,lastLaunch;
 const doc={...root(),hidden:false,getElementById:id=>id==='journey'?dialog:modals[id]||root().getElementById(id)};
 const win={localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},setInterval:fn=>{timers.push(fn);return timers.length;},clearInterval(){},addEventListener:(type,fn)=>{const a=windowListeners.get(type)||[];a.push(fn);windowListeners.set(type,a);},removeEventListener:(type,fn)=>{windowListeners.set(type,(windowListeners.get(type)||[]).filter(f=>f!==fn));}};
 const makeGame=()=>({status:'playing',time:10,weapon:'sword',player:{maxHp:120,hp:120,potions:3},boss:{hp:100,maxHp:100}});
 releases.push(bindBattleSession(doc,()=>({game:current,start(w,configure){current=makeGame();current.weapon=w;configure(current);},menu(){},pause(){}})));
 const loadBattle=async boss=>{if(failLoadOnce){failLoadOnce=false;throw Error('test load failure');}const launch=options=>{lastLaunch=options;current=makeGame();options.configure(current);const child=root();modals[boss+'-battle']={firstElementChild:{shadowRoot:child}};releases.push(bindBattleSession(child,()=>({game:current,active:true})));return {close(){delete modals[boss+'-battle'];options.onClose();}};};return {launchClownBattle:launch,launchDiceBattle:launch,launchBloodBattle:launch,launchGyuwonBattle:launch};};
 let releaseClown;const scenes=[];const api=installJourney(doc,win,{loadBattle,playPull:()=>{scenes.push('pull');return {finished:Promise.resolve(true),dispose(){}};},playTransition:boss=>{if(failScene===boss)throw Error('cinematic exploded');scenes.push(boss);return {finished:boss==='clown'&&holdClown?new Promise(r=>releaseClown=r):Promise.resolve(true),dispose(){releaseClown?.(false);}};},makeMusic:()=>({unlock(){},update:on=>states.push(on),dispose(){}})});
 const click=(action,extra={})=>listeners.get('click')({target:{closest:()=>({dataset:{j:action,...extra}})}});
 const key=(code='Semicolon',overrides={})=>{const event={code,key:';',repeat:false,ctrlKey:false,altKey:false,metaKey:false,shiftKey:false,target:{closest:()=>null},preventDefault(){this.prevented=true;},...overrides};for(const handler of windowListeners.get('keydown')||[])handler(event);return event;};
 return {api,dialog,data,states,scenes,finishScene:()=>releaseClown(true),click,key,poll:()=>timers[0](),game:()=>current,lastLaunch:()=>lastLaunch,release:()=>releases.forEach(fn=>fn())};
}
test('controller grants five repeatable flames, replaces relic choices, and records a full clear',async()=>{
 const f=rig();await f.click('new');await f.click('begin');
 assert.equal(f.dialog.open,false);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/검사가 되지 못한 자/);
 await f.click('memory-next');assert.match(f.dialog.html,/정화의 불꽃을 획득했습니다/);
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).flames,1);
 f.poll();assert.equal(JSON.parse(f.data.get(SAVE_KEY)).flames,1,'victory counted twice');
 await f.click('flame-next');assert.match(f.dialog.html,/다음 도전/);
 await f.click('next');assert.deepEqual(f.game().evolutions,[]);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/영원한 마지막 공연/);
 await f.click('memory-next');await f.click('flame-next');await f.click('next');
 assert.deepEqual(f.game().evolutions,[]);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/운명의 마지막 판돈/);
 await f.click('memory-next');await f.click('flame-next');
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).clears,0);
 assert.match(f.dialog.html,/성혈 대성당/);
 await f.click('next');assert.equal(f.game().boss.maxHp,6345);
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/영원하지 못한 생명/);
 await f.click('memory-next');assert.match(f.dialog.html,/정화의 불꽃을 획득했습니다/);
 await f.click('flame-next');await f.click('next');
 f.game().status='won';await f.poll();assert.match(f.dialog.html,/다섯 지배자를 넘어섰다/);
 const saved=JSON.parse(f.data.get(SAVE_KEY));
 assert.equal(saved.clears,1);assert.equal(saved.flames,5);assert.equal(saved.earnedFlames,5);
 assert.deepEqual(saved.memories.map(m=>m.id),['kwon','clown','dice','blood','gyuwon']);
 assert.deepEqual(f.scenes,['kwon','pull','clown','pull','dice','pull','blood','pull','gyuwon','complete']);
 assert.doesNotMatch(f.dialog.html,/무기 진화 선택|도전 시련|연속 격파|무회복/);
 await f.click('home');await f.api.dispose();f.release();
});
test('after a boss clear, home is in the top-left header rather than next to the next-boss button',async()=>{
 const f=rig();await f.click('new');await f.click('begin');
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('flame-next');
 const html=f.dialog.html;
 const header=html.match(/<header class="j-top">([\s\S]*?)<\/header>/)?.[1];
 const main=html.match(/<main class="j-main">([\s\S]*?)<\/main>/)?.[1];
 assert.ok(header&&main);
 assert.match(header,/data-j="home"/);
 assert.doesNotMatch(main,/data-j="home"/);
 assert.match(main,/data-j="next"/);
 assert.equal((html.match(/data-j="home"/g)||[]).length,1);
 await f.click('next');assert.equal(f.game().status,'playing');
 await f.api.dispose();f.release();
});
test('loss and home discard the run while permanent kill records remain',async()=>{
 const f=rig();await f.click('new');await f.click('begin');f.game().status='lost';f.poll();assert.match(f.dialog.html,/처음부터 다시 도전/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run,null);
 await f.click('restart');assert.equal(f.game().status,'playing');await f.click('home');assert.doesNotMatch(f.dialog.html,/여정 이어가기/);assert.equal(JSON.parse(f.data.get(SAVE_KEY)).run,null);
 await f.api.dispose();f.release();
});
test('the defeat tip comes from the boss registry',async()=>{
 const f=rig();await f.click('new');await f.click('begin');f.game().status='lost';f.poll();
 assert.ok(f.dialog.html.includes(BOSS_REGISTRY.kwon.hint(f.game())));
 await f.api.dispose();f.release();
});

test('memory and flame claim precede the chain pull and the next boss cinematic',async()=>{
 const f=rig({holdClown:true});await f.click('new');await f.click('begin');
 const defeated=f.game();defeated.status='won';await f.poll();
 assert.match(f.dialog.html,/검사가 되지 못한 자/);
 await f.click('memory-next');assert.match(f.dialog.html,/정화의 불꽃을 획득했습니다/);
 assert.deepEqual(f.scenes,['kwon']);await f.click('flame-next');assert.equal(f.game(),defeated);
 const pending=f.click('next');assert.deepEqual(f.scenes,['kwon','pull']);
 await flush();assert.deepEqual(f.scenes,['kwon','pull','clown']);
 f.finishScene();await pending;assert.notEqual(f.game(),defeated);
 await f.api.dispose();f.release();
});
test('a failing boss cinematic is disabled and next boss still launches after flame claim',async()=>{
 const f=rig({failScene:'clown'});await f.click('new');await f.click('begin');
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('flame-next');
 const defeated=f.game();await f.click('next');
 assert.notEqual(f.game(),defeated);assert.equal(f.api.transitionsEnabled,false);
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('flame-next');
 const before=[...f.scenes];await f.click('next');
 assert.deepEqual(f.scenes,before);assert.equal(f.dialog.open,false);
 await f.api.dispose();f.release();
});
test('closing during the victory animation still preserves the defeated boss but never the active run',async()=>{const f=rig();await f.click('new');await f.click('begin');f.game().status='won';await f.api.dispose();const saved=JSON.parse(f.data.get(SAVE_KEY));assert.deepEqual(saved.defeated,['kwon']);assert.equal(saved.flames,1);assert.equal(saved.run,null);f.release();});

test('repeated title taps and retired gate actions cannot mint flames or bypass boss locks',async()=>{
 const f=rig(),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 for(let i=0;i<20;i++)await f.click('secret-tap');
 assert.equal(saved().flames,0);assert.equal(saved().earnedFlames,0);
 assert.doesNotMatch(f.dialog.html,/data-j="secret-tap"|data-j="gate-boss"/);
 await f.click('gate-boss',{stage:'4'});
 await f.click('secret-enter',{boss:'blood'});
 assert.equal(saved().run,null);assert.deepEqual(saved().defeated,[]);
 await f.click('new');
 assert.match(f.dialog.html,/data-j="boss-target"[^>]*data-stage="4"[^>]*disabled/);
 await f.click('boss-target',{stage:'4'});await f.click('begin');
 assert.equal(f.game().boss.maxHp,4822);
 await f.api.dispose();f.release();
});
test('old hidden ODEN key path no longer opens a boss selector or mints flames',async()=>{
 const f=rig(),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 for(const code of ['KeyO','KeyD','KeyE','KeyN'])f.key(code,{key:code.at(-1).toLowerCase()});
 assert.equal(saved().flames,0);
 assert.equal(saved().run,null);
 assert.doesNotMatch(f.dialog.html,/봉인 밖의 문|보스에게 이동하세요/);
 await f.api.dispose();f.release();
});

test('main-menu forge invests permanent points and can refund across weapons',async()=>{
 const profile=freshProfile();profile.flames=4;profile.earnedFlames=4;
 const f=rig({savedProfile:profile});
 await f.click('forge');assert.match(f.dialog.html,/대장간/);
 assert.match(f.dialog.html,/정화의 불꽃/);
 await f.click('forge-buy',{evolution:'blade-wave'});
 await f.click('forge-buy',{evolution:'blade-wave'});
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).forge.sword['blade-wave'],2);
 await f.click('home');await f.click('new');await f.click('begin');
 assert.deepEqual(f.game().evolutions,['blade-wave','blade-wave']);
 await f.click('home');await f.click('forge');
 await f.click('forge-refund',{weapon:'sword'});
 assert.match(f.dialog.html,/forge-refund-confirm/);
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).forge.sword['blade-wave'],2,'confirmation is required');
 await f.click('forge-refund-confirm');
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).flames,4);
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).forge.sword['blade-wave'],0);
 await f.click('forge-weapon',{weapon:'bow'});await f.click('forge-buy',{evolution:'twin-arrow'});
 assert.equal(JSON.parse(f.data.get(SAVE_KEY)).forge.bow['twin-arrow'],1);
 await f.api.dispose();f.release();
});
test('unlocked boss travel is free and retries at the chosen starting boss',async()=>{
 const profile=freshProfile();profile.flames=3;profile.defeated=['kwon','clown'];
 profile.forge.bow['twin-arrow']=1;
 const f=rig({savedProfile:profile}),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 assert.doesNotMatch(f.dialog.html,/skip-toggle|불꽃 지름길/);
 assert.match(f.dialog.html,/시련 시작 · 보스 선택/);
 await f.click('new');await f.click('boss-target',{stage:'2'});assert.match(f.dialog.html,/거대 주사위 박성원부터 도전/);
 await f.click('weapon',{weapon:'bow'});assert.match(f.dialog.html,/j-stat-chart/);
 assert.match(f.dialog.html,/한 번 공격 피해|최대 체력/);
 await f.click('begin');assert.equal(f.game().boss.maxHp,5711);
 assert.deepEqual(f.game().evolutions,['twin-arrow']);assert.equal(saved().flames,3);
 const first=f.game();await f.click('begin');assert.equal(f.game(),first);
 first.status='lost';await f.poll();assert.match(f.dialog.html,/선택 보스부터 다시 도전/);
 await f.click('restart');assert.equal(f.game().boss.maxHp,5711);assert.equal(saved().flames,3);
 await f.api.dispose();f.release();
});
test('locked bosses cannot be chosen, including fake clicks, and no currency is required',async()=>{
 for(const defeated of [[],['blood'],['clown','dice','blood']]){
  const profile=freshProfile();profile.defeated=defeated;
  const f=rig({savedProfile:profile});
  await f.click('new');
  assert.match(f.dialog.html,/data-j="boss-target"[^>]*data-stage="1"[^>]*disabled/);
  await f.click('boss-target',{stage:'3'});assert.match(f.dialog.html,/긴턱의 이권재부터 도전/);
  await f.click('begin');assert.equal(f.game().boss.maxHp,4822);
  assert.equal(JSON.parse(f.data.get(SAVE_KEY)).flames,0);await f.api.dispose();f.release();
 }
});
test('any earlier unlocked boss can be chosen with zero flames, and chain progression stays intact',async()=>{
 const profile=freshProfile();profile.defeated=['kwon','clown','dice'];
 const f=rig({savedProfile:profile}),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 await f.click('new');await f.click('boss-target',{stage:'3'});assert.match(f.dialog.html,/영원한 혈왕 배서준부터 도전/);
 await f.click('boss-target',{stage:'1'});assert.match(f.dialog.html,/광대 오슬우부터 도전/);
 await f.click('weapon',{weapon:'bow'});
 await f.click('begin');assert.equal(f.game().boss.maxHp,5076);
 assert.equal(f.lastLaunch().weapon,'bow');assert.equal(saved().flames,0);
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('flame-next');
 assert.match(f.dialog.html,/다음 도전/);
 await f.api.dispose();f.release();
});
test('a failed destination load is retryable without spending flames',async()=>{
 const profile=freshProfile();profile.defeated=['kwon'];profile.flames=2;
 const f=rig({savedProfile:profile,failLoadOnce:true}),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 await f.click('new');await f.click('boss-target',{stage:'1'});await f.click('begin');
 assert.match(f.dialog.html,/전장을 열지 못했습니다/);assert.equal(saved().flames,2);
 await f.click('continue');assert.equal(f.game().boss.maxHp,5076);assert.equal(saved().flames,2);
 await f.click('continue');assert.equal(saved().flames,2);await f.api.dispose();f.release();
});
test('starting at final unlocked boss rewards only its clear and records that starting point',async()=>{
 const profile=freshProfile();profile.flames=2;profile.defeated=['kwon','clown','dice','blood'];
 profile.records=[{weapon:'sword',time:100,deaths:0,bossCount:4,startStage:0}];profile.clears=1;
 const f=rig({savedProfile:profile});await f.click('new');await f.click('boss-target',{stage:'4'});await f.click('begin');
 assert.equal(f.game().boss.maxHp,7000);
 f.game().status='won';await f.poll();await f.click('memory-next');await f.click('flame-next');
 assert.match(f.dialog.html,/마지막 시련을 넘어섰다/);assert.match(f.dialog.html,/별도로 기록/);
 const saved=JSON.parse(f.data.get(SAVE_KEY));assert.equal(saved.flames,3);assert.equal(saved.earnedFlames,3);
 assert.equal(saved.clears,1);assert.equal(saved.records.at(-1).startStage,4);assert.equal(saved.records.at(-1).time,10);
 assert.deepEqual(saved.memories.map(m=>m.id),['gyuwon']);
 await f.click('records');assert.match(f.dialog.html,/보스 선택 · 무두의 사유 최규원부터 · 1보스/);
 await f.api.dispose();f.release();
});
test('refund confirmation can be cancelled and never carries across weapon tabs',async()=>{
 const profile=freshProfile();profile.forge.sword['blade-wave']=1;profile.earnedFlames=1;
 const f=rig({savedProfile:profile}),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 await f.click('forge');
 await f.click('forge-refund-confirm');
 assert.equal(saved().forge.sword['blade-wave'],1,'unconfirmed synthetic action must do nothing');
 await f.click('forge-refund');
 assert.match(f.dialog.html,/j-refund-confirm/);
 await f.click('forge-refund-cancel');
 assert.doesNotMatch(f.dialog.html,/data-j="forge-refund-confirm"/);
 assert.equal(saved().forge.sword['blade-wave'],1);
 await f.click('forge-refund');
 await f.click('forge-weapon',{weapon:'bow'});
 assert.doesNotMatch(f.dialog.html,/data-j="forge-refund-confirm"/,'changing weapon cancels refund');
 await f.click('forge-refund-confirm');
 assert.equal(saved().forge.sword['blade-wave'],1);
 await f.api.dispose();f.release();
});
test('semicolon stays inert on home, in forge, and after returning home',async()=>{
 const f=rig(),saved=()=>JSON.parse(f.data.get(SAVE_KEY));
 for(const action of [null,'forge','home']){
  if(action)await f.click(action);
  for(let i=0;i<10;i++)assert.equal(f.key('Semicolon').prevented,undefined);
  assert.equal(saved().flames,0);assert.equal(saved().earnedFlames,0);
 }
 await f.api.dispose();f.release();
});
