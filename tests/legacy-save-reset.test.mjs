import test from 'node:test';
import assert from 'node:assert/strict';
import {LEGACY_SAVE_RESET_MARKER,LEGACY_SAVE_KEYS,resetLegacyOdenSavesOnce} from '../src/legacy-save-reset.mjs';

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
