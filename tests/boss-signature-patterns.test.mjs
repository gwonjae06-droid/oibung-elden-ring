import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginSequence,step,PHASE_ONE,SEQUENCES,PATTERNS as KWON_PATTERNS} from '../src/combat.mjs';
import {createClownGame,stepClown,startClownPattern,PATTERNS as CLOWN_PATTERNS} from '../src/clown-combat.mjs';
import {GIANT_NAMES,FERAL_NAMES,giantPattern,giantHeadPose,giantHazards,hazardContains,handCanAttack} from '../src/dice-giant.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardContains as bloodHazardContains} from '../src/blood-data.mjs';
import {BLOOD_ATTACK_GESTURES,bloodAttackMotion} from '../src/blood-attack-motion.mjs';
import {BLOOD_SPELL_FORMS} from '../src/blood-spell-fx.mjs';
import {BLOOD_ATTACK_SOUNDS} from '../src/blood-foley.mjs';

const kwonNew={1:['counterDancer','skyJudge'],2:['falseExecution','jawSnare','doubleMoon','windParry']};
for(const phase of [1,2])for(const name of kwonNew[phase])test('Kwon '+name+' plays every visible sword swing and ends punishable',()=>{
 const g=createGame('sword',{register:false});g.boss.phase=phase;g.player.invuln=1e7;
 const seq=(phase===1?PHASE_ONE:SEQUENCES)[name];assert.ok(seq.length>=3);
 beginSequence(g,name);const seen=[g.boss.pattern];let last=g.boss.attackId;
 for(let i=0;i<2200&&!g.boss.punishable;i++){
  step(g,.01);if(g.boss.attackId!==last){last=g.boss.attackId;seen.push(g.boss.pattern);}
 }
 assert.deepEqual(seen,seq);
 assert.ok(g.boss.punishable);
 assert.ok(g.boss.recovery>=.8);
 assert.ok(seq.every(k=>KWON_PATTERNS[k]?.wind>0));
});

const clownNew=['mirrorStage','trapdoorWaltz','grandEncore','invertedApplause'];
for(const name of clownNew)test('Clown '+name+' has bodily warning, bounded danger and a genuine counter window',()=>{
 const phase=name==='grandEncore'||name==='invertedApplause'?2:1;
 const g=createClownGame('sword',{register:false});g.boss.phase=phase;
 g.player.hp=g.player.maxHp=1e7;g.player.invuln=1e7;
 startClownPattern(g,name);const def=CLOWN_PATTERNS[name];let hazard=false,recovery=false;
 for(let i=0;i<Math.ceil((def.dur+.1)*100);i++){
  stepClown(g,.01);
  recovery||=g.clown.punish;
  for(const z of g.clown.zones){
   hazard=true;assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z)&&z.warn>=.6);
   assert.ok(z.shape!=='circle'||z.r>0);
  }
 }
 assert.ok(hazard,name+' missing physical telegraph');
 assert.ok(recovery,name+' missing player counter');
 assert.equal(g.clown.state,'idle');
});

test('Park Sungwon controlled stage has 14 authorized attacks while feral phase retains 16',()=>{
 assert.equal(GIANT_NAMES.length,14,'removed controlled attacks must not return');assert.equal(FERAL_NAMES.length,16);
 for(const [feral,indices]of [[false,[9,10]],[true,[10,11]]]){
  for(const slot of indices){
   const p=giantPattern(slot,{x:8,z:-41},feral?'feral':'controlled',.23);
   assert.equal(p.slot,slot);assert.ok(p.name);
   assert.ok(p.hazards.length>=3);
   assert.ok(p.hazards.every(h=>Number.isFinite(h.x)&&Number.isFinite(h.z)&&h.warn>=.7&&h.damage>0));
   assert.ok(p.duration>=Math.max(...p.hazards.map(h=>h.start+h.warn)));
   if(slot===11&&feral)assert.ok(p.hazards.every(h=>h.headSlam));
   else assert.ok(p.hazards.every(h=>Number.isInteger(h.handIndex)));
   const g={player:{x:8,z:-41},boss:{phase:feral?3:2,maxHp:3000,hp:1000},
    dice:{giant:{state:'attack',temperament:feral?'feral':'controlled',slot,t:0,
      hazards:p.hazards,destroyed:[false,false],revive:[0,0]}}};
   let sawSafe=false;
   for(let t=0;t<p.duration;t+=.2){
    g.dice.giant.t=t;
    const active=giantHazards(g).filter(h=>h.live);
    if(active.length){
     const safe=[[-50,45],[50,45],[0,45],[-40,-15],[40,-15]]
       .some(([x,z])=>active.every(h=>!hazardContains(h,{x,z})));
     sawSafe||=safe;
    }
   }
   assert.ok(sawSafe,'no safe area for '+p.name);
  }
 }
});

test('feral new triple head slam moves the real torso/head without stretching the neck',()=>{
 const p=giantPattern(11,{x:0,z:-45},'feral',.2);
 const g={dice:{giant:{state:'attack',temperament:'feral',slot:11,t:.2,hazards:p.hazards}}};
 const first=giantHeadPose(g);g.dice.giant.t=1.45;const after=giantHeadPose(g);
 assert.ok([first.x,first.y,first.z,after.x,after.y,after.z].every(Number.isFinite));
 assert.notDeepEqual([first.x,first.y,first.z],[after.x,after.y,after.z]);
});

const bloodNew={1:['bloodScissors','heartCage'],2:['wingShear','rosary']};
for(const phase of [1,2])for(const id of bloodNew[phase])test('Baeseojun '+id+' has an animated spell, explicit impact markers and safe recovery',()=>{
 const spec=BLOOD_PATTERNS[id];
 assert.equal(spec.phase,phase);assert.ok(BLOOD_ATTACK_GESTURES[id]);assert.ok(BLOOD_SPELL_FORMS[id]);assert.ok(BLOOD_ATTACK_SOUNDS[id]);
 const g=createBloodGame('sword',{seed:7});g.boss.phase=phase;
 g.player.hp=g.player.maxHp=1e7;g.player.invuln=1e7;
 assert.equal(startBloodPattern(g,id),true);
 assert.ok(g.blood.hazards.length>=2);
 assert.ok(g.blood.hazards.every(h=>h.warn>=1&&h.warn+h.life<spec.duration));
 const markers=g.blood.hazards.map(h=>h.warn);
 assert.ok(markers.some(h=>h>2),'multi-beat spell should not be an instant shot');
 const pose=bloodAttackMotion(g);assert.equal(pose.style,BLOOD_ATTACK_GESTURES[id].style);
 for(let t=0;t<spec.duration+.01;t+=.01)stepBlood(g,.01);
 assert.equal(g.boss.state,'recovery');
 assert.equal(g.blood.hazards.length,0);
 assert.equal(g.blood.elevation,0);
});
test('expanded Blood pools retain signature openers and 13/14 attacks by phase',()=>{
 for(const phase of [1,2]){
  assert.equal(bloodPool(phase).length,phase===1?13:14);
  assert.ok(bloodNew[phase].every(id=>bloodPool(phase).includes(id)));
 }
});
