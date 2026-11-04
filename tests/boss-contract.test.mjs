import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BOSS_REGISTRY,PLAYABLE_BOSSES,CAMPAIGN_ORDER} from '../src/boss-registry.mjs';
import {applyBossDamage,damageStandard} from '../src/boss-damage.mjs';
import {createGame} from '../src/combat.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';

test('every finished boss supplies everything the journey needs',()=>{
 const names=new Set();
 for(const id of PLAYABLE_BOSSES){
  const entry=BOSS_REGISTRY[id];
  assert.equal(typeof entry.name,'string',id);assert.ok(entry.name.length>0,id);
  assert.ok(!names.has(entry.name),'duplicate boss name '+entry.name);names.add(entry.name);
  assert.ok(['evolution','advance','ending'].includes(entry.reward),id);
  assert.ok(entry.maxHp>0,id);
  assert.equal(typeof entry.hint,'function',id);assert.equal(typeof entry.hint({}),'string',id);
  if(entry.kind==='module'){assert.equal(typeof entry.load,'function',id);assert.equal(typeof entry.launch,'function',id);assert.ok(entry.dialogId,id);}
  if(entry.secret){assert.ok(entry.secret.label&&entry.secret.phase>=1,id);}
 }
 assert.equal(CAMPAIGN_ORDER.at(-1),'gyuwon');
});
test('the journey no longer compares boss ids directly',()=>{
 const text=readFileSync(new URL('../src/journey.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(text,/BOSSES\[[^\]]*\]\s*===\s*'/);
 assert.doesNotMatch(text,/secret-giant/);
});
test('applyBossDamage hands damage to each boss own rules, with plain damage for the arena bosses',async()=>{
 const dice=createDicePlayerGame();const before=dice.boss.hp;
 await applyBossDamage(dice,500);
 assert.equal(dice.boss.hp,before-500);
 const kwon=createGame('sword',{register:false});const hp=kwon.boss.hp;
 await applyBossDamage(kwon,500);
 assert.equal(kwon.boss.hp,hp-500);
 assert.ok(kwon.events.some(e=>e.type==='boss-hit'&&e.developer));
});
test('plain damage ends the fight at zero health and starts the phase change at half health',()=>{
 const g=createGame('sword',{register:false});g.boss.maxHp=1000;g.boss.hp=1000;g.boss.phase=1;g.boss.state='idle';
 damageStandard(g,500);assert.equal(g.boss.phase,2);assert.equal(g.boss.state,'transition');
 const h=createGame('sword',{register:false});h.boss.hp=300;h.boss.state='idle';
 damageStandard(h,500);assert.equal(h.boss.hp,0);assert.equal(h.status,'won');
});
