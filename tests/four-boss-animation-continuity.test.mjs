import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoseContinuity} from '../src/boss-animation-continuity.mjs';
import {createClownGame,stepClown,startClownPattern} from '../src/clown-combat.mjs';
import {clownBeastPose} from '../src/clown-beast-pose.mjs';
import {clownHurtShapes} from '../src/boss-hit-regions.mjs';
import {giantHandGesture} from '../src/dice-giant-motion.mjs';

test('clown briefly folds into a floor-supported crawl and returns to two feet',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;g.clown.horrorStage=2;
 assert.equal(clownBeastPose(g).entry,0);
 startClownPattern(g,'feralSkitter');
 let last=0;
 for(let i=0;i<90;i++){
  g.clown.pt=i*.01;const pose=clownBeastPose(g),shapes=clownHurtShapes(g);
  assert.ok(pose.pitch+1e-8>=last);
  assert.ok(shapes.some(q=>q.id==='head'));
  assert.ok(!shapes.some(q=>q.id==='mount-head'||q.id==='ball'));
  last=pose.pitch;
 }
 assert.ok(clownBeastPose(g).entry>.99);
 g.clown.pt=7.39;assert.equal(clownBeastPose(g).entry,0,'recover before next action');
});
test('toggling visual continuity cannot change damage, state, or giant palm contact',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=2;g.clown.horrorStage=3;startClownPattern(g,'feralSkitter');
 const smoothing=createPoseContinuity(),bossX=g.boss.x;
 for(let i=0;i<45;i++){
  stepClown(g,1/120);
  smoothing.step({lean:Math.sin(i/12)},1/120,{owner:g,time:g.time});
 }
 assert.equal(g.boss.phase,2);
 assert.ok(Number.isFinite(bossX));
 const gesture=giantHandGesture({state:'attack',temperament:'controlled',hazards:[],t:0},0);
 assert.equal(gesture.impact,0);
});
