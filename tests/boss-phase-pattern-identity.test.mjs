import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE_ONE,SEQUENCES,PATTERNS as KWON} from '../src/combat.mjs';
import {PATTERNS as CLOWN,createClownGame,choosePattern,startClownPattern} from '../src/clown-combat.mjs';
import {BEAST_PATTERNS} from '../src/clown-beast-pose.mjs';
import {HORROR_PATTERNS,horrorMinStage} from '../src/clown-horror-patterns.mjs';
import {GIANT_NAMES,FERAL_NAMES,giantPattern} from '../src/dice-giant.mjs';
import {BLOOD_PATTERNS,bloodPool} from '../src/blood-data.mjs';
import {GYUWON_PATTERNS,gyuwonPool,MEMORY_ORDER} from '../src/gyuwon-data.mjs';
import {createGyuwonGame,startGyuwonPattern,stepGyuwon,chooseGyuwonPattern} from '../src/gyuwon-combat.mjs';
const sorted=a=>[...a].sort(),intersect=(a,b)=>a.filter(x=>b.includes(x));

test('Kwon opening identities are exclusive and every authored combo can execute',()=>{
 const p1=Object.keys(PHASE_ONE),p2=Object.keys(SEQUENCES);
 assert.ok(p1.length>=10&&p2.length>=15);
 assert.deepEqual(intersect(p1,p2),['shove']);
 for(const mapping of [PHASE_ONE,SEQUENCES])
  for(const [id,parts] of Object.entries(mapping)){
   assert.ok(parts.length,id);
   for(const key of parts)assert.ok(KWON[key],id+'/'+key);
  }
 for(const key of ['spiderPrison','skyJudge'])assert.ok(p1.includes(key));
 for(const key of ['graveSword','livingSword','lastStance'])assert.ok(p2.includes(key));
});
test('Seulwoo phase one is circus, second phase is exclusively the transformed horror',()=>{
 const human=Object.keys(CLOWN).filter(k=>k!=='shove'&&CLOWN[k].phases.includes(1));
 const beast=Object.keys(CLOWN).filter(k=>k!=='shove'&&CLOWN[k].phases.includes(2));
 assert.equal(human.length,20);assert.equal(beast.length,27);
 assert.deepEqual(intersect(human,beast),[]);
 assert.equal(new Set([...human,...beast,'shove']).size,Object.keys(CLOWN).length);
 for(const name of BEAST_PATTERNS)assert.ok(beast.includes(name),name);
 for(const name of HORROR_PATTERNS)assert.ok((human.includes(name)||beast.includes(name)),name);
 for(const phase of [1,2]){
  for(const seed of [2,14,205]){
   const g=createClownGame('sword',{register:false,seed});g.boss.phase=phase;
   g.clown.horrorStage=phase===1?1:3;
   const roster=phase===1?human:beast,seen=[];
   for(let i=0;i<roster.length;i++){
    const k=choosePattern(g);
    assert.ok(roster.includes(k),phase+'/'+k);
    assert.ok(horrorMinStage(k)<=g.clown.horrorStage);
    seen.push(k);startClownPattern(g,k);g.clown.last=k;
   }
   assert.deepEqual(sorted(seen),sorted(roster));
  }
 }
});
test('Sungwon has three genuinely different encounter forms with authored impact cues',()=>{
 assert.equal(GIANT_NAMES.length,16);assert.equal(FERAL_NAMES.length,16);
 for(let i=0;i<16;i++){
  assert.notEqual(GIANT_NAMES[i],FERAL_NAMES[i]);
  const controlled=giantPattern(i,{x:0,z:-40},'controlled',.25);
  const feral=giantPattern(i,{x:0,z:-40},'feral',.25);
  assert.ok(controlled.hazards.length&&feral.hazards.length);
  assert.ok(controlled.hazards.every(h=>h.warn>.35));
  assert.ok(feral.hazards.every(h=>h.warn>.35));
 }
});
test('Seojun phase one ground spells and phase two airborne rituals have no overlap',()=>{
 const first=bloodPool(1),second=bloodPool(2);
 assert.equal(first.length,13);assert.equal(second.length,14);
 assert.deepEqual(intersect(first,second),[]);
 assert.deepEqual(sorted([...first,...second]),sorted(Object.keys(BLOOD_PATTERNS)));
});
test('Gyuwon phase one academic, phase two metaphysical, phase three memory pools do not overlap',()=>{
 const first=gyuwonPool(1),white=gyuwonPool(2,'white'),dark=gyuwonPool(2,'dark'),final=gyuwonPool(3);
 assert.equal(first.length,7);assert.equal(white.length,4);assert.equal(dark.length,4);assert.equal(final.length,5);
 assert.deepEqual(intersect(first,[...white,...dark,...final]),[]);
 assert.deepEqual(intersect(white,dark),[]);
 assert.deepEqual(intersect([...white,...dark],final),[]);
 assert.deepEqual(sorted([...first,...white,...dark,...final]),sorted(Object.keys(GYUWON_PATTERNS)));
 assert.deepEqual(final,MEMORY_ORDER);
 for(const [space,pool] of [['white',white],['dark',dark]]){
  const g=createGyuwonGame('sword',{seed:19});g.boss.phase=2;g.gyuwon.space=space;
  const chosen=[];
  for(let i=0;i<pool.length;i++){const id=chooseGyuwonPattern(g);chosen.push(id);g.gyuwon.pattern=id;}
  assert.deepEqual(sorted(chosen),sorted(pool));
 }
});
test('each new phase-two Gyuwon ritual actually spawns readable attacks and fully recovers',()=>{
 for(const id of ['verdict','mirror','axiom','paradox','erasure']){
  const g=createGyuwonGame();g.boss.phase=2;g.player.invuln=1e6;
  assert.equal(startGyuwonPattern(g,id),true,id);
  assert.ok(g.gyuwon.hazards.length>=3,id);
  assert.ok(g.gyuwon.hazards.every(h=>Number.isFinite(h.warn)&&h.warn>=1),id);
  const count=Math.ceil((GYUWON_PATTERNS[id].duration+.08)*120);
  for(let i=0;i<count;i++)stepGyuwon(g,1/120);
  assert.equal(g.boss.state,'recovery',id);
  assert.equal(g.gyuwon.hazards.length,0,id);
 }
});
