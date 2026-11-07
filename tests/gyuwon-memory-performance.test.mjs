import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,startGyuwonPattern} from '../src/gyuwon-combat.mjs';
import {GYUWON_MEMORY_CAMERA,gyuwonMemoryFraming,
 gyuwonHorizonShot,poseGyuwonHorizonCamera} from '../src/gyuwon-horizon-camera.mjs';
import {createGyuwonMemoryWave,MEMORY_WAVE_HALF_OPENING} from '../src/gyuwon-memory-wave.mjs';
import {createGyuwonSpectacle} from '../src/gyuwon-spectacle.mjs';
import {matchedBossCamera,KWON_CAMERA_REFERENCE} from '../src/boss-camera-framing.mjs';

function withCanvas(fn){
 const previous=globalThis.document;
 const ctx={fillRect(){},strokeRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fillText(){}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 try{return fn();}finally{globalThis.document=previous;}
}

test('all five memory scenes raise the player-follow camera smoothly without changing basic phases',()=>{
 const g=createGyuwonGame();
 for(const phase of [1,2]){
  g.boss.phase=phase;g.gyuwon.stageMemory='tsunami';
  assert.deepEqual(gyuwonMemoryFraming(g),{pitch:0,distance:0,height:0});
 }
 g.boss.phase=3;
 for(const [name,spec]of Object.entries(GYUWON_MEMORY_CAMERA)){
  g.gyuwon.stageMemory=name;g.gyuwon.stageTime=0;
  const start=gyuwonMemoryFraming(g);
  assert.equal(start.distance,0);assert.equal(start.height,0);
  g.gyuwon.stageTime=.8;const end=gyuwonMemoryFraming(g);
  assert.ok(end.distance>3&&end.height>3);
  assert.ok(end.pitch>=KWON_CAMERA_REFERENCE.pitch);
  const base=matchedBossCamera('gyuwon',{player:g.player,boss:g.boss,yaw:0,pitch:.4});
  const lifted=matchedBossCamera('gyuwon',{player:g.player,boss:g.boss,yaw:0,
   pitch:Math.max(.4,end.pitch),extraDistance:end.distance});
  assert.ok(lifted.position.y+end.height>base.position.y+5,name);
  assert.ok(lifted.distance>base.distance,name);
  assert.equal(lifted.fov,KWON_CAMERA_REFERENCE.fov);
  assert.equal(spec.pitch,end.pitch);
 }
});

test('even during a tsunami cast the horizon camera does not jump or widen field-of-view',()=>{
 const g=createGyuwonGame();g.boss.phase=3;
 startGyuwonPattern(g,'tsunami');
 g.gyuwon.hazards[0].age=.5;
 const camera=new THREE.PerspectiveCamera(58,1,.1,1000);
 camera.position.set(1,9,21);
 const target=new THREE.Vector3(2,1,3);
 const before={position:camera.position.toArray(),aim:target.toArray(),fov:camera.fov};
 const shot=poseGyuwonHorizonCamera(camera,target,g);
 assert.equal(shot.incoming,true);assert.equal(gyuwonHorizonShot(g).active,false);
 assert.deepEqual({position:camera.position.toArray(),aim:target.toArray(),fov:camera.fov},before);
});

test('one detailed 3D tsunami with physical low passage is reused for arbitrary gap positions',()=>{
 const wave=createGyuwonMemoryWave({coarse:true});
 const geometry=wave.geometry;
 assert.ok(geometry.getAttribute('position').count>5000);
 assert.ok(geometry.index.count>10000);
 assert.equal(wave.stats().openHalfWidth,MEMORY_WAVE_HALF_OPENING);
 const front=wave.group.getObjectByName('gyuwon-gold-wave-surface');
 assert.equal(front.geometry,geometry);
 wave.update({gap:-12},2);assert.equal(wave.group.position.x,-12);
 wave.update({gap:13},7);assert.equal(wave.group.position.x,13);
 assert.equal(front.geometry,geometry,'no new geometry on a second remembered tsunami');
 let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
 wave.dispose();wave.dispose();assert.equal(disposed,1);
});

test('repeat memory hazards reuse the pooled wave and do not leak shader/geometry after removal',()=>{
 withCanvas(()=>{
  const scene=new THREE.Scene(),fx=createGyuwonSpectacle(scene,{coarse:true});
  const make=id=>({id,shape:'wave',visual:'wave',x:0,z:-180,gap:id%2?5:-5,
   opening:3.2,age:.8,warn:2,life:6,depth:2.2,speed:60,hit:false});
  const g={boss:{phase:3},status:'playing',time:1,
   gyuwon:{stageMemory:'tsunami',stageTime:1,t:1,hazards:[make(1)]}};
  const water=scene.getObjectByName('gyuwon-gold-wave-surface');
  const geometry=water.geometry;
  let disposed=0;geometry.addEventListener('dispose',()=>disposed++);
  fx.update(g,.016,0);assert.equal(fx.stats().liveAttackGroups,1);
  g.gyuwon.hazards=[];fx.update(g,.016,0);
  assert.equal(fx.stats().liveAttackGroups,0);
  assert.equal(disposed,0,'pooled wave must survive between different memory casts');
  g.gyuwon.hazards=[make(2)];g.time+=1;fx.update(g,.016,0);
  assert.equal(scene.getObjectByName('gyuwon-gold-wave-surface').geometry,geometry);
  assert.equal(fx.stats().waveGeometryBuilds,1);
  let compiles=0;
  fx.prewarm({compile(){compiles++;}},new THREE.PerspectiveCamera(),scene);
  assert.equal(compiles,5,'all five distinct memory VFX shaders compile before a stage change');
  fx.dispose();assert.equal(disposed,1);
 });
});
