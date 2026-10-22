import test from 'node:test';
import assert from 'node:assert/strict';
import {beginChainSweep,stepChainSweep,planChainSweep,chainSweptRect,circleRectHit} from '../src/dice-chain-sweep.mjs';
import {applyDiceSlow,diceSlowFactor,stepDiceSlow} from '../src/dice-slow.mjs';
const game=()=>({status:'playing',events:[],boss:{hp:3000,maxHp:3000},player:{x:20,z:10,hp:120},dice:{pose:{x:0,z:0},groundSpikes:null}});
function advance(g,time,frozen=false){for(let left=time;left>1e-9;){const h=Math.min(.01,left);stepChainSweep(g,h,frozen);left-=h;}}
test('warning then single damage and slow, then cleanup',()=>{const g=game();beginChainSweep(g);advance(g,.9);assert.equal(g.player.hp,120);advance(g,.71);assert.equal(g.player.hp,98);assert.equal(diceSlowFactor(g.player),.6);assert.equal(g.events.filter(e=>e.source==='dice-chain').length,1);assert.equal(g.dice.groundSpikes,null);});
test('dodge consumes sweep without later hit',()=>{const g=game();beginChainSweep(g);g.player.invuln=1;advance(g,1.35);g.player.invuln=0;advance(g,.26);assert.equal(g.player.hp,120);assert.equal(g.player.slow,undefined);});
test('body coverage or changed pose cannot cancel begun sweep',()=>{const g=game();beginChainSweep(g);g.dice.pose={x:20,y:6,z:10,rotation:[0,0,-Math.SQRT1_2,Math.SQRT1_2]};advance(g,1.61);assert.equal(g.player.hp,98);});
test('freeze pauses and tempo stays locked',()=>{const g=game(),w=beginChainSweep(g);advance(g,.2);const t=w.t;g.boss.hp=1;advance(g,1,true);assert.equal(w.t,t);advance(g,.6);assert.equal(w.stage,'warning');assert.equal(w.tempo,1);});
test('lethal damage and terminal cleanup',()=>{const g=game();g.player.hp=10;beginChainSweep(g);advance(g,1.61);assert.equal(g.status,'lost');assert.equal(g.player.hp,0);assert.equal(g.dice.groundSpikes,null);assert.equal(g.player.slow,null);});
test('slow refresh is not multiplicative and expires',()=>{const p={};applyDiceSlow(p);stepDiceSlow(p,1);applyDiceSlow(p);assert.equal(p.slow.factor,.6);assert.equal(p.slow.t,1.5);for(let i=0;i<151;i++)stepDiceSlow(p,.01);assert.equal(diceSlowFactor(p),1);});
test('swept rectangle catches between-frame crossing',()=>{const p=planChainSweep({x:0,z:0},{x:20,z:10},65);assert.equal(circleRectHit({x:20,z:10},chainSweptRect(p,0,1)),true);assert.equal(circleRectHit({x:20,z:30},chainSweptRect(p,0,1)),false);});
