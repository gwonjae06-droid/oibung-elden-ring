import test from 'node:test';
import assert from 'node:assert/strict';
import {createPatternShuffle,drawPatternShuffle} from '../src/pattern-shuffle.mjs';
import {createGame,chooseOpening,beginSequence,PHASE_ONE,SEQUENCES} from '../src/combat.mjs';
import {createClownGame,choosePattern,startClownPattern,PATTERNS as CLOWN} from '../src/clown-combat.mjs';
import {createDiceGame,stepDice} from '../src/dice-combat.mjs';
import {DICE_RULES as DICE} from '../src/dice-data.mjs';
import {nextGiantPressureSlot,GIANT_NAMES,FERAL_NAMES,giantPattern} from '../src/dice-giant.mjs';
import {createBloodPatternDeck,nextBloodPattern} from '../src/blood-pattern-director.mjs';
import {bloodPool} from '../src/blood-data.mjs';
const equalPool=(actual,pool)=>assert.deepEqual([...actual].sort(),[...pool].sort());
const distinct=(values)=>assert.equal(new Set(values).size,values.length);
test('shuffle bag is seeded, exhaustive, fully shuffled and never repeats across cycles',()=>{
 const pool=Array.from({length:24},(_,i)=>'move-'+i);
 const a=createPatternShuffle(42),b=createPatternShuffle(42),c=createPatternShuffle(43);
 const draw=state=>Array.from({length:pool.length*6},()=>drawPatternShuffle(state,'phase1',pool));
 const x=draw(a),y=draw(b),z=draw(c);
 assert.deepEqual(x,y,'the same seed must reproduce a boss fight');
 assert.notDeepEqual(x,z,'different attempts must change the order');
 for(let k=0;k<6;k++)equalPool(x.slice(k*24,(k+1)*24),pool);
 for(let k=1;k<x.length;k++)assert.notEqual(x[k],x[k-1]);
});
test('context priorities never starve non-preferred attacks',()=>{
 const state=createPatternShuffle(99),pool=['range','close','spell','finish','dash'];
 const x=Array.from({length:pool.length*4},()=>drawPatternShuffle(state,'phase1',pool,{preferred:['close']}));
 for(let c=0;c<4;c++)equalPool(x.slice(c*5,c*5+5),pool);
});
test('first boss uses each legal opening once per phase, with no repeat and random attempts',()=>{
 for(const phase of [1,2]){
  const all=Object.keys(phase===1?PHASE_ONE:SEQUENCES);
  const run=seed=>{
   const g=createGame('sword',{register:false,seed});g.boss.phase=phase;
   g.player.x=8;g.player.z=8;
   const choices=[];
   for(let n=0;n<all.length*3;n++){
    const id=chooseOpening(g);choices.push(id);beginSequence(g,id);
    g.boss.state='idle';
   }
   return choices;
  };
  const a=run(11),b=run(11),c=run(12);
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
  for(let k=0;k<3;k++)equalPool(a.slice(k*all.length,(k+1)*all.length),all);
  for(let k=1;k<a.length;k++)assert.notEqual(a[k],a[k-1]);
 }
});
test('clown cycles every regular circus show once, independently of phase and difficulty',()=>{
 for(const phase of [1,2])for(const story of [false,true]){
  const pool=Object.keys(CLOWN).filter(k=>k!=='shove'&&CLOWN[k].phases.includes(phase));
  const run=seed=>{
   const g=createClownGame('sword',{register:false,seed});g.boss.phase=phase;
   // Include all final-act attacks when testing the complete phase-two deck.
   if(phase===2)g.clown.horrorStage=3;
   g.player.x=8;g.player.z=g.boss.z+8;
   if(story)g.journeyBalance={mode:'story'};
   const result=[];
   for(let i=0;i<pool.length*2;i++){
    const id=choosePattern(g);result.push(id);startClownPattern(g,id);g.clown.last=id;
   }
   return result;
  };
  const a=run(101),b=run(101),c=run(102);
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
  for(let i=0;i<2;i++)equalPool(a.slice(i*pool.length,(i+1)*pool.length),pool);
  for(let i=1;i<a.length;i++)assert.notEqual(a[i],a[i-1]);
 }
});
test('Sungwon casino cycles every roulette/physical attack once, then reshuffles',()=>{
 for(const phase of [1,2]){
  const slots=Array.from({length:phase===1?3:7},(_,i)=>i);
  const run=seed=>{
   const g=createDiceGame({seed}),seen=[];g.boss.phase=phase;
   for(let i=0;i<slots.length*4;i++){
    g.dice.state='recovery';g.dice.t=DICE.recovery;g.dice.pendingPattern=true;
    stepDice(g,.04);seen.push(g.dice.lastAttackSlot);
    assert.ok(slots.includes(g.dice.lastAttackSlot));
   }
   return seen;
  };
  const a=run(400),b=run(400),c=run(401);
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
  for(let j=0;j<4;j++)equalPool(a.slice(j*slots.length,(j+1)*slots.length),slots);
  for(let j=1;j<a.length;j++)assert.notEqual(a[j],a[j-1]);
 }
});
test('Sungwon controlled and feral giant each uses every move exactly once per cycle',()=>{
 for(const feral of [false,true]){
  const pool=Array.from({length:feral?FERAL_NAMES.length:GIANT_NAMES.length},(_,i)=>i);
  const run=seed=>{
   const g={player:{x:0,z:-42},dice:{patternShuffle:createPatternShuffle(seed),giant:{temperament:feral?'feral':'controlled'}}};
   return Array.from({length:pool.length*3},()=>nextGiantPressureSlot(g));
  };
  const a=run(43),b=run(43),c=run(44);
  assert.deepEqual(a,b);assert.notDeepEqual(a,c);
  for(let i=0;i<3;i++)equalPool(a.slice(i*pool.length,(i+1)*pool.length),pool);
  for(let i=1;i<a.length;i++)assert.notEqual(a[i],a[i-1]);
 }
 const h=giantPattern(GIANT_NAMES.length+3,{x:0,z:-40});
 assert.equal(h.coinFace,'tails','roulette variants change after each randomized cycle');
});
test('Blood already uses an independently shuffled full deck for every phase',()=>{
 for(const phase of [1,2]){
  const pool=bloodPool(phase);
  const a=createBloodPatternDeck(901),b=createBloodPatternDeck(901),c=createBloodPatternDeck(902);
  const draw=x=>Array.from({length:pool.length*3},()=>nextBloodPattern(x,phase));
  const aa=draw(a);assert.deepEqual(aa,draw(b));assert.notDeepEqual(aa,draw(c));
  for(let i=0;i<3;i++)equalPool(aa.slice(i*pool.length,(i+1)*pool.length),pool);
 }
});
