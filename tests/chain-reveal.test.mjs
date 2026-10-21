import test from 'node:test';
import assert from 'node:assert/strict';
import {chainRevealPose,chainLinkPose} from '../src/chain-reveal-data.mjs';
test('victory scene starts full size and visible',()=>{const p=chainRevealPose(0);assert.equal(p.scale,1);assert.equal(p.screenOpacity,1);assert.equal(p.headOpacity,0);assert.equal(p.y,.5);});
test('screen becomes the visible clown head before being pulled away',()=>{const p=chainRevealPose(.6);assert.equal(p.screenOpacity,0);assert.equal(p.headOpacity,1);assert.equal(p.gather,1);assert.equal(p.drop,0);});
test('final pull clears the head below the viewport',()=>{const p=chainRevealPose(1);assert.equal(p.headOpacity,0);assert.ok(p.y>1.5);assert.equal(p.drop,1);});
test('invalid progress stays finite and bounded',()=>{for(const t of [NaN,Infinity,-1,0,.5,1,2])for(const v of Object.values(chainRevealPose(t)))assert.ok(Number.isFinite(v));});
test('alternate links expose different sides of thick metal',()=>{const a=chainLinkPose(0,0,36,28,390,844,1,1,.6),b=chainLinkPose(0,1,36,28,390,844,1,1,.6);assert.notEqual(a.turn,b.turn);assert.ok(a.rx>=10&&a.ry===20);});
test('chain anchors gather toward the revealed head',()=>{const a=chainLinkPose(0,0,64,36,1000,800,1,1,0),b=chainLinkPose(0,0,64,36,1000,800,1,1,.6);assert.ok(Math.abs(b.x-500)<Math.abs(a.x-500));});
