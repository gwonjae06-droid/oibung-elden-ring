import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionPose,advanceTransition,shouldStartTransition,CUES} from '../src/transition-data.mjs';
test('victory, chains, pull and clown entry occur in order',()=>{for(const [t,s]of[[0,'declare'],[2.1,'bind'],[3.5,'pull'],[5,'enter'],[8.3,'ready']])assert.equal(transitionPose(t).stage,s);});
test('visual progress stays finite and bounded',()=>{for(const t of[-10,0,.3,2,3.4,4.7,8.2,100,NaN,Infinity]){const p=transitionPose(t);for(const k of['bind','pull','entry','title'])assert.ok(Number.isFinite(p[k])&&p[k]>=0&&p[k]<=1,k);}});
test('each animated track moves forward without jumps',()=>{for(const k of['bind','pull','entry']){let prev=0;for(let i=0;i<1000;i++){const v=transitionPose(i/100)[k];assert.ok(v>=prev-1e-9&&v-prev<.03,k);prev=v;}}});
test('defeat and hidden victory screens never trigger the entrance',()=>{assert.equal(shouldStartTransition(true,'패배'),false);assert.equal(shouldStartTransition(false,'승리'),false);assert.equal(shouldStartTransition(true,'승리'),true);});
test('background tabs pause the timeline and long frames are clamped',()=>{assert.equal(advanceTransition(2,1,true),2);assert.equal(advanceTransition(2,-1),2);assert.equal(advanceTransition(2,1),2.05);assert.equal(advanceTransition(2,NaN),2);});
test('the preview does not advertise playable second boss combat',()=>{assert.equal(transitionPose(CUES.ready).stage,'ready');assert.equal(transitionPose(CUES.enter).entry,0);assert.equal(transitionPose(CUES.ready).entry,1);});
