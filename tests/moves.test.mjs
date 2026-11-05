import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,step,startPattern,patternConfig} from '../src/combat.mjs';
import {KWON_WAVE} from '../src/kwon-wave-data.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/240)step(g,1/240);};
test('crescent wave now fires one large vertical sword projectile after an overhead warning',()=>{
  const g=createGame();g.boss.phase=2;g.player.z=20;startPattern(g,'wave');
  const cfg=patternConfig(g.boss);tick(g,cfg.wind-.03);assert.equal(g.bossShots.length,0,'preparation must not deal ranged damage');
  tick(g,.03+cfg.active*KWON_WAVE.releaseRatio+.04);
  assert.equal(g.bossShots.length,1);
  assert.equal(g.bossShots[0].kind,KWON_WAVE.kind);
  assert.equal(g.bossShots[0].radius,KWON_WAVE.radius);
  g.player.x=15;tick(g,1.5);assert.equal(g.player.hp,120);
});
test('melee and arrows can still hit the enlarged boss in phase two',()=>{
  for(const weapon of ['sword','bow']){const g=createGame(weapon);g.boss.phase=2;g.boss.wait=99;g.player.z=0;g.player.yaw=Math.PI;act(g,'light');tick(g,.7);assert.ok(g.boss.hp<g.boss.maxHp);}
});
test('threshold cinematic does not heal boss and clears active projectiles',()=>{
  const g=createGame('hammer');g.boss.hp=901;g.boss.wait=99;g.player.z=0;g.player.yaw=Math.PI;act(g,'light');tick(g,1);assert.equal(g.boss.phase,2);assert.equal(g.boss.hp,787);assert.equal(g.boss.state,'transition');assert.deepEqual(g.bossShots,[]);assert.deepEqual(g.projectiles,[]);
});
