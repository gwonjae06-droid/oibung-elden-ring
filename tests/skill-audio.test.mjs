import test from 'node:test';
import assert from 'node:assert/strict';
import {createSkillAudio,SKILL_SOUND_NAMES} from '../src/skill-audio.mjs';
function fake(){
  const log={starts:0,stops:0,errors:[]};
  const param=(v=0)=>({value:v,setValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('set '+x+' '+t);},linearRampToValueAtTime(x,t){if(!Number.isFinite(x)||!Number.isFinite(t))log.errors.push('lin '+x);},exponentialRampToValueAtTime(x,t){if(!(x>0)||!Number.isFinite(t))log.errors.push('exp '+x+' '+t);}});
  const node=e=>Object.assign({connect(){},disconnect(){}},e);
  const ctx={currentTime:0,state:'running',sampleRate:8000,destination:node(),resume(){},createDynamicsCompressor:()=>node(),createGain:()=>node({gain:param(1)}),createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(l)}),
    createOscillator:()=>node({type:'',frequency:param(),detune:param(),start(){log.starts++;},stop(){log.stops++;}}),createBufferSource:()=>node({buffer:null,loop:false,start(){log.starts++;},stop(){log.stops++;}}),createBiquadFilter:()=>node({type:'',frequency:param(),Q:param()})};
  return {ctx,log};
}
test('every skill sound plays valid, balanced audio and matches the declared name list',()=>{
  const {ctx,log}=fake(),a=createSkillAudio(()=>ctx);assert.equal(a.setEnabled(true),true);assert.deepEqual([...a.names].sort(),[...SKILL_SOUND_NAMES].sort());
  for(const name of a.names){ctx.currentTime+=1;const before=log.starts;assert.equal(a.play(name),true,name);assert.ok(log.starts>before,name);}
  assert.deepEqual(log.errors,[]);assert.equal(log.starts,log.stops);
});
test('skill audio stays silent when disabled or unsupported, and ignores unknown names',()=>{
  let made=0;const a=createSkillAudio(()=>{made++;return fake().ctx;});assert.equal(a.play('skill-sword'),false);assert.equal(made,0);
  assert.equal(createSkillAudio(()=>null).setEnabled(true),false);assert.equal(createSkillAudio(()=>{throw new Error('x');}).setEnabled(true),false);
  const {ctx}=fake(),b=createSkillAudio(()=>ctx);b.setEnabled(true);assert.equal(b.play('nope'),false);b.setEnabled(false);assert.equal(b.play('skill-heal'),false);
});
test('rapid repeats are throttled and floods are capped',()=>{
  const {ctx,log}=fake(),a=createSkillAudio(()=>ctx);a.setEnabled(true);assert.equal(a.play('skill-ready'),true);assert.equal(a.play('skill-ready'),false);
  for(let i=0;i<300;i++)a.play('skill-hammer',{minGap:0});assert.ok(log.starts<=40,String(log.starts));
});
