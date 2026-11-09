import test from 'node:test';
import assert from 'node:assert/strict';
import {damageArenaBoss} from '../src/arena-damage.mjs';
import {damageStandard,applyBossDamage} from '../src/boss-damage.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
const game=()=>({status:'playing',events:[],stats:{hits:0,damage:0},player:{action:null},projectiles:[{}],bossShots:[{}],boss:{hp:1000,maxHp:1000,phase:1,state:'idle',poise:0,stun:0,queue:[]}});
test('invalid damage never mutates state',()=>{
 for(const n of [0,-1,NaN,Infinity,undefined]){const g=game(),before=structuredClone(g);assert.equal(damageArenaBoss(g,n),0);assert.deepEqual(g,before);}
 for(const status of ['won','lost']){const g=game();g.status=status;assert.equal(damageStandard(g,500),0);assert.equal(g.boss.hp,1000);}
});
test('weapon and fixed damage share phase transition cleanup',()=>{
 for(const developer of [false,true]){const g=game();g.clown={zones:[{}],bombs:[{}],waves:[{}]};
 assert.equal(damageArenaBoss(g,500,0,{developer}),300);assert.equal(g.boss.state,'transition');assert.equal(g.boss.phase,2);
 assert.deepEqual(g.clown.zones,[]);assert.deepEqual(g.projectiles,[]);assert.deepEqual(g.bossShots,[]);
 assert.equal(damageArenaBoss(g,1),0);assert.equal(g.events.filter(e=>e.type==='phase').length,1);}
});
test('death emits victory once and clears clown hazards',()=>{
 const g=game();g.boss.phase=3;g.clown={zones:[{}],bombs:[{}],waves:[{}]};
 assert.equal(damageArenaBoss(g,2000),1000);assert.equal(g.status,'won');assert.equal(g.clown.state,'defeated');
 assert.equal(damageStandard(g,500),0);assert.equal(g.events.filter(e=>e.type==='victory').length,1);assert.equal(g.stats.hits,1);
});
test('weapon poise and hitstop are retained; fixed developer damage remains raw',()=>{
 const g=game();g.boss.state='stagger';assert.equal(damageArenaBoss(g,100,0),125);assert.equal(g.hitstop,.035);
 const h=game();h.boss.state='stagger';assert.equal(damageStandard(h,100),100);assert.equal(h.hitstop,undefined);
 const p=game();damageArenaBoss(p,10,180);assert.equal(p.boss.state,'stagger');assert.ok(p.events.some(e=>e.type==='stagger'));
});
test('cancelled or stale dispatch does not damage a boss after loading',async()=>{
 const g=createDicePlayerGame(),hp=g.boss.hp;let checks=0;
 assert.equal(await applyBossDamage(g,100,{isCurrent:()=>++checks===1}),0);assert.equal(g.boss.hp,hp);
 assert.equal(await applyBossDamage(g,100,{isCurrent:()=>false}),0);assert.equal(g.boss.hp,hp);
});

test('overkill damage cannot skip O Seulwoo phase two or three, even for developer or DoT hits',()=>{
 for(const opts of [{},{developer:true},{dot:true}]){
  const g=createClownGame('sword',{register:false});
  const max=g.boss.maxHp;
  const first=damageArenaBoss(g,max*8,0,opts);
  assert.ok(Math.abs(first-max*.30)<.001,'first curtain should clamp to 70% HP');
  assert.equal(g.boss.phase,2);
  assert.equal(g.boss.state,'transition');
  assert.equal(g.status,'playing');
  g.boss.state='clown';g.clown.state='idle';
  const second=damageArenaBoss(g,max*8,0,opts);
  assert.ok(Math.abs(second-max*(.70-1/3))<.001,'second curtain should clamp to 33.3% HP');
  assert.equal(g.boss.phase,3);
  assert.equal(g.boss.state,'transition');
  assert.equal(g.status,'playing');
  assert.equal(g.clown.troupe.members.length,0);
  g.boss.state='clown';g.clown.state='idle';
  assert.ok(damageArenaBoss(g,max*8,0,opts)>0);
  assert.equal(g.status,'won');
  assert.equal(g.events.filter(e=>e.type==='phase').length,2);
  assert.equal(g.events.filter(e=>e.type==='victory').length,1);
 }
});
