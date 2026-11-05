import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {bloodAttackMotion,createBloodMotionDirector} from '../src/blood-attack-motion.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {createBloodWings} from '../src/blood-wings.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const at=(g,t)=>{g.blood.t=t;g.time=t;for(const h of g.blood.hazards)h.age=t;};
const finite=o=>{
 if(typeof o==='number')assert.ok(Number.isFinite(o));
 else if(o&&typeof o==='object')for(const v of Object.values(o))finite(v);
};
test('all fourteen attacks now have a windup, a timed release, a follow-through and an eased return',()=>{
 for(const [id,spec]of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;g.player.hp=1e8;
  assert.ok(startBloodPattern(g,id));
  const warn=Math.min(...g.blood.hazards.map(h=>h.warn));
  at(g,warn*.72);const before=bloodAttackMotion(g);
  at(g,warn);const impact=bloodAttackMotion(g);
  at(g,warn+.26);const after=bloodAttackMotion(g);
  assert.ok(before.anticipation>.35,id+': missing charged windup');
  assert.ok(impact.release>.3,id+': missing attack release');
  assert.ok(impact.impact>.95,id+': animation not aligned to authoritative warning');
  assert.ok(after.followThrough>.18,id+': no trailing physical motion');
  assert.ok(before.body.lean!==after.body.lean||before.body.twist!==after.body.twist,id);
  assert.equal(after.arms.length,2);
  finite(before);finite(impact);finite(after);
  at(g,spec.duration);
  const end=bloodAttackMotion(g);
  assert.ok(end.weight<.02,id+': pose does not settle before attack completes');
  g.boss.state='recovery';g.blood.recover=spec.recover;
  const recovery=bloodAttackMotion(g);
  assert.ok(recovery.weight<impact.weight,id+': recovery snaps into an attack pose');
 }
});
test('per-hit marker memory follows the combat engine even when hazards are retired',()=>{
 for(const id of ['fountain','rain','pulse','tide','pursuit']){
  const g=createBloodGame();g.boss.phase=BLOOD_PATTERNS[id].phase;
  startBloodPattern(g,id);
  const times=[...new Set(g.blood.hazards.map(h=>h.warn))].sort((a,b)=>a-b);
  assert.ok(times.length>1);
  const director=createBloodMotionDirector();
  at(g,0);director.update(g,.016); // capture the authoritative complete warning schedule
  const seen=[];
  times.forEach((warn,i)=>{
   // Retire every earlier hazard, as the battle loop does.
   g.blood.hazards=g.blood.hazards.filter(h=>h.warn>=warn-.0001);
   at(g,warn);
   const p=director.update(g,.016);seen.push(p.beatIndex);
   assert.equal(p.beatIndex,i,id+': cue '+i+' detached from its warning');
   assert.ok(p.impact>.9,id+': impact '+i+' was lost when hazards expired');
  });
  assert.deepEqual(seen,times.map((_,i)=>i));
  director.reset();at(g,times[0]);assert.ok(Number.isFinite(director.update(g,.016).body.lean));
 }
});
test('render director is dt-robust, pause-safe and blends phase boundaries',()=>{
 const g=createBloodGame();startBloodPattern(g,'burst');
 const director=createBloodMotionDirector();
 let previous=director.update(g,.016);
 for(let t=0;t<2.16;t+=1/120){
  at(g,t);const pose=director.update(g,1/120);
  const jump=Math.abs(pose.body.lean-previous.body.lean);
  assert.ok(jump<.15,'one-frame jump at t='+t+': '+jump);
  finite(pose);previous=pose;
 }
 g.boss.state='recovery';g.blood.recover=BLOOD_PATTERNS.burst.recover;
 const p=director.update(g,.016);
 assert.ok(Math.abs(p.body.lean-previous.body.lean)<.12);
 const frozen=structuredClone(p);
 assert.deepEqual(director.update(g,0),frozen,'pause changed model posture');
 director.reset();
 const idle=director.update(createBloodGame(),.016);
 assert.equal(idle.style,'idle');
 assert.equal(idle.body.lean,0);
});
test('fingers gather before the strike, open on release and follow the wrist',()=>{
 const actor=new THREE.Group(),rig=createBloodRegalia(actor,{coarse:true}),g=createBloodGame();
 startBloodPattern(g,'burst');const warn=g.blood.hazards[0].warn;
 at(g,warn*.7);const prep=bloodAttackMotion(g);
 rig.update(g,{veins:0},.016,0,prep);
 const early=rig.arms[0].fingers[0].rotation.x;
 at(g,warn+.26);rig.update(g,{veins:0},.016,0,bloodAttackMotion(g));
 const late=rig.arms[0].fingers[0].rotation.x;
 assert.ok(early<late-.08,'finger grip did not release ('+early+', '+late+')');
 assert.ok(rig.arms[0].fingers.every(f=>f.parent===rig.arms[0].hand));
 assert.deepEqual(disposeScene(actor).errors,[]);
});
test('wings add delayed joint and membrane motion without creating geometry per frame',()=>{
 const parent=new THREE.Group(),quality=bloodQuality({coarse:true}),fluid=createBloodFluid(quality);
 const wings=createBloodWings(parent,fluid,quality),g=createBloodGame();
 g.boss.phase=2;startBloodPattern(g,'wing');
 const marker=g.blood.hazards[0].warn;
 const count=()=>{let n=0;parent.traverse(o=>{if(o.isMesh)n++;});return n;};
 const before=count();
 for(let i=0;i<100;i++){
  const t=Math.max(0,marker-.2+i*.006);at(g,t);
  const pose=bloodAttackMotion(g);
  wings.update(g,{bones:1,membrane:1,active:false},.016,pose);
 }
 assert.equal(count(),before);
 assert.ok(wings.sides.every(s=>s.webs.some(web=>Math.abs(web.rotation.x)>.001)));
 for(const s of wings.sides)for(const joint of [s.pivot,s.elbow,s.wrist])finite(joint.rotation.toArray());
 wings.clear();wings.dispose();for(const resource of fluid.resources)resource.dispose();
 assert.deepEqual(disposeScene(parent).errors,[]);
});
