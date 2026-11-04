import test from 'node:test';
import assert from 'node:assert/strict';
import {clownShowPose as pose} from '../src/clown-show-pose.mjs';
test('unrelated and phase-one dash keep their existing choreography',()=>{assert.equal(pose('juggle',1),null);assert.equal(pose('dash',1,1),null);});
test('new clap retains its late final hand motion',()=>{assert.ok(pose('clap',4.1).glove>2);assert.equal(pose('clap',6.5).glove,1);});
test('return head panics during the return and settles afterwards',()=>{assert.ok(pose('laughBomb',2.2).arms>1);assert.equal(pose('laughBomb',4.8).arms,1);});
test('runaway has both dash smears and a late stumble',()=>{assert.ok(pose('dash',1.1,2).smear>.5);assert.ok(pose('dash',2.95,2).smear>.5);assert.ok(pose('dash',4,2).lean>.3);});
test('all sampled transforms stay finite with positive scales',()=>{for(const [name,d,phase] of [['laughBomb',4.8,1],['clap',6.5,2],['dash',5.8,2]])for(let t=0;t<=d+.2;t+=.01){const p=pose(name,t,phase);assert.ok(Object.values(p).every(Number.isFinite));for(const k of ['bodyX','bodyY','bodyZ','arms','glove','shoe'])assert.ok(p[k]>0);}});
test('inactive and invalid timestamps yield neutral transforms',()=>{for(const time of [NaN,Infinity])assert.equal(pose('clap',time).glove,1);assert.equal(pose('clap',4.1,2,false).glove,1);});
