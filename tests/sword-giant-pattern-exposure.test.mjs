import test from 'node:test';
import assert from 'node:assert/strict';
import {createPatternShuffle} from '../src/pattern-shuffle.mjs';
import {nextGiantPressureSlot,GIANT_NAMES,FERAL_NAMES,giantPattern} from '../src/dice-giant.mjs';
import {createGame,chooseOpening,beginSequence,KWON_RANGE_PRESSURE,PHASE_ONE,SEQUENCES} from '../src/combat.mjs';
const sort=a=>[...a].sort((a,b)=>String(a).localeCompare(String(b)));
test('all thirty of Sungwons giant signatures can actually cast with visible strike objects',()=>{
 for(const phase of ['controlled','feral']){
  const pool=phase==='feral'?FERAL_NAMES:GIANT_NAMES;
  for(let i=0;i<pool.length;i++){
   const p=giantPattern(i,{x:0,z:-40},phase,.25);
   assert.equal(p.slot,i);assert.equal(p.name.startsWith(pool[i]),true);
   assert.ok(p.hazards.length>0&&Number.isFinite(p.duration)&&p.duration>0);
   assert.ok(p.hazards.some(h=>Number.isFinite(h.warn)&&h.warn>=.4));
  }
  for(const seed of [7,22,98]){
   const g={player:{x:0,z:-42},dice:{patternShuffle:createPatternShuffle(seed),
    giant:{temperament:phase,phaseCastCount:0}}};
   const selected=Array.from({length:pool.length},()=>nextGiantPressureSlot(g));
   const essential=phase==='feral'?[7,13,14,15]:[6,12,13];
   assert.deepEqual(sort(selected.slice(0,essential.length)),sort(essential));
   assert.deepEqual(sort(selected),sort(Array.from({length:pool.length},(_,i)=>i)));
  }
 }
});
test('Kwon sword signatures appear in the first three appropriate openings while every combo remains legal',()=>{
 for(const phase of [1,2]){
  for(const seed of [14,100,227]){
   const g=createGame('sword',{register:false,seed});
   g.boss.phase=phase;g.player.x=4;g.player.z=6;
   const found=[];
   for(let i=0;i<(phase===1?2:3);i++){
    const id=chooseOpening(g);found.push(id);beginSequence(g,id);
    g.boss.state='idle';
   }
   const signature=phase===1?['spiderPrison','skyJudge','counterDancer']
    :['graveSword','livingSword','lastStance','doubleMoon'];
   assert.ok(found.every(id=>signature.includes(id)),phase+':'+seed);
   const map=phase===1?PHASE_ONE:SEQUENCES;
   for(const id of Object.keys(map))assert.ok(Array.isArray(map[id])&&map[id].length,phase+':'+id);
  }
 }
});
test('long-range Kwon opening guarantee never forces a non-pressure attack',()=>{
 const g=createGame('sword',{register:false,seed:190});
 g.boss.phase=2;g.player.x=0;g.player.z=22;
 const opening=chooseOpening(g);
 assert.ok(KWON_RANGE_PRESSURE.openings[2].includes(opening));
});
