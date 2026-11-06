import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoseContinuity} from '../src/boss-animation-continuity.mjs';
import {createClownGame,stepClown,startClownPattern} from '../src/clown-combat.mjs';
import {clownBeastPose} from '../src/clown-beast-pose.mjs';
import {clownHurtShapes} from '../src/boss-hit-regions.mjs';
import {giantHandGesture} from '../src/dice-giant-motion.mjs';

test('clown quadruped folds smoothly after possession with hitboxes matching its pitch',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;g.clown.horrorStage=2;g.clown.beastSince=g.clown.time;
 const first=clownBeastPose(g);assert.equal(first.entry,0);assert.ok(first.bodyHeight>8);
 let prior=first.pitch;
 for(let i=0;i<90;i++){
  g.clown.time+=.01;const pose=clownBeastPose(g),shapes=clownHurtShapes(g);
  assert.ok(pose.pitch+1e-8>=prior);assert.ok(shapes.some(q=>q.id==='head'));
  assert.ok(!shapes.some(q=>q.id==='mount-head'||q.id==='ball'));
  prior=pose.pitch;
 }
 assert.ok(clownBeastPose(g).entry>=.999);
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
