import test from 'node:test';
import assert from 'node:assert/strict';
import {ACT_FIVE_SCORE,actFivePerformanceAt,actFiveAttackProfile,actFiveAttackPoint} from '../src/gyuwon-act-five-score.mjs';
import {GYUWON_ALIGNED_CAPTIONS} from '../src/gyuwon-aligned-captions.mjs';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
const advance=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120);};
const at=t=>{const g=createGyuwonGame('sword',{yearMode:true});g.gyuwon.years.year=5;g.boss.hp=6000;stepGyuwon(g,.008);const m=g.gyuwon.years.musical;m.transition=0;m.clock={source:'media',time:t,duration:179.95,ended:false};stepGyuwon(g,.016);m.clock=null;return {g,m};};
test('every sung phrase uses the aligned original clock and new phrases take priority over old tails',()=>{
 assert.equal(ACT_FIVE_SCORE.length,GYUWON_ALIGNED_CAPTIONS[5].length);
 for(const [i,cue]of GYUWON_ALIGNED_CAPTIONS[5].entries()){const p=actFivePerformanceAt(cue.start+.32);assert.equal(p.index,i);assert.equal(p.start,cue.start);assert.equal(p.end,cue.end);assert.ok(p.weight>.99);}
 assert.equal(actFivePerformanceAt(28).gesture,'king');assert.equal(actFivePerformanceAt(43).gesture,'brass');assert.equal(actFivePerformanceAt(71).gesture,'hand');assert.equal(actFivePerformanceAt(105).pattern,'breather');
});
test('the greeting performs during the opening entrance while combat remains gated',()=>{const g=createGyuwonGame('sword',{yearMode:true});g.gyuwon.years.year=5;stepGyuwon(g,.01);const m=g.gyuwon.years.musical;advance(g,4.8);assert.ok(m.transition>0);assert.equal(m.songPerformance.gesture,'welcome');assert.ok(m.songPerformance.weight>.9);assert.ok(m.enemies[0].x< -14);assert.ok(m.enemies[1].y>4);assert.equal(m.raidAttack,null);});
test('all lyric patterns have a visible windup and converge exactly on their real contact point',()=>{
 const from={x:-20,y:23,z:-18},to={x:9,y:1.8,z:11};
 for(const t of [14,20.5,28,31.5,43,54.5,58,71,91,113.5,140])for(const part of [0,2]){const p=actFiveAttackProfile(t,part);assert.ok(p.wind>=1.3);assert.ok(p.impactAt>p.wind+.6);const held=actFiveAttackPoint(p,from,to,p.wind*.4);assert.equal(held.z,from.z);const hit=actFiveAttackPoint(p,from,to,p.impactAt);for(const axis of ['x','y','z'])assert.ok(Math.abs(hit[axis]-to[axis])<1e-7);}
});
test('brass fan keeps its chosen profile across the next lyric and hits three victims only at contact',()=>{
 const {g,m}=at(43);m.turn='boss';m.turnActor='enemy2';m.enemyVictim='ally0';m.raidAttack=null;const hp=m.party.map(p=>p.hp);
 advance(g,.5);assert.equal(m.raidAttack.kind,'fan');assert.equal(m.raidAttack.shots.length,3);assert.deepEqual(m.party.map(p=>p.hp),hp);
 advance(g,1.55);assert.equal(m.songPerformance.gesture,'costume');assert.equal(m.raidAttack.kind,'fan');assert.deepEqual(m.party.map(p=>p.hp),hp);
 advance(g,.3);assert.deepEqual(m.party.map(p=>p.hp),hp.map((v,i)=>v-(i<3?12:0)));const after=m.party.map(p=>p.hp);advance(g,.2);assert.deepEqual(m.party.map(p=>p.hp),after);
});
test('the laugh lyric gives a recovery opportunity instead of an untelegraphed new attack',()=>{const {g,m}=at(104);m.turn='boss';m.turnActor='enemy2';m.raidAttack=null;const hp=m.party.map(p=>p.hp);advance(g,.05);assert.equal(m.raidAttack,null);assert.deepEqual(m.party.map(p=>p.hp),hp);assert.equal(g.boss.hp,6000);});
test('the audio clock freeze holds both lyric pose and an in-flight patterned attack',()=>{const {g,m}=at(91);m.turn='boss';m.turnActor='enemy2';m.enemyVictim='ally0';advance(g,.6);const snapshot={time:m.time,age:m.raidAttack.age,gesture:m.songPerformance.gesture,shots:m.raidAttack.shots.map(s=>({...s}))};m.clock={source:'media',time:m.time,duration:179.95,ended:false};advance(g,1);assert.equal(m.time,snapshot.time);assert.equal(m.raidAttack.age,snapshot.age);assert.equal(m.songPerformance.gesture,snapshot.gesture);assert.deepEqual(m.raidAttack.shots,snapshot.shots);});
