import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startPattern,step,act} from '../src/combat.mjs';
test('being under the boss no longer deals unconditional body damage',()=>{for(const phase of[1,2]){const g=createGame();g.boss.phase=phase;g.boss.x=g.boss.z=0;g.player.x=0;g.player.z=-3.1;startPattern(g,'sweep');g.boss.yaw=0;g.boss.state='active';g.boss.t=0;step(g,1/240);assert.equal(g.player.hp,120);}});
test('melee hits still have hitstop',()=>{const g=createGame();g.boss.wait=99;g.player.z=0;g.player.yaw=Math.PI;act(g,'light');for(let i=0;i<200&&!g.events.some(e=>e.type==='boss-hit');i++)step(g,1/240);assert.ok(g.events.some(e=>e.type==='boss-hit'));assert.ok(g.hitstop>0);});
