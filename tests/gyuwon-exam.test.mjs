import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,startGyuwonPattern,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_PATTERNS,gyuwonPool,hazardContains} from '../src/gyuwon-data.mjs';
import {GYUWON_EXAM_IDS,GYUWON_EXAM_INTERVAL,dueGyuwonExam} from '../src/gyuwon-exam.mjs';
import {createGyuwonExamView} from '../src/gyuwon-exam-view.mjs';

const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120);};

test('exam clock starts a scheduled test only after an ordinary recovery',()=>{
 const g=createGyuwonGame();g.player.invuln=200;
 assert.equal(g.gyuwon.exam.level,0);
 assert.equal(dueGyuwonExam(g),null);
 g.gyuwon.exam.clock=GYUWON_EXAM_INTERVAL;g.gyuwon.exam.due=true;
 g.gyuwon.recover=.001;advance(g,.03);
 assert.equal(g.gyuwon.pattern,'exam-first');
 assert.equal(g.boss.state,'pattern');assert.equal(g.gyuwon.exam.level,1);
 assert.equal(g.gyuwon.exam.due,false);
 assert.ok(g.gyuwon.hazards.length>=5);
});

test('six attempts advance exactly in order without entering the regular shuffled pattern pools',()=>{
 const g=createGyuwonGame();g.player.invuln=999;
 for(let i=0;i<6;i++){
  g.boss.state='recovery';g.gyuwon.exam.due=true;
  const id=dueGyuwonExam(g);
  assert.equal(id,GYUWON_EXAM_IDS[i]);
  assert.ok(startGyuwonPattern(g,id));
  assert.equal(g.gyuwon.exam.active,i);
  assert.equal(g.gyuwon.exam.level,i+1);
  assert.ok(GYUWON_PATTERNS[id].duration>=4.5);
  if(i!==2)assert.ok(g.gyuwon.hazards.length,id);
  assert.ok(g.gyuwon.hazards.every(h=>h.warn>=1&&h.warn+h.life<=GYUWON_PATTERNS[id].duration+.001),id);
 }
 assert.equal(g.gyuwon.exam.level,6);
 g.gyuwon.exam.due=true;
 assert.equal(dueGyuwonExam(g),GYUWON_EXAM_IDS[5],'a sixth retake remains possible after prolonged combat');
 for(const phase of [1,2,3])for(const space of phase===2?['white','dark']:['white']){
  assert.ok(gyuwonPool(phase,space).every(id=>!GYUWON_EXAM_IDS.includes(id)));
 }
});

test('white-space proof recording is never interrupted by an exam',()=>{
 const g=createGyuwonGame();g.boss.phase=2;g.gyuwon.exam.due=true;
 assert.equal(g.gyuwon.space,'white');
 assert.equal(dueGyuwonExam(g),null);
 g.gyuwon.space='dark';
 assert.equal(dueGyuwonExam(g),'exam-first');
});

test('three-answer exam locks the player's selected region then gives a fresh telegraph',()=>{
 const g=createGyuwonGame();g.player.invuln=100;g.gyuwon.exam.due=true;
 assert.ok(startGyuwonPattern(g,'exam-third'));
 assert.equal(g.gyuwon.hazards.length,0,'selection phase is non-damaging');
 g.player.x+=4;
 advance(g,2.1);
 assert.equal(g.gyuwon.exam.choice,2);
 assert.equal(g.gyuwon.exam.choiceLocked,true);
 assert.equal(g.gyuwon.hazards.length,4);
 assert.ok(g.gyuwon.hazards.every(h=>h.age<h.warn),'selection must not cause instant damage');
});

test('four actual moving bullets preannounce their trajectories and influence the sewage gap',()=>{
 const g=createGyuwonGame();g.player.x=10;g.gyuwon.exam.due=true;
 startGyuwonPattern(g,'exam-shooter');
 const shots=g.gyuwon.hazards;
 assert.equal(shots.length,4);
 assert.deepEqual(shots.map(h=>h.gun),[0,1,2,3]);
 assert.ok(shots.every(h=>h.warn>=1.5&&h.life>1&&Math.hypot(h.vx,h.vz)>20));
 const gapFromGun=g.gyuwon.exam.gunGap;
 startGyuwonPattern(g,'exam-sewage');
 const wave=g.gyuwon.hazards[0];
 assert.equal(wave.shape,'wave');
 assert.ok(Math.abs(wave.gap-gapFromGun)<=3);
 assert.ok(Math.abs(wave.gap-g.player.x)<=3,'escape opening must stay reachable');
 wave.age=wave.warn+2;
 const crestZ=wave.z+(wave.age-wave.warn)*wave.speed;
 assert.equal(hazardContains(wave,{x:wave.gap,z:crestZ}),false);
 assert.equal(hazardContains(wave,{x:wave.gap+wave.opening+1,z:crestZ}),true);
});

test('sewage is a moving 3D wall with the same actual gap; six figurines have distinct props',()=>{
 const stage=new THREE.Group(),view=createGyuwonExamView(stage,{coarse:true});
 const g=createGyuwonGame();g.gyuwon.exam.due=true;
 startGyuwonPattern(g,'exam-sewage');view.update(g);
 const front=stage.getObjectByName('gyuwon-exam-physical-sewage-front');
 assert.ok(front&&front.geometry.isBufferGeometry);
 const z=front.position.z;
 g.gyuwon.hazards[0].age=3.7;view.update(g);
 assert.ok(front.position.z>z,'the wave mesh follows the same moving hazard clock');
 startGyuwonPattern(g,'exam-figurines');view.update(g);
 assert.equal(view.stats().figures,6);
 assert.ok(stage.getObjectByName('gyuwon-six-figurines'));
 view.dispose();
 assert.equal(stage.getObjectByName('gyuwon-six-exam-world'),undefined);
});
