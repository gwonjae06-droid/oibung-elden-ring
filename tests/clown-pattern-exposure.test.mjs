import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,choosePattern,startClownPattern,PATTERNS} from '../src/clown-combat.mjs';
import {HORROR_PATTERNS,horrorMinStage} from '../src/clown-horror-patterns.mjs';
import {BEAST_PATTERNS} from '../src/clown-beast-pose.mjs';
const sort=x=>[...x].sort();
test('new four-legged hunts get real early casts in the second phase',()=>{
 for(const seed of [1,17,89,2026]){
  const g=createClownGame('sword',{register:false,seed});
  g.boss.phase=2;g.clown.horrorStage=2;g.player.x=8;g.player.z=2;
  const expected=BEAST_PATTERNS.filter(k=>horrorMinStage(k)===2),used=[];
  for(let i=0;i<expected.length;i++){const k=choosePattern(g);used.push(k);startClownPattern(g,k);g.clown.last=k;}
  assert.deepEqual(sort(used),sort(expected),seed+' phase-two hunts');
 }
});
test('all last-act horrors fire first, then the other phase-two patterns stay reachable',()=>{
 for(const seed of [2,27,91]){
  const g=createClownGame('sword',{register:false,seed});
  g.boss.phase=2;g.clown.horrorStage=3;g.player.x=8;g.player.z=2;
  const pool=Object.keys(PATTERNS).filter(k=>k!=='shove'&&PATTERNS[k].phases.includes(2));
  const finale=HORROR_PATTERNS.filter(k=>horrorMinStage(k)===3),seen=[];
  for(let i=0;i<pool.length;i++){const k=choosePattern(g);seen.push(k);startClownPattern(g,k);g.clown.last=k;}
  assert.deepEqual(sort(seen.slice(0,finale.length)),sort(finale),seed+' guaranteed finale');
  assert.deepEqual(sort(seen),sort(pool),seed+' full-cycle coverage');
 }
});
test('locked stage-two moves never accidentally cast a stage-three-only attack',()=>{
 const g=createClownGame('sword',{register:false,seed:8});g.boss.phase=2;g.clown.horrorStage=2;
 for(let i=0;i<65;i++){const k=choosePattern(g);assert.ok(horrorMinStage(k)<=2,k);startClownPattern(g,k);g.clown.last=k;}
});
