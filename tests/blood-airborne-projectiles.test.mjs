import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
 createBloodGame,actBlood,stepBlood,startBloodPattern,damageBlood,
 bloodBossAirborne,bloodProjectileGroundHeight,BLOOD_AIRBORNE_HEIGHT,
 BLOOD_PROJECTILE_GROUND_HEIGHT
} from '../src/blood-combat.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {playerProjectilePose} from '../src/player-projectile-data.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

function advance(game,seconds){
 for(let t=0;t<seconds-1e-8;t+=.02)stepBlood(game,Math.min(.02,seconds-t));
}
function flight(weapon='bow'){
 const g=createBloodGame(weapon);
 g.boss.phase=2;g.blood.transitioned=true;
 g.player.z=-2;g.player.hp=g.player.maxHp=1e6;
 assert.equal(startBloodPattern(g,'eclipse'),true);
 advance(g,.52);
 assert.ok(bloodBossAirborne(g),'the blood angel needs to be flying for this test');
 return g;
}
function landed(weapon='bow'){
 const g=createBloodGame(weapon);
 g.boss.phase=2;g.blood.transitioned=true;
 g.boss.state='recovery';g.blood.recover=1000;
 g.player.z=-2;g.player.hp=g.player.maxHp=1e6;
 return g;
}
test('visible airborne height prevents ALL incoming player damage, including direct damage and flying phase',()=>{
 const g=flight('bow'),hp=g.boss.hp;
 assert.equal(g.blood.elevation>2,true);
 assert.equal(damageBlood(g,1000),0);
 assert.equal(g.boss.hp,hp);
 assert.equal(g.stats.damage,0);
 assert.equal(g.events.filter(e=>e.type==='boss-hit').length,0);
 // The collision boundary is shared by melee, projectiles and direct damage.
 g.blood.elevation=BLOOD_AIRBORNE_HEIGHT+.001;
 assert.equal(bloodBossAirborne(g),true);
 assert.equal(damageBlood(g,900),0);
 g.blood.elevation=0;g.boss.state='recovery';g.blood.recover=100;
 assert.equal(bloodBossAirborne(g),false);
 assert.equal(damageBlood(g,100),100);
 assert.equal(g.boss.hp,hp-100);
 assert.equal(g.boss.phase,2);
});
test('bow and cards traverse UNDER a flying boss, without consuming hits or granting damage rewards',()=>{
 for(const weapon of ['bow','cards']){
  const g=flight(weapon),hp=g.boss.hp;
  assert.ok(actBlood(g,'light'),weapon+' must be allowed to shoot during the flight');
  advance(g,.74);
  assert.ok(g.projectiles.length>0,weapon+' must spawn a projectile');
  assert.ok(g.projectiles.every(q=>q.bossHit===false&&q.hit===false),weapon+' projectile should pass below the boss');
  assert.ok(g.projectiles.every(q=>q.y===BLOOD_PROJECTILE_GROUND_HEIGHT),weapon+' must stay close to the floor');
  assert.equal(g.boss.hp,hp,weapon+' must not deal damage to flying blood boss');
  assert.equal(g.stats.damage,0);
  assert.equal(g.stats.hits,0);
  assert.equal(g.events.filter(e=>e.type==='boss-hit').length,0);
 }
});
test('bow and cards still damage Baeseojun once he has landed',()=>{
 for(const weapon of ['bow','cards']){
  const g=landed(weapon),before=g.boss.hp;
  assert.equal(bloodBossAirborne(g),false);
  assert.ok(actBlood(g,'light'));
  advance(g,.76);
  assert.ok(g.boss.hp<before,weapon+' must damage the landed boss');
  assert.ok(g.stats.damage>0,weapon+' must grant damage only after valid hit');
  assert.ok(g.events.some(e=>e.type==='boss-hit'),weapon+' must emit a hit event');
  assert.equal(g.boss.phase,2);
 }
});
test('floor-level projectile height is enforced after spawning for arrows, cards, skills and blade waves',()=>{
 for(const kind of ['bow','cards','wave']){
  const g=landed('bow');
  g.projectiles.push({id:123,x:0,z:2,y:18,kind,yaw:Math.PI,speed:8,
   life:2,damage:1,piercing:true,hit:false,bossHit:false,source:{basic:true}});
  stepBlood(g,.02);
  const projectile=g.projectiles[0];
  assert.ok(projectile);
  assert.equal(projectile.y,kind==='wave'?.25:BLOOD_PROJECTILE_GROUND_HEIGHT);
  assert.deepEqual(playerProjectilePose(projectile,g.time).y,projectile.y);
  assert.equal(bloodProjectileGroundHeight(projectile),projectile.y);
  assert.ok(projectile.z<2,'projectiles must still travel horizontally');
 }
});
test('existing grounded hit windows, wing air attacks and victory remain correct',()=>{
 const flying=flight('sword'),hp=flying.boss.hp;
 assert.ok(actBlood(flying,'light'));
 advance(flying,.55);
 assert.equal(flying.boss.hp,hp,'melee cannot hit flying boss either');
 const ground=landed('sword'),before=ground.boss.hp;
 assert.ok(actBlood(ground,'light'));
 advance(ground,.5);
 assert.ok(ground.boss.hp<before,'melee counterattack must remain available after landing');
 assert.equal(damageBlood(ground,1e7)>0,true);
 assert.equal(ground.status,'won');
 assert.equal(damageBlood(ground,300),0);
});
test('real Three.js projectile meshes render at the SAME floor height as collision state during flight',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=flight('bow');
 g.projectiles.push({id:77,x:2,z:3,y:1.2,yaw:0,speed:5,life:1.8,
  damage:30,kind:'bow',source:{basic:true},hit:false,bossHit:false});
 stepBlood(g,.02);view.update(g,.02);
 const group=scene.getObjectByName('shared-player-projectiles');
 assert.ok(group);
 const flightModels=group.children.filter(c=>!c.name.startsWith('boss-card-mark-'));
 assert.equal(flightModels.length,1);
 const mesh=flightModels[0];
 assert.equal(mesh.position.y,BLOOD_PROJECTILE_GROUND_HEIGHT);
 assert.ok(view.root.position.y>BLOOD_AIRBORNE_HEIGHT);
 assert.equal(g.boss.hp,g.boss.maxHp);
 view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
