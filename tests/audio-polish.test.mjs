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

test('every sound works with a reverb bus and leaves no unmatched voices',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 assert.equal(a.setEnabled(true),true);
 assert.equal(log.convolvers,1);
 for(const name of a.names){ctx.currentTime+=1;const before=log.starts;assert.equal(a.play(name,{amount:120}),true,name);assert.ok(log.starts>before,name);}
 assert.deepEqual(log.errors,[]);
 assert.equal(log.starts,log.stops);
});

test('a failing reverb does not disable audio',()=>{
 const {ctx}=fakeContext({brokenReverb:true}),a=createAudio(()=>ctx);
 assert.equal(a.setEnabled(true),true);
 ctx.currentTime+=1;
 assert.equal(a.play('ui'),true);
});

test('layered ambience starts six sources once and stops them all',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 a.setEnabled(true);
 const before=log.starts;
 a.ambience(true);
 assert.equal(log.starts-before,6);
 a.ambience(true);
 assert.equal(log.starts-before,6);
 assert.equal(a.activeDrone,true);
 a.ambience(false);
 assert.equal(a.activeDrone,false);
 assert.equal(log.stops,log.starts);
 assert.deepEqual(log.errors,[]);
});

test('expired voices are reclaimed even when no ended event arrives',()=>{
 const {ctx,log}=fakeContext(),a=createAudio(()=>ctx);
 a.setEnabled(true);
 for(let i=0;i<400;i++)a.play('phase',{minGap:0});
 assert.ok(log.starts<=48);
 ctx.currentTime+=10;
 const before=log.starts;
 assert.equal(a.play('ui',{minGap:0}),true);
 assert.ok(log.starts>before);
});
