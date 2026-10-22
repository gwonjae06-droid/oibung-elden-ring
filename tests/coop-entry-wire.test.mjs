import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCoopRooms} from '../server/coop/rooms.mjs';
import {connectCoop} from '../src/coop-client.mjs';
function transport(fn){
 const old=globalThis.WebSocket,m=createCoopRooms();let next=0;
 class Socket{static OPEN=1;constructor(){this.id='p'+next++;this.readyState=1;this.listeners={};this.sent=[];}addEventListener(t,f){(this.listeners[t]??=[]).push(f);}send(raw){const message=JSON.parse(raw);this.sent.push(message);let reply;try{reply={type:'state',selfId:this.id,state:m.handle(this.id,message)};}catch(e){reply={type:'error',code:e.message};}for(const f of this.listeners.message||[])f({data:JSON.stringify(reply)});}close(){this.readyState=3;}}
 globalThis.WebSocket=Socket;
 const client=()=>{const messages=[],c=connectCoop('wss://example.test/coop',{onMessage:m=>messages.push(m)});return {c,messages};};
 try{fn(m,client);}finally{globalThis.WebSocket=old;}
}
test('game page boots coop menu exactly once and preserves existing bootstraps',()=>{const h=readFileSync(new URL('../spider-combat.html',import.meta.url),'utf8');assert.equal(h.split("import('./src/coop-menu.mjs')").length-1,1);for(const s of ["m.installCoopMenu()","import('./src/arena.mjs')","import('./src/boss-transition.mjs')"])assert.ok(h.includes(s));});
for(const boss of ['kwon','clown','dice'])test('actual client serialization and room core agree on '+boss+' (socket double)',()=>transport((m,client)=>{const a=client(),b=client();a.c.create('방장','hammer',boss);const state=a.messages.at(-1).state;assert.equal(state.boss,boss);assert.equal(a.c.socket.sent[0].boss,boss);b.c.join(state.code,'친구','cards',boss);assert.equal(b.messages.at(-1).state.boss,boss);assert.equal(b.messages.at(-1).state.players.length,2);assert.equal(b.messages.at(-1).state.players[1].weapon,'cards');}));
test('wrong boss join is rejected without consuming a player slot',()=>transport((m,client)=>{const a=client(),b=client();a.c.create('a','sword','dice');const code=a.messages.at(-1).state.code;b.c.join(code,'b','bow','clown');assert.deepEqual(b.messages.at(-1),{type:'error',code:'BOSS_MISMATCH'});assert.equal(m.snapshot(a.c.socket.id).players.length,1);b.c.join(code,'b','bow','dice');assert.equal(b.messages.at(-1).state.players.length,2);}));
test('room boss is immutable through ready and forged start payloads',()=>{let selected;const m=createCoopRooms({battleFactory:(players,options)=>{selected=options.boss;return {step(){},snapshot(){return {};}};}}),r=m.handle('a',{type:'create',boss:'clown'});m.handle('b',{type:'join',code:r.code,boss:'clown'});for(const id of ['a','b'])m.handle(id,{type:'ready',value:true,boss:'dice'});m.handle('a',{type:'start',boss:'dice'});assert.equal(selected,'clown');assert.equal(m.snapshot('a').boss,'clown');});
test('invalid boss values fail and legacy clients default to kwon',()=>{const m=createCoopRooms();for(const boss of ['unknown',{},'__proto__'])assert.throws(()=>m.handle('a',{type:'create',boss}),/BAD_BOSS/);assert.equal(m.handle('a',{type:'create'}).boss,'kwon');});
test('legacy join without boss remains supported',()=>{const m=createCoopRooms(),r=m.handle('a',{type:'create',boss:'dice'});assert.equal(m.handle('b',{type:'join',code:r.code}).boss,'dice');});
test('missing battle adapter still prevents combat start',()=>{const m=createCoopRooms(),r=m.handle('a',{type:'create',boss:'dice'});m.handle('b',{type:'join',code:r.code,boss:'dice'});for(const id of ['a','b'])m.handle(id,{type:'ready',value:true});assert.throws(()=>m.handle('a',{type:'start'}),/BATTLE_NOT_CONNECTED/);assert.equal(m.snapshot('a').phase,'lobby');});
