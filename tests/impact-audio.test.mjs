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

test('impact backend closes once and cannot be reactivated after terminal disposal',async()=>{
  const {ctx}=fake();let closes=0;ctx.close=()=>{closes++;return Promise.resolve();};
  const audio=createImpactAudio(()=>ctx);audio.setEnabled(true);const completion=audio.dispose();
  assert.equal(audio.dispose(),completion);assert.equal(audio.enabled,false);assert.equal(audio.setEnabled(true),false);assert.equal(audio.play('hit-slash'),false);
  assert.deepEqual(await completion,{errors:[]});assert.equal(closes,1);
});
test('all legacy retro-impact names remain valid but make no oscillator sound',()=>{
 const {ctx,log}=fake(),a=createImpactAudio(()=>ctx);
 assert.equal(a.setEnabled(true),true);
 assert.deepEqual([...a.names].sort(),[...IMPACT_SOUND_NAMES].sort());
 for(const n of a.names){ctx.currentTime+=1;assert.equal(a.play(n),false,n);}
 assert.deepEqual(log.errors,[]);assert.equal(log.starts,0);
});

test('disabled and unsupported impact audio is silent even under floods',()=>{
 let made=0;const a=createImpactAudio(()=>{made++;return fake().ctx;});
 assert.equal(a.play('hit-slash'),false);assert.equal(made,0);
 assert.equal(createImpactAudio(()=>null).setEnabled(true),false);
 const {ctx,log}=fake(),b=createImpactAudio(()=>ctx);b.setEnabled(true);
 assert.equal(b.play('x'),false);assert.equal(b.play('hit-blunt'),false);
 for(let i=0;i<300;i++)b.play('hit-crit',{minGap:0});
 assert.equal(log.starts,0);
});
