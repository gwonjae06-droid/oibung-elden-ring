import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,damageBlood,stepBlood,skipBloodTransition,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_RULES,BLOOD_PHASE_TWO_ENTRY_RATIO,BLOOD_PHASE_THREE_ENTRY_RATIO,
 BLOOD_SERAPH_TRANSITION,BLOOD_SERAPH_REBIRTH_HEAL,BLOOD_FINAL_HYMN_RATIO,
 BLOOD_PATTERNS,bloodPool,hazardContains} from '../src/blood-data.mjs';
import {createBloodSeraph} from '../src/blood-seraph.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {nextBloodPattern,createBloodPatternDeck} from '../src/blood-pattern-director.mjs';
import {BLOOD_SIPHON_RULES,tickBloodSiphon} from '../src/blood-siphon.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {bloodHurtShapes,bloodAimPart} from '../src/boss-hit-regions.mjs';
import {createBloodTransformationAudio} from '../src/blood-transformation-audio.mjs';
import {bossTrack,createBossTracks} from '../src/boss-tracks.mjs';

const advance=(g,t)=>{for(let left=t;left>1e-7;left-=.05)stepBlood(g,Math.min(.05,left));};
const p3=()=>{
 const g=createBloodGame('sword',{seed:718});g.boss.phase=3;g.boss.state='recovery';
 g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
 g.blood.seraphAwakened=true;g.blood.transitionKind='seraph';
 g.player.hp=g.player.maxHp=100000;g.player.invuln=10000;return g;
};
test('Blood King keeps original total health and enters true third phase at 25%',()=>{
 const g=createBloodGame('sword',{seed:718}),max=g.boss.maxHp;
 assert.equal(max,BLOOD_RULES.hp);
 assert.equal(BLOOD_PHASE_TWO_ENTRY_RATIO,.7);
 assert.equal(BLOOD_PHASE_THREE_ENTRY_RATIO,.25);
 damageBlood(g,max*.32);
 assert.equal(g.blood.phasePending,true);
 stepBlood(g,.02);
 assert.equal(g.boss.phase,2);
 assert.equal(g.boss.state,'transition');
 assert.equal(g.blood.seraphArmed,true);
 skipBloodTransition(g);stepBlood(g,.02);
 assert.equal(g.boss.state,'recovery');
 assert.equal(g.boss.maxHp,max,'never give the boss a second HP bar');
 // The mandatory original 3000HP tsunami must complete before HP can
 // descend to the 25% angel transformation threshold.
 damageBlood(g,100000);
 assert.equal(g.boss.hp,3000);
 assert.equal(g.blood.seraphPending,false);
 stepBlood(g,.02);
 assert.equal(g.blood.requiredTsunamiStarted,true);
 assert.equal(g.blood.pattern,'requiem');
 assert.equal(damageBlood(g,100000),0);
 g.blood.requiredTsunamiDone=true;g.blood.requiredTsunamiStarted=true;
 g.boss.state='recovery';g.blood.pattern=null;g.blood.hazards.length=0;
 damageBlood(g,1401);
 assert.equal(g.boss.hp,max*.25);
 assert.equal(g.blood.seraphPending,true);
 assert.equal(damageBlood(g,20000),0,'cannot skip the third-phase reveal');
 stepBlood(g,.02);
 assert.equal(g.boss.phase,3);
 assert.equal(g.boss.state,'transition');
 assert.equal(g.blood.transitionKind,'seraph');
 assert.equal(g.blood.seraphPending,false);
 assert.ok(g.events.some(e=>e.type==='blood-seraph-awakening'));
 const transform=bloodTransformation(g);
 assert.equal(transform.musicPhase,3);
 assert.ok(transform.seraph>=0);
 assert.equal(transform.wings,1,'the existing phase-two wings do not collapse');
 skipBloodTransition(g);stepBlood(g,.02);
 assert.equal(g.boss.state,'recovery');
 assert.equal(g.blood.seraphAwakened,true);
 assert.equal(g.boss.hp,max*.25+BLOOD_SERAPH_REBIRTH_HEAL);
 assert.equal(g.blood.seraphHealDone,true);
 assert.equal(g.events.filter(e=>e.type==='blood-seraph-heal').length,1);
 assert.equal(g.events.find(e=>e.type==='blood-seraph-heal').amount,1000);
 const healed=g.boss.hp;advance(g,1.5);
 assert.equal(g.boss.hp,healed,'rebirth must never repeat after the cinematic');
 assert.equal(g.events.filter(e=>e.type==='blood-seraph-heal').length,1);
 assert.equal(g.boss.maxHp,max);
 assert.ok(g.events.filter(e=>e.type==='phase').length===2);
});
test('six NEW Seraph-only patterns and final hymn all telegraph, stay dodgeable and finish',()=>{
 const patterns=['seraphSweep','seraphWingCross','seraphInwardPillars',
  'seraphFrenzy','seraphHaloProcession','seraphBloodRosette','seraphFinale'];
 assert.deepEqual(bloodPool(3),patterns);
 for(const id of patterns){
  const g=p3(),spec=BLOOD_PATTERNS[id];
  assert.ok(startBloodPattern(g,id),id);
  assert.ok(g.blood.hazards.length>=1,id);
  assert.ok(g.blood.hazards.every(h=>h.warn>=1&&h.damage>0),id);
  assert.equal(!!spec.air,false,'phase three cannot kite players in the air: '+id);
  for(let t=0;t<spec.duration;t+=.25){
   const active=g.blood.hazards.filter(h=>h.age>=h.warn&&h.age<h.warn+h.life);
   let hasSafeSpot=false;
   for(let x=-24;x<=24&&!hasSafeSpot;x+=4)
    for(let z=-24;z<=24;z+=4)
     if(Math.hypot(x,z)<26&&active.every(h=>!hazardContains(h,{x,z})))hasSafeSpot=true;
   assert.ok(hasSafeSpot,id+' became unavoidable at t='+t);
   advance(g,.25);
  }
  advance(g,.20);
  assert.equal(g.boss.state,'recovery',id);
  assert.equal(g.boss.phase,3,id);
  assert.equal(g.blood.elevation,0,id);
  if(id==='seraphFinale')assert.equal(g.blood.seraphFinaleDone,true);
 }
});
test('finale is selected on low HP without looping or reintroducing healing',()=>{
 const g=p3(),max=g.boss.maxHp;
 g.boss.hp=max*BLOOD_FINAL_HYMN_RATIO+2;
 g.blood.recover=10000;
 assert.equal(g.blood.seraphFinaleStarted,false);
 damageBlood(g,3);
 stepBlood(g,.02);
 assert.equal(g.blood.pattern,'seraphFinale');
 assert.equal(g.blood.seraphFinaleStarted,true);
 assert.equal(g.boss.state,'pattern');
 advance(g,BLOOD_PATTERNS.seraphFinale.duration+.15);
 assert.equal(g.blood.seraphFinaleDone,true);
 g.blood.siphon.cooldown=0;
 g.blood.siphon.active=true;
 const hp=g.boss.hp;tickBloodSiphon(g,BLOOD_SIPHON_RULES.channel+1);
 assert.equal(g.boss.hp,hp,'phase-three healing must be disabled');
 assert.equal(g.blood.siphon.heals,0);
});
test('3P pattern shuffler exhausts six UNIQUE non-legacy attacks before repeating, reserving last hymn',()=>{
 const deck=createBloodPatternDeck(473),expected=bloodPool(3).filter(p=>p!=='seraphFinale');
 let previous=null;
 for(let cycle=0;cycle<5;cycle++){
  const picks=Array.from({length:expected.length},()=>nextBloodPattern(deck,3));
  assert.deepEqual(picks.slice().sort(),expected.slice().sort());
  assert.ok(!picks.includes('seraphFinale'));
  if(cycle===0)assert.deepEqual(picks.slice(0,2),['seraphSweep','seraphWingCross']);
  if(previous)assert.notEqual(picks[0],previous,'avoid back-to-back duplicates across deck boundaries');
  previous=picks.at(-1);
 }
});
test('colossal Blood Seraph uses sculpted Baeseojun photo-face and six independent wing joints',()=>{
 const scene=new THREE.Scene(),seraph=createBloodSeraph(scene,{coarse:true,reduced:true});
 const first=seraph.stats();
 assert.equal(first.decorativeOnly,false,'the angel itself must be the combat model');
 assert.equal(first.ownsHurtSilhouette,true);
 assert.equal(first.hasLiveEyeRay,true);
 assert.equal(first.hinges,6);
 assert.equal(first.haloRings,3);
 assert.ok(first.featherInstances>=60);
 assert.equal(first.damageSources,0);
 assert.equal(first.hasFace,true);
 assert.equal(first.hasEye,false);
 assert.equal(first.photoAsset,'assets/baeseojun.png');
 assert.ok(scene.getObjectByName('blood-seraph-baeseojun-photo-visage')?.isGroup);
 assert.ok(scene.getObjectByName('baeseojun-sculpted-head')?.isMesh);
 assert.equal(scene.getObjectByName('blood-seraph-eye-pupil'),undefined);
 assert.ok(scene.getObjectByName('blood-seraph-sacred-face-ring')?.isMesh);
 const wings=[];scene.traverse(o=>{if(o.isInstancedMesh&&o.name.includes('blood-seraph-layered-feathers'))wings.push(o);});
 assert.equal(wings.length,6);
 const g=p3();g.boss.state='transition';g.blood.t=3.75;
 seraph.update(g,bloodTransformation(g),.05);
 assert.equal(seraph.stats().visible,true);
 assert.ok(seraph.root.scale.x>0);
 g.status='won';seraph.update(g,bloodTransformation(g),.016);
 assert.equal(seraph.stats().visible,false);
 seraph.clear();seraph.dispose();seraph.dispose();
 assert.equal(scene.getObjectByName('blood-third-phase-crimson-seraph'),undefined);
});
test('real cathedral draws 3P warnings, hands and eye without creating hitboxes in the apparition',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=p3();
 try{
  assert.ok(startBloodPattern(g,'seraphSweep'));
  view.update(g,.025);
  assert.equal(view.stats().seraph.visible,true);
  assert.ok(view.stats().seraph.featherInstances>=60);
  assert.ok(view.stats().hazards>=1);
  const floor=scene.getObjectByName('blood-hazard-dark-and-safe-liquid');
  assert.ok(floor?.visible,'new patterns need visible geometry for their exact footprints');
  assert.equal(scene.getObjectByName('blood-third-phase-crimson-seraph').userData.decorativeOnly,false);
  assert.equal(view.root.visible,false,'the old 2P humanoid MUST be hidden in phase three');
  assert.ok(bloodHurtShapes(g).every(h=>h.id.startsWith('seraph-')));
  assert.equal(bloodAimPart(g).id,'seraph-chest');
  for(const id of ['seraphWingCross','seraphInwardPillars','seraphFrenzy',
   'seraphHaloProcession','seraphBloodRosette','seraphFinale']){
   g.boss.state='recovery';g.blood.hazards.length=0;
   assert.ok(startBloodPattern(g,id));
   view.update(g,.025);
   assert.ok(view.stats().hazards>=1,id);
  }
 }finally{view.dispose();}
});
test('Seraph uses the late section of the existing bloodbgm2 MP3 with unchanged tempo',()=>{
 const phaseTwo=bossTrack({boss:'blood',phase:2});
 const third=bossTrack({boss:'blood',phase:3});
 assert.equal(third.key,'blood:3');
 assert.equal(third.url,phaseTwo.url);
 const clips=[];
 class Audio{
  constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=1;this.playbackRate=1;clips.push(this);}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}load(){}
 }
 const tracks=createBossTracks({Audio},{fadeMs:100});
 tracks.update({boss:'blood',phase:2,offset:1.8});
 assert.equal(clips[0].currentTime,1.8);
 tracks.update({boss:'blood',phase:3,offset:180});
 assert.equal(tracks.playingKey,'blood:3');
 assert.equal(clips[1].currentTime,180);
 assert.equal(clips[1].playbackRate,1);
 tracks.dispose();
 const effects=[];class EffectAudio extends Audio{constructor(url){super(url);effects.push(this);}}
 const transition=createBloodTransformationAudio({AudioClass:EffectAudio}),g=p3();
 g.boss.state='transition';g.blood.t=4.0;
 transition.update(g);
 assert.equal(transition.fired.length,0,'womanvoice and bell must not repeat during the seraph cutscene');
 transition.dispose();
});

