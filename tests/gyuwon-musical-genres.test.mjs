import {GYUWON_PERFORMANCE_ROUTE as ROUTE,gyuwonNextPerformance} from '../src/gyuwon-musical-route.mjs';
import {GYUWON_SONGS} from '../src/gyuwon-song-data.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,actGyuwon,stepGyuwon,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {annualFloor,annualFloorForYear} from '../src/gyuwon-annual-progress.mjs';
import {GYUWON_MUSICAL_ACTS,isGyuwonMusicalYear} from '../src/gyuwon-musical-genres.mjs';
import {applyGyuwonPlayerDamage,gyuwonPlayerHpFloor} from '../src/gyuwon-ending-survival.mjs';
import {gyuwonMasterScene,gyuwonMasterRhythmNotes,gyuwonVerifiedMasterAccents} from '../src/gyuwon-master-director.mjs';
import {gyuwonFinaleMemoryPhase} from '../src/gyuwon-musical-genres.mjs';

const advance=(g,seconds,keys={})=>{
 for(let i=0;i<Math.ceil(seconds*60)&&g.status==='playing';i++)
  stepGyuwon(g,1/60,keys);
};
function at(year=5){
 const g=createGyuwonGame('sword',{yearMode:true,seed:2034+year});
 const e=g.gyuwon.years;e.year=year;e.mode='combat';e.day=300;
 stepGyuwon(g,1/60);
 assert.equal(e.mode,'musical');
 assert.equal(e.musical.year,year);
 assert.equal(e.cast,null);
 assert.deepEqual(g.gyuwon.hazards,[]);
 e.musical.transition=0;const a=e.musical.entry;g.player.x=a.tx;g.player.z=a.tz;g.boss.x=a.btx;g.boss.z=a.btz;g.boss.hp=year===5?6000:({6:5300,7:4600,8:3900,9:3200,10:2500,11:1800})[year];g.player.invuln=0;
 return g;
}
test('first four exam years remain original, seven white stage acts have distinct colors',()=>{
 const g=createGyuwonGame('sword',{yearMode:true});
 assert.equal(g.gyuwon.years.year,1);
 assert.equal(g.gyuwon.years.mode,'combat');
 assert.equal(isGyuwonMusicalYear(4),false);
 assert.equal(isGyuwonMusicalYear(5),true);
 assert.deepEqual(Object.keys(GYUWON_MUSICAL_ACTS),['5','6','7','8','9','10','11']);
 assert.equal(new Set(Object.values(GYUWON_MUSICAL_ACTS).map(x=>x.color)).size,7);
 for(const year of [5,6,7,8,9,10,11]){
  const one=at(year);
  assert.equal(one.gyuwon.space,'white');
  assert.equal(one.boss.phase,2);
  assert.equal(one.gyuwon.years.mode,'musical');
 }
});
// Genre contact and control regressions live in gyuwon-reference-games.test.mjs.
test('songs own exact HP targets and cannot be skipped by direct damage or DoT',()=>{
 const g=at(5),e=g.gyuwon.years;g.player.invuln=1e6;g.stats.damage=77;
 const targets=Object.fromEntries(ROUTE.map(y=>[y,GYUWON_SONGS[y].target]));
 for(const year of ROUTE){
  const m=e.musical,hp=g.boss.hp;assert.equal(e.year,year);
  assert.equal(damageGyuwon(g,1e9),0);assert.equal(damageGyuwon(g,1e9,null,{dot:true}),0);
  advance(g,2);assert.equal(g.boss.hp,hp);
  m.clock={source:'media',time:4,duration:48,ended:true};advance(g,1.2);
  assert.equal(g.boss.hp,targets[year]);assert.equal(g.stats.damage,77);
 }
 assert.equal(e.mode,'curtain');assert.equal(actGyuwon(g,'light'),false);
 advance(g,30);assert.equal(g.status,'playing');assert.equal(g.boss.hp,800);
 // Original 3-minute ending replaces the old 45-second edited master.
 advance(g,151);assert.equal(g.status,'won');assert.equal(g.boss.hp,0);
 assert.equal(g.events.filter(e=>e.type==='victory').length,1);
});
test('removed act skip cannot advance a performance or alter boss HP',()=>{
 for(const year of ROUTE){
  const g=at(year),e=g.gyuwon.years,m=e.musical;
  m.clock={source:'media',time:0,duration:180,ended:false};
  const hp=g.boss.hp;
  assert.equal(actGyuwon(g,'skip-act'),false);
  m.skipRequested=true; // Stale flags cannot bypass the song clock either.
  advance(g,.05);
  assert.equal(e.year,year);assert.equal(e.mode,'musical');
  assert.equal(g.boss.hp,hp);
 }
});
test('a stalled media clock freezes every genre and song ended is idempotent',()=>{
 for(let year=5;year<=11;year++){
  const g=at(year),m=g.gyuwon.years.musical;g.player.invuln=1e6;
  m.clock={source:'media',time:m.time,duration:48,ended:false};const time=m.time;
  advance(g,3);assert.equal(m.time,time);assert.equal(g.gyuwon.years.year,year);
  m.clock.time=48;advance(g,4);assert.equal(g.gyuwon.years.year,year,'duration alone must not advance');
 }
});
test('all 7000 HP are accounted for and prologue cannot spend more than 250 per year',()=>{
 const g=createGyuwonGame('sword',{yearMode:true});assert.equal(g.boss.hp,7000);
 assert.deepEqual(Array.from({length:11},(_,i)=>annualFloorForYear(g,i+1)),[6750,6500,6250,6000,5300,4600,3900,3200,2500,1800,800]);
 for(let y=1;y<=4;y++){g.gyuwon.years.year=y;g.gyuwon.years.mode='combat';const hp=g.boss.hp;assert.equal(damageGyuwon(g,1e9),250);assert.equal(g.boss.hp,hp-250);assert.equal(damageGyuwon(g,1e9),0);}
});

