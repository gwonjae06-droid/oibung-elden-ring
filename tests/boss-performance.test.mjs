import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bossMotion} from '../src/boss-motion-data.mjs';
import {patternConfig} from '../src/combat.mjs';
import {kwonWeightAccent,clownWeightAccent,giantWeightAccent,bloodWeightAccent} from '../src/boss-performance.mjs';
import {cinematicLightCue} from '../src/cinematic-light-cues.mjs';
import {createCinematicWorld,CINEMATIC_PROFILES} from '../src/cinematic-graphics.mjs';

const bounded=(a,n)=>Object.values(a).every(v=>Number.isFinite(v)&&Math.abs(v)<=n);
test('Kwon wind-up, slash and recovery produce separate weight phases',()=>{
 const b={pattern:'sweep',phase:1,state:'windup',t:0,stun:0,queue:[],recovery:1};
 const cfg=patternConfig(b),ready=bossMotion({...b,t:cfg.wind});
 const strike=bossMotion({...b,state:'active',t:cfg.active*.5});
 const follow=bossMotion({...b,state:'recovery',t:.1});
 assert.ok(ready.brace>.99&&strike.strike>.9&&follow.follow>.5);
 assert.ok(bounded(kwonWeightAccent(b,strike),.13));
 assert.ok(Math.abs(kwonWeightAccent(b,strike).shoulderYaw)>.03);
});
test('Clown, giant and Blood accents are bounded and do not change gameplay objects',()=>{
 const clown={status:'playing',boss:{state:'clown',phase:2},clown:{state:'pattern',pt:.48,vis:{glove:1,stomp:.9}}};
 const before=JSON.stringify(clown),a=clownWeightAccent(clown,{glove:2,shoe:1.7,twist:.5});
 assert.ok(bounded(a,.2)&&a.compression>0);assert.equal(JSON.stringify(clown),before);
 const giant={state:'attack',temperament:'feral',t:1.02,hazards:[{start:0,warn:1,active:.3,handIndex:1}]};
 const g=JSON.stringify(giant),mass=giantWeightAccent(giant);
 assert.ok(bounded(mass,.16)&&mass.pitch>0);assert.equal(JSON.stringify(giant),g);
 const early=bloodWeightAccent({anticipation:1,body:{twist:-.7}});
 const hit=bloodWeightAccent({release:1,impact:1,body:{twist:-.7}});
 assert.ok(early.pitch<0&&hit.pitch>0&&hit.capeKick>0&&bounded(hit,.18));
});
test('Cinematic profile cues remain bounded without gameplay mutation',()=>{
 for(const [profile,game] of [
  ['kwon',{status:'playing',boss:{phase:1,state:'active'}}],
  ['clown',{status:'playing',boss:{phase:1},clown:{state:'pattern',vis:{glove:1}}}],
  ['dice',{status:'playing',boss:{phase:2},dice:{giant:{state:'attack'}}}],
  ['blood',{status:'playing',boss:{phase:2,state:'pattern'},blood:{elevation:2}}]
 ]){const copy=JSON.stringify(game),cue=cinematicLightCue(game,profile);
  assert.ok(cue.rim>0&&cue.rim<=.38&&cue.environment>=0&&cue.environment<=.024);
  assert.equal(JSON.stringify(game),copy);
 }
});
test('Existing rim reacts gently to attacks while mobile stays zero and no extra lights appear',()=>{
 for(const coarse of [false,true]){
  const scene=new THREE.Scene(),renderer={toneMapping:THREE.NoToneMapping,toneMappingExposure:1,outputColorSpace:THREE.LinearSRGBColorSpace};
  const world=createCinematicWorld(scene,renderer,{profile:'kwon',coarse});
  const lamp=scene.getObjectByName('cinematic-boss-silhouette-fill');
  for(let i=0;i<60;i++)world.update({status:'playing',boss:{phase:1,state:'active'}},1/60);
  if(coarse)assert.equal(lamp.intensity,0);else assert.ok(lamp.intensity>CINEMATIC_PROFILES.kwon.fill);
  assert.equal(lamp.castShadow,false);assert.equal(scene.children.filter(o=>o.isLight).length,1);
  for(let i=0;i<100;i++)world.update({status:'playing',boss:{phase:1,state:'idle'}},1/60);
  if(!coarse)assert.ok(Math.abs(lamp.intensity-CINEMATIC_PROFILES.kwon.fill)<.001);
  world.dispose();assert.equal(scene.children.length,0);
 }
});
