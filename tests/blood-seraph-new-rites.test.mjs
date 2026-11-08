import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,startBloodPattern,stepBlood,seraphFlankDestination} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardPosition,bloodHazardFootprint,hazardContains} from '../src/blood-data.mjs';
import {SERAPH_CANONICAL_PATTERNS} from '../src/blood-seraph-doctrine.mjs';
import {createBloodSeraph} from '../src/blood-seraph.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';

const sample=(name)=>{
 const g=createBloodGame('sword',{seed:2921});
 g.boss.phase=3;g.boss.state='recovery';g.blood.seraphAwakened=true;
 g.blood.requiredTsunamiStarted=true;g.blood.requiredTsunamiDone=true;
 g.player.invuln=100000;g.player.hp=g.player.maxHp=100000;
 assert.equal(startBloodPattern(g,name),true,name);
 return g;
};

test('the live 3P deck contains ONLY six distinct blood-angel weapons plus the signature finale',()=>{
 assert.deepEqual(bloodPool(3),[...SERAPH_CANONICAL_PATTERNS,'seraphFinale']);
 assert.equal(new Set(bloodPool(3)).size,7);
 const phaseOne=new Set(bloodPool(1)),phaseTwo=new Set(bloodPool(2));
 for(const name of SERAPH_CANONICAL_PATTERNS){
  assert.equal(phaseOne.has(name)||phaseTwo.has(name),false,name);
  assert.equal(BLOOD_PATTERNS[name].phase,3);
  assert.equal(!!BLOOD_PATTERNS[name].air,false,'ordinary combat retains a targetable body');
 }
 for(const retired of ['seraphWings','seraphPulse','seraphLances','seraphCrown',
  'seraphGaze','seraphFeathers','seraphEmbrace','seraphDescent']){
  assert.ok(!bloodPool(3).includes(retired),retired+' must not repeat 1P/2P concepts');
 }
});

test('the crimson face cannon really rotates left-to-right and only damages its LIVE ray',()=>{
 const g=sample('seraphSweep'),h=g.blood.hazards[0];
 assert.equal(g.blood.hazards.length,1);
 assert.equal(h.seraphAngularSweep,true);
 assert.ok(h.width>=2.1&&h.length>=60,'sweep must be enormous and thick');
 assert.ok(h.warn>=1&&h.life>=3);
 const start=hazardPosition(h);
 assert.ok(Math.abs(start.yaw-h.yawStart)<1e-6);
 assert.equal(hazardContains(h,{x:start.x,z:start.z}),true);
 h.age=h.warn+h.life*.5;
 const middle=hazardPosition(h),f=bloodHazardFootprint(h);
 assert.ok(middle.yaw>start.yaw+.9);
 assert.ok(Math.abs(f.yaw-middle.yaw)<1e-8);
 assert.equal(hazardContains(h,{x:middle.x,z:middle.z}),true);
 assert.ok(!hazardContains(h,{x:-middle.x,z:-middle.z}),
  'opposite side of the arena must not take invisible ray damage');
 h.age=h.warn+h.life;
 const end=hazardPosition(h);
 assert.ok(end.yaw>middle.yaw+.9);
});

test('the wing-disc leaves the map and crosses FOUR distinct warned lanes',()=>{
 const g=sample('seraphWingCross'),hs=g.blood.hazards;
 assert.equal(hs.length,4);
 assert.deepEqual(hs.map(h=>h.pass),[0,1,2,3]);
 assert.ok(hs.every(h=>Math.abs(h.x)>32&&h.shape==='lane'));
 assert.ok(hs.every(h=>h.width>=3.4&&h.length>=11),'wider ring needs a wider visible hit volume');
 assert.ok(hs.every(h=>h.warn>=1.2&&h.life>.7));
 assert.ok(hs.every((h,i)=>i===0||h.warn-hs[i-1].warn>.75));
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  hs[0].age=hs[0].warn-.5;
  rig.update(g,bloodTransformation(g),.12);
  assert.ok(rig.stats().warningGuides>=1,'warning must precede the actual passing disc');
  assert.equal(rig.stats().wingWheelVisible,true);
  hs[0].age=hs[0].warn+.16;
  rig.update(g,bloodTransformation(g),.12);
  assert.equal(rig.stats().wingWheelVisible,true);
  const m=scene.getObjectByName('blood-seraph-independent-crossing-wings');
  assert.ok(m&&m.visible);
  assert.ok(m.position.x>-37&&m.position.x<37);
 }finally{rig.dispose();}
});

test('four concentric blood-pillar rings encircle the entire map but stop before the caster',()=>{
 const g=sample('seraphInwardPillars'),hs=g.blood.hazards;
 assert.equal(hs.length,4);
 assert.deepEqual(hs.map(h=>h.rank),[0,1,2,3]);
 assert.ok(hs.every(h=>h.shape==='ring'&&h.seraphCue==='blood-pillar-ring'));
 for(let rank=0;rank<4;rank++){
  const h=hs[rank];assert.equal(h.x,0);assert.equal(h.z,0);
  assert.ok(h.width>=3.4&&h.warn>=1.3);
  if(rank){assert.ok(h.r<hs[rank-1].r);assert.ok(h.warn>hs[rank-1].warn);}
  assert.ok(h.r-h.width*.72>=5,'inner sanctuary must remain open');
  h.age=h.warn+.03;
  for(let a=0;a<Math.PI*2;a+=Math.PI/8)
   assert.ok(hazardContains(h,{x:Math.sin(a)*h.r,z:Math.cos(a)*h.r}),
    'blood pillars must reach every arena angle');
  h.age=0;
 }
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  hs[0].age=hs[0].warn-.3;
  rig.update(g,bloodTransformation(g),.05);
  assert.equal(rig.stats().columns.visible,true);
  assert.equal(rig.stats().columns.columns,24);
  const mesh=scene.getObjectByName('blood-seraph-concentric-3d-blood-pillars');
  assert.ok(mesh?.isInstancedMesh);
  const matrix=new THREE.Matrix4(),world=new THREE.Vector3();
  mesh.getMatrixAt(0,matrix);world.setFromMatrixPosition(matrix);
  assert.ok(Math.abs(Math.hypot(world.x,world.z)-hs[0].r)<.01);
  rig.clear();assert.equal(rig.stats().columns.columns,0);
 }finally{rig.dispose();}
});