test('5수부터 공연 엔딩까지 플레이어 HP는 1 아래로 떨어지지 않는다',()=>{
 for(let year=5;year<=11;year++){
  const g=at(year);g.player.hp=3;
  assert.equal(gyuwonPlayerHpFloor(g),1);
  assert.equal(applyGyuwonPlayerDamage(g,5000),2);
  assert.equal(g.player.hp,1);
  assert.equal(applyGyuwonPlayerDamage(g,5000),0);
  assert.equal(g.player.hp,1);
  assert.equal(g.status,'playing');
 }
});
test('1~4수의 치명적인 피해와 사망 가능성은 그대로 유지된다',()=>{
 const g=createGyuwonGame('sword',{yearMode:true});
 for(let year=1;year<=4;year++){
  g.gyuwon.years.year=year;g.player.hp=2;
  assert.equal(gyuwonPlayerHpFloor(g),0);
  assert.equal(applyGyuwonPlayerDamage(g,9999),2);
  assert.equal(g.player.hp,0);
 }
});
test('5수 턴제 보스에게 반복해서 맞아도 피격 연출은 유지되고 게임이 끝나지 않는다',()=>{
 const g=at(5),m=g.gyuwon.years.musical;
 g.player.hp=2;g.player.invuln=0;
 for(let attack=0;attack<2;attack++){
  m.turn='boss';m.turnActor='enemy1';m.enemyVictim='ally0';
  m.turnElapsed=0;m.raidAttack=null;m.enemyHit=false;g.player.invuln=0;
  advance(g,.02);
  const impact=m.raidAttack.impactAt;
  advance(g,impact+.03);
  assert.equal(g.player.hp,1);
  assert.equal(g.status,'playing');
 }
 const hurts=g.events.filter(e=>e.type==='hurt');
 assert.ok(hurts.length>=2);
 assert.equal(hurts.at(-1).amount,0);
 assert.ok(m.hitFlash>=0);
 assert.equal(g.events.some(e=>e.type==='death'),false);
 assert.equal(g.events.some(e=>e.type==='healed'),false);
});
test('6수 낙하는 피해를 주지만 11수 커튼콜은 피격 패턴이 없다',()=>{
 const runner=at(6),r=runner.gyuwon.years.musical;
 runner.player.hp=2;runner.player.invuln=0;r.platforms=[];r.jumpY=-5.4;r.jumpV=-2;
 advance(runner,.05);
 assert.equal(runner.player.hp,1);
 assert.equal(runner.status,'playing');
 const finale=at(11),m=finale.gyuwon.years.musical;
 finale.player.hp=1;finale.player.invuln=0;
 m.finaleHazards=[{id:1,kind:'star',x:0,z:5,wind:1.5,age:1.49,hit:false,radius:2.3}];
 advance(finale,.05);
 assert.equal(finale.player.hp,1);
 assert.equal(finale.status,'playing');
 assert.deepEqual(m.finaleHazards,[]);
 assert.equal(finale.events.some(e=>e.type==='hurt'),false);
 m.finishing=true;finale.gyuwon.years.mode='curtain';m.clock=null;
 advance(finale,.2);
 assert.equal(finale.player.hp,1);
 assert.equal(finale.status,'playing');
});
test('original masters drive authored sections and traceable excerpt-derived rhythm cues',()=>{
 assert.equal(gyuwonMasterScene(6,96).kind,'quiet');
 assert.equal(gyuwonMasterScene(6,115).kind,'sunrise');
 assert.equal(gyuwonMasterScene(7,118).kind,'lonely');
 assert.equal(gyuwonMasterScene(10,134).kind,'carrier');
 assert.equal(gyuwonMasterScene(11,144).kind,'grand-chorus');
 assert.equal(gyuwonFinaleMemoryPhase(102),3);
 assert.equal(gyuwonFinaleMemoryPhase(125),5);
 const notes=gyuwonMasterRhythmNotes(11),verified=gyuwonVerifiedMasterAccents(11);
 assert.ok(verified.length>0);
 assert.ok(notes.some(n=>n.source==='source-excerpt'));
 assert.ok(notes.some(n=>n.source==='guide-grid'));
 assert.ok(notes.every(n=>n.at>0&&n.at<180));
 assert.ok(notes.every((n,i)=>i===0||n.at>notes[i-1].at));
});
test('11수 is a noncombat curtain call that becomes credits halfway through the music',()=>{
 const g=at(11),m=g.gyuwon.years.musical;
 const hp=g.player.hp,bossHp=g.boss.hp;
 assert.equal(actGyuwon(g,'light'),false);
 assert.equal(actGyuwon(g,'roll'),false);
 assert.equal(actGyuwon(g,'skill'),false);
 m.clock={source:'media',duration:180,time:26,ended:false};
 advance(g,.05);
 assert.equal(m.curtainCall.actor,'oslu');
 assert.equal(m.curtainCall.mode,'recollection');
 assert.equal(g.player.x,0);
 assert.equal(g.player.z,5);
 m.clock.time=104;
 advance(g,.05);
 assert.equal(m.curtainCall.mode,'credits');
 assert.equal(m.curtainCall.actorIndex,-1);
 assert.equal(g.boss.hp,bossHp);
 assert.equal(g.player.hp,hp);
 assert.deepEqual(m.finaleHazards,[]);
 assert.equal(g.events.some(e=>e.type==='hurt'),false);
});
