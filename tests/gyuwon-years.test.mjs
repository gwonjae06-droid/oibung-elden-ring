import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {GYUWON_PATTERNS,hazardContains} from '../src/gyuwon-data.mjs';
import {
 GYUWON_YEAR_SECONDS,GYUWON_EXAM_SUBJECTS,GYUWON_SUBJECT_SECONDS,
 gyuwonYearRoster,gyuwonYearTitle,gyuwonMapInterval,resolveGyuwonExamGrade
} from '../src/gyuwon-years.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';

const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120);};
const annual=()=>{const g=createGyuwonGame('sword',{yearMode:true,seed:19});g.player.invuln=1000;return g;};
function nextExam(g){
 const e=g.gyuwon.years;
 e.mode='combat';e.cast=null;e.recover=0;e.season=GYUWON_YEAR_SECONDS;
 g.boss.state='recovery';g.gyuwon.hazards.length=0;
 stepGyuwon(g,.025);return e;
}

test('live D-365 mode replaces all old phase-locked attack pools',()=>{
 const g=annual(),e=g.gyuwon.years;
 assert.equal(e.year,1);assert.equal(e.day,365);assert.equal(gyuwonYearTitle(1),'현역');
 assert.equal(gyuwonYearTitle(2),'재수');assert.equal(gyuwonYearTitle(11),'11수');
 assert.equal(g.boss.phase,1);
 e.recover=0;stepGyuwon(g,.03);
 assert.ok(gyuwonYearRoster(1).includes(e.cast));
 assert.ok(g.gyuwon.pattern.startsWith('year-'));
 assert.equal(Object.hasOwn(GYUWON_PATTERNS,g.gyuwon.pattern),false);
 assert.equal(g.gyuwon.phasePending,false);
});

test('the 365-day timer expires into five sequential exams, never a mid-cast interruption',()=>{
 const g=annual(),e=g.gyuwon.years;
 e.recover=0;stepGyuwon(g,.03);
 const first=e.cast;
 e.season=GYUWON_YEAR_SECONDS;stepGyuwon(g,.05);
 assert.equal(e.cast,first);
 assert.equal(e.day,0);
 advance(g,5.8);
 assert.equal(e.mode,'exam');assert.equal(e.subjectLabel,'국어');
 assert.equal(GYUWON_EXAM_SUBJECTS.join(','),'국어,수학,영어,한국사,탐구');
 advance(g,GYUWON_SUBJECT_SECONDS+.05);
 assert.equal(e.subjectLabel,'수학');
 assert.ok(g.gyuwon.hazards.every(h=>h.warn>=.5));
});

test('incoming damage during exam is 50% and other years retain ordinary damage',()=>{
 const g=annual();nextExam(g);
 assert.equal(g.gyuwon.years.mode,'exam');
 const before=g.boss.hp;
 assert.equal(damageGyuwon(g,120),60);
 assert.equal(g.boss.hp,before-60);
 const other=annual();assert.equal(damageGyuwon(other,120),120);
});

test('outcomes follow 10/50/40 boundaries and maxHP percentages',()=>{
 const sample=[{r:0,grade:'great',delta:.10},{r:.09999,grade:'great',delta:.10},
  {r:.10,grade:'normal',delta:.05},{r:.59999,grade:'normal',delta:.05},
  {r:.60,grade:'failure',delta:-.05},{r:.999,grade:'failure',delta:-.05}];
 for(const item of sample){
  const g=annual();g.boss.hp=g.boss.maxHp*.5;
  const result=resolveGyuwonExamGrade(g,item.r);
  assert.equal(result.result,item.grade);
  assert.equal(result.delta,g.boss.maxHp*item.delta);
  assert.equal(g.boss.hp,g.boss.maxHp*(.5+item.delta));
 }
 const capped=annual();capped.boss.hp=capped.boss.maxHp*.98;
 resolveGyuwonExamGrade(capped,0);
 assert.equal(capped.boss.hp,capped.boss.maxHp);
});

test('grade recovery resets D-365 and advances one academic year',()=>{
 const g=annual();nextExam(g);
 resolveGyuwonExamGrade(g,.4);
 advance(g,3.83);
 assert.equal(g.gyuwon.years.year,2);
 assert.equal(g.gyuwon.years.day,365);
 assert.equal(g.gyuwon.years.mode,'combat');
 assert.ok(g.gyuwon.years.bannerUntil>g.time);
});

