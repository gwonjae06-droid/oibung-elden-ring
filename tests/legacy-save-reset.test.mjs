import test from 'node:test';
import assert from 'node:assert/strict';
import {LEGACY_SAVE_RESET_MARKER,LEGACY_SAVE_KEYS,resetLegacyOdenSavesOnce} from '../src/legacy-save-reset.mjs';
import {BOSSES,freshProfile,newRun,finishAttempt,loadProfile,saveProfile,latestUnlockedStage} from '../src/journey-state.mjs';
import {eventScopedStorage} from '../src/oden-event-client.mjs';

const storage=entries=>{const data=new Map(entries);return {
 getItem:key=>data.has(key)?data.get(key):null,
 setItem:(key,value)=>data.set(key,String(value)),
 removeItem:key=>data.delete(key),data};};

test('a returning friend loses old boss progression, forge state and post-ending photo',()=>{
 const saves=storage([
 ['oibung.journey.v1',JSON.stringify({version:4,clears:12,forge:{cards:{upgrades:6}}})],
 ['oibung.gyuwon.ending-watched','1'],
 ['oibung.gyuwon.ensemble-photo','data:image/jpeg;base64,OLD'],
 ['oibung-muted','1'],
 ['oibung.audio.master','0.7'],
 ['oibung.coop.url','wss://example.invalid'],
 ['oibung.oden-event.claim.v1:oden-ending-2026','existing-private-event-session'],
 ['oibung.event.oden-ending-2026.id.oibung.journey.v1','current-event-profile'],
 ['another-app','preserve']
 ]);
 const result=resetLegacyOdenSavesOnce(saves);
 assert.deepEqual(result,{ok:true,changed:true,removed:3});
 for(const key of LEGACY_SAVE_KEYS)assert.equal(saves.getItem(key),null,key);
 assert.equal(saves.getItem(LEGACY_SAVE_RESET_MARKER),'done');
 assert.equal(saves.getItem('oibung-muted'),'1');
 assert.equal(saves.getItem('oibung.audio.master'),'0.7');
 assert.equal(saves.getItem('oibung.coop.url'),'wss://example.invalid');
 assert.equal(saves.getItem('oibung.oden-event.claim.v1:oden-ending-2026'),'existing-private-event-session');
 assert.equal(saves.getItem('oibung.event.oden-ending-2026.id.oibung.journey.v1'),'current-event-profile');
 assert.equal(saves.getItem('another-app'),'preserve');
});

test('a new progress save after reset remains on repeat visits',()=>{
 const saves=storage([['oibung.journey.v1','old']]);
 assert.equal(resetLegacyOdenSavesOnce(saves).changed,true);
 saves.setItem('oibung.journey.v1','new save after reset');
 assert.deepEqual(resetLegacyOdenSavesOnce(saves),{ok:true,changed:false,reason:'already-applied'});
 assert.equal(saves.getItem('oibung.journey.v1'),'new save after reset');
});

test('failure does not mark reset complete, allowing a later retry',()=>{
 const saves=storage([['oibung.journey.v1','old']]);
 const broken={...saves,removeItem:()=>{throw new Error('quota/security error')}};
 assert.equal(resetLegacyOdenSavesOnce(broken).ok,false);
 assert.equal(saves.getItem(LEGACY_SAVE_RESET_MARKER),null);
 assert.equal(resetLegacyOdenSavesOnce(saves).ok,true);
 assert.equal(saves.getItem('oibung.journey.v1'),null);
});

test('missing storage is safe and the reset intentionally targets only save fields',()=>{
 assert.equal(resetLegacyOdenSavesOnce(undefined).ok,false);
 assert.equal(LEGACY_SAVE_KEYS.length,3);
});

