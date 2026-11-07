import test from 'node:test';
import {BOSS_TEMPO} from '../src/boss-tempo.mjs';
import assert from 'node:assert/strict';
import {
 createGame,chooseOpening,beginSequence,step,startPattern,
 KWON_RANGE_PRESSURE,KWON_COUNTERPLAY,PHASE_ONE,SEQUENCES,PATTERNS
} from '../src/combat.mjs';

function chooseAtRange(phase,seed,{story=false,range=20}={}){
 const g=createGame('sword',{register:false,seed});
 g.boss.phase=phase;g.player.x=0;g.player.z=g.boss.z+range;
 if(story)g.journeyBalance={mode:'story'};
 const pool=Object.keys(phase===1?PHASE_ONE:SEQUENCES);
 const chosen=[];
 for(let i=0;i<pool.length*2;i++){
  const opening=chooseOpening(g);chosen.push(opening);
  beginSequence(g,opening);
  g.boss.state='idle';
 }
 return {chosen,pool};
}
test('both phases choose a projectile or a gap-closing combo first when the player is distant',()=>{
 assert.ok(KWON_RANGE_PRESSURE.farDistance>=11&&KWON_RANGE_PRESSURE.farDistance<=14);
 for(const phase of [1,2])for(const story of [false,true]){
  const candidates=KWON_RANGE_PRESSURE.openings[phase];
  assert.ok(candidates.length>=6);
  for(const name of candidates)assert.ok((phase===1?PHASE_ONE:SEQUENCES)[name],name);
  for(let seed=1;seed<=36;seed++){
   const {chosen,pool}=chooseAtRange(phase,seed,{story});
   // All distance-appropriate options leave the bag before stationary melee.
   assert.ok(chosen.slice(0,candidates.length).every(k=>candidates.includes(k)),
    'out-of-reach melee in first distant choices: phase '+phase+' seed '+seed);
   for(let cycle=0;cycle<2;cycle++)
    assert.deepEqual([...chosen.slice(cycle*pool.length,(cycle+1)*pool.length)].sort(),[...pool].sort());
   for(let i=1;i<chosen.length;i++)assert.notEqual(chosen[i],chosen[i-1]);
  }
 }
});
test('a long-range phase-one combo can throw the spider sword fan instead of a short ground swing',()=>{
 const g=createGame('sword',{register:false,seed:13});
 g.player.z=19;
 startPattern(g,'spiderPrison');g.boss.state='active';g.boss.t=PATTERNS.spiderPrison.active*.38;
 step(g,1/120);
 assert.equal(g.bossShots.length,7);
 for(const shot of g.bossShots){
  assert.equal(shot.life,2.45);
  assert.equal(shot.speed,9,'ranged pressure must not make projectiles too fast to dodge');
  assert.ok(shot.minArmTime>=.3,'actual sword projectile must retain release safety');
  assert.ok(Math.hypot(shot.x-g.boss.x,shot.z-g.boss.z)<=5);
 }
});
test('phase-two grave projectiles can reach the rim without invisible direct damage',()=>{
 const g=createGame('sword',{register:false,seed:9});
 g.boss.phase=2;g.player.z=19;
 startPattern(g,'graveSword');g.boss.state='active';g.boss.t=PATTERNS.graveSword.active*.38;
 const hp=g.player.hp;
 step(g,1/120);
 assert.equal(g.bossShots.length,3);
 assert.ok(g.bossShots.every(shot=>shot.life===2.7&&shot.speed===8));
 assert.equal(g.player.hp,hp,'travelling shots must not cause damage from an invisible attack area');
});
test('idle Kwon runs toward the distant player faster in both phases, keeping recovery still',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:101});g.boss.phase=phase;
  g.boss.state='idle';g.boss.wait=5;g.player.x=0;g.player.z=19;
  const start=Math.hypot(g.player.x-g.boss.x,g.player.z-g.boss.z);
  for(let i=0;i<30;i++)step(g,1/120);
  const distance=Math.hypot(g.player.x-g.boss.x,g.player.z-g.boss.z);
  assert.ok(start-distance>KWON_RANGE_PRESSURE.chaseSpeed[phase]*.25*.94);
  g.boss.state='recovery';g.boss.pattern='sweep';g.boss.queue=[];
  g.boss.recovery=1;g.boss.t=0;
  const before={x:g.boss.x,z:g.boss.z};
  for(let i=0;i<30;i++)step(g,1/120);
  assert.equal(g.boss.x,before.x,"boss cannot chase during player recovery window");
  assert.equal(g.boss.z,before.z);
 }
});
test('finishing a distant sword combo gives Kwon a short visible pursuit interval, but keeps short-range tempo',()=>{
 for(const range of [20,8]){
  const g=createGame('sword',{register:false,seed:5}),b=g.boss;
  g.player.x=0;g.player.z=b.z+range;b.state='recovery';b.pattern='sweep';
  b.queue=[];b.recovery=.7;b.t=.69;
  step(g,.02);
  assert.equal(b.state,'idle');
  const standard=range>KWON_RANGE_PRESSURE.farDistance
   ?KWON_RANGE_PRESSURE.chaseWait:.68*BOSS_TEMPO.gap;
  assert.equal(b.wait,Math.max(standard,KWON_COUNTERPLAY.postComboWait[1]));
 }
});
