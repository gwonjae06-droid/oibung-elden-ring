import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginSequence,step,swordPose,startPattern,SEQUENCES,PHASE_ONE} from '../src/combat.mjs';
test('all linked sword poses are continuous at state transitions',()=>{for(const[phase,map]of[[1,PHASE_ONE],[2,SEQUENCES]])for(const key of Object.keys(map)){const g=createGame();g.boss.phase=phase;g.player.x=g.player.z=18;g.player.invuln=100;beginSequence(g,key);let prev=swordPose(g.boss),max=0;for(let i=0;i<8000&&!g.boss.punishable;i++){step(g,1/240);const p=swordPose(g.boss);for(const k of['x','y','z','yaw','pitch'])max=Math.max(max,Math.abs(p[k]-prev[k]));prev=p;}assert.ok(max<.2,phase+' '+key+' '+max);}});
test('next strike starts in the previous end pose',()=>{const g=createGame();g.boss.phase=2;g.player.x=g.player.z=18;g.player.invuln=100;beginSequence(g,'flurry');let id=g.boss.attackId,n=0;for(let i=0;i<8000&&!g.boss.punishable;i++){step(g,1/240);if(g.boss.attackId!==id){id=g.boss.attackId;assert.ok(g.boss.from);n++;}}assert.equal(n,4);});

test('signature follow-through exactly carries into the next windup',()=>{
 for(const [pattern,phase] of [['spiderPrison',1],['graveSword',2],['livingSword',2],['lastStance',2]]){
  const g=createGame();g.boss.phase=phase;g.boss.pattern=pattern;g.boss.state='recovery';g.boss.queue=['sweep'];
  const before=swordPose(g.boss);
  startPattern(g,'sweep');
  const after=swordPose(g.boss);
  for(const axis of ['x','y','z','yaw','pitch'])assert.ok(Math.abs(before[axis]-after[axis])<1e-7,pattern+' '+axis);
 }
});
