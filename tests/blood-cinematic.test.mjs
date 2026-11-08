import test from 'node:test';
import assert from 'node:assert/strict';
import {createBloodGame,damageBlood,stepBlood,skipBloodTransition,startBloodPattern} from '../src/blood-combat.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {createBloodTransformationAudio} from '../src/blood-transformation-audio.mjs';
import {createBossTracks} from '../src/boss-tracks.mjs';

function fixture(){const clips=[];class Audio{constructor(src){Object.assign(this,{src,paused:true,ended:false,currentTime:0,plays:0});clips.push(this);}play(){this.paused=false;this.plays++;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}}const control=createBloodTransformationAudio({AudioClass:Audio});return {clips,control};}
test('transformation waits for the complete attack and occurs exactly once',()=>{
 const g=createBloodGame();g.player.hp=1e6;startBloodPattern(g,'fountain');damageBlood(g,3500);stepBlood(g,.05);assert.equal(g.boss.phase,1);
 for(let i=0;i<80;i++)stepBlood(g,.05);assert.equal(g.boss.state,'transition');assert.equal(g.events.filter(e=>e.type==='phase').length,1);
 skipBloodTransition(g);stepBlood(g,.01);assert.equal(g.boss.state,'recovery');damageBlood(g,100);for(let i=0;i<100;i++)stepBlood(g,.05);assert.equal(g.events.filter(e=>e.type==='phase').length,1);
});
test('prayer and bell trigger once, pause resumes the same clips and skip cleans everything',()=>{
 const {control,clips}=fixture(),g=createBloodGame();g.boss.state='transition';g.boss.phase=2;
 for(const t of [0,.59,.61,.8,1.79,1.81,2,3.8]){g.blood.t=t;control.update(g);}
 assert.deepEqual(clips.map(a=>a.plays),[1,1]);assert.deepEqual(control.fired,['prayer','bell']);
 control.update(g,{running:false});assert.ok(clips.every(a=>a.paused));control.update(g);assert.deepEqual(clips.map(a=>a.plays),[2,2]);
 control.skip();skipBloodTransition(g);control.update(g);assert.ok(clips.every(a=>a.paused));stepBlood(g,.01);control.update(g);control.dispose();assert.ok(clips.every(a=>a.paused));
});
test('mute respects effects gain; retry permits a fresh single prayer',()=>{
 const {control,clips}=fixture(),g=createBloodGame();g.boss.phase=2;g.boss.state='transition';g.blood.t=.8;control.update(g,{muted:true});assert.equal(clips[0].plays,0);
 control.update(g);assert.equal(clips[0].plays,1);control.reset();control.update(g);assert.equal(clips[0].plays,2);control.dispose();
});
test('phase-one music is silent before the bell and phase-two begins at 3.8',()=>{
 const g=createBloodGame();g.boss.phase=2;g.boss.state='transition';g.blood.t=.6;assert.equal(bloodTransformation(g).musicGain,0);assert.equal(bloodTransformation(g).musicPhase,1);
 g.blood.t=3.8;assert.equal(bloodTransformation(g).musicPhase,2);assert.equal(bloodTransformation(g).wings,1);
});
test('cinematic music discards the silent phase one and starts the measured phase-two lead-in',()=>{
 const clips=[];class Audio{constructor(){this.paused=true;this.currentTime=0;clips.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){}load(){}}
 let time=0;const tracks=createBossTracks({Audio},{now:()=>time,fadeMs:100});tracks.update({boss:'blood',phase:1});time=100;tracks.update({boss:'blood',phase:1,gain:0,cinematic:true});assert.equal(clips[0].volume,0);
 tracks.update({boss:'blood',phase:2,offset:1.8,cinematic:true});assert.ok(clips[0].paused);assert.equal(clips[1].currentTime,1.8);assert.equal(tracks.state.length,1);tracks.dispose();
});
test('blocked recordings are attempted once per cutscene and zero effects volume is respected',async()=>{
 const clips=[];class Audio{constructor(){this.paused=true;this.currentTime=0;this.plays=0;clips.push(this);}pause(){this.paused=true;}play(){this.plays++;return Promise.reject(Error('blocked'));}removeAttribute(){}load(){}}
 const control=createBloodTransformationAudio({AudioClass:Audio,storage:{getItem:key=>key.endsWith('effects')?'0':'1'}}),g=createBloodGame();g.boss.phase=2;g.boss.state='transition';g.blood.t=1;control.update(g);await Promise.resolve();control.update(g);assert.equal(clips[0].plays,1);assert.equal(clips[0].volume,0);control.dispose();
});
