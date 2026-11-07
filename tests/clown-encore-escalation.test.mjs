import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,PATTERNS,startClownPattern,stepClown} from '../src/clown-combat.mjs';
import {HORROR_DEFINITIONS,HORROR_RUN} from '../src/clown-horror-patterns.mjs';
import {nightmareWorldState} from '../src/clown-nightmare-world.mjs';
import {clownPrecastTime} from '../src/attack-readability.mjs';
const acts={
 vanishingAct:{phase:1,stage:1,world:'mirror'},
 funeralParade:{phase:2,stage:2,world:'audience'},
 brokenHorses:{phase:2,stage:2,world:'flesh'},
 audienceJudgement:{phase:2,stage:3,world:'audience'},
 marionetteDevour:{phase:2,stage:3,world:'flesh'}
};
test('new clown signatures are fully registered and telegraphed',()=>{
 for(const [id,{phase,stage}] of Object.entries(acts)){
  assert.ok(PATTERNS[id],id);
  assert.ok(PATTERNS[id].phases.includes(phase),id);
  assert.ok(clownPrecastTime(id)>=.7,id);
  assert.equal(typeof HORROR_RUN[id],'function',id);
  assert.equal(HORROR_DEFINITIONS.find(v=>v[0]===id)?.[5],stage,id);
 }
});
test('new clown performances use delayed real hazards and moving physical attacks',()=>{
 for(const [id,{phase,stage,world}] of Object.entries(acts)){
  const g=createClownGame('sword',{register:false});
  g.boss.phase=phase;g.boss.hp=g.boss.maxHp*(stage===3?.18:phase===2?.55:1);
  g.clown.horrorStage=stage;g.player.invuln=1e5;
  startClownPattern(g,id);
  assert.equal(nightmareWorldState(g).mode,world,id);
  const zones=new Map(),bombs=new Set();
  for(let i=0;i<Math.ceil(PATTERNS[id].dur*120);i++){
   stepClown(g,1/120);
   for(const z of g.clown.zones)zones.set(z.id,z);
   for(const b of g.clown.bombs)bombs.add(b.id);
  }
  const hits=[...zones.values()].filter(z=>z.damage>0&&!z.visual);
  assert.ok(hits.length>=3,id);
  assert.ok(hits.every(z=>Number.isFinite(z.x)&&Number.isFinite(z.z)&&z.warn>=1.3),id);
  assert.equal(g.status,'playing',id);
  if(id==='funeralParade')assert.ok(bombs.size>=4,'parade needs visible live projectiles');
  if(id==='brokenHorses'||id==='marionetteDevour')
   assert.ok(Math.hypot(g.boss.x,g.boss.z+6)>1,'boss must physically pursue the player');
 }
});
test('legacy beast attacks gain extra recovery-aware beats',()=>{
 for(const id of ['feralSkitter','reverseCrawl','facePeelHunt','ceilingPounce','unhingedClap']){
  assert.ok(PATTERNS[id].dur>=6.6,id);
  assert.ok(PATTERNS[id].recover>=1.35,id);
 }
});
