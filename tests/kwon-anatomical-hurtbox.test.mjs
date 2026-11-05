import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,act,WEAPONS,kwonVisibleHurtShapes,kwonBossAimPoint} from '../src/combat.mjs';
import {kwonHurtContact,kwonProjectileContact} from '../src/kwon-hurtbox.mjs';

const setup=(phase=1)=>{const g=createGame('bow',{register:false});
 g.boss.phase=phase;g.boss.wait=99;return g;};
function shot(g,x,z,y=1.2){const hp=g.boss.hp,before=g.stats.hits;
 g.projectiles.push({id:910+before,x,y,z,yaw:0,speed:0,life:1,damage:22,poise:0,source:{basic:true},bossHit:false});
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
 const result=shot(g,head.x,head.z,head.y);
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
  const result=shot(g,belly.x+belly.rx-.15,belly.z,belly.y);
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
 assert.equal(shot(g,rotated.x,rotated.z,rotated.y).damage,22);
});
test('melee near the visible chest reaches the boss and shows a local impact point',()=>{
 const g=createGame('sword',{register:false});
 g.boss.wait=99;g.player.x=0;g.player.z=1.2;g.player.yaw=Math.PI;
 assert.equal(act(g,'light'),true);
 for(let i=0;i<65;i++)step(g,1/120);
 assert.equal(g.stats.hits,1);
 assert.equal(g.boss.maxHp-g.boss.hp,WEAPONS.sword.damage);
 const impact=g.events.find(e=>e.type==='boss-hit');
 assert.ok(impact&&impact.z>g.boss.z);
 assert.ok(['head','chest','abdomen'].includes(impact.part));
});

test('lock-on follows the real chest rather than the boss locomotion root',()=>{
 const g=setup(1),p=g.player;
 p.x=8;p.z=0;
 const chest=kwonVisibleHurtShapes(g.boss).find(s=>s.id==='chest');
 assert.deepEqual(kwonBossAimPoint(g.boss),chest);
 step(g,1/120,{lock:true});
 const wanted=Math.atan2(chest.x-p.x,chest.z-p.z);
 assert.ok(Math.abs(Math.atan2(Math.sin(p.yaw-wanted),Math.cos(p.yaw-wanted)))<1e-8);
});
test('diagonal melee cannot hit empty space beside the abdomen',()=>{
 const shapes=kwonVisibleHurtShapes(setup(1).boss);
 const ghost={x:6.8,z:-4};
 const contact=kwonHurtContact(shapes,ghost,{reach:3.5,yaw:-Math.PI/2});
 assert.equal(contact,null);
});

test('a low projectile cannot hit the boss head floating well above its flight',()=>{
 const g=setup(1),head=kwonVisibleHurtShapes(g.boss).find(s=>s.id==='head');
 const hp=g.boss.hp;
 assert.equal(shot(g,head.x,head.z,.25).damage,0);
 assert.equal(g.boss.hp,hp);
 assert.equal(g.stats.hits,0);
});
test('3D hit testing rejects a projectile that crosses a 2D silhouette above the target',()=>{
 const g=setup(1),belly=kwonVisibleHurtShapes(g.boss)[0];
 const start={x:belly.x,z:belly.z+belly.rz+1,y:belly.y+belly.ry+2};
 const end={x:belly.x,z:belly.z-belly.rz-1,y:start.y};
 assert.equal(kwonProjectileContact([belly],start,end),null);
});
test('phase two is still vulnerable when the blade actually meets its lowered abdomen',()=>{
 const g=createGame('sword',{register:false});g.boss.phase=2;g.boss.wait=99;
 const belly=kwonVisibleHurtShapes(g.boss)[0];g.player.x=belly.x;g.player.z=belly.z+belly.rz+2;
 g.player.yaw=Math.PI;
 const hp=g.boss.hp;assert.ok(act(g,'light'));
 for(let i=0;i<70;i++)step(g,1/120);
 assert.equal(hp-g.boss.hp,WEAPONS.sword.damage);
});