test('retake rosters match each requested distinct transformation',()=>{
 assert.deepEqual(gyuwonYearRoster(1),['bike','scooter','smoke']);
 assert.ok(gyuwonYearRoster(2).includes('workbook'));
 assert.ok(gyuwonYearRoster(2).includes('scooter'));
 assert.deepEqual(gyuwonYearRoster(3),['letters','bookfall','flame']);
 assert.deepEqual(gyuwonYearRoster(4),['sniper','archery','crossfire']);
 assert.deepEqual(gyuwonYearRoster(5),['sewageThrow','sewageWave','sewageBomb']);
 assert.ok(gyuwonYearRoster(6).includes('figures'));
 assert.ok(gyuwonYearRoster(7).includes('donation'));
 assert.ok(gyuwonYearRoster(8).includes('octoStrike'));
 assert.deepEqual(gyuwonYearRoster(9),['recall']);
 assert.deepEqual(gyuwonYearRoster(10),['recallMix']);
 assert.deepEqual(gyuwonYearRoster(11),['recallAll']);
 assert.deepEqual(gyuwonYearRoster(23),['recallAll']);
 assert.ok(gyuwonMapInterval(10)<gyuwonMapInterval(9));
 assert.ok(gyuwonMapInterval(11)<gyuwonMapInterval(10));
 assert.ok(gyuwonMapInterval(20)>=1.5);
});

test('fifth-year physical sewage wave shares its safe gap with collision logic',()=>{
 const g=annual(),e=g.gyuwon.years;e.year=5;e.recover=0;
 // The fifth-year shuffle eventually casts each attack once.
 const seen=new Set();
 for(let i=0;i<3;i++){
  e.recover=0;e.cast=null;g.boss.state='recovery';stepGyuwon(g,.03);
  seen.add(e.cast);
  if(e.cast==='sewageWave'){
   const h=g.gyuwon.hazards.find(v=>v.shape==='wave');
   assert.ok(h);
   h.age=h.warn+2.5;
   const z=h.z+(h.age-h.warn)*h.speed;
   assert.equal(hazardContains(h,{x:h.gap,z}),false);
   assert.equal(hazardContains(h,{x:h.gap+h.opening+2,z}),true);
  }
  e.cast=null;
 }
 assert.ok(seen.has('sewageWave'));
});

test('the fourth year stays exclusively sniper/bow, and the eighth has eight armed segments',()=>{
 const g=annual(),e=g.gyuwon.years;e.year=4;e.recover=0;
 stepGyuwon(g,.03);
 assert.ok(['sniper','archery','crossfire'].includes(e.cast));
 assert.ok(g.gyuwon.hazards.every(h=>h.warn>=1));
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 e.year=8;g.boss.state='recovery';e.cast=null;e.recover=0;
 stepGyuwon(g,.03);
 fx.update(g);assert.ok(stage.getObjectByName('gyuwon-eight-octopus-arms'));
 assert.equal(fx.stats().tentacles,8);
 fx.dispose();
 assert.equal(stage.getObjectByName('gyuwon-dday-examination-world'),undefined);
});

test('ninth through eleventh years use real maps and combined hazards',()=>{
 const g=annual(),e=g.gyuwon.years;e.year=8;e.mode='result';e.gradeT=3.75;
 stepGyuwon(g,.025);assert.equal(e.year,9);
 assert.equal(g.boss.phase,3);assert.ok(g.gyuwon.stageMemory);
 e.recover=0;stepGyuwon(g,.025);
 assert.equal(e.cast,'recall');
 const firstMap=g.gyuwon.stageMemory;
 e.mapClock=gyuwonMapInterval(e.year);e.cast=null;e.recover=1;
 stepGyuwon(g,.025);
 assert.notEqual(g.gyuwon.stageMemory,firstMap);
 e.year=11;e.recover=0;e.cast=null;
 stepGyuwon(g,.025);
 assert.equal(e.cast,'recallAll');
 assert.ok(g.gyuwon.hazards.some(h=>h.shape==='wave'));
 assert.ok(g.gyuwon.hazards.some(h=>h.visual==='sword'));
 assert.ok(g.gyuwon.hazards.every(h=>h.warn>=.85));
});

test('legacy engine fixtures remain isolated, while the published encounter uses yearMode',()=>{
 const legacy=createGyuwonGame('sword');
 assert.equal(legacy.gyuwon.years,undefined);
 const modern=annual();
 assert.equal(modern.gyuwon.years.mode,'combat');
});
