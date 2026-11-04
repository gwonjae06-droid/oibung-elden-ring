import test from 'node:test';
import assert from 'node:assert/strict';
import {rippleHeight,RIPPLE} from '../src/dice-ripple.mjs';
import {playerWeaponCue} from '../src/player-weapon-sfx.mjs';
import {giantPattern} from '../src/dice-giant.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';

test('head-slam ripple travels outward like a wave and dies out without any hazard',()=>{
 const r={x:0,z:0,t0:0,amp:RIPPLE.amp};
 assert.ok(Math.abs(rippleHeight([r],25.5,0,.5))>.3,'the wave front lifts the felt');
 assert.ok(Math.abs(rippleHeight([r],80,0,.5))<.001,'the far felt is still calm');
 assert.equal(rippleHeight([r],25,0,RIPPLE.life+.1),0);
 assert.ok(giantPattern(2,{x:0,z:0},'feral',.1).hazards.every(h=>h.shape!=='ring'),'no damaging shockwave ring remains');
});
test('sword and hammer swings are faint unless they connect',()=>{
 const swing={type:'swing'};
 for(const weapon of ['sword','hammer']){
  assert.equal(playerWeaponCue(swing,{weapon,player:{action:{kind:'attack',hit:false}}}).quiet,true);
  assert.ok(!playerWeaponCue(swing,{weapon,player:{action:{kind:'attack',hit:true}}}).quiet);
 }
 assert.ok(!playerWeaponCue({type:'shot'},{weapon:'bow',player:{action:{kind:'attack',hit:false}}}).quiet);
});
test('the dice walking foley is quieter than before',()=>{
 const g={boss:{},dice:{}};
 assert.ok(bossFoleySpec({type:'dice-roll'},g).volume<.2);
 assert.ok(bossFoleySpec({type:'dice-warning'},g).volume<.12);
});
