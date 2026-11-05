import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {BOSS_ATMOSPHERE_PROFILES,createBossAtmosphere} from '../src/boss-atmosphere.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const found=(scene,name)=>scene.getObjectByName(name);
function assertReleased(scene){
 const out=disposeScene(scene);
 assert.deepEqual(out.errors,[]);
}
test('all four identity-specific stage profiles live wholly outside their actual battle circles',()=>{
 const names=['kwon','clown','dice','blood'];
 assert.deepEqual(Object.keys(BOSS_ATMOSPHERE_PROFILES),names);
 for(const profile of names){
  const scene=new THREE.Scene(),stage=createBossAtmosphere(scene,{profile});
  const cfg=BOSS_ATMOSPHERE_PROFILES[profile],s=stage.stats();
  assert.equal(s.theme,cfg.name);
  assert.equal(s.profile,profile);
  assert.ok(s.decorRadius>s.playRadius+4,'decorations must stay outside playable combat for '+profile);
  assert.equal(s.collidableProps,0);
  assert.equal(s.realLights,0);
  assert.equal(s.soundGenerators,0);
  assert.equal(s.standards,cfg.plaques);
  assert.ok(s.particles>=80);
  assert.equal(stage.root.userData.decorativeOnly,true);
  assert.ok(found(scene,'boss-atmosphere-silent-standards')?.isInstancedMesh);
  assert.ok(found(scene,'boss-atmosphere-ambient-'+cfg.particleStyle)?.isInstancedMesh);
  assert.equal(found(scene,'boss-atmosphere-gilded-banner-rails').count,cfg.plaques*2);
  assert.equal(found(scene,'boss-atmosphere-phase-emblems').count,cfg.plaques);
  const banners=found(scene,'boss-atmosphere-silent-standards');
  const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(let i=0;i<banners.count;i++){
   banners.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);
   assert.ok(Math.hypot(p.x,p.z)>s.playRadius+3,profile+' standard encroaches at '+i);
  }
  stage.dispose();stage.dispose();
  assert.equal(found(scene,'boss-atmosphere-'+cfg.name),undefined);
  assertReleased(scene);
 }
});
test('phase transitions visibly recolor banners/emblems while leaving combat state intact',()=>{
 for(const profile of ['kwon','clown','dice','blood']){
  const scene=new THREE.Scene(),stage=createBossAtmosphere(scene,{profile,reduced:false});
  const game={time:0,status:'playing',player:{hp:120,x:2,z:0},boss:{phase:1,hp:3000,x:-4,z:3}};
  const snapshot=structuredClone(game);
  stage.update(game,.016);
  assert.equal(stage.stats().phase,1);
  const mesh=found(scene,'boss-atmosphere-silent-standards'),warm=new THREE.Color(),hot=new THREE.Color();
  mesh.getColorAt(0,warm);
  game.boss.phase=profile==='dice'?3:2;
  stage.event({type:'phase'},game);
  for(let i=0;i<130;i++){game.time+=.033;stage.update(game,.033);}
  mesh.getColorAt(0,hot);
  assert.ok(stage.stats().phaseMix>.9,profile+' failed phase fade');
  assert.notEqual(warm.getHex(),hot.getHex(),profile+' did not recolor ambience');
  assert.ok(found(scene,'boss-atmosphere-phase-emblems').material.emissiveIntensity>.2);
  assert.equal(game.player.hp,snapshot.player.hp);
  assert.equal(game.boss.hp,snapshot.boss.hp);
  assert.equal(game.status,snapshot.status);
  stage.reset();
  assert.equal(stage.stats().phase,1);
  assert.equal(stage.stats().phaseMix,0);
  assert.equal(stage.stats().impactCount,0);
  mesh.getColorAt(0,hot);
  assert.equal(hot.getHex(),warm.getHex(),profile+' did not restore phase-one banner colors');
  stage.dispose();assertReleased(scene);
 }
});
test('physical impact glimmers spawn only AFTER combat events and never alter game state',()=>{
 const scene=new THREE.Scene(),stage=createBossAtmosphere(scene,{profile:'dice',coarse:false});
 const game={boss:{phase:2,hp:1500,x:5,z:-7},player:{hp:75,x:-2,z:8},events:[],status:'playing'};
 const before=structuredClone(game);
 let waves=0;scene.traverse(o=>{if(o.name==='boss-atmosphere-contact-wave')waves++;});
 assert.equal(waves,4);
 stage.event({type:'dice-warning',x:5,z:-7},game);
 assert.equal(stage.stats().impactCount,0,'telegraph must not trigger false impact');
 stage.event({type:'dice-giant-head-impact',x:5,z:-7},game);
 assert.equal(stage.stats().impactCount,1);
 assert.ok(scene.children[0].children.some(o=>o.name==='boss-atmosphere-contact-wave'&&o.visible));
 stage.update(game,.03);
 assert.deepEqual(game,before,'visual events must not change damage/phase/collision');
 for(let i=0;i<60;i++)stage.update(game,.05);
 assert.equal(scene.children[0].children.filter(o=>o.name==='boss-atmosphere-contact-wave'&&o.visible).length,0);
 stage.dispose();assertReleased(scene);
});
test('mobile/reduced motion is sparse, pulse-free and entirely silent',()=>{
 for(const profile of ['kwon','clown','dice','blood']){
  const scene=new THREE.Scene(),stage=createBossAtmosphere(scene,{profile,coarse:true,reduced:true});
  const {particles,contactWaves,standards,realLights,soundGenerators}=stage.stats();
  assert.equal(particles,32);assert.equal(contactWaves,2);
  assert.equal(standards,BOSS_ATMOSPHERE_PROFILES[profile].plaques);
  assert.equal(realLights,0);assert.equal(soundGenerators,0);
  const game={boss:{phase:2,hp:200},player:{hp:120}};
  stage.event({type:'boss-hit',x:0,z:0},game);
  stage.event({type:'player-hit',x:1,z:1},game);
  stage.update(game,.03);
  assert.equal(stage.root.children.filter(o=>o.name==='boss-atmosphere-contact-wave'&&o.visible).length,0);
  assert.equal(game.boss.hp,200);assert.equal(game.player.hp,120);
  stage.dispose();assertReleased(scene);
 }
});
test('four actual boss entrypoints connect the atmosphere to scene lifecycle, events, reset and frame',()=>{
 const entries=['arena','clown-battle','dice-battle','blood-battle'];
 for(const name of entries){
  const src=readFileSync(new URL('../src/'+name+'.mjs',import.meta.url),'utf8');
  assert.match(src,/createBossAtmosphere/);
  assert.match(src,/atmosphere\.reset\(\)/);
  assert.match(src,/atmosphere\.event\(e(?:v)?,g\)/);
  assert.match(src,/atmosphere\.update\(/);
  assert.match(src,/atmosphere\.cameraReaction\(camera\)/);
  assert.match(src,/atmosphere\.dispose\(\)/);
 }
});
test('brief camera sway is bounded, once per rendered frame and off on reduced motion',()=>{
 const scene=new THREE.Scene(),stage=createBossAtmosphere(scene,{profile:'clown',coarse:false,reduced:false});
 const game={boss:{phase:2,hp:900},player:{hp:120},status:'playing'};
 const camera=new THREE.PerspectiveCamera(),before=camera.position.y;
 stage.event({type:'clown-phase2'},game);
 stage.update(game,.04);
 const offset=stage.cameraReaction(camera);
 assert.ok(Math.abs(offset)<=.115);
 assert.equal(camera.position.y,before+offset);
 assert.equal(stage.cameraReaction(camera),0,'must never apply camera kick twice on same rendered frame');
 stage.update(game,0);
 assert.equal(stage.cameraReaction(camera),0,'paused scene must not move camera');
 stage.dispose();assertReleased(scene);
 const mobile=new THREE.Scene(),low=createBossAtmosphere(mobile,{profile:'clown',coarse:true,reduced:true});
 const mobileCam=new THREE.PerspectiveCamera(),originalY=mobileCam.position.y;
 low.event({type:'phase'},game);low.update(game,.04);
 assert.equal(low.cameraReaction(mobileCam),0);assert.equal(mobileCam.position.y,originalY);
 low.dispose();assertReleased(mobile);
});
test('atmosphere module contains no sound generation or media code',()=>{
 const text=readFileSync(new URL('../src/boss-atmosphere.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(text,/new AudioContext|createOscillator|createBufferSource|\.play\(|\.mp3|\.wav|\.ogg/);
 assert.throws(()=>createBossAtmosphere(new THREE.Scene(),{profile:'unknown'}),/Unknown boss atmosphere/);
});
