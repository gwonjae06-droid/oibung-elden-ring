import test from 'node:test';
import assert from 'node:assert/strict';
import {collapsePose,createCollapseClock,COLLAPSE_DURATION} from '../src/boss-collapse.mjs';
test('brief hold precedes a gradual collapse',()=>{assert.equal(collapsePose(.1).fall,0);assert.ok(collapsePose(.6).fall>0&&collapsePose(.6).fall<1);assert.equal(collapsePose(COLLAPSE_DURATION).roll,.9);assert.equal(collapsePose(COLLAPSE_DURATION).sink,-.6);});
test('collapse finishes before existing 1.2 second result delay',()=>{assert.ok(COLLAPSE_DURATION<1.2);assert.equal(collapsePose(1.2).done,true);});
test('fall is monotonic and bounded',()=>{let previous=0;for(let i=0;i<=150;i++){const p=collapsePose(i/100);assert.ok(p.fall>=previous&&p.fall<=1);previous=p.fall;}});
test('clock resets on retry and boss replacement',()=>{const c=createCollapseClock(),b={state:'dead'};for(let i=0;i<30;i++)c.step(b,.05);assert.equal(c.step(b,0).done,true);b.state='idle';assert.equal(c.step(b,.05),null);b.state='dead';assert.equal(c.step(b,0).fall,0);assert.equal(c.step({state:'dead'},0).fall,0);});
test('hidden tabs and invalid dt do not advance collapse',()=>{const c=createCollapseClock(),b={state:'dead'};for(let i=0;i<100;i++)c.step(b,1,true);assert.equal(c.step(b,NaN).fall,0);assert.equal(c.step(b,-1).fall,0);});
