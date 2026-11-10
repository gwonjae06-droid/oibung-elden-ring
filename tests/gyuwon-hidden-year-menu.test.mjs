import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame} from '../src/gyuwon-combat.mjs';
import {GYUWON_PERFORMANCE_ROUTE,gyuwonDisplayYear} from '../src/gyuwon-musical-route.mjs';
import {jumpGyuwonToSelectedYear} from '../src/gyuwon-years.mjs';
import {annualFloorForYear} from '../src/gyuwon-annual-progress.mjs';
import {GYUWON_YEAR_LABELS} from '../src/gyuwon-hidden-year-menu.mjs';

test('the concealed chooser exposes only actual playable years',()=>{
 assert.deepEqual(GYUWON_YEAR_LABELS,['현역','재수','3수','4수','5수','6수','7수','8수','9수']);
 assert.deepEqual(GYUWON_PERFORMANCE_ROUTE,[5,6,8,9,11]);
});
test('each pause-year choice enters an isolated year with the correct recording and health',()=>{
 for(let choice=1;choice<=9;choice++){
  const game=createGyuwonGame('sword',{yearMode:true,seed:800+choice});
  const events=[];
  const ok=jumpGyuwonToSelectedYear(game,choice,(type,data)=>events.push({type,...data}));
  assert.equal(ok,true,'choice '+choice);
  const year=choice<=4?choice:GYUWON_PERFORMANCE_ROUTE[choice-5];
  const state=game.gyuwon.years;
  assert.equal(state.year,year);
  assert.equal(game.status,'playing');
  const hp=choice===1?game.boss.maxHp:annualFloorForYear(game,year===11?10:year-1);
  assert.equal(game.boss.hp,hp,'year '+choice+' starts above the floor');
  if(choice>=5){
   assert.equal(state.mode,'musical');
   assert.equal(state.musical?.year,year);
   assert.equal(state.musical.time,0);
   assert.equal(gyuwonDisplayYear(year,state.musical),choice);
   assert.ok(events.some(e=>e.type==='gyuwon-musical-act'));
  }else{
   assert.equal(state.mode,'combat');
   assert.equal(state.musical,undefined);
  }
 }
});
test('invalid numbers and a live, already-entered song cannot be redirected',()=>{
 for(const invalid of [0,10,7.5,-1,NaN,null,'8']){
  const game=createGyuwonGame('sword',{yearMode:true});
  assert.equal(jumpGyuwonToSelectedYear(game,invalid),false);
  assert.equal(game.gyuwon.years.year,1);
 }
 const game=createGyuwonGame('sword',{yearMode:true});
 assert.equal(jumpGyuwonToSelectedYear(game,6),true);
 assert.equal(jumpGyuwonToSelectedYear(game,7),false);
 assert.equal(game.gyuwon.years.musical?.year,6);
});
