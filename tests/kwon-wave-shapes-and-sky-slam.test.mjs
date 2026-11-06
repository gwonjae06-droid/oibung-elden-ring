import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGame,startPattern,step,patternConfig} from '../src/combat.mjs';
import {KWON_WAVE,nextKwonWaveVariant,KWON_WAVE_VARIANTS} from '../src/kwon-wave-data.mjs';
import {createKwonVerticalWaveView} from '../src/kwon-vertical-wave-view.mjs';
import {createKwonSkySwordView} from '../src/kwon-sky-sword-view.mjs';

const advance=(g,seconds)=>{for(let t=0;t<seconds;){const dt=Math.min(1/120,seconds-t);step(g,dt);t+=dt;}};
function cast(g){
 startPattern(g,'wave');
 const cfg=patternConfig(g.boss);
 advance(g,cfg.wind-.03);
 assert.equal(g.bossShots.length,0,'a cross must not hit before windup completes');
 advance(g,.03+cfg.active*KWON_WAVE.releaseRatio+.05);
 assert.equal(g.bossShots.length,1,'two strokes must belong to ONE projectile');
 return g.bossShots[0];
}
test('wave variants alternate between + and X and each launch is a single projectile',()=>{
 assert.deepEqual(KWON_WAVE_VARIANTS,['plus','x']);
 assert.equal(nextKwonWaveVariant(undefined),'plus');
 assert.equal(nextKwonWaveVariant('plus'),'x');
 assert.equal(nextKwonWaveVariant('x'),'plus');
 const g=createGame('sword',{register:false});g.boss.phase=2;
 g.player.x=0;g.player.z=24;g.player.invuln=9999;
 const variants=[];
 for(let i=0;i<4;i++){
  const shot=cast(g);variants.push(shot.variant);
  assert.equal(shot.kind,KWON_WAVE.kind);
  assert.equal(shot.radius,KWON_WAVE.width/2);
  assert.equal(shot.damage,patternConfig(g.boss).damage);
  g.bossShots=[];g.events=[];
 }
 assert.deepEqual(variants,['plus','x','plus','x']);
});
test('both cross variants deal one hit, not two overlapped slash hits',()=>{
 for(const variant of ['plus','x']){
  const g=createGame('sword',{register:false});g.boss.phase=2;
  g.player.x=0;g.player.z=24;g.player.invuln=999;
  let shot=cast(g);
  if(variant==='x'){g.bossShots=[];shot=cast(g);}
  assert.equal(shot.variant,variant);
  shot.x=0;shot.z=0;shot.yaw=0;shot.speed=0;shot.life=1.5;shot.age=shot.minArmTime;
  g.player.x=KWON_WAVE.radius-.15;g.player.z=.1;g.player.invuln=0;
  const hp=g.player.hp;step(g,1/120);
  assert.equal(hp-g.player.hp,patternConfig(g.boss).damage);
  assert.equal(g.events.filter(e=>e.type==='player-hit').length,1);
  assert.equal(g.bossShots.length,0,'projectile consumed on the first hit');
 }
});
test('the projectile silhouette really switches from orthogonal + to diagonal X',()=>{
 const scene=new THREE.Scene(),view=createKwonVerticalWaveView(scene);
 const shot=(id,variant)=>({id,kind:KWON_WAVE.kind,variant,x:0,z:0,yaw:0,life:1,age:.1});
 view.update([shot(1,'plus')]);
 assert.equal(view.count,1);
 const plus=view.root.getObjectByName('kwon-wave-plus');
 const plusSlashes=plus.children.filter(c=>c.geometry?.type==='ShapeGeometry');
 assert.equal(plusSlashes.length,6);
 assert.equal(plusSlashes[0].rotation.z,0);
 assert.equal(plusSlashes[3].rotation.z,Math.PI/2);
 view.update([shot(2,'x')]);
 assert.equal(view.count,1);
 const x=view.root.children.find(c=>c.name==='kwon-wave-x'&&c.visible!==false&&c.children.some(m=>m.geometry?.type==='RingGeometry'));
 assert.ok(x);
 const xSlashes=x.children.filter(c=>c.geometry?.type==='ShapeGeometry');
 assert.equal(xSlashes[0].rotation.z,-Math.PI/4);
 assert.equal(xSlashes[3].rotation.z,Math.PI/4);
 view.clear();assert.equal(view.count,0);
 view.dispose();assert.ok(!scene.children.includes(view.root));
});
test('heavenly execution sword falls to the existing slam target and never changes damage',()=>{
 const scene=new THREE.Scene(),view=createKwonSkySwordView(scene);
 const g=createGame('sword',{register:false});g.boss.phase=2;
 g.player.x=5;g.player.z=10;startPattern(g,'slam');
 const cfg=patternConfig(g.boss),blade=view.root.getObjectByName('sky-falling-greatsword');
 assert.equal(cfg.damage,55);
 view.update(g.boss);
 assert.equal(view.root.visible,true);
 assert.equal(view.root.position.x,5);assert.equal(view.root.position.z,10);
 assert.ok(blade.position.y>15);
 g.boss.state='active';g.boss.t=cfg.active*.45;view.update(g.boss);
 assert.ok(blade.position.y>1,'the sword is still falling before the original hit frame');
 g.boss.t=cfg.active*.84;view.update(g.boss);
 assert.ok(blade.position.y<.2,'sword tip reaches the ground exactly at slam impact');
 g.boss.state='recovery';g.boss.t=.3;view.update(g.boss);
 assert.equal(view.root.visible,false);
 view.dispose();assert.ok(!scene.children.includes(view.root));
});
