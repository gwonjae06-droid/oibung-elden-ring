import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,step,act} from '../src/combat.mjs';
import {WEAPONS} from '../src/weapon-data.mjs';

function closeFight(weapon){
 const g=createGame(weapon,{register:false});
 g.player.x=0;g.player.z=1;
 return g;
}
function swingUntilHit(g){
 assert.equal(act(g,'light'),true);
 for(let i=0;i<90&&g.stats.hits===0;i++)step(g,1/60,{});
}

test('one real sword hit on the first boss removes exactly the nerfed weapon damage and is counted once',()=>{
 const g=closeFight('sword'),before=g.boss.hp;
 swingUntilHit(g);
 assert.equal(g.stats.hits,1);
 assert.equal(before-g.boss.hp,WEAPONS.sword.damage);
 assert.equal(g.stats.damage,WEAPONS.sword.damage);
});
test('a hammer hit still charges the hammer skill through the shared settlement',()=>{
 const g=closeFight('hammer');
 swingUntilHit(g);
 assert.equal(g.stats.hits,1);
 assert.equal(g.player.skill.hammerHits,1);
});
test('the arena fight no longer pays hit rewards on its own',()=>{
 const text=readFileSync(new URL('../src/combat.mjs',import.meta.url),'utf8');
 assert.ok(text.includes('settlePlayerHit'));
 assert.ok(!text.includes('rewardPlayerHit'));
});
