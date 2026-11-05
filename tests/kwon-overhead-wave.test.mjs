import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startPattern,step,swordPose,PATTERNS,patternConfig} from '../src/combat.mjs';
import {KWON_WAVE} from '../src/kwon-wave-data.mjs';
const tick=(g,n,dt=1/120)=>{for(let i=0;i<n;i++)step(g,dt);};
function chargedWave(phase=2){
 const g=createGame('sword',{register:false});g.boss.phase=phase;
 g.player.x=0;g.player.z=24;g.player.invuln=100;
 startPattern(g,'wave');const cfg=patternConfig(g.boss);
 tick(g,Math.ceil(cfg.wind*120)+2);
 assert.equal(g.boss.state,'active');
 assert.equal(g.bossShots.length,0,'no wave before sword drops');
 tick(g,Math.ceil(cfg.active*KWON_WAVE.releaseRatio*120)+2);
 assert.equal(g.bossShots.length,1,'one wide wave rather than three fanned waves');
 return {g,cfg};
}
test('moon-wave overhead anticipation is a held high sword that drops vertically',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false});g.boss.phase=phase;
  startPattern(g,'wave');const cfg=patternConfig(g.boss);
  assert.ok(cfg.wind>=1,'warning should be readable in both phases');
  assert.equal(swordPose(g.boss).pitch>=-1.4,true);
  g.boss.t=cfg.wind*.78;
  const lifted=swordPose(g.boss);
  g.boss.t=cfg.wind*.95;const held=swordPose(g.boss);
  assert.ok(lifted.pitch<-.95,'blade raised overhead');
  assert.ok(Math.abs(lifted.pitch-held.pitch)<.02,'blade held visibly before downward swing');
  g.boss.state='active';g.boss.t=cfg.active;
  assert.ok(swordPose(g.boss).pitch>.95,'blade finishes pointing downward');
 }
});
test('each wave strike releases only one broad projectile with matching artwork width',()=>{
 assert.equal(KWON_WAVE.width/2,KWON_WAVE.radius);
 for(const phase of [1,2]){
  const {g,cfg}=chargedWave(phase);
  const [shot]=g.bossShots;
  assert.equal(shot.kind,KWON_WAVE.kind);
  assert.equal(shot.radius,KWON_WAVE.radius);
  assert.equal(shot.damage,cfg.damage);
  assert.equal(shot.age,0);
  assert.equal(g.events.filter(e=>e.type==='boss-shot').length,1);
  tick(g,35);assert.equal(g.events.filter(e=>e.type==='boss-shot').length,1,'must not fire twice');
 }
});
test('the single wave deals only one hit across its visible collision width',()=>{
 const {g,cfg}=chargedWave(2);const shot=g.bossShots[0];
 shot.x=0;shot.z=0;shot.yaw=0;shot.life=1.5;shot.age=0;
 g.player.x=KWON_WAVE.radius-.15;g.player.z=.8;g.player.invuln=0;
 const before=g.player.hp;step(g,1/30);
 assert.equal(before-g.player.hp,cfg.damage);
 assert.equal(g.bossShots.length,0,'projectile consumed on impact');
 g.player.invuln=0;tick(g,30);
 assert.equal(g.player.hp,before-cfg.damage,'the strike cannot deal three overlapping hits');
});
test('wave does not hit players outside its half-width',()=>{
 const {g}=chargedWave(2);const shot=g.bossShots[0];
 shot.x=0;shot.z=0;shot.yaw=0;
 g.player.x=KWON_WAVE.radius+.6;g.player.z=.4;g.player.invuln=0;
 const hp=g.player.hp;step(g,1/30);
 assert.equal(g.player.hp,hp);
});
