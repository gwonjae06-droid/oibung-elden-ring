import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,actGyuwon,stepGyuwon,startGyuwonPattern} from '../src/gyuwon-combat.mjs';
import {GYUWON_PATTERNS,gyuwonPool,hazardContains} from '../src/gyuwon-data.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {gyuwonHurtShapes} from '../src/boss-hit-regions.mjs';
import {kwonProjectileContact} from '../src/kwon-hurtbox.mjs';
import {weaponStats,playerIncomingDamage} from '../src/weapon-stats.mjs';
import {playerWalkSpeed,playerRollSpeed} from '../src/player-movement-rules.mjs';

const advance=(g,t,input={})=>{
 for(let i=0;i<Math.round(t*120);i++)stepGyuwon(g,1/120,input);
};
test('final encounter uses the same health, walk and roll multipliers as every boss',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createGyuwonGame(weapon),stats=weaponStats(weapon);
  assert.equal(g.player.hp,stats.maxHp);
  assert.equal(g.player.maxHp,stats.maxHp);
  advance(g,.5,{x:1,z:0});
  assert.ok(Math.abs(g.player.x-playerWalkSpeed(g.player)*.5)<.02,weapon+' walk');
  const before=g.player.x;
  assert.ok(actGyuwon(g,'roll',{x:1,z:0}),weapon+' dodge input');
  advance(g,.25);
  assert.ok(Math.abs(g.player.x-before-playerRollSpeed(g)*.25)<.02,weapon+' dodge');
 }
});
test('incoming Gyuwon damage is weapon-specific and still respects invulnerability',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createGyuwonGame(weapon);
  assert.ok(startGyuwonPattern(g,'mark'));
  advance(g,2.1);
  const expected=playerIncomingDamage(g,22);
  assert.ok(Math.abs(g.player.hp-(g.player.maxHp-expected))<.01,weapon+' defense');
  assert.equal(g.stats.dodges,0);
  const immune=createGyuwonGame(weapon);immune.player.invuln=3;
  startGyuwonPattern(immune,'mark');advance(immune,2.1);
  assert.equal(immune.player.hp,immune.player.maxHp,weapon+' invulnerability');
 }
});
test('all weapons now count accurate landing damage and hit rewards through shared combat',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createGyuwonGame(weapon);
  g.player.z=g.boss.z+2;
  assert.ok(actGyuwon(g,'light'));
  advance(g,.9);
  assert.ok(g.boss.hp<g.boss.maxHp,weapon+' should hit authored torso');
  assert.ok(g.stats.hits>=1,weapon+' should count hits');
  assert.ok(g.stats.damage>0,weapon+' should count dealt damage');
  const landed=g.events.find(e=>e.type==='boss-hit'&&e.part);
  assert.ok(landed&&Number.isFinite(landed.x)&&Number.isFinite(landed.y)&&Number.isFinite(landed.z),
   weapon+' impact FX must follow the struck real body part');
 }
 const bonus=createGyuwonGame('bow');
 assert.equal(bonus.applyBonusDamage(12,0,{}),12);
 assert.equal(bonus.applyBonusDamage(8,0,{dot:true}),8);
 assert.equal(bonus.stats.hits,1,'damage-over-time must not count as a normal strike');
 assert.equal(bonus.stats.damage,20);
});
test('the final boss head is targetable only when it visibly exists',()=>{
 const g=createGyuwonGame('bow');
 const before=gyuwonHurtShapes(g);
 assert.ok(before.some(p=>p.id==='anatomical-head'));
 const trace=[{x:0,y:3.15,z:g.boss.z+2},{x:0,y:3.15,z:g.boss.z-2}];
 assert.ok(kwonProjectileContact(before,...trace));
 g.boss.phase=2;g.boss.state='recovery';
 const after=gyuwonHurtShapes(g);
 assert.ok(!after.some(p=>p.id==='anatomical-head'));
 assert.equal(kwonProjectileContact(after,...trace),null,'invisible head cannot be struck');
});
test('new dark-world counterproof has staggered readable cues and a walkable escape route',()=>{
 assert.ok(gyuwonPool(2,'dark').includes('counterproof'));
 const standing=createGyuwonGame();standing.boss.phase=2;
 assert.ok(startGyuwonPattern(standing,'counterproof'));
 const hazards=standing.gyuwon.hazards;
 assert.equal(hazards.length,3);
 assert.ok(hazards[0].warn>=1.7);
 assert.ok(hazards[0].warn<hazards[1].warn&&hazards[1].warn<hazards[2].warn);
 assert.ok(hazards.every(h=>h.warn+h.life<GYUWON_PATTERNS.counterproof.duration));
 assert.equal(hazardContains(hazards[0],{x:standing.player.x+7,z:standing.player.z}),false);
 const safe=createGyuwonGame();safe.boss.phase=2;
 startGyuwonPattern(safe,'counterproof');
 advance(safe,2,{x:1,z:0});
 assert.equal(safe.player.hp,safe.player.maxHp,'moving away is a fair answer at unified walk speed');
});
test('first-phase multiple-choice always has a safe sector within walking reach',()=>{
 for(const start of [{x:25,z:0},{x:0,z:-25},{x:-17,z:18},{x:0,z:14}]){
  const g=createGyuwonGame();
  Object.assign(g.player,start);
  startGyuwonPattern(g,'choice');
  const cones=g.gyuwon.hazards.filter(h=>h.shape==='cone');
  assert.equal(cones.length,4);
  assert.ok(cones.every(h=>!hazardContains(h,start)),JSON.stringify(start)+' must start in a visible safe sector');
  advance(g,2.8);
  assert.equal(g.player.hp,g.player.maxHp,'the targeted follow-up must stay warned for long enough');
  const note=g.gyuwon.hazards.find(h=>h.shape==='circle');
  assert.ok(note&&note.warn>=2.9,'a distinct late note prevents a free stationary clear');
 }
});
test('anatomical shoulder, elbow, wrist, neck and both knee chains stay connected',()=>{
 const scene=new THREE.Scene(),actor=createGyuwonActor(scene,{coarse:true}),g=createGyuwonGame();
 const root=actor.root,torso=root.getObjectByName('gyuwon-tailored-torso');
 assert.equal(root.getObjectByName('gyuwon-head').parent,torso);
 assert.equal(root.getObjectByName('gyuwon-rigged-neck').parent,torso);
 assert.equal(root.getObjectByName('gyuwon-left-shoulder-rig').parent,torso);
 assert.equal(root.getObjectByName('gyuwon-right-shoulder-rig').parent,torso);
 const count=name=>{let n=0;root.traverse(o=>{if(o.name===name)n++;});return n};
 assert.equal(count('gyuwon-rigged-knee'),2);
 assert.equal(count('gyuwon-rigged-shin'),2);
 assert.equal(count('gyuwon-elbow-pivot'),2);
 assert.equal(count('gyuwon-wrist-pivot'),2);
 for(let i=0;i<60;i++){
  stepGyuwon(g,1/120,{x:1,z:0});actor.update(g,0,1/120);
 }
 root.updateMatrixWorld(true);
 for(const name of ['gyuwon-rigged-knee','gyuwon-rigged-shin','gyuwon-leather-shoe']){
  const obj=root.getObjectByName(name);
  assert.ok(obj.position.toArray().every(Number.isFinite),name+' finite pose');
 }
 const shoes=[];root.traverse(o=>{if(o.name==='gyuwon-leather-shoe')shoes.push(o)});
 assert.ok(shoes.every(s=>s.position.y>=.15-1e-5),'shoes must not sink through the floor');
});
