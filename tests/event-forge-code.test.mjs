import test from 'node:test';
import assert from 'node:assert/strict';
import {EVENT_BOW_KEY,EVENT_BOW_DAMAGE,matchesEventForgeCode,isEventForgeShortcut,eventBowProjectileDamage} from '../src/event-forge-code.mjs';
import {eventScopedStorage} from '../src/oden-event-client.mjs';
import {createGame,WEAPONS} from '../src/combat.mjs';
import {spawnPlayerProjectiles} from '../src/player-combat.mjs';

test('the forge shortcut only opens during a registered event forge visit',()=>{
 const shortcut={code:'Semicolon',key:';',repeat:false,target:{}};
 const context={screen:'forge',eventMode:true,registered:true};
 assert.equal(isEventForgeShortcut(shortcut,context),true);
 assert.equal(isEventForgeShortcut(shortcut,{...context,screen:'home'}),false);
 assert.equal(isEventForgeShortcut(shortcut,{...context,eventMode:false}),false);
 assert.equal(isEventForgeShortcut(shortcut,{...context,registered:false}),false);
 assert.equal(isEventForgeShortcut(shortcut,{...context,open:true}),false);
 assert.equal(isEventForgeShortcut({...shortcut,repeat:true},context),false);
 assert.equal(isEventForgeShortcut({...shortcut,ctrlKey:true},context),false);
 assert.equal(isEventForgeShortcut({...shortcut,target:{tagName:'INPUT'}},context),false);
});

test('code matching is exact and normalizes Korean input',()=>{
 assert.equal(matchesEventForgeCode('규원아사랑해'),true);
 assert.equal(matchesEventForgeCode(' 규원아사랑해 '),true);
 assert.equal(matchesEventForgeCode('규원아사랑'),false);
 assert.equal(matchesEventForgeCode(''),false);
 assert.equal(matchesEventForgeCode(null),false);
});

test('the 200-damage effect belongs only to a flagged event bow projectile',()=>{
 const active=createGame('bow');
 active.odenPrizeEvent=true;active.eventBowDamage200=true;
 assert.equal(spawnPlayerProjectiles(active,{yaw:0,mult:2,basic:true},WEAPONS.bow),true);
 assert.equal(active.projectiles[0].damage,EVENT_BOW_DAMAGE);
 const normal=createGame('bow');
 normal.eventBowDamage200=true;
 assert.equal(spawnPlayerProjectiles(normal,{yaw:0,mult:1,basic:true},WEAPONS.bow),true);
 assert.equal(normal.projectiles[0].damage,WEAPONS.bow.damage);
 const other=createGame('cards');
 other.odenPrizeEvent=true;other.eventBowDamage200=true;
 assert.equal(eventBowProjectileDamage(other,23),23);
 const second=createGame('bow');
 second.odenPrizeEvent=true;
 assert.equal(eventBowProjectileDamage(second,23),23);
});

test('the code unlock persists for one event participant only',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 const playerA=eventScopedStorage(storage,'event-1','player-A');
 const playerB=eventScopedStorage(storage,'event-1','player-B');
 playerA.setItem(EVENT_BOW_KEY,'1');
 assert.equal(playerA.getItem(EVENT_BOW_KEY),'1');
 assert.equal(playerB.getItem(EVENT_BOW_KEY),null);
 assert.equal(storage.getItem(EVENT_BOW_KEY),null,'regular storage is not given event powers');
});
