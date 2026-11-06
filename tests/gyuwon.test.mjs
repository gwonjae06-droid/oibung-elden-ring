import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,actGyuwon,stepGyuwon,startGyuwonPattern,damageGyuwon} from '../src/gyuwon-combat.mjs';
import {freshProfile,newRun,finishAttempt,advanceJourney,BOSSES,configureJourney} from '../src/journey-state.mjs';
import {applyBossDamage} from '../src/boss-damage.mjs';
const advance=(g,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds*120);i++)stepGyuwon(g,1/120,input);};

test('all four weapons can hit and clear all three phases',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createGyuwonGame(weapon);g.player.z=g.boss.z+2;g.gyuwon.recover=100;
  assert.ok(actGyuwon(g,'light'));advance(g,1);
  assert.ok(g.boss.hp<g.boss.maxHp,weapon);
  damageGyuwon(g,1e6);advance(g,.05);assert.equal(g.boss.state,'transition');
  assert.equal(actGyuwon(g,'light'),false);assert.equal(damageGyuwon(g,100),0);
  advance(g,3.1);assert.equal(g.boss.phase,2);assert.equal(g.boss.state,'recovery');
  damageGyuwon(g,1e6);advance(g,3.2);assert.equal(g.boss.phase,3);damageGyuwon(g,1e6);assert.equal(g.status,'won');assert.equal(g.gyuwon.hazards.length,0);
 }
});
test('repeated attacks preserve the previous locations even after the player moves',()=>{
 const g=createGyuwonGame();startGyuwonPattern(g,'mark');const original=g.gyuwon.hazards.map(h=>({x:h.x,z:h.z}));
 g.player.x=15;startGyuwonPattern(g,'repeat');assert.equal(g.gyuwon.hazards.length,6);
 for(let i=0;i<3;i++){assert.equal(g.gyuwon.hazards[i*2].x,original[i].x);assert.equal(g.gyuwon.hazards[i*2+1].z,original[i].z);}
 const warnings=g.gyuwon.hazards.map(h=>h.warn);g.boss.phase=2;startGyuwonPattern(g,'repeat');assert.ok(g.gyuwon.hazards[1].warn<warnings[1]);
});
test('warnings do no damage, moving away avoids a strike, standing still is hit twice',()=>{
 const g=createGyuwonGame();startGyuwonPattern(g,'repeat');const hp=g.player.hp;
 advance(g,.9);assert.equal(g.player.hp,hp);advance(g,.5);assert.ok(g.player.hp<hp);
 const after=g.player.hp;advance(g,1.3);assert.ok(g.player.hp<after);
 const safe=createGyuwonGame();startGyuwonPattern(safe,'mark');advance(safe,2.7,{x:0,z:-1});assert.equal(safe.player.hp,safe.player.maxHp);
});
test('roll protection, terminal cleanup, and retry state remain isolated',()=>{
 const g=createGyuwonGame();startGyuwonPattern(g,'mark');advance(g,.95);actGyuwon(g,'roll',{x:0,z:1});advance(g,.25);assert.equal(g.player.hp,g.player.maxHp);
 const dying=createGyuwonGame();dying.player.hp=1;startGyuwonPattern(dying,'mark');advance(dying,1.95);assert.equal(dying.status,'lost');assert.equal(dying.gyuwon.hazards.length,0);
 assert.equal(createGyuwonGame().boss.phase,1);
});
test('blood advances to Gyuwon; only the fifth victory completes and records the run',()=>{
 const p=freshProfile();p.run=newRun('sword');p.run.stage=3;
 assert.equal(finishAttempt(p,{won:true,time:10}),'flame');advanceJourney(p.run);assert.equal(BOSSES[p.run.stage],'gyuwon');
 const g=createGyuwonGame();configureJourney(g,p.run,p);assert.ok(g.boss.hp>0);
 assert.equal(finishAttempt(p,{won:true,time:12}),'complete');assert.equal(p.records[0].bossCount,5);assert.ok(p.memories.some(m=>m.id==='gyuwon'));assert.equal(p.flames,2);
});
test('shared boss damage uses Gyuwon phase and victory rules',async()=>{
 const g=createGyuwonGame();await applyBossDamage(g,1e6);advance(g,3.2);await applyBossDamage(g,1e6);advance(g,3.2);await applyBossDamage(g,1e6);assert.equal(g.status,'won');
});

import {MEMORY_ORDER,memoryInterval,gyuwonPool,GYUWON_PATTERNS} from '../src/gyuwon-data.mjs';
test('white and dark pools alternate only between attacks',()=>{const g=createGyuwonGame();g.boss.phase=2;g.gyuwon.spaceTime=12;g.gyuwon.recover=100;advance(g,.05);assert.equal(g.gyuwon.space,'dark');assert.ok(gyuwonPool(2,'dark').includes('reverse'));g.boss.state='pattern';g.gyuwon.pattern='stop';g.gyuwon.spaceTime=20;advance(g,.1);assert.equal(g.gyuwon.space,'dark');});
test('all giant memories have finite telegraphs and complete with a counterattack window',()=>{for(const id of MEMORY_ORDER){const g=createGyuwonGame();g.boss.phase=3;g.player.invuln=100;assert.ok(startGyuwonPattern(g,id));assert.ok(g.gyuwon.hazards.length);for(const h of g.gyuwon.hazards)assert.ok(Number.isFinite(h.warn)&&h.warn>=1);advance(g,GYUWON_PATTERNS[id].duration+.1);assert.equal(g.boss.state,'recovery',id);assert.equal(g.gyuwon.hazards.length,0);}});
test('wave has a reachable opening and only harms players outside it as the volume crosses',()=>{const safe=createGyuwonGame();safe.boss.phase=3;safe.player.x=0;safe.player.z=0;startGyuwonPattern(safe,'tsunami');advance(safe,7.9);assert.equal(safe.player.hp,safe.player.maxHp);const hit=createGyuwonGame();hit.boss.phase=3;hit.player.x=10;hit.player.z=0;startGyuwonPattern(hit,'tsunami');advance(hit,7.9);assert.ok(hit.player.hp<hit.player.maxHp);});
test('memory stage changes accelerate at low health independently of active hazards',()=>{assert.ok(memoryInterval(.03)<memoryInterval(.25));const g=createGyuwonGame();g.boss.phase=3;g.boss.hp=g.boss.maxHp*.03;startGyuwonPattern(g,'tsunami');const wave=g.gyuwon.hazards[0];advance(g,1.1);assert.notEqual(g.gyuwon.stageMemory,'sword');assert.ok(g.gyuwon.hazards.includes(wave));});
