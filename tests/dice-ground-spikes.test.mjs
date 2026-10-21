import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beginGroundSpikes,stepGroundSpikes,GROUND_SPIKES as S} from '../src/dice-ground-spikes.mjs';
const board=Array.from({length:25},(_,i)=>({index:i,x:(i%5-2)*8,z:(Math.floor(i/5)-2)*8}));
const make=(count=3)=>{const g={status:'playing',events:[],player:{x:0,z:0,hp:120,invuln:0},dice:{t:0}};beginGroundSpikes(g,board,count);return g;};
function advance(g,t){for(let left=t;left>1e-9&&g.status==='playing';){const dt=Math.min(.05,left);g.dice.t+=dt;stepGroundSpikes(g);left-=dt;}}
test('warning locks exactly the pip count nearest cells',()=>{for(let i=1;i<=6;i++){const g=make(i);assert.equal(g.dice.groundSpikes.cells.length,i);assert.equal(new Set(g.dice.groundSpikes.cells.map(c=>c.index)).size,i);assert.equal(g.dice.groundSpikes.cells[0].index,12);}});
test('warning does no damage and target cannot follow player',()=>{const g=make(),cells=JSON.stringify(g.dice.groundSpikes.cells);g.player.x=16;advance(g,.8);assert.equal(g.player.hp,120);assert.equal(JSON.stringify(g.dice.groundSpikes.cells),cells);assert.equal(g.dice.state,'spike-warning');});
test('eruption deals only one hit during a wave then recovers',()=>{const g=make();advance(g,1.5);assert.equal(g.player.hp,88);assert.equal(g.events.filter(e=>e.source==='dice-spikes').length,1);advance(g,.2);assert.equal(g.dice.state,'recovery');assert.equal(g.dice.groundSpikes,null);});
test('safe spaces remain safe and circles do not cover whole tiles',()=>{const g=make(1);g.player.x=4;g.player.z=4;advance(g,1.7);assert.equal(g.player.hp,120);});
test('dodging avoids contact but entering an active spike remains dangerous',()=>{const g=make(1);g.player.invuln=1;advance(g,1);assert.equal(g.player.hp,120);g.player.invuln=0;advance(g,.1);assert.equal(g.player.hp,88);});
test('lethal damage and terminal state emit no duplicate death',()=>{const g=make(1);g.player.hp=10;advance(g,1);assert.equal(g.status,'lost');stepGroundSpikes(g);assert.equal(g.events.filter(e=>e.type==='death').length,1);assert.equal(g.dice.groundSpikes,null);});
test('renderer radius and timing constants are explicit',()=>{assert.equal(S.radius+.42,3.52);assert.ok(S.warning>=.8);assert.ok(S.active>.5);});

test('engine and board both connect the spike module',()=>{const engine=readFileSync(new URL('../src/dice-combat.mjs',import.meta.url),'utf8'),actor=readFileSync(new URL('../src/dice-actor.mjs',import.meta.url),'utf8');for(const token of ['beginGroundSpikes(g,DICE_BOARD,d.topFace?.pips||1)','if(stepGroundSpikes(g))','g.dice.groundSpikes=null'])assert.ok(engine.includes(token),token);assert.ok(actor.includes('buildGroundSpikeVisuals(THREE,root)'));assert.ok(actor.includes('groundSpikes.update(g)'));});