test('live reset is enabled only at campaign startup and runs before loading profile',async()=>{
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const {dirname,resolve}=await import('node:path');
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const journey=readFileSync(resolve(root,'src/journey.mjs'),'utf8');
 const config=readFileSync(resolve(root,'src/oden-event-config.mjs'),'utf8');
 assert.match(config,/enabled:\s*true/);
 const gate=journey.indexOf('if(event.enabled)resetLegacyOdenSavesOnce(rawStorage);');
 const profile=journey.indexOf('let profile=loadProfile(storage)');
 assert.ok(gate>=0,'destructive reset must be feature gated');
 assert.ok(profile>gate,'reset must precede profile load after event activation');
 const edge=readFileSync(resolve(root,'supabase/functions/oden-event/index.js'),'utf8');
 assert.match(config,/eventId:'oden-ending-2026-live-1110'/);
 assert.match(edge,/const EVENT_ID='oden-ending-2026-live-1110'/);
});

test('real boss win saved after first reset persists after 1, 2 and 3 further simulated browser visits',()=>{
 const store=storage([
  ['oibung.journey.v1',JSON.stringify({version:4,clears:1,defeated:[...BOSSES],records:[],memories:[],flames:50})],
  ['oibung.gyuwon.ending-watched','1'],
  ['oibung.gyuwon.ensemble-photo','old-picture']
 ]);
 assert.equal(resetLegacyOdenSavesOnce(store).changed,true);
 assert.equal(store.getItem('oibung.gyuwon.ending-watched'),null);
 const fresh=loadProfile(store);
 assert.deepEqual(fresh.defeated,[]);
 assert.equal(fresh.flames,0);
 fresh.run=newRun('sword');
 assert.equal(finishAttempt(fresh,{won:true,time:102,damage:50}),'flame');
 assert.equal(saveProfile(store,fresh),true);
 for(let visit=1;visit<=3;visit++){
  const before=store.getItem('oibung.journey.v1');
  assert.deepEqual(resetLegacyOdenSavesOnce(store),{ok:true,changed:false,reason:'already-applied'});
  assert.equal(store.getItem('oibung.journey.v1'),before,'subsequent visits must not clear progress');
  const loaded=loadProfile(store);
  assert.deepEqual(loaded.defeated,[BOSSES[0]]);
  assert.equal(loaded.flames,1);
  assert.equal(loaded.earnedFlames,1);
  assert.equal(latestUnlockedStage(loaded),1);
 }
 // A newly earned ending/photo also survives later starts.
 store.setItem('oibung.gyuwon.ending-watched','1');
 store.setItem('oibung.gyuwon.ensemble-photo','new-picture');
 resetLegacyOdenSavesOnce(store);
 assert.equal(store.getItem('oibung.gyuwon.ending-watched'),'1');
 assert.equal(store.getItem('oibung.gyuwon.ensemble-photo'),'new-picture');
});

test('event-mode victory and general-mode victory both survive subsequent startup and remain separate',()=>{
 const store=storage([
  ['oibung.journey.v1','stale general profile'],
  ['oibung.gyuwon.ending-watched','1']
 ]);
 resetLegacyOdenSavesOnce(store);
 const eventStorage=eventScopedStorage(store,'oden-ending-2026-live-1110','friend-a');
 const eventProfile=freshProfile();
 eventProfile.run=newRun('sword');
 assert.equal(finishAttempt(eventProfile,{won:true,time:78,damage:333}),'flame');
 assert.equal(saveProfile(eventStorage,eventProfile),true);
 const general=freshProfile();
 general.run=newRun('sword');
 assert.equal(finishAttempt(general,{won:true,time:90,damage:200}),'flame');
 assert.equal(saveProfile(store,general),true);
 // Both live in distinct keys. An old save reset must never run again.
 for(let i=0;i<3;i++){
  resetLegacyOdenSavesOnce(store);
  assert.deepEqual(loadProfile(eventStorage).defeated,[BOSSES[0]]);
  assert.deepEqual(loadProfile(store).defeated,[BOSSES[0]]);
  assert.equal(loadProfile(eventStorage).flames,1);
  assert.equal(loadProfile(store).flames,1);
 }
 assert.notEqual(store.getItem('oibung.journey.v1'),store.getItem('oibung.event.oden-ending-2026-live-1110.friend-a.oibung.journey.v1')?.replace('"damage":333','"damage":200'),'two saves are independently stored');
});
