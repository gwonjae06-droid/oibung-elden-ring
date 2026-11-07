import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PATTERNS,createClownGame,choosePattern,startClownPattern,stepClown} from '../src/clown-combat.mjs';
import {HORROR_PATTERNS,horrorMinStage} from '../src/clown-horror-patterns.mjs';
import {createClownNightmareTheatre} from '../src/clown-nightmare-theatre.mjs';
import {createClownNightmareAnatomy} from '../src/clown-nightmare-anatomy.mjs';
import {bossFoleySpec} from '../src/boss-foley-map.mjs';
import {clownDangerSpotlightCue} from '../src/clown-danger-spotlight.mjs';

test('forty-two horror and ensemble routines keep actual windups, recoveries and three-act eligibility',()=>{
 assert.equal(HORROR_PATTERNS.length,42);
 const phase1=HORROR_PATTERNS.filter(k=>PATTERNS[k].phases.includes(1));
 assert.equal(phase1.length,14);
 for(const name of HORROR_PATTERNS){
  const d=PATTERNS[name];
  assert.ok(d,d?.name||name);
  assert.ok(d.precast>=.55,name);
  assert.ok(d.recover>=1.2,name);
  assert.ok(d.dur>d.precast+d.recover+2,name);
  assert.ok([1,2,3].includes(horrorMinStage(name)),name);
 }
 assert.equal(horrorMinStage('curtainNightmare'),3);
 assert.equal(horrorMinStage('clockOfTeeth'),3);
 assert.equal(horrorMinStage('stolenFace'),2);
 assert.equal(horrorMinStage('mouthOfTheAudience'),3);
 assert.equal(horrorMinStage('stageRupture'),3);
});

test('the third horror act starts at 25% HP without disrupting phase-two monster movement',()=>{
 const g=createClownGame('sword',{register:false,seed:91});
 g.boss.phase=2;g.clown.state='idle';g.clown.wait=900;
 g.boss.hp=g.boss.maxHp*.26;stepClown(g,1/120);
 assert.equal(g.clown.horrorStage,2);
 g.boss.hp=g.boss.maxHp*.24;stepClown(g,1/120);
 assert.equal(g.clown.horrorStage,3);
 assert.equal(g.boss.phase,2,'monster simulation remains in its second phase');
 assert.equal(g.events.filter(e=>e.type==='clown-phase3').length,1);
 stepClown(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='clown-phase3').length,1,'no repeated transformation event');
});

for(const name of HORROR_PATTERNS){
 test(name+' never causes unexplained immediate damage, has visible warnings, then a punish window',()=>{
  const g=createClownGame('sword',{register:false,seed:90});
  g.boss.phase=2; // keep the authored phase-two physical rig stable while exercising all attack timelines
  g.boss.hp=g.boss.maxHp*.2;
  g.clown.horrorStage=3;
  const hp=g.player.hp;g.player.invuln=999;
  startClownPattern(g,name);
  assert.equal(g.clown.state,'pattern');
  const def=PATTERNS[name];
  for(let i=0;i<Math.ceil(def.precast*120)-2;i++)stepClown(g,1/120);
  assert.equal(g.clown.zones.length,0,'no zone can materialize before initial windup');
  let warnings=0,recovery=false;
  for(let i=0;i<Math.ceil((def.dur-def.precast+.18)*120);i++){
   stepClown(g,1/120);
   for(const z of g.clown.zones){
    assert.ok(['circle','cone','lane'].includes(z.shape));
    assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.z)&&z.warn>=.55);
    assert.ok(z.damage>=0);
    if(z.state==='warn'&&(z.damage>0||z.visual)){
     warnings++;
     // Swept claw/dash lanes are visually warned and resolve through actual
     // boss motion, rather than a separate damaging floor spotlight.
     if(z.damage>0&&!z.visual)
      assert.equal(clownDangerSpotlightCue(z),true,'actual floor damage must be spotlighted');
    }
   }
   if(g.clown.punish)recovery=true;
  }
  assert.ok(warnings>0,name+' should telegraph some harm');
  assert.equal(g.player.hp,hp,'iframes remain authoritative');
  assert.ok(recovery,'legible punishment window after unsettling attack');
  assert.equal(g.clown.state,'idle');
 });
}

test('spectators, doubles, masks and living shadows render without a single registered collision object',()=>{
 const scene=new THREE.Scene(),fx=createClownNightmareTheatre(scene,{coarse:true,reduced:true});
 assert.ok(fx.root.userData.decorativeOnly);
 assert.deepEqual(fx.stats(),{ghosts:3,masks:5,spectators:8,decorativeOnly:true});
 const g=createClownGame('sword',{register:false});g.clown.horrorStage=3;
 const named=n=>{const a=[];fx.root.traverse(o=>{if(o.name===n)a.push(o);});return a;};
 assert.equal(named('false-clown-stage-double').length,3);
 assert.equal(named('falling-porcelain-audience-mask').length,5);
 assert.equal(named('impossible-silent-audience').length,8);
 assert.equal(named('shadow-that-moves-before-the-clown').length,3);
 g.clown.name='wrongTwin';fx.update(g,.016);
 assert.ok(named('false-clown-stage-double').some(o=>o.visible));
 g.clown.name='emptyAudience';fx.update(g,.016);
 assert.ok(named('impossible-silent-audience').every(o=>o.visible));
 g.clown.name='livingShadow';g.clown.f={shadowLane:{x:0,z:0,yaw:0,len:10}};fx.update(g,.016);
 assert.ok(named('shadow-that-moves-before-the-clown').every(o=>o.visible));
 fx.event({type:'clown-phase3'});
 fx.reset();assert.equal(named('false-clown-stage-double').some(o=>o.visible),false);
 fx.dispose();assert.equal(scene.children.length,0);
});

test('sculpted facial anomalies are drawn on both heads and not on collision sockets',()=>{
 const body=new THREE.Group(),head={group:new THREE.Group()},mount={group:new THREE.Group()};
 const anatomy=createClownNightmareAnatomy(THREE,{body,head,mount});
 assert.equal(anatomy.groupNames.length,2);
 const g=createClownGame('sword',{register:false});
 g.clown.horrorStage=3;
 anatomy.update(g,3.2,true);
 const n=(root,key)=>{let found=0;root.traverse(o=>{if(o.name===key)found++;});return found;};
 assert.equal(n(head.group,'unblinking-unequal-eye'),2);
 assert.equal(n(mount.group,'unblinking-unequal-eye'),2);
 assert.equal(n(head.group,'porcelain-teeth-4'),1);
 assert.equal(n(body,'puppet-shadow-appendage'),4);
 assert.ok(body.children.some(o=>o.rotation.x!==0));
 assert.ok(![...body.children].some(o=>o.userData?.hitbox));
});

test('eerie foley remains sampled recordings with no synthesized 8-bit tones',()=>{
 const g=createClownGame('sword',{register:false});
 for(const cue of ['echo','mask-fall','fold','audience','curtain','teeth-end']){
  const sample=bossFoleySpec({type:'clown-horror',cue},g);
  assert.ok(sample?.file&&(sample.file.endsWith('.mp3')),cue);
  assert.ok(sample.volume<=.25);
 }
 const third=bossFoleySpec({type:'clown-phase3'},g);
 assert.ok(third.file.endsWith('.mp3'));
});
