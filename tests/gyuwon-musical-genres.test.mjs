import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,actGyuwon,stepGyuwon,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {annualFloor,annualFloorForYear} from '../src/gyuwon-annual-progress.mjs';
import {GYUWON_MUSICAL_ACTS,isGyuwonMusicalYear} from '../src/gyuwon-musical-genres.mjs';

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
test('act 5 turn combat takes actual choices, damage, visible hostile windup and guard',()=>{
 const g=at(5),m=g.gyuwon.years.musical,old=g.boss.hp;
 assert.ok(actGyuwon(g,'light'));advance(g,.6);assert.equal(g.boss.hp,old);assert.ok(m.score>0);
 assert.equal(m.turn,'boss');assert.ok(m.turnWind>0);
 assert.ok(actGyuwon(g,'roll'),'defend during the enemy turn');
 const hp=g.player.hp;advance(g,2);
 assert.equal(hp,g.player.hp,'a correct timed guard prevents boss damage');
 assert.equal(m.turn,'player');
});
test('act 6 runner uses jumping and sliding against moving physical obstacles',()=>{
 const g=at(6),m=g.gyuwon.years.musical;
 assert.ok(actGyuwon(g,'roll'));advance(g,.25);
 assert.ok(g.player.floorY>0);
 assert.ok(actGyuwon(g,'skill'));assert.ok(m.slide>0);
 m.runnerSpawn=.01;advance(g,.05);
 assert.ok(m.obstacles.length>=1);
 const x=m.obstacles[0].x;advance(g,.1);assert.ok(m.obstacles[0].x<x);
});
test('act 7 army is resource-gated, units move and can fight each other',()=>{
 const g=at(7),m=g.gyuwon.years.musical;
 assert.ok(actGyuwon(g,'light'));assert.equal(m.units[0].team,1);
 const original=m.money;
 assert.ok(original<75);
 m.enemySpawn=0;advance(g,.06);
 assert.ok(m.units.some(u=>u.team<0));
 const x=m.units[0].x;advance(g,.08);
 assert.ok(m.units[0].x>x);
});
test('act 8 rhythm notes have strict beat input with performance scoring',()=>{
 const g=at(8),m=g.gyuwon.years.musical;
 advance(g,3.4);assert.ok(m.note);m.note.time=0;
 const key=m.note.key,old=g.boss.hp;
 assert.ok(actGyuwon(g,key));assert.equal(g.boss.hp,old);assert.ok(m.score>0);
 assert.ok(m.combo>0);
});
test('act 9 fighting gameplay hits only within real horizontal reach',()=>{
 const g=at(9),m=g.gyuwon.years.musical;
 g.player.x=g.boss.x-2.9;
 const hp=g.boss.hp;
 assert.ok(actGyuwon(g,'light'));advance(g,.5);assert.equal(g.boss.hp,hp);assert.ok(m.score>0);
 const hit=g.boss.hp;
 m.shotCooldown=0;g.player.x=-18;g.boss.x=17;
 assert.ok(actGyuwon(g,'light'));
 assert.equal(g.boss.hp,hit,'outside reach must be an honest miss');
});
test('act 10 twin-stick shooter fires projectiles and warns before enemy volleys',()=>{
 const g=at(10),m=g.gyuwon.years.musical;
 g.player.x=-1;g.player.z=0;g.boss.x=6;g.boss.z=0;
 const old=g.boss.hp;
 assert.ok(actGyuwon(g,'light'));assert.ok(m.bullets.length);
 advance(g,.4);assert.equal(g.boss.hp,old);assert.ok(m.score>0,'actual bullet must contact the boss to score');
 m.enemyWind=.01;advance(g,.05);assert.ok(m.enemyTarget?.wind>=1.05);
 advance(g,1.1);assert.ok(m.enemyShots.length>0);
});

test('songs own exact HP targets and cannot be skipped by direct damage or DoT',()=>{
 const g=at(5),e=g.gyuwon.years;g.player.invuln=1e6;g.stats.damage=77;
 const targets=[5300,4600,3900,3200,2500,1800,800];
 for(let year=5;year<=11;year++){
  const m=e.musical,hp=g.boss.hp;assert.equal(e.year,year);
  assert.equal(damageGyuwon(g,1e9),0);assert.equal(damageGyuwon(g,1e9,null,{dot:true}),0);
  advance(g,2);assert.equal(g.boss.hp,hp);
  m.clock={source:'media',time:4,duration:48,ended:true};advance(g,1.2);
  assert.equal(g.boss.hp,targets[year-5]);assert.equal(g.stats.damage,77);
 }
 assert.equal(e.mode,'curtain');assert.equal(actGyuwon(g,'light'),false);
 advance(g,30);assert.equal(g.status,'playing');assert.equal(g.boss.hp,800);
 advance(g,16);assert.equal(g.status,'won');assert.equal(g.boss.hp,0);
 assert.equal(g.events.filter(e=>e.type==='victory').length,1);
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
