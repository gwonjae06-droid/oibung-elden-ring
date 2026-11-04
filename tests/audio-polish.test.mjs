import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../src/audio.mjs';

function fakeContext({reverb=true,brokenReverb=false}={}){
 const log={starts:0,stops:0,errors:[],convolvers:0};
 const param=(v=0)=>({value:v,setValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('set '+x+' '+t);},linearRampToValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('linear '+x+' '+t);},exponentialRampToValueAtTime(x,t){if(!(x>0)||!Number.isFinite(t))log.errors.push('exp '+x+' '+t);}});
 const node=extra=>Object.assign({connect(){},disconnect(){}},extra);
 const ctx={currentTime:0,state:'running',sampleRate:8000,destination:node(),resume(){},
  createDynamicsCompressor:()=>node(),createGain:()=>node({gain:param(1)}),
  createBuffer:(c,len)=>({getChannelData:()=>new Float32Array(len)}),
  createOscillator:()=>node({type:'',frequency:param(),detune:param(),start(){log.starts++;},stop(){log.stops++;}}),
  createBufferSource:()=>node({buffer:null,loop:false,start(){log.starts++;},stop(){log.stops++;}}),
  createBiquadFilter:()=>node({type:'',frequency:param(),Q:param()})};
 if(reverb)ctx.createConvolver=()=>{log.convolvers++;if(brokenReverb)throw new Error('convolver unavailable');return node({buffer:null});};
 return {ctx,log};
}

test('retro tones stay silent while physical noise and reverb remain safe',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 assert.equal(a.setEnabled(true),true);
 assert.equal(log.convolvers,1);
 for(const name of a.names){ctx.currentTime+=1;assert.equal(a.play(name,{amount:120}),['hit-player','roll','dodge'].includes(name),name);}
 assert.equal(log.starts,4);
 assert.deepEqual(log.errors,[]);
});

test('failing reverb does not disable the recorded sample backend',()=>{
 const {ctx}=fakeContext({brokenReverb:true}),a=createAudio(()=>ctx);
 assert.equal(a.setEnabled(true),true);
 assert.equal(a.enabled,true);
 assert.equal(a.play('ui'),false);
});

test('filtered natural ambience uses one noise source and stops cleanly',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 a.setEnabled(true);
 const before=log.starts;
 a.ambience(true);
 assert.equal(log.starts-before,1);
 a.ambience(true);
 assert.equal(log.starts-before,1);
 assert.equal(a.activeDrone,true);
 a.ambience(false);
 assert.equal(a.activeDrone,false);
 assert.equal(log.stops,log.starts);
 assert.deepEqual(log.errors,[]);
});

test('retired phase/UI cues never allocate expiring voices',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 a.setEnabled(true);
 for(let i=0;i<400;i++)assert.equal(a.play('phase',{minGap:0}),false);
 ctx.currentTime+=10;
 assert.equal(a.play('ui',{minGap:0}),false);
 assert.equal(log.starts,0);
});
