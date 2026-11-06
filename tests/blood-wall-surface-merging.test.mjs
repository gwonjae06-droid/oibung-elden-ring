import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sweepBloodWall,deflectBloodAtWall,mergeBloodBeads,coalesceBloodBeads,BLOOD_CONTACT} from '../src/blood-contact-dynamics.mjs';
import {bloodTorsoRivulet,bloodWallRivulet,createBloodSurfaceFlow} from '../src/blood-surface-flow.mjs';
import {createBloodParticles} from '../src/blood-particles.mjs';
import {createBloodFluid,bloodQuality} from '../src/blood-fluid.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`expected ${a} near ${b}`);
const point=([x,y,z])=>new THREE.Vector3(x,y,z);
test('actual cathedral wall, rear masonry and column ray sweeps find earliest impact',()=>{
 const side=sweepBloodWall({x:40,y:3,z:6,size:.1},{x:42,y:3,z:6,size:.1});
 assert.equal(side.type,'wall');near(side.x,41.4);near(side.nx,-1);
 const back=sweepBloodWall({x:4,y:4,z:-46,size:.1},{x:4,y:4,z:-49,size:.1});
 assert.equal(back.type,'back');near(back.z,-47.05);near(back.nz,1);
 const pillar=sweepBloodWall({x:33,y:4,z:7,size:.1},{x:36,y:4,z:7,size:.1});
 assert.equal(pillar.type,'column');near(pillar.x,35.4-(BLOOD_CONTACT.columnRadius+.1));
 assert.ok(pillar.t>0&&pillar.t<1);
 assert.equal(sweepBloodWall({x:0,y:3,z:0},{x:1,y:3,z:0}),null);
 assert.equal(sweepBloodWall({x:40,y:27,z:5},{x:42,y:27,z:5}),null);
});
test('impact damping always sends blood back into the allowed wall/column half-space',()=>{
 const hit=sweepBloodWall({x:40,y:4,z:0,size:.1},{x:42,y:4,z:0,size:.1});
 const drop={x:42,y:4,z:0,vx:6,vy:2,vz:.2};
 deflectBloodAtWall(drop,hit);
 assert.ok(drop.x<=hit.x);
 assert.ok(drop.vx<0);
 assert.ok(drop.vy<=.8);
 assert.ok([drop.x,drop.y,drop.z,drop.vx,drop.vy,drop.vz].every(Number.isFinite));
});
test('merged beads preserve volume and linear momentum and never expand into unlimited blobs',()=>{
 const a={x:0,y:2,z:1,vx:3,vy:-1,vz:0,size:.14,life:.8,total:1.1},
  b={x:.1,y:2,z:1,vx:-1,vy:1,vz:0,size:.14,life:.7,total:1.0};
 const initialMass=a.size**3+b.size**3;
 assert.equal(mergeBloodBeads(a,b),true);
 near(a.size**3,initialMass);
 near(a.vx,1);near(a.vy,0);
 near(a.x,.05);
 assert.equal(b.life,0);assert.equal(a.mergePulse,1);
 assert.equal(mergeBloodBeads(a,b),false);
 const big={...a,size:.35,life:1},more={...a,size:.2,life:1};
 assert.equal(mergeBloodBeads(big,more),false);
});
test('bounded local coalescence combines only neighboring droplets from the same burst',()=>{
 const beads=Array.from({length:48},(_,i)=>({x:i*.7,y:3,z:0,vx:1,vy:0,vz:0,
  size:.11,life:1,total:1.3,emitter:1,quiet:false,mergePulse:0}));
 for(let i=0;i<12;i++){beads[i].x=i*.02;beads[i].emitter=i<8?5:6;}
 const merged=coalesceBloodBeads(beads,{limit:4,offset:0});
 assert.ok(merged>0&&merged<=4);
 assert.ok(beads.some(p=>p.life>0&&p.size>.11));
 const other=beads.filter(p=>p.life>0&&p.emitter===1);
 assert.ok(other.every(p=>p.size===.11),'unrelated droplets were merged');
});
test('boss blood rivulets stay on a moving skeletal parent and descend down the torso',()=>{
 const scene=new THREE.Scene(),torso=new THREE.Group();scene.add(torso);
 const fluid=createBloodFluid(bloodQuality({coarse:true}));
 const visuals=createBloodSurfaceFlow(torso,scene,fluid,{coarse:true});
 try{
  visuals.streakBoss(6);visuals.update(.05);
  const mesh=torso.getObjectByName('blood-rivuletted-boss-surface');
  assert.ok(mesh?.isInstancedMesh);assert.equal(mesh.parent,torso);
  assert.ok(mesh.count>0&&mesh.count<=10);
  const start=bloodTorsoRivulet(2,0),finish=bloodTorsoRivulet(2,.99);
  assert.ok(finish[1]<start[1]-3);
  const sample=point(start),worldA=torso.localToWorld(sample.clone());
  torso.rotation.y=.45;torso.rotation.x=.12;torso.updateWorldMatrix(true,true);
  const worldB=torso.localToWorld(sample.clone());
  assert.ok(worldA.distanceTo(worldB)>.1,'paint layer did not follow rotated bones');
  for(let i=0;i<60;i++)visuals.update(.05);
  assert.equal(visuals.stats().boss,0);
 }finally{visuals.dispose();for(const resource of fluid.resources)resource.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('column impact creates bounded wet streaks that run downward and eventually vanish',()=>{
 const scene=new THREE.Scene(),torso=new THREE.Group();scene.add(torso);
 const fluid=createBloodFluid(bloodQuality({coarse:true}));
 const visuals=createBloodSurfaceFlow(torso,scene,fluid,{coarse:true,reduced:true});
 try{
  visuals.splashWall({x:34.2,y:7,z:7,nx:-1,nz:0},20);
  visuals.update(.05);
  const mesh=scene.getObjectByName('blood-rivuletted-cathedral-surface');
  assert.ok(mesh.isInstancedMesh);assert.ok(mesh.count>0&&mesh.count<=8);
  const a=bloodWallRivulet({x:34.2,y:7,z:7},0,1),b=bloodWallRivulet({x:34.2,y:7,z:7},.7,1);
  assert.ok(b[1]<a[1]);
  for(let i=0;i<50;i++)visuals.update(.05);
  assert.equal(visuals.stats().wall,0);
  assert.equal(visuals.stats().collidable,false);
 }finally{visuals.dispose();for(const resource of fluid.resources)resource.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('real particle system detects moving spray that actually strikes cathedral columns',()=>{
 const scene=new THREE.Scene(),fluid=createBloodFluid(bloodQuality({coarse:true})),
  q=bloodQuality({coarse:true}),particles=createBloodParticles(scene,fluid,q,{reduced:true});
 const hits=[];
 particles.setWallSplashListener((h,n)=>hits.push({h,n}));
 try{
  particles.burst(32.7,4.2,7,{count:10,power:4,lift:.1,gravity:.6,direction:{x:11,z:0}});
  for(let i=0;i<100;i++)particles.update(.016,i*.016);
  assert.ok(hits.length>0,'no real wall or column impact occurred');
  assert.ok(hits.some(x=>x.h.type==='column'));
  assert.ok(hits.every(x=>x.n<=4));
  assert.ok(particles.active<=q.drops);
  assert.ok(particles.stats.particleCapacity===q.drops);
 }finally{particles.dispose();for(const resource of fluid.resources)resource.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('full Blood phase-two battle produces wall splashes and boss-attached flows, then clears on retry',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:false,reduced:false}),
  g=createBloodGame();
 try{
  g.boss.phase=2;g.blood.transitioned=true;g.boss.state='recovery';
  g.blood.phasePending=false;g.blood.pattern='tide';g.blood.recover=30;
  g.status='playing';g.time=12;g.player.x=12;g.boss.z=7;
  view.event({type:'blood-impact'},g);
  const bossMesh=scene.getObjectByName('blood-rivuletted-boss-surface'),
   wallMesh=scene.getObjectByName('blood-rivuletted-cathedral-surface');
  assert.ok(bossMesh&&wallMesh);
  let hadBoss=false,hadWall=false;
  for(let i=0;i<110;i++){
   g.time+=.016;view.update(g,.016);
   hadBoss ||= bossMesh.count>0;hadWall ||= wallMesh.count>0;
   assert.ok(bossMesh.count<=22&&wallMesh.count<=18);
  }
  assert.ok(hadBoss,'boss surface never dripped');
  assert.ok(hadWall,'cathedral column was not visibly wetted');
  const hp=g.boss.hp,playerHp=g.player.hp;
  assert.ok(Number.isFinite(hp)&&Number.isFinite(playerHp));
  view.clear();
  assert.equal(bossMesh.count,0);assert.equal(wallMesh.count,0);
  assert.equal(g.boss.hp,hp);assert.equal(g.player.hp,playerHp);
 }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
