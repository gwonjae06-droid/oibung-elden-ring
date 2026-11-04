import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {settlePlayerHit} from '../src/player-hit.mjs';
import {createPlayerState} from '../src/player-combat.mjs';
import {createBloodGame,actBlood,stepBlood} from '../src/blood-combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';

const game=(weapon='sword')=>({weapon,evolutions:[],events:[],stats:{hits:0,damage:0,dodges:0},player:createPlayerState()});

test('a landed hit is counted once and a zero hit changes nothing',()=>{
 const g=game();
 assert.equal(settlePlayerHit(g,0,{basic:true}),0);
 assert.equal(settlePlayerHit(g,-5,{basic:true}),0);
 assert.equal(settlePlayerHit(g,Number.NaN,{basic:true}),0);
 assert.deepEqual(g.stats,{hits:0,damage:0,dodges:0});
 assert.equal(settlePlayerHit(g,40,{basic:true}),40);
 assert.deepEqual(g.stats,{hits:1,damage:40,dodges:0});
});
test('engines that already count hits can opt out of the double count',()=>{
 const g=game();
 settlePlayerHit(g,40,{basic:true},{countStats:false});
 assert.deepEqual(g.stats,{hits:0,damage:0,dodges:0});
});
test('hammer hits still charge the skill and a card stun fires only once per action',()=>{
 const g=game('hammer');settlePlayerHit(g,60,{basic:true});
 assert.equal(g.player.skill.hammerHits,1);
 const stuns=[],action={basic:true,stun:true,stunUsed:false};
 settlePlayerHit(g,30,action,{canStun:true,stun:d=>stuns.push(d)});
 settlePlayerHit(g,30,action,{canStun:true,stun:d=>stuns.push(d)});
 assert.equal(stuns.length,1);assert.ok(stuns[0]>0);
});
test('one real sword hit on the blood boss removes exactly the nerfed weapon damage and is counted once',()=>{
 const g=createBloodGame('sword');g.player.x=0;g.player.z=-1;
 const before=g.boss.hp;
 assert.equal(actBlood(g,'light'),true);
 for(let i=0;i<60&&g.stats.hits===0;i++)stepBlood(g,1/60);
 assert.equal(g.stats.hits,1);
 assert.equal(before-g.boss.hp,WEAPONS.sword.damage);
 assert.equal(g.stats.damage,WEAPONS.sword.damage);
});
test('the dice and blood fights no longer settle hits on their own',()=>{
 for(const file of ['dice-player.mjs','blood-combat.mjs']){
  const text=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  assert.ok(text.includes('settlePlayerHit'),file);
  assert.ok(!text.includes('rewardPlayerHit'),file);
  assert.ok(!text.includes('stats.hits++'),file);
 }
});
