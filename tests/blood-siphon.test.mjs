import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,stepBlood,damageBlood,skipBloodTransition} from '../src/blood-combat.mjs';
import {BLOOD_RULES,BLOOD_PHASE_TWO_ENTRY_RATIO} from '../src/blood-data.mjs';
import {configureJourney,newRun,freshProfile} from '../src/journey-state.mjs';
import {JOURNEY_BOSS_HP} from '../src/journey-balance.mjs';
import {BLOOD_SIPHON_RULES,createBloodSiphonState} from '../src/blood-siphon.mjs';
import {createBloodSiphonFx} from '../src/blood-siphon-fx.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const advance=(g,seconds)=>{for(let t=0;t<seconds-1e-6;t+=.05)stepBlood(g,Math.min(.05,seconds-t));};
function phaseTwo(hp=2000){
 const g=createBloodGame();
 g.boss.phase=2;g.boss.state='recovery';g.boss.hp=hp;
 g.blood.transitioned=true;g.blood.phasePending=false;g.blood.recover=1e6;
 // Isolate the scheduled blood-sea siphon from the separate ranged whip.
 // The whip damages the player and legitimately restores additional HP via boss-drain.
 g.blood.whipCooldown=Infinity;
 g.player.hp=g.player.maxHp=1e8;return g;
}
test('blood siphon is a finite 2P-only timed heal with a readable warning, not instant regen',()=>{
 const g=phaseTwo(2000),before=g.boss.hp;
 assert.equal(BLOOD_SIPHON_RULES.healFraction,.05);
 assert.equal(BLOOD_SIPHON_RULES.maxHeals,5);
 advance(g,BLOOD_SIPHON_RULES.firstDelay-.1);
 assert.equal(g.boss.hp,before);assert.equal(g.blood.siphon.active,false);
 advance(g,.13);
 assert.equal(g.blood.siphon.active,true);
 assert.equal(g.events.filter(e=>e.type==='blood-siphon-begin').length,1);
 assert.equal(g.boss.hp,before,'no health until the blood has reached the body');
 advance(g,BLOOD_SIPHON_RULES.channel-.08);
 assert.equal(g.boss.hp,before);
 advance(g,.12);
 assert.equal(g.blood.siphon.active,false);
 assert.equal(g.boss.hp,before+320);
 assert.equal(g.blood.siphon.heals,1);
 assert.equal(g.blood.siphon.totalHealed,320);
 assert.equal(g.events.filter(e=>e.type==='blood-siphon-heal').length,1);
 assert.equal(g.boss.phase,2);
 assert.ok(g.blood.siphon.flash>0);
});
test('siphon respects the new 70% second-phase ceiling without reverting phases',()=>{
 const cap=BLOOD_RULES.hp*BLOOD_PHASE_TWO_ENTRY_RATIO;
 const g=phaseTwo(cap);
 assert.equal(BLOOD_SIPHON_RULES.phaseCeiling,BLOOD_PHASE_TWO_ENTRY_RATIO);
 advance(g,BLOOD_SIPHON_RULES.firstDelay+4);
 assert.equal(g.blood.siphon.active,false);
 assert.equal(g.blood.siphon.heals,0);
 g.boss.hp=cap-18;
 advance(g,4.8);
 assert.equal(g.blood.siphon.heals,1);
 assert.equal(g.boss.hp,cap);
 assert.equal(g.events.filter(e=>e.type==='blood-siphon-heal')[0].amount,18);
 assert.equal(g.boss.phase,2);
});
test('only five completed channels can restore blood, preventing an endless boss fight',()=>{
 const g=phaseTwo(140),before=g.boss.hp;
 advance(g,110);
 assert.equal(g.blood.siphon.heals,5);
 assert.equal(g.blood.siphon.totalHealed,1600);
 assert.equal(g.boss.hp,before+1600);
 assert.equal(g.events.filter(e=>e.type==='blood-siphon-begin').length,5);
 advance(g,75);
 assert.equal(g.blood.siphon.heals,5);
 assert.equal(g.boss.hp,before+1600);
 assert.equal(g.boss.phase,2);
});
test('phase-one and 2P transformation cannot siphon; pause, defeat and invalid dt never heal',()=>{
 const one=createBloodGame();one.blood.recover=1000;one.player.hp=one.player.maxHp=1e7;
 one.boss.hp=2200; // Only phase two may siphon, even if manually set below its threshold.
 advance(one,12);
 assert.equal(one.blood.siphon.active,false);assert.equal(one.blood.siphon.heals,0);
 const transitioned=createBloodGame();
 damageBlood(transitioned,3400);
 stepBlood(transitioned,.04);
 assert.equal(transitioned.boss.state,'transition');
 assert.equal(transitioned.boss.phase,2);
 assert.equal(transitioned.blood.siphon.heals,0);
 const start=structuredClone(transitioned.blood.siphon);
 for(const dt of [0,-1,NaN,Infinity])stepBlood(transitioned,dt);
 assert.deepEqual(transitioned.blood.siphon,start);
 assert.ok(skipBloodTransition(transitioned));
 stepBlood(transitioned,.01);
 assert.equal(transitioned.boss.state,'recovery');
 assert.equal(transitioned.blood.siphon.active,false);
 const dying=phaseTwo(150);
 advance(dying,11);
 assert.equal(dying.blood.siphon.active,true);
 damageBlood(dying,1e5);
 assert.equal(dying.status,'won');const won=dying.boss.hp;
 advance(dying,30);
 assert.equal(dying.boss.hp,won);
 assert.equal(dying.events.filter(e=>e.type==='blood-siphon-heal').length,0);
});
test('sea-to-core healing uses a bounded visual-only instanced blood stream',()=>{
 for(const coarse of [false,true]){
  const scene=new THREE.Scene(),siphon=createBloodSiphonFx(scene,{coarse,reduced:coarse});
  const g=phaseTwo(1800);
  const stream=scene.getObjectByName('blood-sea-absorbed-droplets');
  assert.ok(stream?.isInstancedMesh);
  assert.equal(stream.count,0);
  g.blood.siphon.active=true;g.blood.siphon.t=BLOOD_SIPHON_RULES.channel*.55;
  siphon.update(g,.016);
  const stats=siphon.stats();
  assert.equal(stats.poolSize,coarse?36:100);
  assert.equal(stats.active,true);
  assert.ok(stats.droplets>0);
  assert.equal(stats.collidable,false);assert.equal(stats.soundSources,0);
  assert.ok(scene.getObjectByName('blood-sea-absorption-shoreline')?.visible);
  assert.ok(scene.getObjectByName('blood-sea-healing-core-glow')?.visible);
  const matrix=new THREE.Matrix4();
  const pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(let i=0;i<stream.count;i++){
   stream.getMatrixAt(i,matrix);matrix.decompose(pos,quat,scale);
   assert.ok(Number.isFinite(pos.x)&&Number.isFinite(pos.y)&&Number.isFinite(pos.z));
   assert.ok(pos.y>=.15&&pos.y<=18,'droplets must arc toward the core, not pierce the scene');
  }
  g.blood.siphon.active=false;g.blood.siphon.flash=1;
  siphon.update(g,.05);
  assert.equal(stream.count,0);
  assert.ok(scene.getObjectByName('blood-sea-healing-core-glow').visible);
  g.blood.siphon.flash=0;siphon.update(g,.05);
  assert.equal(scene.getObjectByName('blood-sea-healing-core-glow').visible,false);
  siphon.dispose();siphon.dispose();
  assert.deepEqual(disposeScene(scene).errors,[]);
 }
});
test('full cathedral view attaches siphon visuals, releases them and leaves hit rules untouched',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true});
 const g=phaseTwo(2200),hp=g.boss.hp;
 view.update(g,.01);assert.equal(view.stats().siphon.active,false);
 g.blood.siphon.active=true;g.blood.siphon.t=1.2;view.update(g,.01);
 assert.equal(view.stats().siphon.active,true);
 view.event({type:'blood-siphon-heal',amount:320},g);
 assert.equal(g.boss.hp,hp);
 view.clear();assert.equal(view.stats().siphon.active,false);
 view.dispose();view.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('story boss enters second phase at 70% without raising total HP',()=>{
 const g=createBloodGame('sword');
 const run={...newRun('sword'),stage:3};
 configureJourney(g,run,freshProfile());
 assert.equal(g.boss.maxHp,JOURNEY_BOSS_HP.blood);
 const max=g.boss.maxHp,threshold=max*BLOOD_PHASE_TWO_ENTRY_RATIO;
 assert.ok(threshold>3000,'the existing required wave must remain within phase two');
 const before=max-(threshold+1);
 assert.ok(damageBlood(g,before)>0);
 assert.equal(g.blood.phasePending,false);
 assert.equal(g.boss.phase,1);
 damageBlood(g,2);
 assert.ok(g.boss.hp<=threshold);
 assert.equal(g.blood.phasePending,true);
 stepBlood(g,.05);
 assert.equal(g.boss.phase,2);
 assert.equal(g.boss.state,'transition');
 assert.equal(g.boss.maxHp,max);
 assert.ok(skipBloodTransition(g));
 stepBlood(g,.05);
 assert.equal(g.boss.state,'recovery');
 assert.equal(g.blood.siphon.heals,0);
 assert.equal(g.blood.requiredTsunamiDone,false);
 // Preserve the separate mandatory 3000 HP tsunami as a middle-of-2P
 // showcase, instead of firing it immediately on the earlier transition.
 damageBlood(g,100000);
 assert.equal(g.boss.hp,3000);
 stepBlood(g,.05);
 assert.equal(g.blood.requiredTsunamiStarted,true);
 assert.equal(g.blood.pattern,'requiem');
 assert.equal(damageBlood(g,100000),0,'the tsunami cannot be bypassed');
 assert.equal(g.status,'playing');
});
