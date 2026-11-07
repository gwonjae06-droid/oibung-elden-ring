import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createGame,step,KWON_RANGE_PRESSURE,beginSequence
} from '../src/combat.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const tick=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*120);i++)step(g,1/120);};

test('both Kwon phases pursue into sword range instead of starting a mid-range melee attack',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:184});
  g.boss.phase=phase;g.boss.state='idle';g.boss.wait=0;
  g.player.x=0;g.player.z=g.boss.z+10;
  g.player.invuln=100;
  const initial=distance(g.player,g.boss),attackId=g.boss.attackId;
  tick(g,.14);
  assert.equal(g.boss.state,'idle','must keep chasing before entering sword range');
  assert.equal(g.boss.attackId,attackId,'no mid-range blind melee');
  assert.ok(distance(g.player,g.boss)<initial,'must actually run toward the player');
  for(let i=0;i<500&&g.boss.state==='idle';i++)step(g,1/120);
  assert.equal(g.boss.state,'windup','the boss must eventually engage');
  assert.ok(distance(g.player,g.boss)<=KWON_RANGE_PRESSURE.engageDistance+.08,
   'melee engagement must start in range, not at a medium-range stand-off');
 }
});

test('sustained pursuit favors the player over circling at the old 6-8 metre distance',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:32});
  g.boss.phase=phase;g.boss.state='idle';g.boss.wait=100;
  g.player.x=0;g.player.z=g.boss.z+11;
  const before=distance(g.boss,g.player);
  tick(g,1.8);
  assert.equal(g.boss.state,'idle');
  assert.ok(distance(g.boss,g.player)<KWON_RANGE_PRESSURE.engageDistance,
   'pursuit should enter real melee range and keep pressure');
  assert.ok(before-distance(g.boss,g.player)>4);
 }
});

test('an out-of-range combo follow-up is held until approach, without changing the prior recovery pose',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:77}),b=g.boss;
  b.phase=phase;g.player.invuln=100;b.state='recovery';
  b.pattern='cross';b.recovery=.13;b.t=.13;b.queue=['reverse'];
  g.player.x=0;g.player.z=b.z+10;
  const before=distance(b,g.player),attackId=b.attackId;
  step(g,1/120);
  assert.equal(b.pattern,'cross','must not cast the next melee hit from ten metres');
  assert.equal(b.state,'recovery','hold natural follow-through while closing');
  assert.equal(b.attackId,attackId);
  assert.ok(distance(b,g.player)<before);
  for(let i=0;i<500&&b.pattern==='cross';i++)step(g,1/120);
  assert.equal(b.pattern,'reverse','queued move must still execute after the approach');
  assert.equal(b.state,'windup');
  assert.ok(distance(b,g.player)<=KWON_RANGE_PRESSURE.engageDistance+.08);
 }
});

test('final punish recovery remains stationary even when the player runs far away',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false}),b=g.boss;
  b.phase=phase;b.state='recovery';b.pattern='sweep';b.recovery=1.1;b.t=0;b.queue=[];
  g.player.z=20;const from={x:b.x,z:b.z};
  tick(g,.85);
  assert.deepEqual({x:b.x,z:b.z},from);
  assert.equal(b.state,'recovery','punish window cannot be cancelled by the chase rule');
 }
});

test('far-range pressure is reserved for authored projectiles and gap-closing openings',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:14}),b=g.boss;
  b.phase=phase;b.state='idle';b.wait=0;
  g.player.x=0;g.player.z=23;g.player.invuln=100;
  step(g,1/120);
  assert.ok(b.state==='windup'||b.state==='idle');
  if(b.state==='windup')assert.ok(KWON_RANGE_PRESSURE.openings[phase].includes(b.lastOpening),
   'cannot launch non-ranged static melee outside sword range');
 }
});
