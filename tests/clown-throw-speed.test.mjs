import test from 'node:test';import assert from 'node:assert/strict';
import {CLOWN_THROW_SLOW,slowClownThrow} from '../src/clown-throw-speed.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);
test('thrown head and its blast warning slow together',()=>{const z={id:4,state:'warn',warn:1.45},q={kind:'head',fly:.9,warn:1.45,zone:4},c={zones:[z]};assert.equal(slowClownThrow(c,q),true);near(CLOWN_THROW_SLOW,1.1);near(q.fly,.99);near(q.warn,1.595);near(z.warn,1.595);});
test('thrown ball slows but unrelated zone stays unchanged',()=>{const z={id:8,state:'warn',warn:3},q={kind:'ball',fly:.85,warn:.85,zone:8},c={zones:[z]};slowClownThrow(c,q);near(q.fly,.935);near(q.warn,.935);assert.equal(z.warn,3);});
test('rolling heads and placed heads are not thrown projectiles',()=>{for(const q of[{kind:'roll',fly:0,warn:1,travel:.6},{kind:'head',fly:.001,warn:.8}]){const before={...q};assert.equal(slowClownThrow({zones:[]},q),false);assert.deepEqual(q,before);}});
test('malformed bombs are rejected without changes',()=>{for(const q of[null,{kind:'ball',fly:NaN,warn:1},{kind:'ball',fly:1,warn:.5}]){assert.equal(slowClownThrow({zones:[]},q),false);}});
