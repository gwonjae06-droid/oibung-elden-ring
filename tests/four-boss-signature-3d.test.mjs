import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createCasinoBreakawayTables,casinoFurniturePose} from '../src/casino-table-destruction.mjs';
import {bloodArterialGeometry,bloodArterialPoint,createBloodArterialVortex} from '../src/blood-arterial-vortex.mjs';
import {createKwonLivingBlade,livingBladePulse} from '../src/kwon-living-blade.mjs';
import {createClownStageMachinery,clownMechanismPose} from '../src/clown-stage-machinery.mjs';
import {buildCasinoRoom} from '../src/casino-room.mjs';
import {createClownCircusStage} from '../src/clown-radiant-circus.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test('casino breakaway splits 3D felt slabs only outside the combat square',()=>{
 const scene=new THREE.Scene(),fx=createCasinoBreakawayTables(THREE,scene,{coarse:true});
 const g={time:0,status:'playing',boss:{phase:1},dice:{giant:null}};
 fx.update(g,0);assert.equal(fx.stats().tableCount,2);
 assert.equal(fx.stats().panels,8);assert.equal(fx.stats().activeFragments,0);
 for(const table of fx.root.children.filter(x=>x.name==='casino-spectator-table')){
  assert.ok(Math.abs(table.position.x)>67.5);
  assert.ok(Math.abs(table.position.z)>67.5);
 }
 g.boss.phase=3;g.dice.giant={state:'attack',temperament:'feral',t:1,hazards:[
  {headSlam:true,start:0,warn:1,active:.3}
 ]};
 const before=JSON.stringify(g);fx.update(g,1.0);fx.update(g,1.5);
 assert.equal(JSON.stringify(g),before);
 assert.equal(fx.stats().activeFragments,20);
 assert.ok(Math.abs(casinoFurniturePose(1,1,3).roll)>.03);
 assert.equal(fx.stats().collidable,false);
 fx.update(g,5);assert.equal(fx.stats().activeFragments,0);
 g.time=0;g.boss.phase=1;g.dice.giant=null;fx.update(g,0);
 assert.equal(fx.stats().phase,1);assert.equal(fx.stats().activeFragments,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('three dimensional blood coils stay bounded, phase-aware and collision-free',()=>{
 const geometry=bloodArterialGeometry({segments:20,sides:6});
 const points=geometry.getAttribute('position');
 assert.ok(points.count>130);assert.ok(geometry.index.count>350);
 for(let i=0;i<points.count;i++)for(const value of [points.getX(i),points.getY(i),points.getZ(i)])
  assert.ok(Number.isFinite(value)&&Math.abs(value)<8);
 assert.ok(bloodArterialPoint(.5).every(Number.isFinite));geometry.dispose();
 const scene=new THREE.Scene(),torso=new THREE.Group();scene.add(torso);
 const fx=createBloodArterialVortex(torso,{coarse:true});
 assert.equal(fx.stats().strands,2);assert.equal(fx.stats().active,false);
 const g={time:1,status:'playing',boss:{phase:2,state:'pattern'},blood:{siphon:{active:true}}};
 const copy=JSON.stringify(g);fx.update(g,.05,{release:1},{active:true});
 assert.equal(JSON.stringify(g),copy);assert.equal(fx.stats().active,true);
 g.status='won';for(let i=0;i<110;i++){g.time+=.05;fx.update(g,.05);}
 assert.equal(fx.stats().active,false);
 fx.dispose();assert.equal(torso.children.length,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('living sword grows actual side cartilage and stays bound to the existing sword group',()=>{
 const carrier=new THREE.Group(),fx=createKwonLivingBlade(THREE,carrier,{length:8.55,coarse:true});
 const b={state:'windup',pattern:'livingSword',phase:2,t:.5};
 const idle=livingBladePulse({...b,state:'idle',pattern:'sweep',phase:1});
 const strike=livingBladePulse({...b,state:'active'},{strike:1});
 assert.ok(strike>idle);assert.ok(strike<=1);
 const before=JSON.stringify(b);fx.update(b,{brace:1});
 assert.equal(JSON.stringify(b),before);
 assert.ok(fx.stats().ribs>=12&&fx.stats().cords===2);
 assert.ok(carrier.children.includes(fx.root));assert.equal(fx.stats().collidable,false);
 fx.update({...b,state:'dead'},{});assert.equal(fx.root.visible,false);
 fx.dispose();assert.equal(carrier.children.length,0);
});

test('circus flywheels suspend outside the arena, animate and isolate state',()=>{
 const scene=new THREE.Scene(),machinery=createClownStageMachinery(scene,{coarse:true});
 const g={time:.8,status:'playing',boss:{phase:2,state:'clown'},
  clown:{state:'pattern',pt:.6,vis:{stomp:1,tilt:.7}}};
 assert.equal(machinery.stats().rigs,4);
 assert.equal(machinery.stats().collidable,false);
 for(const child of machinery.root.children)assert.ok(Math.hypot(child.position.x,child.position.z)>26);
 const before=JSON.stringify(g);
 machinery.event({type:'clown-clap'});machinery.update(g,.016);
 assert.equal(JSON.stringify(g),before);
 const pose=clownMechanismPose(g,.6,.5);
 assert.ok(Math.abs(pose.swing)>.05);assert.equal(pose.collidable,false);
 machinery.reset();machinery.dispose();
 assert.equal(scene.children.length,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('real casino and circus scenes mount distinct signature visuals without touching gameplay',()=>{
 const casinoScene=new THREE.Scene(),room=buildCasinoRoom(THREE,casinoScene,{coarse:true,reduced:true});
 assert.ok(casinoScene.getObjectByName('casino-furniture-breakaway'));
 const c={time:0,status:'playing',boss:{phase:1,x:0,z:0},dice:{giant:null}};
 room.update(0,c,0);
 assert.ok(casinoScene.getObjectByName('casino-spectator-table'));
 assert.deepEqual(disposeScene(casinoScene).errors,[]);
 const circusScene=new THREE.Scene(),stage=createClownCircusStage(circusScene,{coarse:true,reduced:true});
 assert.ok(stage.root.getObjectByName('circus-articulated-rig-machinery'));
 assert.equal(stage.stats().machinery.rigs,4);
 const before={status:'playing',time:0,boss:{phase:1,x:0,z:0},clown:{vis:{tilt:0}}};
 stage.update(before,1/60);stage.event({type:'clown-blast'},before);
 stage.dispose();assert.equal(circusScene.children.length,0);
});

test('the four new presentation components are wired only into view modules',()=>{
 const paths=['casino-room','blood-view','boss-stance','clown-radiant-circus'];
 const marker=['createCasinoBreakawayTables','createBloodSurfaceFlow',
  'createKwonLivingBlade','createClownStageMachinery'];
 for(let i=0;i<paths.length;i++){
  const src=readFileSync(new URL('../src/'+paths[i]+'.mjs',import.meta.url),'utf8');
  assert.ok(src.includes(marker[i]),paths[i]);
 }
 for(const path of ['combat','dice-giant','blood-combat','clown-combat']){
  const src=readFileSync(new URL('../src/'+path+'.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(src,/casino-table-destruction|blood-arterial-vortex|kwon-living-blade|clown-stage-machinery/);
 }
});
