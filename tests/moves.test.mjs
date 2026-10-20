import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,beginSequence,act,bodyPose,PATTERNS,ORDER} from '../src/combat.mjs';
const tick=(g,t,input={})=>{for(let s=0;s<t;s+=1/240)step(g,1/240,input);};
test('the two phases have distinct opening sets',()=>{
  assert.deepEqual(ORDER[1],['rush','sweep','thrust','leap']);assert.deepEqual(ORDER[2],['cross','jab','retreat','wave','whirl']);
  assert.ok(ORDER[1].every(k=>!ORDER[2].includes(k)));assert.throws(()=>beginSequence(createGame(),'wave'));
});
test('rush strafes then dashes in a locked direction, ending with downtime',()=>{
  const g=createGame();g.player.invuln=100;startPattern(g,'rush');const x=g.boss.x;tick(g,.17);assert.ok(Math.abs(g.boss.x-x)>1);
  tick(g,.5);const aim=g.boss.aim;g.player.x=20;tick(g,.1);assert.equal(g.boss.aim,aim);
  tick(g,.2);assert.equal(g.boss.state,'recovery');assert.ok(g.boss.punishable);
});
test('wave is a real projectile, not an invisible melee hit',()=>{
  const g=createGame();g.boss.phase=2;g.player.z=12;startPattern(g,'wave');tick(g,.7);assert.equal(g.bossShots.length,1);assert.equal(g.player.hp,120);
  g.player.x=7;tick(g,1);assert.equal(g.player.hp,120);
});
test('standing does not disable player melee or projectile damage',()=>{
  for(const weapon of ['sword','bow']){
    const g=createGame(weapon);g.boss.phase=2;g.boss.wait=99;g.player.z=0;g.player.yaw=Math.PI;
    act(g,'light');tick(g,.7);assert.ok(g.boss.hp<1800,weapon);
  }
});
test('victory clears enemy projectiles and prevents additional inputs',()=>{
  const g=createGame();g.boss.wait=99;g.boss.hp=1;g.player.z=0;g.player.yaw=Math.PI;act(g,'light');tick(g,.4);
  assert.equal(g.status,'won');assert.deepEqual(g.bossShots,[]);assert.equal(act(g,'light'),false);
});
