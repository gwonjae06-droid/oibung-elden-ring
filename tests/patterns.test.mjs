import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginSequence,chooseOpening,startPattern,step,PATTERNS,bodyPose,act} from '../src/combat.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/240)step(g,1/240);};
function safe(g){g.player.x=20;g.player.z=20;g.player.invuln=100;}
test('phase one is agile but all four openings end with guaranteed punish windows',()=>{
  for(const k of ['rush','sweep','thrust','leap']){
    const g=createGame();safe(g);beginSequence(g,k);
    for(let i=0;i<2400&&!g.boss.punishable;i++)step(g,1/240);
    assert.ok(g.boss.punishable,k);assert.ok(g.boss.recovery>=.95,k+' has no punish window');
    const id=g.boss.attackId;tick(g,.85);assert.equal(g.boss.state,'recovery');assert.equal(g.boss.attackId,id);
  }
});
test('phase one double slash and phase two sword combos have fixed endings',()=>{
  for(const [phase,opening,expected] of [[1,'sweep',['sweep','reverse']],[2,'cross',['cross','reverse','slam']],[2,'jab',['jab','jab','thrust']],[2,'retreat',['retreat','rise']],[2,'wave',['wave','rush']]]){
    const g=createGame();safe(g);g.boss.phase=phase;beginSequence(g,opening);
    const got=[];let id=-1;
    for(let i=0;i<3000;i++){if(g.boss.attackId!==id){id=g.boss.attackId;got.push(g.boss.pattern);}if(g.boss.punishable)break;step(g,1/240);}
    assert.deepEqual(got,expected);assert.ok(g.boss.punishable);assert.ok(g.boss.recovery>=.95);
  }
});
test('tracking stops before the strike and cannot turn during punish time',()=>{
  const g=createGame();startPattern(g,'thrust');tick(g,PATTERNS.thrust.wind*.65);
  const yaw=g.boss.yaw;g.player.x=18;tick(g,.2);assert.equal(g.boss.yaw,yaw);
  while(!g.boss.punishable)step(g,1/240);
  const locked=g.boss.yaw;tick(g,.5);assert.equal(g.boss.yaw,locked);
});
test('distance changes openings and the same opening does not repeat',()=>{
  const g=createGame();for(const phase of [1,2]){
    g.boss.phase=phase;g.player.z=18;
    for(let i=0;i<12;i++){const k=chooseOpening(g);assert.notEqual(k,g.boss.lastOpening);assert.ok((phase===1?['thrust','leap']:['wave','jab']).includes(k));g.boss.lastOpening=k;}
  }
});
test('phase transition clears the combo and rises smoothly without healing',()=>{
  const g=createGame('hammer');g.player.z=0;g.player.yaw=Math.PI;g.boss.wait=50;g.boss.hp=901;
  act(g,'heavy');tick(g,1);assert.equal(g.boss.phase,2);assert.equal(g.boss.state,'transition');assert.equal(g.boss.hp,709);assert.deepEqual(g.boss.queue,[]);
  const s=bodyPose(g.boss).standing;assert.ok(s>0&&s<1);tick(g,2);assert.equal(bodyPose(g.boss).standing,1);
});
