import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,chooseGyuwonPattern,startGyuwonPattern,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {gyuwonPool,GYUWON_PATTERNS} from '../src/gyuwon-data.mjs';
const sort=a=>[...a].sort();
test('all 15 patterns remain in the phase-specific shuffled casting decks',()=>{
 for(const seed of [4,48,125]){
  const g=createGyuwonGame('sword',{seed});
  for(const phase of [1,2,3])for(const space of phase===2?['white','dark']:['white']){
   g.boss.phase=phase;g.gyuwon.space=space;g.gyuwon.pattern=null;
   const pool=gyuwonPool(phase,space),selected=[];
   for(let n=0;n<pool.length;n++){
    const id=chooseGyuwonPattern(g);
    assert.ok(GYUWON_PATTERNS[id],id);
    selected.push(id);g.gyuwon.pattern=id;
   }
   assert.deepEqual(sort(selected),sort(pool),phase+'/'+space);
  }
 }
});
test('returning from the dark room does not reset white-room patterns',()=>{
 const g=createGyuwonGame('sword',{seed:304});g.boss.phase=2;
 const whiteFirst=chooseGyuwonPattern(g);g.gyuwon.pattern=whiteFirst;
 g.gyuwon.space='dark';const darkFirst=chooseGyuwonPattern(g);g.gyuwon.pattern=darkFirst;
 g.gyuwon.space='white';const remaining=[];
 for(let i=0;i<gyuwonPool(2,'white').length-1;i++){
  const next=chooseGyuwonPattern(g);remaining.push(next);g.gyuwon.pattern=next;
 }
 assert.deepEqual(sort([whiteFirst,...remaining]),sort(gyuwonPool(2,'white')));
});
test('Gyuwon first combat cast varies with seed instead of always using line',()=>{
 const seen=new Set();
 for(const seed of [1,2,3,4,5,6]){
  const g=createGyuwonGame('sword',{seed});g.player.invuln=10000;
  for(let i=0;i<170&&g.boss.state==='recovery';i++)stepGyuwon(g,1/120);
  assert.equal(g.boss.state,'pattern');seen.add(g.gyuwon.pattern);
 }
 assert.ok(seen.size>1);
});
