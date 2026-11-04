import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {createBloodParticles} from '../src/blood-particles.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,hazardPosition} from '../src/blood-data.mjs';
import {collectSceneResources,disposeScene} from '../src/runtime/scene-resources.mjs';

test('each real pattern causes its defined damage when the player enters the actual hazard',()=>{
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;g.player.hp=g.player.maxHp=1e6;startBloodPattern(g,id);
  const hazard=g.blood.hazards[0],expected=hazard.damage,hp=g.player.hp;
  for(let t=0;t<hazard.warn+.025;t+=.005){const c=hazardPosition(hazard);g.player.x=c.x+(hazard.shape==='ring'?c.r:0);g.player.z=c.z;stepBlood(g,.005);}
  assert.equal(hp-g.player.hp,expected,id);
 }
});
test('particle and puddle caps hold after thousands of impacts, merge and drain on the visual clock',()=>{
 const scene=new THREE.Scene(),q=bloodQuality({coarse:true}),fluid=createBloodFluid(q),fx=createBloodParticles(scene,fluid,q);
 for(let i=0;i<1000;i++){fx.burst(i%20,1,i%13,{count:30});fx.puddle(i%20,i%13,1);fx.update(.01,i*.01);assert.ok(fx.active<=q.drops);assert.ok(fx.puddles<=q.puddles);}
 const snapshot=fx.active;fx.update(0,10);assert.equal(fx.active,snapshot);
 // Blood now runs on a slowed clock and puddles linger about six seconds, so allow twelve seconds to drain.
 for(let t=0;t<12;t+=.05)fx.update(.05,10+t);assert.equal(fx.active,0);assert.equal(fx.puddles,0);fx.clear();disposeScene(scene);
});
test('all 14 spell pools settle to a fixed resource count across repeated fights and retry clears them',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),g=createBloodGame();g.player.hp=1e6;const sizes=[];
 for(let round=0;round<3;round++){
  for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){g.boss.phase=spec.phase;g.boss.state='recovery';g.blood.phasePending=false;startBloodPattern(g,id);for(let t=0;t<spec.duration+.1;t+=.05){stepBlood(g,.05);view.update(g,.05);}}
  view.clear();sizes.push(collectSceneResources(scene).size);assert.deepEqual(view.stats(),{drops:0,puddles:0,hazards:0});
 }
 assert.equal(sizes[1],sizes[0]);assert.equal(sizes[2],sizes[1]);view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('the touch tier reduces geometry and particle count without dropping spell forms',()=>{
 const normal=bloodQuality({}),mobile=bloodQuality({coarse:true});
 assert.ok(mobile.drops<normal.drops);assert.ok(mobile.segments<normal.segments);
});
