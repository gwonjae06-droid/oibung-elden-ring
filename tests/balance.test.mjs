import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WEAPONS} from '../src/weapon-data.mjs';
import {PLAYER_DAMAGE_MULTIPLIER,BASE_BOSS_HP,BOSS_HP_SCALE,bossMaxHp} from '../src/balance.mjs';
import {CAMPAIGN_ORDER,PLAYABLE_BOSSES,BOSS_REGISTRY} from '../src/boss-registry.mjs';

test('the campaign order is fixed and only finished bosses are playable',()=>{
 assert.deepEqual(CAMPAIGN_ORDER,['kwon','clown','dice','blood','gyuwon']);
 assert.deepEqual(PLAYABLE_BOSSES,['kwon','clown','dice','blood']);
 for(const id of CAMPAIGN_ORDER)assert.equal(BOSS_REGISTRY[id].id,id);
});
test('boss health is similar: lowest first and slowly rising afterwards',()=>{
 const hp=CAMPAIGN_ORDER.map(id=>BOSS_REGISTRY[id].maxHp);
 assert.deepEqual(hp,BOSS_HP_SCALE.map((_,i)=>bossMaxHp(i)));
 assert.equal(hp[0],BASE_BOSS_HP);
 for(let i=1;i<hp.length;i++)assert.ok(hp[i]>hp[i-1],'boss '+i+' must have more health than the previous boss');
 assert.ok(hp.at(-1)/hp[0]<1.3,'the last boss stays within 30% of the first');
});
test('every weapon deals exactly the nerfed damage once',()=>{
 const base={sword:72,hammer:114,bow:68,cards:27};
 assert.equal(PLAYER_DAMAGE_MULTIPLIER,.9);
 for(const [id,damage] of Object.entries(base))assert.equal(WEAPONS[id].damage,Math.round(damage*.9),id);
});
test('the removed challenge modes leave no trace in the journey code',()=>{
 for(const file of ['../src/journey.mjs','../src/journey-state.mjs']){
  const text=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.doesNotMatch(text,/challenges|noheal|MODES/,file);
 }
});
