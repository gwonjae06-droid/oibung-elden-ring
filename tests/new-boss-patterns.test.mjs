import test from 'node:test';
import assert from 'node:assert/strict';
import {PATTERNS as KWON,SEQUENCES,PHASE_ONE,ORDER,CLOSE,createGame,beginSequence,chooseOpening} from '../src/combat.mjs';
import {PATTERNS as CLOWN,createClownGame,choosePattern,startClownPattern,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {horrorMinStage} from '../src/clown-horror-patterns.mjs';

test('new first-boss combos reuse existing moves and are in the opening rotation',()=>{
 for(const [phase,map,keys] of [[1,PHASE_ONE,['feint','skewer']],[2,SEQUENCES,['afterimage','widow']]])
  for(const k of keys){assert.ok(map[k],k);assert.ok(map[k].length>=2&&map[k].length<=3,k);for(const m of map[k])assert.ok(KWON[m],m);assert.ok(ORDER[phase].includes(k),k);}
 assert.ok(CLOSE[1].includes('skewer'));
 for(const phase of [1,2]){const map=phase===1?PHASE_ONE:SEQUENCES;for(const list of [ORDER[phase],CLOSE[phase]])for(const k of list)assert.ok(map[k],phase+':'+k);}
});

test('every opening can be chosen and started, and rotation no longer skips entries',()=>{
 for(const phase of [1,2])for(const z of [-1,5,16]){
  const g=createGame(),seen=new Set();g.boss.phase=phase;g.player.z=z;g.player.invuln=100;
  for(let i=0;i<120;i++){const k=chooseOpening(g);beginSequence(g,k);seen.add(k);g.boss.state='idle';}
  if(z===5)for(const k of ORDER[phase])assert.ok(seen.has(k),phase+':'+k);
 }
});

test('an opening never repeats immediately when several are available',()=>{
 for(const phase of [1,2]){
  const g=createGame();g.boss.phase=phase;g.player.z=5;
  for(let i=0;i<80;i++){const k=chooseOpening(g);assert.notEqual(k,g.boss.lastOpening);g.boss.lastOpening=k;}
 }
});

test('the live circus rotates authored director/troupe actions, not removed ball era attacks',()=>{
 const retired=['humanCannon','ballCannon','bounceChain','ballRain','ballSpin'];
 assert.ok(LIVE_REPERTOIRE.includes('directorBatonRake'));
 assert.ok(LIVE_REPERTOIRE.includes('directorStringLash'));
 assert.ok(LIVE_REPERTOIRE.includes('maskedCannonade'));
 for(const id of retired){
  assert.ok(CLOWN[id],'archived move data should remain compatible');
  assert.ok(!LIVE_REPERTOIRE.includes(id),id+' must not return to the current battle');
 }
 assert.equal(new Set(LIVE_REPERTOIRE).size,LIVE_REPERTOIRE.length);
 for(const id of LIVE_REPERTOIRE){
  const p=CLOWN[id];
  assert.ok(p,id+' has no authored definition');
  assert.ok(p.precast>0&&p.dur>p.precast+p.recover,id+' must have a physical windup and a counter window');
 }
});

test('current 1P / 2P / horror-finale selection stays stage-legal and exhaustive',()=>{
 for(const [phase,stage] of [[1,1],[2,2],[2,3]]){
  const g=createClownGame('sword',{register:false,seed:411+phase*10+stage});
  g.boss.phase=phase;g.clown.horrorStage=stage;
  g.player.x=4;g.player.z=g.boss.z+7;
  const pool=LIVE_REPERTOIRE.filter(k=>CLOWN[k].phases.includes(phase)&&horrorMinStage(k)<=stage);
  assert.ok(pool.length>=8,'the current stage must include a real repertoire');
  const seen=[];
  for(let n=0;n<pool.length*8;n++){
   const key=choosePattern(g);
   assert.ok(pool.includes(key),'out-of-stage or retired move: '+key);
   startClownPattern(g,key);
   assert.ok(g.events.some(e=>e.type==='clown-telegraph'&&e.key===key),'authored intro missing: '+key);
   seen.push(key);
   g.clown.last=key;
  }
  assert.deepEqual([...new Set(seen)].sort(),[...pool].sort(),'every live move must eventually appear across separate director and troupe decks');
  assert.ok(seen.every((id,i)=>i===0||id!==seen[i-1]),'no accidental immediate repeat');
 }
});
