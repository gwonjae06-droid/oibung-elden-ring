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
 e.musical.transition=0;g.player.invuln=0;
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
 assert.ok(actGyuwon(g,'light'));assert.ok(g.boss.hp<old);
 assert.equal(m.turn,'boss');assert.ok(m.turnWind>=1.05);
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
test('act 8 rhythm notes have strict beat input with real HP damage',()=>{
 const g=at(8),m=g.gyuwon.years.musical;
 advance(g,.26);assert.ok(m.note);
 advance(g,.82);assert.ok(m.note);
 const key=m.note.key,old=g.boss.hp;
 assert.ok(actGyuwon(g,key));assert.ok(g.boss.hp<old);
 assert.ok(m.combo>0);
});
test('act 9 fighting gameplay hits only within real horizontal reach',()=>{
 const g=at(9),m=g.gyuwon.years.musical;
 g.player.x=g.boss.x-2.9;
 const hp=g.boss.hp;
 assert.ok(actGyuwon(g,'light'));assert.ok(g.boss.hp<hp);
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
 advance(g,.4);assert.ok(g.boss.hp<old,'actual bullet must contact the boss');
 m.enemyWind=.01;advance(g,.05);assert.ok(m.enemyTarget?.wind>=1.05);
 advance(g,1.1);assert.ok(m.enemyShots.length>0);
});
test('each genre advances at an HP milestone without entering exam or result',()=>{
 const g=at(5),e=g.gyuwon.years;
 for(let year=5;year<=9;year++){
  assert.equal(e.year,year);assert.equal(e.mode,'musical');
  damageGyuwon(g,g.boss.maxHp);
  assert.ok(g.boss.hp>=annualFloor(g)-.01);
  advance(g,1.6);
  assert.equal(e.year,year+1);
  assert.equal(e.mode,'musical');
  assert.equal(e.grade,null);
  assert.equal(e.cast,null);
  e.musical.transition=0;
 }
});
test('11th-act last 800 HP becomes unskippable sad narrative, then victory',()=>{
 const g=at(11),e=g.gyuwon.years,m=e.musical;
 g.boss.hp=825;
 damageGyuwon(g,900);
 assert.equal(g.boss.hp,800,'damage cannot skip the final 800-HP curtain');
 advance(g,.09);
 assert.equal(m.finishing,true);
 assert.equal(e.mode,'curtain');
 assert.equal(actGyuwon(g,'light'),false);
 assert.ok(g.boss.hp>=0);
 advance(g,18);
 assert.equal(g.status,'won');assert.equal(g.boss.hp,0);
 assert.ok(g.events.some(x=>x.type==='victory'));
});
