import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_EPIC_CUTS,bloodEpicShotState,bloodEpicKey} from '../src/blood-epic-script.mjs';
import {createBloodEpicCinematics} from '../src/blood-epic-cinematics.mjs';
import {BLOOD_PATTERNS,bloodPool} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const start=id=>{const g=createBloodGame('sword',{seed:83});g.boss.phase=BLOOD_PATTERNS[id].phase;
 g.player.hp=g.player.maxHp=1e7;assert.ok(startBloodPattern(g,id));return g;};

test('all monumental patterns reserve a reaction window AFTER their camera returns',()=>{
 for(const [id,shot] of Object.entries(BLOOD_EPIC_CUTS)){
  const g=start(id),s=bloodEpicShotState(g);
  const first=Math.min(...g.blood.hazards.map(h=>h.warn));
  const last=Math.max(...g.blood.hazards.map(h=>h.warn+h.life));
  assert.ok(first>=shot.finish+.7,id+' hits before player can see the field');
  assert.ok(last<BLOOD_PATTERNS[id].duration,id+' attack ends before its final wave');
  assert.equal(s.remainingReaction,first-shot.finish);
  assert.ok(g.blood.hazards.every(h=>h.damage>0));
 }
 assert.ok(bloodPool(1).includes('cross'));
 assert.ok(bloodPool(2).includes('requiem'));
});

test('first see a small distant tsunami, return to the arena before the actual wave',()=>{
 const g=start('requiem'),scene=new THREE.Scene();
 const fx=createBloodEpicCinematics(scene);
 const camera=new THREE.PerspectiveCamera(62,1,.1,1300),target=new THREE.Vector3(0,3,0);
 const initialKey=bloodEpicKey(g);
 g.blood.t=.3;fx.update(g);
 assert.ok(fx.waveRoot.visible);
 const far=fx.waveRoot.position.clone();
 camera.position.set(0,18,32);
 assert.ok(fx.pose(camera,target,g).active);
 assert.notEqual(camera.position.z,32,'camera should change to cinematic');
 const filmFov=camera.fov;
 assert.ok(filmFov<62);
 g.blood.t=2.58;fx.update(g);
 const near=fx.waveRoot.position.clone();
 const bossPosition=new THREE.Vector3(g.boss.x,0,g.boss.z);
 assert.ok(near.distanceTo(bossPosition)<far.distanceTo(bossPosition),'the distant tsunami must close the gap');
 assert.equal(fx.pose(camera,target,g).active,false,'camera must be back before the first hit');
 assert.equal(bloodEpicKey(g),initialKey);
 assert.ok(g.blood.hazards.every(h=>h.age===0),'presentation must not advance actual attacks');
 g.blood.t=Math.min(...g.blood.hazards.map(h=>h.warn));
 fx.update(g);assert.equal(fx.waveRoot.visible,true,'the real tsunami must remain visible throughout the actual moving hitbox');
 assert.equal(fx.stats().damageSources,0);
 fx.dispose();fx.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('epic cutscene cannot be skipped and keeps combat unchanged',()=>{
 const g=start('requiem'),fx=createBloodEpicCinematics(new THREE.Scene());
 g.blood.t=.9;
 const snapshot=JSON.stringify(g);
 assert.ok(fx.isFraming(g));
 assert.equal(typeof fx.skip,'undefined');
 assert.equal(fx.isFraming(g),true);
 assert.equal(JSON.stringify(g),snapshot,'presentation must never mutate simulation');
 assert.ok(g.blood.hazards.every(h=>h.warn>3));
 g.blood.t=3.1;
 assert.equal(fx.state(g).active,false);
 assert.equal(g.blood.hazards.filter(h=>h.tsunami&&h.shape==='lane').length,4);
 assert.ok(g.blood.hazards.every(h=>h.tsunami),'both overtopping crests use the same safe corridor');
 fx.reset();assert.ok(fx.isFraming({...g,blood:{...g.blood,t:.6}}));
 fx.dispose();
});

test('pause, reduced-motion and retry isolate the cinematic from combat state',()=>{
 const g=start('tide'),scene=new THREE.Scene(),fx=createBloodEpicCinematics(scene,{coarse:true,reduced:true});
 g.blood.t=.4;
 assert.equal(fx.isFraming(g),false,'reduced motion should never seize the camera');
 fx.update(g);assert.ok(fx.waveRoot.visible,'distant visual remains despite reduced motion');
 const before=JSON.stringify(g);
 stepBlood(g,0);
 assert.equal(JSON.stringify(g),before);
 fx.reset();
 const fresh=start('requiem');
 fx.update(fresh);assert.equal(fx.state(fresh).blocking,false);
 fx.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});

test('multiple giant spells retain one authoritatively timed cast and recover normally',()=>{
 for(const id of ['tide','requiem','eclipse','judgement','ritual','wingGenesis','lances','cross']){
  const g=start(id),finish=BLOOD_EPIC_CUTS[id].finish;
  const before=g.player.hp;
  for(let t=0;t<finish+.4;t+=.05)stepBlood(g,.05);
  assert.equal(g.player.hp,before,id+' caused invisible cinematic damage');
  for(let t=finish+.4;t<BLOOD_PATTERNS[id].duration+.2;t+=.05)stepBlood(g,.05);
  assert.equal(g.boss.state,'recovery',id+' failed to finish after prolonged windup');
 }
});
