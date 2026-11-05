import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_FLOW,advanceBloodDrop,bloodContactFraction,mixBloodPuddle,advanceBloodPuddle} from '../src/blood-flow-dynamics.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {createBloodParticles} from '../src/blood-particles.mjs';
import {createCathedralBloodSea} from '../src/blood-cathedral-sea.mjs';
import {createBloodSiphonFx} from '../src/blood-siphon-fx.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {BLOOD_SIPHON_RULES} from '../src/blood-siphon.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`expected ${a} ~= ${b}`);

test('droplets advance with closed-form viscosity and gravity consistently at 30/60/120 fps',()=>{
 function simulate(fps){
  const d={x:0,y:12,z:0,vx:7.3,vy:4.8,vz:-3.2,g:.94,drag:1.19};
  for(let i=0;i<fps;i++)advanceBloodDrop(d,1/fps);
  return d;
 }
 const a=simulate(30),b=simulate(60),c=simulate(120);
 for(const key of ['x','y','z','vx','vy','vz']){close(a[key],b[key]);close(b[key],c[key]);}
 assert.ok(a.y<12&&a.x>0&&a.z<0);
 const before=structuredClone(a);advanceBloodDrop(a,0);
 assert.deepEqual(a,before,'paused simulation moved');
});
test('blood impacts interpolate ground contact rather than teleport through the marble floor',()=>{
 assert.equal(bloodContactFraction(2,-1), (2-BLOOD_FLOW.ground)/3);
 assert.equal(bloodContactFraction(.05,-.3),0);
 assert.equal(bloodContactFraction(2,1),1);
 const d={x:1,y:.21,z:2,vx:8,vy:-7,vz:1,g:1,drag:1.2};
 const old=structuredClone(d);
 advanceBloodDrop(d,.05);
 const f=bloodContactFraction(old.y,d.y);
 assert.ok(f>0&&f<1);
 const impactX=old.x+(d.x-old.x)*f;
 assert.ok(impactX>old.x&&impactX<d.x);
});
test('colliding pools conserve area-weighted centre and impulse before bounded spreading',()=>{
 const p={x:0,z:0,vx:0,vz:0,r:.6,cur:.2,vr:0};
 mixBloodPuddle(p,2,0,.6,{x:3,z:0});
 close(p.x,1);close(p.r,Math.sqrt(.72));
 assert.ok(p.vx>0&&p.vr>0);
 assert.ok(p.r<=BLOOD_FLOW.puddleRadiusCap);
 const before=p.cur;advanceBloodPuddle(p,1/60);
 assert.ok(p.cur>before&&p.cur<p.r*1.15);
 assert.ok(p.x>1,'incoming splash inertia was discarded');
 let last=p;for(let i=0;i<120;i++)last=advanceBloodPuddle(p,1/60);
 assert.ok(Math.abs(last.cur-last.r)<.08);
 const snapshot=structuredClone(p);advanceBloodPuddle(p,0,{retract:{x:15,z:10}});
 assert.deepEqual(p,snapshot);
});
test('siphon accelerates puddles without teleportation, and drains progressively',()=>{
 const p={x:0,z:0,vx:0,vz:0,r:1.2,cur:.4,vr:0};
 advanceBloodPuddle(p,.02,{retract:{x:14,z:0}});
 assert.ok(p.vx>0&&p.vx<=BLOOD_FLOW.retractSpeed);
 assert.ok(p.x>0&&p.x<.2);
 assert.ok(p.r<1.2&&p.cur<=p.r);
 for(let i=0;i<300;i++)advanceBloodPuddle(p,.016,{retract:{x:14,z:0}});
 assert.ok(p.x>0&&Number.isFinite(p.r)&&p.r>=0);
});
test('GPU blood shader advects coherent thick-fluid currents without increasing geometry budget',()=>{
 for(const low of [false,true]){
  const q=bloodQuality({coarse:low}),fluid=createBloodFluid(q);
  const fake={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
  fluid.material.onBeforeCompile(fake);
  assert.match(fake.vertexShader,/currentDir/);
  assert.match(fake.vertexShader,/transformed\+=normal\*wave/);
  assert.match(fake.fragmentShader,/uBloodEnergy/);
  assert.match(fake.fragmentShader,/diffuseColor/);
  fluid.update(3.5,1.4);
  close(fake.uniforms.uBloodTime.value,3.5);
  close(fake.uniforms.uBloodEnergy.value,1.4);
  const q2=bloodQuality({coarse:true});
  assert.ok(q2.drops<360&&q2.ripples<28);
  for(const r of fluid.resources)r.dispose();
 }
});
test('cathedral sea has moving low-frequency swells damped at dry marble boundary',()=>{
 const scene=new THREE.Scene(),sea=createCathedralBloodSea(scene,{radius:28});
 const fake={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
 sea.water.onBeforeCompile(fake);
 assert.match(fake.vertexShader,/shoreDamping/);
 assert.match(fake.vertexShader,/smoothstep\(28\.550,30\.050,radius\)/);
 assert.match(fake.vertexShader,/transformed\.y/);
 assert.match(fake.fragmentShader,/crossFlow/);
 const dryBefore=sea.stats();
 sea.update({time:12,boss:{phase:2}});
 assert.equal(sea.stats().damageSources,0);
 assert.equal(sea.stats().innerRadius,dryBefore.innerRadius);
 assert.equal(fake.uniforms.uSeaFrenzy.value,1);
 sea.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('healing stream droplets follow a curved flight tangent toward the moving core, no hitboxes',()=>{
 const scene=new THREE.Scene(),fx=createBloodSiphonFx(scene,{coarse:false}),g=createBloodGame();
 g.boss.phase=2;g.boss.state='recovery';g.boss.x=4;g.boss.z=-3;g.blood.transitioned=true;
 g.blood.siphon.active=true;g.status='playing';g.time=4;
 const stream=scene.getObjectByName('blood-sea-absorbed-droplets');
 function sample(t){
  g.blood.siphon.t=BLOOD_SIPHON_RULES.channel*t;fx.update(g,.016);
  const out=[],m=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(let i=0;i<stream.count;i++){
   stream.getMatrixAt(i,m);m.decompose(pos,quat,scale);
   assert.ok(pos.y>=.15&&pos.y<=18);
   assert.ok([scale.x,scale.y,scale.z].every(Number.isFinite));
   out.push({p:pos.clone(),direction:new THREE.Vector3(0,1,0).applyQuaternion(quat),size:scale.y});
  }
  return out;
 }
 const first=sample(.32),next=sample(.37);
 assert.equal(first.length,100);assert.equal(next.length,100);
 let aligned=0;
 for(let i=0;i<first.length;i++){
  const v=next[i].p.clone().sub(first[i].p),d=v.length();
  if(d>.1){v.normalize();if(v.dot(first[i].direction)>.75)aligned++;}
 }
 assert.ok(aligned>=18,'the droplets do not point along their own flight paths');
 assert.equal(fx.stats().collidable,false);
 assert.equal(fx.stats().poolSize,100);
 fx.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('repeated visual blood bursts keep the original fixed instancing caps and clean up',()=>{
 const scene=new THREE.Scene(),q=bloodQuality({coarse:true}),fluid=createBloodFluid(q),
  particles=createBloodParticles(scene,fluid,q,{reduced:true});
 try{
  for(let i=0;i<200;i++){
   particles.burst(i%8,1.2,i%11,{count:30,power:4.6});
   particles.update(.016,i*.016);
   assert.ok(particles.active<=q.drops);
   assert.ok(particles.puddles<=q.puddles);
  }
  const prev=particles.active;
  particles.update(0,40);assert.equal(particles.active,prev);
  for(let i=0;i<300;i++)particles.update(.05,40+i*.05);
  assert.equal(particles.active,0);assert.equal(particles.puddles,0);
  particles.clear();
 }finally{
  particles.dispose();
  for(const resource of fluid.resources)resource.dispose();
  assert.deepEqual(disposeScene(scene).errors,[]);
 }
});
