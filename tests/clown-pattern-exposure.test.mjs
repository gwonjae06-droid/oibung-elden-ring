import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,choosePattern,startClownPattern,PATTERNS,LIVE_REPERTOIRE} from '../src/clown-combat.mjs';
import {horrorMinStage} from '../src/clown-horror-patterns.mjs';
test('phase two plays the cast, marionettes and fire rather than compulsory four-paw hunts',()=>{
 const g=createClownGame('sword',{register:false,seed:17});
 g.boss.phase=2;g.clown.horrorStage=2;g.player.x=8;g.player.z=2;
 const played=new Set();
 for(let i=0;i<85;i++){
  const id=choosePattern(g);assert.ok(LIVE_REPERTOIRE.includes(id),id);
  played.add(id);startClownPattern(g,id);g.clown.last=id;
 }
 for(const id of ['choirOfAshes','curtainStampede','infernalHoops','puppetOverture'])
  assert.ok(played.has(id),'missing ensemble '+id);
 for(const old of ['ballSpin','ballRain','ballCannon','bounceChain','rollingSmile'])
  assert.equal(played.has(old),false,'obsolete ball routine still selected '+old);
});
test('climactic audience concert and ensemble finale get exposure without global scripted damage',()=>{
 for(const seed of [2,27,91]){
  const g=createClownGame('sword',{register:false,seed});
  g.boss.phase=2;g.clown.horrorStage=3;g.player.x=8;g.player.z=2;
  const allowed=LIVE_REPERTOIRE.filter(k=>PATTERNS[k].phases.includes(2)&&horrorMinStage(k)<=3);
  const played=new Set();
  for(let i=0;i<100;i++){
   const id=choosePattern(g);assert.ok(allowed.includes(id),id);
   played.add(id);startClownPattern(g,id);g.clown.last=id;
  }
  assert.ok(played.has('midnightGrandFinale'),'no ensemble climax '+seed);
  assert.ok(played.has('audienceJudgement'),'no audience climax '+seed);
 }
});
test('stage-two lock still prevents stage-three-only attacks',()=>{
 const g=createClownGame('sword',{register:false,seed:8});g.boss.phase=2;g.clown.horrorStage=2;
 for(let i=0;i<65;i++){
  const id=choosePattern(g);assert.ok(horrorMinStage(id)<=2,id);
  startClownPattern(g,id);g.clown.last=id;
 }
});
