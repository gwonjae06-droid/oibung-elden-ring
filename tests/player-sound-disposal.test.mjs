import test from 'node:test';import assert from 'node:assert/strict';import {createPlayerSound} from '../src/player-sound.mjs';
function rig({borrowed=false,failClose=false,failVoice=false,muted=false,listenForGestures=true}={}){const events=new Map(),contexts=[];let mute=muted;const win={addEventListener(k,f){if(!events.has(k))events.set(k,new Set());events.get(k).add(f);},removeEventListener(k,f){events.get(k)?.delete(f);},AudioContext:function(){const log={starts:0,closes:0,resumes:0,disconnects:0},param={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}},node=()=>({connect(){},disconnect(){log.disconnects++;}}),ctx={log,currentTime:0,sampleRate:8,state:'running',destination:{},resume(){log.resumes++;return Promise.resolve();},close(){log.closes++;this.state='closed';return failClose?Promise.reject(Error('close failed')):Promise.resolve();},createGain:()=>({...node(),gain:{...param}}),createDynamicsCompressor:node,createBuffer:(channels,n)=>({getChannelData:()=>new Float32Array(n)}),createBiquadFilter(){if(failVoice)throw Error('filter failed');return {...node(),frequency:param};},createOscillator:()=>({...node(),frequency:param,start(){log.starts++;},stop(){}}),createBufferSource:()=>({...node(),start(){log.starts++;},stop(){}})};contexts.push(ctx);return ctx;}};const ctx=borrowed?new win.AudioContext():null,s=createPlayerSound({win,doc:{hidden:false},getContext:borrowed?()=>ctx:undefined,muted:()=>mute,listenForGestures,random:()=>.5});return {s,events,contexts,ctx,mute:()=>{mute=true;}};}

test('muted gesture cannot create a context',async()=>{
 const f=rig({muted:true});for(const cb of f.events.get('pointerdown'))cb();
 assert.equal(f.contexts.length,0);await f.s.dispose();
});
test('deleting retro sound recipes does not allocate oscillator voices',async()=>{
 const f=rig();
 f.s.unlock();
 for(const type of ['step','roll','heal','hit','swing','shot'])assert.equal(f.s.play(type,'sword'),false);
 assert.equal(f.s.activeCount,0);
 assert.equal(f.contexts[0].log.starts,0);
 await f.s.dispose();
});
test('disposal removes gesture listeners and closes owned audio context once',async()=>{
 const f=rig(),gesture=[...f.events.get('keydown')][0];f.s.unlock();
 const ctx=f.contexts[0],p=f.s.dispose();
 assert.equal(f.s.dispose(),p);await p;gesture();
 assert.equal(f.contexts.length,1);assert.equal(ctx.log.closes,1);
 assert.ok([...f.events.values()].every(set=>set.size===0));
 assert.equal(f.s.activeCount,0);assert.equal(f.s.play('step','sword'),false);
});
test('clear and mute leave zero voices and preserve future no-synth policy',async()=>{
 const f=rig();f.s.unlock();
 assert.equal(f.s.play('step','sword'),false);
 f.s.clear();assert.equal(f.s.activeCount,0);
 f.mute();f.s.update();assert.equal(f.s.play('roll','sword'),false);
 await f.s.dispose();
});
test('borrowed context is not closed by a player presentation shutdown',async()=>{
 const f=rig({borrowed:true});f.s.unlock();
 await f.s.dispose();assert.equal(f.ctx.log.closes,0);
 assert.ok(f.ctx.log.disconnects>=2);
});
test('instances are isolated and users may disable gesture listeners',async()=>{
 const a=rig({listenForGestures:false}),b=rig();
 assert.equal(a.events.size,0);a.s.unlock();b.s.unlock();
 await a.s.dispose();assert.equal(b.contexts[0].log.closes,0);
 assert.equal(b.s.disposed,false);await b.s.dispose();
});
test('owned context close rejection is collected without crashing disposal',async()=>{
 const f=rig({failClose:true});f.s.unlock();
 const report=await f.s.dispose();
 assert.ok(report.errors.some(e=>e.message==='close failed'));
 assert.ok([...f.events.values()].every(set=>set.size===0));
});
test('retired waveforms never attempt filter creation even in a faulty audio context',async()=>{
 const f=rig({failVoice:true});f.s.unlock();
 assert.doesNotThrow(()=>f.s.play('roll','sword'));
 assert.equal(f.s.activeCount,0);
 await f.s.dispose();
 assert.ok(f.contexts[0].log.disconnects>=2);
});
