import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,startClownPattern,stepClown,PATTERNS} from '../src/clown-combat.mjs';
import {clownBeastPose} from '../src/clown-beast-pose.mjs';
import {clownLegTarget} from '../src/clown-gait.mjs';
import {createClownStageBall,stepClownStageBall,clownBallWorldPose,phaseTwoBallScale,clownDismountPose} from '../src/clown-grounded-physics.mjs';
const tick=(g,n)=>{for(let i=0;i<n;i++)stepClown(g,1/120)};
test('the second act is a standing clown, not permanent crawling',()=>{
 const g=createClownGame('sword',{register:false});
 g.boss.phase=2;g.clown.horrorStage=2;g.clown.state='idle';
 assert.equal(clownBeastPose(g).entry,0);
 for(const id of ['ballRain','curtainCall','unhingedClap']){
  startClownPattern(g,id);g.clown.pt=2.1;
  assert.equal(clownBeastPose(g).entry,0,id);
 }
 startClownPattern(g,'reverseCrawl');tick(g,180);
 assert.ok(clownBeastPose(g).entry>.9,'a real crawling performance');
 tick(g,Math.ceil(PATTERNS.reverseCrawl.dur*120));
 assert.equal(clownBeastPose(g).entry,0,'returns to two feet');
});
test('the enlarged circus sphere rolls across the arena but stays grounded and tangible',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;g.boss.state='transition';
 g.boss.t=0;g.clown.stageBall=createClownStageBall(g.boss.x,g.boss.z);
 let maxDistance=0;
 for(let i=0;i<800;i++){
  stepClownStageBall(g,1/120);g.boss.t=Math.min(5.2,g.boss.t+1/120);
  const p=clownBallWorldPose(g);
  assert.ok(Math.abs(p.y-p.colliderRadius)<1e-9,'ball rests on arena plane');
  assert.ok(Math.hypot(p.x,p.z)+p.colliderRadius<=27.01);
  maxDistance=Math.max(maxDistance,Math.hypot(p.x-g.boss.x,p.z-g.boss.z));
 }
 assert.ok(maxDistance>8,'the same sphere visibly rolls aside');
 assert.ok(Math.abs(clownBallWorldPose(g).scale-phaseTwoBallScale(5.2))<1e-9);
 assert.equal(clownDismountPose(5.2).bodyY,0);
});
test('a pushed circus ball has a collision response without instant damage',()=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=2;
 g.clown.stageBall=createClownStageBall(7,7);g.clown.stageBall.launched=true;
 g.clown.stageBall.scale=phaseTwoBallScale(5.2);
 g.player.x=7;g.player.z=7;const hp=g.player.hp;
 stepClownStageBall(g,1/120);
 assert.ok(Math.hypot(g.player.x-g.clown.stageBall.x,g.player.z-g.clown.stageBall.z)>5);
 assert.equal(g.player.hp,hp);
});
test('standing and pitched shoe IK never asks for a below-floor planted sole',()=>{
 for(const pitch of [0,.22,.5,.87]){
  const base=pitch>.5?.35:0;
  for(const side of [-1,1]){
   const l=clownLegTarget(side,.27,.75,0,{pitch,bodyHeight:base,supportY:0});
   const y=base+l.foot[1]*Math.cos(pitch)-l.foot[2]*Math.sin(pitch);
   assert.ok(y>=.5,'shoe sole must stay outside ground at pitch '+pitch);
  }
 }
});
