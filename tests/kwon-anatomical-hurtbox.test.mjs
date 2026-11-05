import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,act,WEAPONS,kwonVisibleHurtShapes} from '../src/combat.mjs';
import {kwonHurtContact,kwonProjectileContact} from '../src/kwon-hurtbox.mjs';

const setup=(phase=1)=>{const g=createGame('bow',{register:false});
 g.boss.phase=phase;g.boss.wait=99;return g;};
function shot(g,x,z){const hp=g.boss.hp,before=g.stats.hits;
 g.projectiles.push({id:910+before,x,z,yaw:0,speed:0,life:1,damage:22,poise:0,source:{basic:true},bossHit:false});
 step(g,1/120);
 return {damage:hp-g.boss.hp,hits:g.stats.hits-before,
  strike:g.events.findLast(e=>e.type==='boss-hit')};
}
test('the phase-one abdomen, chest and attached head occupy separate real-world locations',()=>{
 const g=setup(),shapes=kwonVisibleHurtShapes(g.boss);
 assert.deepEqual(shapes.map(s=>s.id),['abdomen','chest','head']);
 const [belly,chest,head]=shapes;
 assert.ok(belly.z<g.boss.z,'abdomen projects behind the locomotion pivot');
 assert.ok(chest.z>belly.z&&head.z>chest.z,'chest and head extend forward');
 assert.ok(Math.abs(belly.z-(g.boss.z-2.1))<.01);
 const result=shot(g,head.x,head.z);
 assert.equal(result.damage,22);
 assert.equal(result.strike.part,'head');
 assert.ok(Math.abs(result.strike.z-head.z)<1.7,'hit feedback follows anatomical location');
});
test('phase two does not retain a phantom head collider at its old location',()=>{
 const g=setup(2),shapes=kwonVisibleHurtShapes(g.boss);
 assert.deepEqual(shapes.map(s=>s.id),['abdomen','chest']);
 const ghost={x:g.boss.x,z:g.boss.z+2.45};
 assert.equal(kwonProjectileContact(shapes,ghost,ghost),null);
 assert.equal(shot(g,ghost.x,ghost.z).damage,0);
});
test('body near-misses outside the visual model do not count as hits',()=>{
 for(const phase of [1,2]){
  const g=setup(phase),shapes=kwonVisibleHurtShapes(g.boss);
  const ghost={x:g.boss.x+3.33,z:g.boss.z};
  assert.equal(kwonProjectileContact(shapes,ghost,ghost),null);
  assert.equal(shot(g,ghost.x,ghost.z).damage,0);
  assert.equal(g.stats.hits,0);
 }
});
test('projectile still hits the visible outer abdomen edge in either phase',()=>{
 for(const phase of [1,2]){
  const g=setup(phase),belly=kwonVisibleHurtShapes(g.boss)[0];
  const result=shot(g,belly.x+belly.rx-.15,belly.z);
  assert.equal(result.damage,22);
  assert.equal(result.hits,1);
  assert.equal(result.strike.part,'abdomen');
  assert.ok(Number.isFinite(result.strike.y));
 }
});
test('hitbox rotates together with boss yaw rather than remaining at a fixed map coordinate',()=>{
 const g=setup(),belly=kwonVisibleHurtShapes(g.boss)[0];
 g.boss.yaw=Math.PI/2;
 const rotated=kwonVisibleHurtShapes(g.boss)[0];
 assert.ok(rotated.x<g.boss.x-2,'abdomen follows boss rotation');
 assert.ok(Math.abs(rotated.z-g.boss.z)<.01);
 assert.equal(shot(g,rotated.x,rotated.z).damage,22);
});
test('melee near the visible head reaches the boss and shows a head-local impact point',()=>{
 const g=createGame('sword',{register:false});
 g.boss.wait=99;g.player.x=0;g.player.z=2.4;g.player.yaw=Math.PI;
 assert.equal(act(g,'light'),true);
 for(let i=0;i<65;i++)step(g,1/120);
 assert.equal(g.stats.hits,1);
 assert.equal(g.boss.maxHp-g.boss.hp,WEAPONS.sword.damage);
 const impact=g.events.find(e=>e.type==='boss-hit');
 assert.ok(impact&&impact.z>g.boss.z);
 assert.ok(['head','chest','abdomen'].includes(impact.part));
});
