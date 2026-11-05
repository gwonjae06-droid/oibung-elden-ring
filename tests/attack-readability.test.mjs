import test from 'node:test';
import assert from 'node:assert/strict';
import {kwonReadableWind,clownPrecastTime,clownPrecastPose,giantReadableWarning,
  bloodReadableWarning,READABLE_ATTACK} from '../src/attack-readability.mjs';
import {PATTERNS as KWON,patternConfig,createGame,startPattern,step} from '../src/combat.mjs';
import {PATTERNS as CLOWN,createClownGame,startClownPattern,stepClown} from '../src/clown-combat.mjs';
import {GIANT_NAMES,FERAL_NAMES,giantPattern,giantHazards} from '../src/dice-giant.mjs';
import {DICE_PATTERNS} from '../src/dice-combat.mjs';
import {DICE_RULES} from '../src/dice-data.mjs';
import {diceMotion} from '../src/dice-motion-data.mjs';
import {BLOOD_PATTERNS,bloodPool} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_ATTACK_GESTURES,bloodAttackMotion} from '../src/blood-attack-motion.mjs';
import {CINEMATIC_PROFILES} from '../src/cinematic-graphics.mjs';

test('every Kwon sword swing has a visible windup with no damage before release',()=>{
 for(const phase of [1,2])for(const key of Object.keys(KWON)){
  const g=createGame('sword',{register:false});g.boss.phase=phase;
  g.player.x=g.boss.x;g.player.z=g.boss.z+3;
  startPattern(g,key);
  const warn=patternConfig(g.boss).wind;
  assert.ok(warn>=kwonReadableWind(key,0,phase),key+': no warning');
  const before=g.player.hp;
  for(let t=0;t+0.02<warn-.03;t+=.02)step(g,.02);
  assert.equal(g.boss.state,'windup',key+' struck before windup');
  assert.equal(g.player.hp,before,key+' dealt early damage');
  assert.ok(!g.boss.hit,key+' flagged hit during windup');
 }
});

test('clown stage opens with a real body movement, not damaging props',()=>{
 for(const [key,spec]of Object.entries(CLOWN)){
  for(const phase of spec.phases){
   const g=createClownGame('sword',{register:false});g.boss.phase=phase;
   startClownPattern(g,key);
   assert.equal(spec.precast,clownPrecastTime(key));
   const lead=spec.precast,initial=g.player.hp;
   for(let t=0;t<lead*.75;t+=.02)stepClown(g,.02);
   assert.equal(g.clown.zones.length,0,key+' created dangerous zone before pose');
   assert.equal(g.clown.bombs.length,0,key+' created projectile before pose');
   assert.equal(g.clown.waves.length,0,key+' created wave before pose');
   assert.equal(g.player.hp,initial,key+' early damage');
   const pose=clownPrecastPose(key,lead*.75,lead);
   assert.ok(pose.glove>0||pose.crouch>0||pose.tilt!==0,key+' must physically anticipate');
   assert.ok(spec.dur>lead+spec.recover,key+' no true action time');
  }
 }
});

test('all controlled and feral giant attacks delay real impact and keep post-hit duration',()=>{
 for(const [temperament,count]of [['controlled',GIANT_NAMES.length],['feral',FERAL_NAMES.length]]){
  for(let n=0;n<count;n++){
   const p=giantPattern(n,{x:3,z:-43},temperament,.23);
   assert.ok(p.hazards.length);
   for(const h of p.hazards){
    assert.ok(h.warn>=READABLE_ATTACK.dice.rapid-.001,p.name+': instant giant hit');
    assert.ok(Math.abs(giantReadableWarning(h).warn-h.warn)<1e-8);
    assert.ok(p.duration>=h.start+h.warn+h.active-.0001,p.name+': finishing before impact');
   }
   const g={dice:{giant:{state:'attack',slot:n,t:0,temperament,
    destroyed:[false,false],revive:[0,0],hazards:p.hazards}}};
   const first=Math.min(...p.hazards.map(h=>h.start+h.warn));
   g.dice.giant.t=Math.max(0,first-.02);
   assert.ok(giantHazards(g).every(h=>!h.live),p.name+' hit before impact');
  }
 }
});

test('stage-one die roll and all dice warnings have non-instant visual cues',()=>{
 assert.ok(DICE_RULES.warning>=.9);
 for(const key of ['chargeWarning','jumpWarning','frenzyWarning','chainWarning','pipWarning','pipWarningP2'])
  assert.ok(DICE_PATTERNS[key]>=.8,key);
 for(const [state,length]of [['warning',DICE_RULES.warning],['jump-warning',DICE_PATTERNS.jumpWarning],
  ['pip-warning',DICE_PATTERNS.pipWarning],['charge-warning',DICE_PATTERNS.chargeWarning],
  ['frenzy-windup',1.1]]){
  const early=diceMotion({state,t:.05,warningTime:length,pips:{warn:length}},1);
  const late=diceMotion({state,t:length*.8,warningTime:length,pips:{warn:length}},1);
  assert.ok(late.glow>=early.glow,state);
  assert.ok(late.shake>early.shake,state);
  assert.equal(late.sy,1);assert.equal(late.sxz,1);
 }
});

test('every Blood spell warns before hurt and morphs its real cast gesture',()=>{
 for(const phase of [1,2])for(const id of bloodPool(phase)){
  const spec=BLOOD_PATTERNS[id],g=createBloodGame('sword',{seed:23});
  g.boss.phase=phase;g.player.hp=g.player.maxHp=1e8;
  assert.ok(startBloodPattern(g,id));
  const first=Math.min(...g.blood.hazards.map(h=>h.warn));
  assert.ok(first>=READABLE_ATTACK.blood.spell,id+' first strike too early');
  assert.ok(g.blood.hazards.every(h=>h.warn>=bloodReadableWarning(0)),id);
  assert.ok(g.blood.hazards.every(h=>h.warn+h.life<=spec.duration+.01),id+' impact exceeds animation');
  const before=g.player.hp;
  const count=Math.floor((first-.06)/.01);
  for(let i=0;i<count;i++)stepBlood(g,.01);
  assert.equal(g.player.hp,before,id+' early damage');
  assert.equal(g.boss.state,'pattern',id);
  assert.equal(g.blood.hazards.some(h=>h.fired),false,id+' visual impact fired too early');
  const motion=bloodAttackMotion(g);
  assert.equal(motion.style,BLOOD_ATTACK_GESTURES[id].style);
  assert.ok(motion.weight>0,id+' has no animated charging pose');
 }
});

test('shared physical PBR lighting stays subdued and differentiated from danger overlays',()=>{
 for(const id of ['kwon','clown','dice','blood']){
  assert.ok(CINEMATIC_PROFILES[id].exposure<=1.2);
  assert.ok(CINEMATIC_PROFILES[id].reflection>0&&CINEMATIC_PROFILES[id].reflection<.8);
 }
});
