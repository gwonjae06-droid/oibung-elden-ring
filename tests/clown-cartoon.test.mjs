import test from 'node:test';
import assert from 'node:assert/strict';
import {CARTOON_DURATIONS,cartoonPose} from '../src/clown-cartoon.mjs';
const neutral=cartoonPose(null);
for(const [name,dur]of Object.entries(CARTOON_DURATIONS))test(name+' has bounded cartoon poses in both phases',()=>{let changed=false;for(const phase of[1,2])for(let t=0;t<=dur;t+=1/120){const p=cartoonPose(name,t,phase);for(const v of Object.values(p))assert.ok(Number.isFinite(v));for(const k of ['bodyX','bodyY','bodyZ'])assert.ok(p[k]>.5&&p[k]<2.1);assert.ok(p.arms>=1&&p.arms<3.6);assert.ok(p.glove>=1&&p.glove<4.1);assert.ok(p.lift>=0&&p.lift<4.5);changed||=JSON.stringify(p)!==JSON.stringify(neutral);}assert.ok(changed);assert.deepEqual(cartoonPose(name,dur),neutral);assert.deepEqual(cartoonPose(name,0),neutral);});
test('inactive states never deform a phase cutscene or defeated body',()=>{for(const name of Object.keys(CARTOON_DURATIONS))assert.deepEqual(cartoonPose(name,1,2,false),neutral);});
test('unknown patterns and invalid clocks safely return neutral',()=>{assert.deepEqual(cartoonPose('unknown',1),neutral);assert.deepEqual(cartoonPose('dash',NaN),neutral);assert.deepEqual(cartoonPose('dash',Infinity),neutral);});
test('phase two enlarges the exaggeration without changing duration',()=>{const a=cartoonPose('clap',.6,1),b=cartoonPose('clap',.6,2);assert.ok(b.glove>a.glove);assert.deepEqual(cartoonPose('clap',3.4,2),neutral);});
test('bounce has a deliberate airborne hold',()=>{const a=cartoonPose('bounce',.8),b=cartoonPose('bounce',.9);assert.equal(a.lift,3.8);assert.equal(b.lift,3.8);assert.deepEqual(cartoonPose('bounce',3.6),neutral);});
