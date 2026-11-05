import test from 'node:test';import assert from 'node:assert/strict';
import {GIANT_THROW_SLOW,slowThrownHazards} from '../src/dice-giant-throw-speed.mjs';
import {giantPattern} from '../src/dice-giant.mjs';
import {giantThrowTimeline} from '../src/dice-giant-motion.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);
test('helper slows only thrown hazards and never twice',()=>{const input=[{warn:1,id:0},{warn:2,id:1}],once=slowThrownHazards(input,h=>h.id===0),twice=slowThrownHazards(once,()=>true);near(GIANT_THROW_SLOW,1.1);near(once[0].warn,1.1);assert.equal(once[1].warn,2);near(twice[0].warn,1.1);near(twice[1].warn,2.2);assert.equal(input[0].warn,1);});
test('possessed giant throw slots take 10 percent longer while palm attacks are unchanged',()=>{
 near(giantPattern(1,{x:0,z:0}).hazards[0].warn,1.15*1.1);near(giantPattern(2,{x:0,z:0}).hazards[0].warn,1.4*1.1);near(giantPattern(3,{x:0,z:0}).hazards[0].warn,1.5*1.1);near(giantPattern(4,{x:0,z:0}).hazards[0].warn,1.4*1.1);
 near(giantPattern(0,{x:0,z:0}).hazards[0].warn,1.1);near(giantPattern(5,{x:0,z:0}).hazards[0].warn,1.6);near(giantPattern(7,{x:0,z:0}).hazards[0].warn,1);near(giantPattern(8,{x:0,z:0}).hazards[0].warn,.85);
});
test('combined roulette slows each thrown prop exactly once',()=>{const p=giantPattern(6,{x:0,z:0}),slowed=p.hazards.filter(h=>h.throwSlowed);assert.equal(slowed.length,10);near(slowed[0].warn,1.4*1.1);near(slowed[9].warn,1.15*1.1);for(const h of p.hazards.filter(h=>!h.throwSlowed))near(h.warn,1.1);});
test('berserk phase is not changed',()=>{for(let slot=0;slot<10;slot++)assert.ok(giantPattern(slot,{x:0,z:0},'feral').hazards.every(h=>!h.throwSlowed),String(slot));});
test('flight from release to impact lasts 10 percent longer',()=>{const h=giantPattern(3,{x:0,z:0}).hazards[0],base={...h,warn:h.warn/1.1},t=giantThrowTimeline({state:'attack',t:0,hazards:[h],temperament:'controlled'},h),t0=giantThrowTimeline({state:'attack',t:0,hazards:[base],temperament:'controlled'},base);near((t.impact-t.release)/(t0.impact-t0.release),1.1);});
