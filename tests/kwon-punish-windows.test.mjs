import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,patternConfig,KWON_RANGE_PRESSURE,KWON_COUNTERPLAY,HUG_TIME} from '../src/combat.mjs';
import {chooseKwonCloseDefense} from '../src/kwon-close-defense.mjs';

const make=(phase,withFollowup=false)=>{
 const g=createGame('hammer',{register:false,seed:441}),b=g.boss;
 b.phase=phase;b.x=0;b.z=0;b.yaw=0;b.aim=0;
 b.pattern='sweep';b.state='active';b.t=patternConfig(b).active;
 b.queue=withFollowup?['reverse']:[];
 g.player.x=0;g.player.z=3;g.player.invuln=100;
 return g;
};

test('all phases provide non-trivial recovery after a finished combo',()=>{
 for(const phase of [1,2,3]){
  const g=make(phase),b=g.boss;
  step(g,1/120);
  assert.equal(b.state,'recovery');
  assert.equal(b.punishable,true);
  assert.ok(b.recovery>=KWON_COUNTERPLAY.finisherRecovery[phase]);
  const from={x:b.x,z:b.z};
  for(let i=0;i<Math.floor(.7*120);i++)step(g,1/120);
  assert.equal(b.state,'recovery','do not skip the player punish window');
  assert.deepEqual({x:b.x,z:b.z},from,'boss stays planted while punishable');
 }
});

test('combo continuations remain quick but no longer restart after 0.13 seconds',()=>{
 for(const phase of [1,2,3]){
  const g=make(phase,true),b=g.boss;
  step(g,1/120);
  assert.equal(b.state,'recovery');
  assert.equal(b.punishable,false);
  assert.ok(b.recovery>=KWON_COUNTERPLAY.comboRecovery[phase]);
 }
});

test('a final recovery creates a near-range breathing window before chase or hug counters',()=>{
 for(const phase of [1,2,3]){
  const g=make(phase),b=g.boss;
  step(g,1/120);
  b.t=b.recovery;
  step(g,1/120);
  assert.equal(b.state,'idle');
  assert.ok(b.wait>=KWON_COUNTERPLAY.postComboWait[phase]);
  assert.ok(b.closeGrace>=KWON_COUNTERPLAY.postComboWait[phase]);
  assert.equal(b.hug,0);
  b.hug=HUG_TIME+.2;
  assert.equal(chooseKwonCloseDefense(b,g.player),null,'no immediate close-range retaliations');
  const pos={x:b.x,z:b.z};
  step(g,1/120);
  assert.equal(b.state,'idle');
  assert.deepEqual({x:b.x,z:b.z},pos,'boss must not slide into a nearby melee counterattack');
 }
});

test('Kwon keeps approaching into striking range rather than reverting to long-distance kiting',()=>{
 assert.ok(KWON_RANGE_PRESSURE.spacing>4&&KWON_RANGE_PRESSURE.spacing<KWON_RANGE_PRESSURE.engageDistance);
 const g=make(1),b=g.boss;
 b.state='idle';b.wait=100;b.closeGrace=0;b.closeCooldown=10;
 g.player.x=0;g.player.z=11;
 const before=Math.hypot(g.player.x-b.x,g.player.z-b.z);
 for(let i=0;i<120;i++)step(g,1/120);
 assert.ok(Math.hypot(g.player.x-b.x,g.player.z-b.z)<before-2,'still approaches the player');
});
