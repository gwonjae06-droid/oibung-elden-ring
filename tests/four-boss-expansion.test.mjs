import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createGyuwonGame,stepGyuwon,startGyuwonPattern,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {MEMORY_ORDER} from '../src/gyuwon-data.mjs';
import {gyuwonHandTrace} from '../src/gyuwon-shadow-hand.mjs';
import {EIGHT_BALL,eightBallPosition,eightBallContact} from '../src/dice-eight-ball.mjs';
import {GIANT_NAMES,FERAL_NAMES,giantPattern} from '../src/dice-giant.mjs';
import {LEGACY_ECHO_CONFIG} from '../src/clown-legacy-echo.mjs';
const advance=(g,time)=>{for(let i=0;i<Math.ceil(time*120);i++)stepGyuwon(g,1/120);};
test('white court stores harmless trajectories, dark hand repeats same coordinates and clocks',()=>{
 const g=createGyuwonGame('sword',{seed:17});g.boss.phase=2;
 assert.equal(damageGyuwon(g,300),0);
 startGyuwonPattern(g,'counterproof');
 const p=g.gyuwon.proofQueue[0];
 assert.ok(p.hazards.length>=3);
 assert.ok(g.gyuwon.hazards.every(h=>h.preview&&h.damage===0));
 advance(g,2.3);assert.equal(g.player.hp,g.player.maxHp);
 g.gyuwon.space='dark';startGyuwonPattern(g,p.id,{replay:p});
 for(let i=0;i<p.hazards.length;i++){
  const expected=p.hazards[i],actual=g.gyuwon.hazards[i];
  for(const k of ['shape','x','z','warn','life','yaw','r','width','length','arc','grow'])
   assert.equal(actual[k],expected[k],k);
  assert.equal(actual.damage,expected.originalDamage);
  assert.ok(gyuwonHandTrace(actual));
 }
});
test('each remembered arena has three seeded signature variants and persists for multiple casts',()=>{
 for(const id of MEMORY_ORDER){
  const g=createGyuwonGame('sword',{seed:11});g.boss.phase=3;
  const seq=[];
  for(let i=0;i<3;i++){assert.ok(startGyuwonPattern(g,id));seq.push(g.gyuwon.memoryVariant);}
  assert.equal(g.gyuwon.stageIndex,1);
  assert.equal(new Set(seq).size,3,id);
  assert.equal(g.gyuwon.memoryRun,3);
 }
});
test('eight ball is physically present for two cushion rebounds then disappears',()=>{
 const h=giantPattern(14,{x:12,z:9},'controlled').hazards[0];
 assert.equal(h.eightBall,true);assert.equal(h.skyfall,undefined);
 assert.ok(h.warn>=1);
 const first=eightBallPosition(h,0),one=eightBallPosition(h,2.3),two=eightBallPosition(h,4.5);
 assert.ok(first.x<-40);assert.ok(one.x<48&&one.bounces>=1);
 assert.ok(two.bounces>=2);
 assert.equal(eightBallContact(h,h.warn+1,{x:eightBallPosition(h,1).x,z:h.z}),true);
 assert.equal(eightBallContact(h,h.warn+h.active+.1,{x:0,z:h.z}),false);
 assert.ok(EIGHT_BALL.speed*h.active>192);
});
test('feral eight balls fall from the sky onto three separately warned impact sites',()=>{
 const p=giantPattern(16,{x:10,z:7},'feral');
 assert.equal(p.hazards.length,3);
 assert.ok(p.hazards.every(h=>h.skyfall&&h.eightBall&&h.warn>=1.4));
 for(const h of p.hazards){
  assert.ok(eightBallPosition(h,0).y>50);
  assert.ok(eightBallPosition(h,.33).y<5);
 }
});
test('new fantasy FX is visual only and production rules still prohibit text tips or cutscene skipping',()=>{
 const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.ok(existsSync(new URL('../assets/choi.png',import.meta.url)));
 const actor=source('src/gyuwon-actor.mjs'),hand=source('src/gyuwon-shadow-hand.mjs');
 assert.match(actor,/assets\/choi.png/);assert.match(hand,/assets\/choi.png/);
 assert.match(actor,/gyuwon-god-face/);assert.match(hand,/ink-hand-articulated-finger/);
 assert.match(source('src/kwon-third-phase-view.mjs'),/kwon-split-falling-moon/);
 assert.match(source('src/clown-phase2-performance.mjs'),/function prewarm/);
 assert.match(source('src/clown-troupe.mjs'),/warn:warn\+1\.05/);
 assert.ok(LEGACY_ECHO_CONFIG.telegraph>=1.2);
 assert.match(source('journey.css'),/data-defeated~='gyuwon'/);
});
