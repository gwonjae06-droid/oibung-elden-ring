import test from 'node:test';
import assert from 'node:assert/strict';
import {createBloodPatternDeck,nextBloodPattern} from '../src/blood-pattern-director.mjs';
import {bloodPool} from '../src/blood-data.mjs';
test('the blood boss casts its visually distinct rare rites early without losing the full deck',()=>{
 for(const seed of [1,9,68,1045]){
  const p1=createBloodPatternDeck(seed),p2=createBloodPatternDeck(seed);
  const first=Array.from({length:bloodPool(1).length},()=>nextBloodPattern(p1,1));
  const second=Array.from({length:bloodPool(2).length},()=>nextBloodPattern(p2,2));
  assert.deepEqual([...first].sort(),bloodPool(1).sort());
  assert.deepEqual([...second].sort(),bloodPool(2).sort());
  assert.ok(first.indexOf('bloodStatues')<6);
  assert.ok(first.indexOf('heartCage')<7);
  assert.ok(second.indexOf('heartFeast')<4,'health siphon must cast in an ordinary short attempt');
  assert.ok(second.indexOf('wingGenesis')<8,'the grand wing creation must be seen');
  assert.ok(['wing','pulse'].includes(second[1]));
  assert.ok(['judgement','ritual'].every(k=>second.indexOf(k)<4));
 }
});
