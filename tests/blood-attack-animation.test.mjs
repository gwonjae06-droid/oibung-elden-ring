import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {bloodAttackMotion,BLOOD_ATTACK_GESTURES} from '../src/blood-attack-motion.mjs';
import {bloodWingWebGeometry,createBloodWings} from '../src/blood-wings.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const finite=o=>{
 if(typeof o==='number'){assert.ok(Number.isFinite(o));return;}
 if(o&&typeof o==='object')for(const value of Object.values(o))finite(value);
};
test('each of the eighteen attacks has a distinct deterministic full-body silhouette',()=>{
 const styles=new Set();
 assert.deepEqual(Object.keys(BLOOD_ATTACK_GESTURES).sort(),Object.keys(BLOOD_PATTERNS).sort());
 for(const [id,spec] of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;g.player.hp=1e8;
  assert.ok(startBloodPattern(g,id));
  const first=Math.min(...g.blood.hazards.map(h=>h.warn));
  g.blood.t=first*.75;
  for(const h of g.blood.hazards)h.age=first*.75;
  const pre=bloodAttackMotion(g);
  assert.notEqual(pre.style,'idle',id);styles.add(pre.style);
  assert.ok(pre.weight>0,id+' did not wind up');
  g.blood.t=first;for(const h of g.blood.hazards)h.age=first;
  const hit=bloodAttackMotion(g);
  assert.ok(hit.impact>.9,id+' impact missed the first collision clock');
  assert.ok(hit.weight>0,id+' body froze on release');
  assert.equal(hit.arms.length,2);
  assert.equal(JSON.stringify(hit),JSON.stringify(bloodAttackMotion(g)),id+' is nondeterministic');
  finite(hit);
  g.boss.state='recovery';g.blood.recover=spec.recover*.9;
  const tail=bloodAttackMotion(g);
  assert.ok(tail.weight<hit.weight,id+' does not ease out');
 }
 assert.equal(styles.size,18);
});
test('wing attack is asymmetric, dive folds and eclipse spreads, with distinct gestures',()=>{
 const pose=id=>{
  const g=createBloodGame();g.boss.phase=2;startBloodPattern(g,id);
  const first=Math.min(...g.blood.hazards.map(h=>h.warn));
  g.blood.t=first+.11;
  for(const h of g.blood.hazards)h.age=g.blood.t;
  return bloodAttackMotion(g);
 };
 const wing=pose('wing'),dive=pose('dive'),eclipse=pose('eclipse'),rain=pose('rain');
 assert.ok(wing.wings.sweep>.2);
 assert.ok(dive.wings.fold>.4);
 assert.ok(eclipse.wings.lift>.4);
 assert.ok(rain.arms.every(arm=>arm.raise>.8));
 assert.notDeepEqual(wing.body,dive.body);
});
test('phase transition unfolds, recovery is finite, defeat clears the performance',()=>{
 const g=createBloodGame();g.boss.phase=2;g.boss.state='transition';
 g.blood.t=2.7;const a=bloodAttackMotion(g);
 g.blood.t=3.85;const b=bloodAttackMotion(g);
 assert.equal(a.style,'transfiguration');
 assert.ok(b.wings.lift>a.wings.lift);
 g.status='won';assert.equal(bloodAttackMotion(g).style,'idle');
});
test('scalloped membrane is a closed, spatially curved mesh with valid normals',()=>{
 for(const coarse of [false,true]){
  const geometry=bloodWingWebGeometry(1,{coarse}),pos=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
  assert.ok(pos.count>40);
  geometry.computeBoundingBox();
  assert.ok(geometry.boundingBox.max.z-geometry.boundingBox.min.z>.15);
  assert.ok(geometry.boundingBox.max.x-geometry.boundingBox.min.x>.1);
  assert.ok(geometry.index.count>pos.count);
  for(let i=0;i<pos.count;i++)for(const value of [pos.getX(i),pos.getY(i),pos.getZ(i),normal.getX(i),normal.getY(i),normal.getZ(i)])assert.ok(Number.isFinite(value));
  geometry.dispose();
 }
});
test('hinged wings retain stable mesh count across attack playback and reset',()=>{
 const parent=new THREE.Group(),fluid=createBloodFluid(bloodQuality({coarse:true}));
 const wings=createBloodWings(parent,fluid,bloodQuality({coarse:true}),{reduced:false});
 const g=createBloodGame();g.boss.phase=2;
 let count=0;parent.traverse(o=>{if(o.isMesh)count++;});
 assert.ok(count>30);assert.equal(wings.sides.length,2);
 const c={bones:1,membrane:1,active:false};
 for(let i=0;i<150;i++){
  const id=i%2?'wing':'dive';g.time=i*.016;g.blood.pattern=id;g.blood.t=1.2;g.boss.state='pattern';
  g.blood.hazards=[{age:1.2,warn:1.1,life:.4}];
  wings.update(g,c,.016,bloodAttackMotion(g));
 }
 assert.ok(wings.sides.every(s=>s.pivot.visible&&s.webs.every(w=>w.visible)));
 const after=[];parent.traverse(o=>{if(o.isMesh)after.push(o);});assert.equal(after.length,count);
 assert.ok(Math.abs(wings.sides[0].pivot.rotation.z-wings.sides[1].pivot.rotation.z)>.02);
 wings.clear();assert.equal(wings.sides[0].pivot.rotation.z,0);
 wings.dispose();for(const resource of fluid.resources)resource.dispose();
 assert.deepEqual(disposeScene(parent).errors,[]);
});
test('forearm hinge, fingers and cape follow pose instead of generic casting',()=>{
 const actor=new THREE.Group(),rig=createBloodRegalia(actor,{coarse:true});
 const g=createBloodGame(),c={veins:0};
 const pose=bloodAttackMotion(g);
 pose.arms=[{raise:.2,open:.2,elbow:1,hand:-.4},{raise:1.5,open:1,elbow:-.8,hand:.6}];
 pose.cape=.9;pose.body.lean=.3;pose.body.twist=.5;
 rig.update(g,c,.016,0,pose);
 assert.ok(rig.arms[0].forearm.rotation.x<0);
 assert.ok(rig.arms[1].forearm.rotation.x>0);
 assert.ok(rig.arms[1].arm.rotation.x<rig.arms[0].arm.rotation.x);
 assert.notEqual(rig.arms[0].hand.rotation.x,rig.arms[1].hand.rotation.x);
 assert.deepEqual(disposeScene(actor).errors,[]);
});
test('integrated model plays all patterns without new meshes or broken reuse',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=createBloodGame();
 const count=()=>{let n=0;view.root.traverse(o=>{if(o.isMesh)n++;});return n;};
 const initial=count();g.player.hp=1e9;
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  g.boss.phase=spec.phase;startBloodPattern(g,id);
  const warn=Math.min(...g.blood.hazards.map(h=>h.warn));
  for(const at of [warn*.7,warn,warn+.18,spec.duration-.05]){
   g.blood.t=at;g.time+=.016;
   for(const h of g.blood.hazards)h.age=at;
   view.update(g,.016);
  }
 }
 const after=count();
 assert.equal(after,initial,'animation constructed new render meshes per frame');
 view.clear();view.update(createBloodGame(),.016);
 view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
