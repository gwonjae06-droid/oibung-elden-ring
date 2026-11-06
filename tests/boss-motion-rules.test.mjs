import test from 'node:test';
import assert from 'node:assert/strict';
import {GYUWON_PATTERNS} from '../src/gyuwon-data.mjs';
import {GYUWON_MOTION_STYLE,gyuwonRawMotion} from '../src/gyuwon-motion.mjs';
import {createGyuwonGame,startGyuwonPattern} from '../src/gyuwon-combat.mjs';
import {FLOW_RATE,flowAlpha} from '../src/boss-flow.mjs';
test('all final boss phase-two attacks have a distinctive pre-strike body pose',()=>{
 for(const name of Object.keys(GYUWON_PATTERNS)){
  assert.ok(GYUWON_MOTION_STYLE[name],name+' lacks authored movement');
 }
 for(const name of ['verdict','mirror','axiom','paradox','erasure']){
  const g=createGyuwonGame();g.boss.phase=2;
  assert.ok(startGyuwonPattern(g,name),name);
  g.gyuwon.t=Math.min(.45,...g.gyuwon.hazards.map(x=>x.warn*.45));
  const pose=gyuwonRawMotion(g);
  assert.ok(Object.values(pose).every(Number.isFinite),name+' contains invalid joints');
  assert.ok(Math.abs(pose.leftArm+.5)>.01||Math.abs(pose.headPitch)>.01,name+' remains idle');
 }
});
test('cinematic transitions maintain continuity instead of hard-snapping',()=>{
 assert.ok(FLOW_RATE.transition<20);
 assert.ok(FLOW_RATE.dead<20);
 assert.ok(flowAlpha('transition',1/60)<.35);
});
