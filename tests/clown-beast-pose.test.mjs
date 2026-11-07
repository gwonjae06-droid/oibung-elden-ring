import test from 'node:test';
import assert from 'node:assert/strict';
import {clownBeastPose,clownBeastPaw,BEAST_PATTERNS} from '../src/clown-beast-pose.mjs';
import {createClownGame,startClownPattern,stepClown,PATTERNS} from '../src/clown-combat.mjs';
import {headFrame} from '../src/clown-visual-data.mjs';
import {clownHurtShapes} from '../src/boss-hit-regions.mjs';
const tick=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepClown(g,1/120)};
test('second phase stands upright; only an authored hunt folds into a grounded quadruped',()=>{
 const g=createClownGame('sword',{register:false});
 assert.equal(clownBeastPose(g).active,false);
 g.boss.phase=2;g.clown.horrorStage=2;
 assert.equal(clownBeastPose(g).active,false,'idle monster must stand');
 assert.equal(headFrame(g).bodyHead,true);
 assert.equal(headFrame(g).mount,null);
 assert.ok(clownHurtShapes(g).some(x=>x.id==='head'));
 assert.ok(!clownHurtShapes(g).some(x=>['ball','mount-head','left-paw'].includes(x.id)));
 startClownPattern(g,'feralSkitter');tick(g,1.7);
 const q=clownBeastPose(g);
 assert.ok(q.active&&q.pitch>.65&&q.bodyHeight<.5);
 const left=clownBeastPaw(q,-1),right=clownBeastPaw(q,1);
 assert.ok(left[0]<0&&right[0]>0&&left.every(Number.isFinite));
 assert.ok(clownHurtShapes(g).some(x=>x.id==='left-paw'));
 const intro=createClownGame('sword',{register:false});
 intro.boss.phase=2;intro.boss.state='transition';
 assert.equal(clownBeastPose(intro).active,false);
 assert.equal(headFrame(intro).bodyHead,true);
});
test('all five signature hunts telegraph before completion and move the physical boss',()=>{
 for(const name of BEAST_PATTERNS){
  const g=createClownGame('sword',{register:false});
  g.boss.phase=2;g.boss.hp*=.2;g.clown.horrorStage=3;
  g.player.invuln=999;g.player.hp=g.player.maxHp=100000;
  assert.ok(PATTERNS[name],name);startClownPattern(g,name);
  const from={x:g.boss.x,z:g.boss.z};
  tick(g,PATTERNS[name].dur+.04);
  assert.ok(g.clown.used[name]>=1,name);
  assert.ok(g.events.some(e=>e.type==='clown-horror'),name+' visual cue');
  assert.ok(g.events.some(e=>e.type==='clown-zone'),name+' real warning');
  if(name!=='unhingedClap')
   assert.ok(Math.hypot(g.boss.x-from.x,g.boss.z-from.z)>.2,name+' physical movement');
 }
});
test('quarter-second of monster anticipation cannot deal invisible damage',()=>{
 for(const name of BEAST_PATTERNS){
  const g=createClownGame('sword',{register:false});
  g.boss.phase=2;g.clown.horrorStage=3;g.player.hp=g.player.maxHp=100000;
  startClownPattern(g,name);const hp=g.player.hp;tick(g,.25);
  assert.equal(g.player.hp,hp,name);
 }
});