// Game damage should use the 3P silhouette, never the invisible 2P human.
test('seraph lower robe is targetable at ground height; its eye owns the upper lock-on region',()=>{
 const g=p3(),shapes=bloodHurtShapes(g);
 assert.deepEqual(shapes.map(s=>s.id),['seraph-hem','seraph-vessel','seraph-chest','seraph-eye']);
 assert.ok(shapes[0].y-shapes[0].ry<=.38,'ground-skimming cards should contact the visible blood robe');
 assert.equal(bloodAimPart(g).id,'seraph-chest');
 const y=shapes.find(s=>s.id==='seraph-eye').y;
 assert.ok(y>5&&y<8);
});
test('eye laser uses each real impact clock and is invisible in safe windup and recovery',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=p3();
 try{
  assert.ok(startBloodPattern(g,'seraphSweep'));
  view.update(g,.025);
  assert.equal(view.stats().seraph.eyeRayVisible,false);
  const warning=g.blood.hazards[0].warn;
  advance(g,warning+.04);view.update(g,.025);
  assert.equal(view.stats().seraph.eyeRayVisible,true);
  advance(g,3.3);view.update(g,.025);
  assert.equal(view.stats().seraph.eyeRayVisible,false);
  const first=g.blood.hazards[0];
  assert.equal(first.shape,'lane');
  assert.ok(first.damage>0);
 }finally{view.dispose();}
});
test('rebirth pulse is exactly one thousand in story-scale HP and never stacks',()=>{
 const g=p3(),max=g.boss.maxHp;
 g.boss.hp=max*.25;g.boss.state='transition';g.blood.seraphHealDone=false;g.blood.t=2.64;
 advance(g,.04);
 assert.equal(g.boss.hp,max*.25+1000);
 assert.equal(g.events.filter(e=>e.type==='blood-seraph-heal').length,1);
 advance(g,1.95);
 assert.equal(g.boss.hp,max*.25+1000);
 assert.equal(g.blood.seraphHealDone,true);
});
