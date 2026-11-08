import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,damageBlood,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_SERAPH_TRANSITION,BLOOD_SERAPH_REBIRTH_HEAL} from '../src/blood-data.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {bloodHurtShapes} from '../src/boss-hit-regions.mjs';
import {createBloodHead} from '../src/blood-head.mjs';

const phase3=()=>{
 const g=createBloodGame('sword',{seed:309});
 g.boss.phase=3;g.boss.state='transition';g.blood.transitionKind='seraph';
 g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
 g.blood.seraphHealDone=false;g.blood.t=0;
 return g;
};
test('2P winged model survives 3P cutscene start, then anatomically blends into 3bae seraph',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=phase3();
 try{
  assert.ok(BLOOD_SERAPH_TRANSITION>=6);
  const checkpoints=[0,.8,1.65,2.8,3.75,4.9,5.85,BLOOD_SERAPH_TRANSITION];
  const scale=[],face=[],old=[];
  for(const t of checkpoints){
   g.blood.t=t;
   const c=bloodTransformation(g);
   view.update(g,.016);
   const summary=view.stats(),seraph=scene.getObjectByName('blood-third-phase-crimson-seraph');
   const visage=scene.getObjectByName('blood-seraph-3bae-sculpted-visage');
   assert.ok(summary.seraph.visible);
   assert.ok(visage?.isGroup&&seraph?.isGroup);
   assert.equal(summary.seraph.photoAsset,'assets/3bae.png');
   assert.ok(summary.seraph.sculpt.robeLayers>=3);
   assert.ok(summary.seraph.sculpt.secondaryFeathers>=48);
   assert.equal(summary.seraph.sculpt.crownProngs,6);
   assert.ok(summary.seraph.sculpt.heart);
   assert.equal(summary.ascension.visible,true);
   if(t<2)assert.equal(view.root.visible,true,
    'the existing 2P model must not disappear immediately');
   if(t>=BLOOD_SERAPH_TRANSITION)assert.equal(view.root.visible,false,
    'the new 3P model must be the only combat boss after the cutscene');
   old.push(c.oldForm);face.push(visage.scale.x);scale.push(seraph.scale.x);
  }
  assert.ok(old[0]>old[4]&&old[4]>old.at(-1));
  assert.ok(face[0]<face[4]&&face[4]<face.at(-1));
  assert.ok(scale[1]<scale[4]&&scale[4]<scale.at(-1));
  assert.equal(view.stats().seraph.ownsHurtSilhouette,true);
  assert.ok(bloodHurtShapes(g).every(s=>s.id.startsWith('seraph-')));
  g.boss.state='recovery';view.update(g,.016);
  assert.equal(view.root.visible,false);
  assert.equal(view.stats().ascension.visible,false);
  assert.equal(view.stats().seraph.visible,true);
 }finally{view.dispose();}
 assert.equal(scene.getObjectByName('blood-seraph-2p-to-3p-evolution'),undefined);
});

test('phase-three portrait uses 3bae.png while first/second phase head keeps baeseojun.png',()=>{
 const defaultHead=createBloodHead({coarse:true,reduced:true});
 const seraphHead=createBloodHead({coarse:true,reduced:true,seraph:true,portrait:'3bae.png'});
 assert.equal(defaultHead.portraitAsset,'baeseojun.png');
 assert.equal(seraphHead.portraitAsset,'3bae.png');
 assert.ok(seraphHead.group.getObjectByName('baeseojun-sculpted-head')?.isMesh);
 defaultHead.dispose();seraphHead.dispose();
});

test('one-time 1000HP rebirth happens during extended cutscene without repeated healing',()=>{
 const g=phase3();
 g.boss.hp=g.boss.maxHp*.25;
 for(let n=0;n<140;n++)stepBlood(g,.05);
 assert.equal(g.boss.phase,3);
 assert.equal(g.blood.seraphHealDone,true);
 assert.equal(g.boss.hp,g.boss.maxHp*.25+BLOOD_SERAPH_REBIRTH_HEAL);
 assert.equal(g.events.filter(e=>e.type==='blood-seraph-heal').length,1);
 assert.equal(g.boss.state,'recovery');
});
