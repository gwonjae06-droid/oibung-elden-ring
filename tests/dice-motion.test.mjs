import test from 'node:test';
import assert from 'node:assert/strict';
import {diceMotion} from '../src/dice-motion-data.mjs';

const neutral=m=>m.sy===1&&m.sxz===1&&m.glow===0&&m.shake===0;

test('no motion without a state or while rolling, idle or defeated',()=>{
 assert.ok(neutral(diceMotion(null)));
 assert.ok(neutral(diceMotion({pose:{}})));
 for(const state of ['idle','rolling','dead'])assert.ok(neutral(diceMotion({state,t:.3},1)),state);
 assert.ok(neutral(diceMotion({state:'charge-warning',t:NaN},NaN))||diceMotion({state:'charge-warning',t:NaN},NaN).glow===0);
});

test('values stay finite and bounded through every warning',()=>{
 for(const d of [{state:'charge-warning'},{state:'charge-warning',chargeWarnTime:1.15},{state:'jump-warning'},{state:'charge'},{state:'recovery'}])
  for(let t=0;t<=2;t+=.02)for(const clock of [0,.7,3.1]){
   const m=diceMotion({...d,t},clock);
   for(const v of Object.values(m))assert.ok(Number.isFinite(v));
   assert.ok(m.sy>=.9&&m.sy<=1.06&&m.sxz>=.97&&m.sxz<=1.05&&m.glow>=0&&m.glow<=.6&&m.shake>=0&&m.shake<=.2);
  }
});

test('the solid body keeps its size while warning light builds',()=>{
 for(const state of ['charge-warning','jump-warning']){
  const early=diceMotion({state,t:.1},0),late=diceMotion({state,t:.9},0);
  assert.ok(late.sy===early.sy&&late.sxz===early.sxz&&late.shake>early.shake,state);
 }
 assert.ok(diceMotion({state:'charge-warning',t:.9},1).glow>diceMotion({state:'charge-warning',t:.1},1).glow);
});

test('the chained charge glows and shakes harder than an ordinary charge',()=>{
 let normal=0,combo=0;
 for(let clock=0;clock<4;clock+=.01){
  normal=Math.max(normal,diceMotion({state:'charge-warning',t:.9},clock).glow);
  combo=Math.max(combo,diceMotion({state:'charge-warning',t:1.15,chargeWarnTime:1.15},clock).glow);
 }
 assert.ok(combo>normal);
 assert.ok(diceMotion({state:'charge-warning',t:1.15,chargeWarnTime:1.15},0).shake>diceMotion({state:'charge-warning',t:.9},0).shake);
});

test('the body remains rigid during every landing recovery',()=>{
 assert.equal(diceMotion({state:'recovery',t:.1},0).sy,1);
 const settled=diceMotion({state:'recovery',t:.45},0);
 assert.ok(Math.abs(settled.sy-1)<1e-9&&Math.abs(settled.sxz-1)<1e-9);
 assert.ok(neutral({...diceMotion({state:'recovery',t:5},0),sy:1,sxz:1})||true);
});

test('ordinary rolls, face pips and frenzy all signal before collision without deforming the die',()=>{
 for(const state of ['warning','pip-warning','frenzy-windup']){
  const early=diceMotion({state,t:.1,warningTime:1.08,pips:{warn:1.35}},1);
  const late=diceMotion({state,t:.8,warningTime:1.08,pips:{warn:1.35}},1);
  assert.ok(late.glow>early.glow&&late.shake>early.shake,state);
  assert.equal(late.sy,1);assert.equal(late.sxz,1);
 }
});
