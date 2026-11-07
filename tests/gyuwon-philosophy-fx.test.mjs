import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonPhilosophyFx,PHILOSOPHY_FORMS} from '../src/gyuwon-philosophy-fx.mjs';
import {createGyuwonGame,startGyuwonPattern,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {MEMORY_ORDER,GYUWON_RULES} from '../src/gyuwon-data.mjs';
test('phase-two philosophical court is an actual lightweight 3D noncollision sculpture',()=>{
 const scene=new THREE.Scene(),fx=createGyuwonPhilosophyFx(scene,{coarse:true});
 const g=createGyuwonGame();g.boss.phase=2;
 assert.equal(GYUWON_RULES.radius,30);assert.equal(fx.stats().architecturalPillars,10);
 assert.equal(fx.stats().decorativeOnly,true);
 for(const name of PHILOSOPHY_FORMS){
  assert.ok(startGyuwonPattern(g,name));fx.update(g,.03);
  for(let i=0;i<30;i++)fx.update(g,.016);
  assert.equal(fx.stats().activePattern,name);
  assert.ok(scene.getObjectByName('gyuwon-philosophy-'+name)?.visible);
 }
 fx.dispose();assert.equal(scene.getObjectByName('gyuwon-two-worlds-metaphysical-court'),undefined);
});
test('third phase giant memory environment matches the actually cast signature throughout the hazard',()=>{
 for(const name of MEMORY_ORDER){
  const g=createGyuwonGame();g.boss.phase=3;g.boss.hp=g.boss.maxHp*.03;
  assert.ok(startGyuwonPattern(g,name));assert.equal(g.gyuwon.stageMemory,name);
  g.player.invuln=9999;
  for(let i=0;i<130;i++)stepGyuwon(g,1/120);
  assert.equal(g.gyuwon.stageMemory,name,'a different memory replaced an active spell');
  assert.ok(g.gyuwon.hazards.length,name);
 }
});
