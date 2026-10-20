import test from 'node:test';
import assert from 'node:assert/strict';
import {createImpactAudio,IMPACT_SOUND_NAMES} from '../src/impact-audio.mjs';
function fake(){
  const log={starts:0,stops:0,errors:[]};
  const param=(v=0)=>({value:v,setValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('set '+x+' '+t);},linearRampToValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('lin '+x);},exponentialRampToValueAtTime(x,t){if(!(x>0)||!Number.isFinite(t))log.errors.push('exp '+x+' '+t);}});
  const node=e=>Object.assign({connect(){},disconnect(){}},e);
  const ctx={currentTime:0,state:'running',sampleRate:8000,destination:node(),resume(){},createDynamicsCompressor:()=>node(),createGain:()=>node({gain:param(1)}),createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(l)}),
    createOscillator:()=>node({type:'',frequency:param(),detune:param(),start(){log.starts++;},stop(){log.stops++;}}),createBufferSource:()=>node({buffer:null,loop:false,start(){log.starts++;},stop(){log.stops++;}}),createBiquadFilter:()=>node({type:'',frequency:param(),Q:param()})};
  return {ctx,log};
}
test('every impact sound is valid, balanced and listed',()=>{
  const {ctx,log}=fake(),a=createImpactAudio(()=>ctx);assert.equal(a.setEnabled(true),true);assert.deepEqual([...a.names].sort(),[...IMPACT_SOUND_NAMES].sort());
  for(const n of a.names){ctx.currentTime+=1;const before=log.starts;assert.equal(a.play(n),true,n);assert.ok(log.starts>before,n);}
  assert.deepEqual(log.errors,[]);assert.equal(log.starts,log.stops);
});
test('impact audio is silent when disabled or unsupported and capped under floods',()=>{
  let made=0;const a=createImpactAudio(()=>{made++;return fake().ctx;});assert.equal(a.play('hit-slash'),false);assert.equal(made,0);
  assert.equal(createImpactAudio(()=>null).setEnabled(true),false);
  const {ctx,log}=fake(),b=createImpactAudio(()=>ctx);b.setEnabled(true);assert.equal(b.play('x'),false);assert.equal(b.play('hit-blunt'),true);assert.equal(b.play('hit-blunt'),false);
  for(let i=0;i<300;i++)b.play('hit-crit',{minGap:0});assert.ok(log.starts<=40,String(log.starts));
});
