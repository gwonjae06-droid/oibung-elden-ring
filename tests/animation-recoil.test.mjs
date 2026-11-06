import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRecoilBank} from '../src/animation-recoil.mjs';

test('secondary hit reaction settles smoothly after a visual attack beat',()=>{
 const bank=createRecoilBank();
 assert.equal(bank.step('body',0,0),0);
 const struck=bank.step('body',1,1/60,{strength:1.7,frequency:14,limit:.09});
 assert.ok(struck>0&&struck<.09);
 let end=struck;
 for(let i=0;i<120;i++)end=bank.step('body',1,1/60,{strength:1.7,frequency:14,limit:.09});
 assert.ok(Math.abs(end)<.001);
});

test('pause freezes render channels and different joints never share recoil',()=>{
 const bank=createRecoilBank();
 bank.step('left',0,0);bank.step('right',0,0);
 const hit=bank.step('left',1,1/60);
 assert.equal(bank.step('left',-1,0),hit);
 assert.equal(bank.step('right',0,1/60),0);
 assert.notEqual(bank.step('left',-1,1/60),hit);
 bank.reset();assert.equal(bank.size,0);assert.equal(bank.step('left',-1,0),0);
});

test('finite bounded recoil is stable at 30 and 120 fps',()=>{
 const run=n=>{const f=createRecoilBank();f.step('x',0,0);let p=0;
  for(let i=0;i<n;i++)p=f.step('x',1,1/n,{strength:1.5,frequency:15,limit:.06});
  return p;
 };
 assert.ok(Math.abs(run(30)-run(120))<.002);
 const f=createRecoilBank();f.step('x',0,0);
 for(let i=0;i<200;i++){
  const value=f.step('x',i%2?Infinity:-Infinity,1/120,{strength:100,limit:.05});
  assert.ok(Number.isFinite(value)&&Math.abs(value)<=.05000001);
 }
});

test('all four boss rigs and the player use presentation-only recoil',()=>{
 for(const name of ['kwon-neck-rig','clown-actor','dice-giant-view','blood-regalia','player-motion']){
  const src=readFileSync(new URL('../src/'+name+'.mjs',import.meta.url),'utf8');
  assert.ok(src.includes('createRecoilBank'),name);
  assert.ok(src.includes('recoil.step(')||src.includes('inertia.step('),name);
 }
 for(const name of ['combat','clown-combat','dice-combat','blood-combat']){
  const src=readFileSync(new URL('../src/'+name+'.mjs',import.meta.url),'utf8');
  assert.ok(!src.includes('animation-recoil'),name);
 }
});
