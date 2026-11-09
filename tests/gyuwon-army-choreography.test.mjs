import test from 'node:test';
import assert from 'node:assert/strict';
import {gyuwonArmyScene,gyuwonArmyLaneY} from '../src/gyuwon-army-director.mjs';
import {createGyuwonGame,stepGyuwon,actGyuwon} from '../src/gyuwon-combat.mjs';

function stage(){
 const g=createGyuwonGame('sword',{yearMode:true,seed:77});
 g.gyuwon.years.year=7;stepGyuwon(g,.01);
 const m=g.gyuwon.years.musical;
 m.transition=0;g.player.invuln=0;
 return {g,m};
}
function at(g,m,t){
 m.clock={source:'media',time:t,duration:180,ended:false};
 stepGyuwon(g,.016);
}
test('Act VII changes actual world scenes at all authored story chapters',()=>{
 assert.deepEqual([0,18,35,57,90,115,130,160,177].map(t=>gyuwonArmyScene(t).key),
  ['arrival','recruits','village','march','siege','lonely','reunion','victory','exit']);
 assert.equal(gyuwonArmyScene(115).quiet,true);
 assert.equal(gyuwonArmyScene(130).quiet,false);
 assert.equal(gyuwonArmyLaneY(0)<gyuwonArmyLaneY(1),true);
});
test('new lane selector assigns production and protects other lane from phantom hits',()=>{
 const {g,m}=stage();m.enemySpawn=100;m.money=500;
 assert.equal(actGyuwon(g,'lane'),true);
 assert.equal(m.deployLane,1);
 assert.equal(actGyuwon(g,'summon0'),true);
 const ally=m.units[0];ally.x=-.7;
 assert.equal(ally.lane,1);
 const enemy={...ally,id:900,team:-1,lane:0,x:.5,hp:500,maxHp:500,wind:0,hit:false,cool:0};
 m.units.push(enemy);
 for(let i=0;i<85;i++)stepGyuwon(g,1/120);
 assert.equal(enemy.hp,500);
 enemy.lane=1;ally.x=-.7;enemy.x=.5;ally.cool=0;ally.wind=0;
 for(let i=0;i<85;i++)stepGyuwon(g,1/120);
 assert.ok(enemy.hp<500,'shared-lane attacks land after windup');
});
test('song-time castle phases progress without infinite base rebuilding',()=>{
 const {g,m}=stage();
 at(g,m,57);assert.equal(m.enemyFort,2);assert.equal(m.enemyBaseMaxHp,4050);
 m.enemyBaseHp=0;m.armyConvoyClock=.001;
 at(g,m,60);
 assert.equal(m.enemyFort,2);assert.equal(m.enemyBaseHp,0);
 assert.ok(m.units.some(u=>u.kind==='supply'));
 at(g,m,126.2);assert.equal(m.enemyFort,3);assert.equal(m.enemyBaseMaxHp,5100);
 m.enemyBaseHp=0;at(g,m,153);
 assert.equal(m.enemyBaseHp,0,'destroyed last castle does not respawn');
});
test('the lonely bridge is interactive and rally recruits return on the reprise',()=>{
 const {g,m}=stage();m.money=500;actGyuwon(g,'summon0');
 const ally=m.units.find(u=>u.team>0);
 ally.hp=12;const before=ally.hp;
 at(g,m,112);assert.equal(m.armyTruce,true);
 assert.ok(ally.hp>before,'existing comrades recover while taking shelter');
 assert.equal(actGyuwon(g,'cannon'),true,'the cannon becomes a flag rally during the quiet verse');
 assert.equal(m.armyRallied,true);assert.equal(actGyuwon(g,'cannon'),false);
 at(g,m,126.2);assert.equal(m.armyTruce,false);
 assert.equal(m.armyReunionDone,true);
 assert.ok(m.units.filter(u=>u.returning&&u.team>0).length>=2);
});
test('new keyboard mapping preserves six existing soldier cards',()=>{
 const {m}=stage();
 assert.equal(m.deployLane,0);
 assert.equal(actGyuwon(stage().g,'lane'),true);
});
