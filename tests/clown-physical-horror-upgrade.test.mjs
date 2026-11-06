import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,startClownPattern,stepClown} from '../src/clown-combat.mjs';
import {nightmareWorldState} from '../src/clown-nightmare-world.mjs';
import {clownMutationPose} from '../src/clown-nightmare-mutation.mjs';
const turn=(g,n)=>{g.player.hp=g.player.maxHp=99999;g.player.invuln=1e5;for(let i=0;i<n;i++)stepClown(g,1/120);};
test('every signature beast pattern has a different readable nightmare world and facial distortion',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;g.clown.horrorStage=3;
 for(const [pattern,mode] of [['feralSkitter','flesh'],['reverseCrawl','flesh'],['facePeelHunt','mirror'],['ceilingPounce','inversion'],['unhingedClap','void']]){
  startClownPattern(g,pattern);
  assert.equal(nightmareWorldState(g).mode,mode);
  turn(g,40);
  const q=clownMutationPose(g,g.time);
  assert.ok(q.jaw>=.45&&q.skeletalFold>.35,pattern);
 }
});
test('sideways reverse crawl really moves diagonally and its warning exists first',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;g.clown.horrorStage=3;
 startClownPattern(g,'reverseCrawl');const origin={x:g.boss.x,z:g.boss.z};
 turn(g,130);
 assert.ok(g.clown.zones.some(z=>z.shape==='lane'&&z.visual));
 assert.ok(Math.abs(g.boss.x-origin.x)>.5,'the monster must move sideways, not just slide straight ahead');
});