test('the frantic face cannon fires eleven distinct warned rays, without all warning at once',()=>{
 const g=sample('seraphFrenzy'),hs=g.blood.hazards;
 assert.equal(hs.length,11);
 assert.ok(hs.every(h=>h.shape==='lane'&&h.seraphCue==='frenzy'&&h.warn>1&&h.width>=1.75));
 assert.equal(bloodFloorField(g),null,
  'the floor must not display eleven future shots simultaneously');
 hs[0].age=hs[0].warn-.65;
 const field=bloodFloorField(g);
 assert.ok(field&&field.hazards.length===1,'only the imminent shot may be marked');
 hs[0].age=hs[0].warn+.08;
 assert.equal(field.hazards.length,1);
});

test('celestial wheels and martyr-rose have different movement and hitbox geometries',()=>{
 const halos=sample('seraphHaloProcession').blood.hazards;
 assert.equal(halos.length,4);
 assert.ok(halos.every(h=>h.shape==='ring'&&Math.abs(h.vx)>0&&h.r>=4.5&&h.width>=1.95));
 const petals=sample('seraphBloodRosette').blood.hazards;
 assert.equal(petals.length,6);
 assert.ok(petals.every(h=>h.shape==='cone'&&h.innerR>=5&&h.arc>=.32&&h.r>=29));
 assert.ok(petals.every((h,i)=>i===0||h.warn>petals[i-1].warn));
});

// A harder attack must remain readable. The safest gap cannot be deleted
// by indiscriminately increasing angular sectors and simultaneous beams.
test('larger blood-angel spells still have valid gaps and visible warning budgets',()=>{
 for(const id of [...SERAPH_CANONICAL_PATTERNS,'seraphFinale']){
  const g=sample(id),spec=BLOOD_PATTERNS[id];
  assert.ok(g.blood.hazards.every(h=>h.warn>=1.2),id+' has an instant unfair strike');
  assert.ok(g.blood.hazards.every(h=>h.damage>0),id);
  for(let time=0;time<spec.duration;time+=.20){
   const active=g.blood.hazards.filter(h=>h.age>=h.warn&&h.age<h.warn+h.life);
   if(active.length){
    let safe=false;
    for(let x=-26;x<=26&&!safe;x+=2.6)for(let z=-26;z<=26;z+=2.6){
     if(Math.hypot(x,z)<28&&active.every(h=>!hazardContains(h,{x,z}))){safe=true;break;}
    }
    assert.ok(safe,id+' erased all evasive space at t='+time.toFixed(2));
   }
   stepBlood(g,.05);
   // Deterministic timing independent of player action, 4 subsamples.
   for(let i=0;i<3;i++)stepBlood(g,.05);
  }
 }
});

test('sweeping cannon visibly charges its face but has no odd horizontal blood bar below',()=>{
 const g=sample('seraphSweep');assert.equal(bloodFloorField(g),null);
 const h=g.blood.hazards[0];h.age=h.warn*.65;g.blood.t=h.age;
 const scene=new THREE.Scene(),rig=createBloodSeraph(scene,{coarse:true,reduced:true});
 try{
  rig.update(g,bloodTransformation(g),.045);
  assert.equal(rig.stats().sacredChargeVisible,true);
  assert.equal(rig.stats().eyeRayVisible,false);
  h.age=h.warn+.06;g.blood.t=h.age;
  rig.update(g,bloodTransformation(g),.045);
  assert.equal(rig.stats().eyeRayVisible,true);
  assert.equal(bloodFloorField(g),null);
 }finally{rig.dispose();}
});

test('blood seraph stops walking, teleports to a flank, and returns to centre for each cast',()=>{
 const g=sample('seraphSweep'),spec=BLOOD_PATTERNS.seraphSweep;
 const step=t=>{for(let left=t;left>1e-8;left-=.05)stepBlood(g,Math.min(.05,left));};
 assert.deepEqual([g.boss.x,g.boss.z],[0,0]);
 step(spec.duration+.08);
 assert.equal(g.boss.state,'recovery');
 assert.equal(g.blood.walk,null);
 step(g.blood.recover+.04);
 assert.equal(g.boss.state,'maneuver');
 assert.equal(g.blood.walk,null);
 assert.ok(Math.hypot(...Object.values(seraphFlankDestination(g.boss,g.player,g.blood.index)))>=11);
 step(.36);
 assert.ok(Math.hypot(g.boss.x,g.boss.z)>=10);
 assert.ok(g.events.some(e=>e.type==='blood-seraph-teleport'&&e.reason==='holy-flank'));
 assert.ok(g.blood.seraphBlink);
 step(1.45);
 assert.equal(g.boss.state,'pattern');
 assert.equal(g.boss.x,0);assert.equal(g.boss.z,0);
 assert.ok(g.events.some(e=>e.type==='blood-seraph-teleport'&&e.reason==='central-cast'));
});
