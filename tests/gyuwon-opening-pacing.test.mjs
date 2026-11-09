import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,damageGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_MUSICAL_TOTAL_HP,GYUWON_MUSICAL_ENDING_HP,
 GYUWON_OPENING_YEAR_HP,GYUWON_MUSICAL_ACT_HP,
 annualFloor,annualFloorForYear,syncAnnualHealth} from '../src/gyuwon-annual-progress.mjs';
import {GYUWON_LIVE_SUBJECT_SECONDS,GYUWON_LIVE_RESULT_SECONDS,
 resolveGyuwonExamGrade} from '../src/gyuwon-years.mjs';

const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*60);i++)
 if(g.status==='playing')stepGyuwon(g,1/60);};
const create=()=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:2542});
 g.player.invuln=10000;
 return g;
};
test('live Gyuwon total HP is 6000; years 1-4 consume exactly 1000 in four 250-HP milestones',()=>{
 const g=create();
 assert.equal(g.boss.maxHp,GYUWON_MUSICAL_TOTAL_HP);
 assert.equal(g.boss.maxHp,6000);
 assert.equal(GYUWON_OPENING_YEAR_HP,250);
 for(let year=1;year<=4;year++){
  assert.equal(annualFloorForYear(g,year),6000-year*250);
 }
 assert.equal(annualFloorForYear(g,4),5000);
 for(let year=5;year<=11;year++){
  assert.equal(annualFloorForYear(g,year),5000-(year-4)*GYUWON_MUSICAL_ACT_HP);
 }
 assert.equal(annualFloorForYear(g,11),GYUWON_MUSICAL_ENDING_HP);
});
test('short live exams are under three seconds including grade reveal',()=>{
 assert.ok(GYUWON_LIVE_SUBJECT_SECONDS*5+GYUWON_LIVE_RESULT_SECONDS<3);
 assert.ok(GYUWON_LIVE_SUBJECT_SECONDS>0.2);
});
test('all random grade outcomes have zero HP effect and no deferred overflow',()=>{
 for(const [random,grade]of [[0,'great'],[.42,'normal'],[.99,'failure']]){
  const g=create(),e=g.gyuwon.years;
  g.boss.hp=annualFloor(g);
  e.mode='exam';
  e.damageBank=0;
  const hp=g.boss.hp;
  const answer=resolveGyuwonExamGrade(g,random);
  assert.equal(answer.result,grade);
  assert.equal(answer.delta,0);
  assert.equal(g.boss.hp,hp);
  assert.equal(e.damageBank,0);
  assert.equal(e.resultScene.duration,GYUWON_LIVE_RESULT_SECONDS);
  assert.equal(e.mode,'result');
 }
});
test('final exam subject cannot restore boss HP and attacks cannot lower HP during exam',()=>{
 const g=create(),e=g.gyuwon.years;
 damageGyuwon(g,100000);
 assert.equal(g.boss.hp,5750);
 e.signatureUsed=true;e.cast=null;e.recover=0;e.day=0;
 stepGyuwon(g,.03);
 assert.equal(e.mode,'exam');
 assert.equal(damageGyuwon(g,7777),0);
 advance(g,GYUWON_LIVE_SUBJECT_SECONDS*5+.3);
 assert.equal(e.mode,'result');
 assert.equal(g.boss.hp,5750);
 assert.equal(e.inquiry,null);
});
test('three short exams and fourth-year seamless entry into the musical leave 5000 HP',()=>{
 const g=create(),e=g.gyuwon.years;
 for(let year=1;year<=4;year++){
  assert.equal(e.year,year);
  assert.equal(e.mode,'combat');
  e.cast=null;e.signatureUsed=true;e.recover=0;
  const floor=annualFloor(g);
  const accepted=damageGyuwon(g,100000);
  assert.ok(accepted>0,'year '+year+' must accept health damage');
  assert.equal(g.boss.hp,floor);
  assert.equal(e.damageBank,0);
  syncAnnualHealth(g);
  assert.equal(e.day,0);
  stepGyuwon(g,.03);
  if(year<4){
   assert.equal(e.mode,'exam');
   advance(g,GYUWON_LIVE_SUBJECT_SECONDS*5+.18);
   assert.equal(e.mode,'result');
   assert.equal(g.boss.hp,floor);
   advance(g,GYUWON_LIVE_RESULT_SECONDS+.15);
   assert.equal(e.year,year+1);
   assert.equal(e.mode,'combat');
   assert.equal(g.boss.hp,floor);
  }else{
   assert.equal(e.year,5);
   assert.equal(e.mode,'musical');
   assert.equal(e.grade,null);
   assert.equal(g.boss.hp,5000);
  }
 }
});
