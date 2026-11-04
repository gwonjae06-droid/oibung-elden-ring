import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAudio} from '../src/audio.mjs';
import {createSkillAudio} from '../src/skill-audio.mjs';
import {createImpactAudio} from '../src/impact-audio.mjs';
import {createCrowdScream} from '../src/dice-crowd-audio.mjs';
import {NOISE_ONLY_SFX,RETRO_SYNTH_DISABLED} from '../src/natural-sfx-policy.mjs';

function context(){
 const log={oscillators:0,noiseSources:0};
 const param=(value=1)=>({value,setValueAtTime(n){this.value=n;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=extra=>Object.assign({connect(){},disconnect(){}},extra);
 const ctx={
  sampleRate:8000,currentTime:0,state:'running',destination:node(),
  resume(){return Promise.resolve();},close(){return Promise.resolve();},
  createOscillator(){log.oscillators++;return node({type:'sine',frequency:param(),detune:param(),start(){},stop(){}});},
  createBufferSource(){log.noiseSources++;return node({start(){},stop(){},buffer:null,loop:false});},
  createGain(){return node({gain:param()});},
  createDynamicsCompressor(){return node({threshold:param(),knee:param(),ratio:param()});},
  createBiquadFilter(){return node({type:'lowpass',frequency:param(),Q:param()});},
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
 };
 return {ctx,log};
}

test('all generic gameplay effects avoid pitch oscillators, while hit and dodge have non-tonal feedback',()=>{
 assert.equal(RETRO_SYNTH_DISABLED,true);
 assert.ok(NOISE_ONLY_SFX['hit-player']?.length);
 const {ctx,log}=context(),audio=createAudio(()=>ctx);
 assert.equal(audio.setEnabled(true),true);
 for(const name of ['hit-player','roll','dodge']){
  ctx.currentTime+=1;
  assert.equal(audio.play(name),true,name+' should provide non-tonal feedback');
 }
 for(const name of ['stagger','phase','ui','tele-whirl','victory']){
  ctx.currentTime+=1;
  assert.equal(audio.play(name),false,name+' must not synthesize pitched alerts');
 }
 assert.equal(log.oscillators,0,'retro pitched oscillator generated in gameplay');
 assert.ok(log.noiseSources>=3,'physical feedback lost');
 audio.setEnabled(false);
});

test('skill and impact modules do not play pitched synthesized leftovers',async()=>{
 const a=context(),skill=createSkillAudio(()=>a.ctx);
 assert.equal(skill.setEnabled(true),true);
 for(const name of ['skill-sword','skill-hammer','skill-bow','skill-blue','skill-red','skill-yellow','skill-stun','skill-ready','skill-pierce']){
  a.ctx.currentTime+=1;
  assert.equal(skill.play(name),false,name+' should be handled by recorded sample or remain silent');
 }
 assert.equal(a.log.oscillators,0);
 skill.setEnabled(false);
 const b=context(),impact=createImpactAudio(()=>b.ctx);
 assert.equal(impact.setEnabled(true),true);
 for(const name of impact.names){
  b.ctx.currentTime+=1;
  assert.equal(impact.play(name),false,name+' synth must be disabled');
 }
 assert.equal(b.log.oscillators,0);
 const report=await impact.dispose();
 assert.deepEqual(report.errors,[]);
});

test('casino crowd synth screams are disabled until a recorded crowd sample exists',()=>{
 let contexts=0;
 const crowd=createCrowdScream(()=>{contexts++;return context().ctx;});
 assert.equal(crowd.scream(),false);
 assert.equal(contexts,0);
});

test('menu and boss music use uploaded MP3 without pitched fallback scores',()=>{
 const menu=readFileSync(new URL('../src/menu-theme.mjs',import.meta.url),'utf8');
 const boss=readFileSync(new URL('../src/boss-music.mjs',import.meta.url),'utf8');
 assert.ok(!menu.includes("from './menu-score.mjs'"));
 assert.ok(boss.includes('music.update(selection,false)'));
});
