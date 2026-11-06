import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {bloodStormEnvelope,createBloodApocalypseSky} from '../src/blood-apocalypse-sky.mjs';
import {createWhiteCathedral} from '../src/blood-white-cathedral.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';
import {BLOOD_PATTERNS,BLOOD_RULES,bloodHazardFootprint} from '../src/blood-data.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const named=(scene,name)=>scene.getObjectByName(name);
test('cathedral flood and storm follow 50% HP phase timeline without changing combat rules',()=>{
 const g=createBloodGame(),hp=g.player.hp,bossHp=g.boss.hp;
 assert.equal(bloodTransformation(g).seaRise,0);
 assert.equal(bloodStormEnvelope(g).reveal,0);
 g.boss.phase=2;g.boss.state='transition';
 const keyframes=[0,1,2,3,4.6].map(t=>{g.blood.t=t;return bloodTransformation(g);});
 for(let i=1;i<keyframes.length;i++){
  for(const k of ['rupture','seaRise','sky','storm'])
   assert.ok(keyframes[i][k]>=keyframes[i-1][k],k+' regressed');
 }
 assert.equal(keyframes[0].sky,0);
 assert.ok(keyframes[2].rupture>0);
 assert.ok(keyframes[3].seaRise>0);
 g.boss.state='recovery';
 assert.equal(bloodTransformation(g).seaRise,1);
 assert.equal(bloodStormEnvelope(g).storm,1);
 assert.equal(g.player.hp,hp);assert.equal(g.boss.hp,bossHp);
});

test('endless ocean and fallen stained glass emerge from the sacred nave',()=>{
 const scene=new THREE.Scene(),chapel=createWhiteCathedral(scene,{coarse:true,reduced:true});
 const g=createBloodGame(),floor=named(scene,'cathedral-battle-floor');
 assert.ok(named(scene,'cathedral-collapse-glass'));
 assert.ok(named(scene,'cathedral-crimson-blood-sea'));
 assert.ok(!named(scene,'blood-sea-to-the-horizon').visible);
 g.boss.phase=2;g.boss.state='transition';g.blood.t=3;
 chapel.update(g,bloodTransformation(g),{light:.5});
 assert.ok(chapel.stats().rupture>0);
 assert.ok(named(scene,'cathedral-walls-bleed-during-rupture').visible);
 g.boss.state='recovery';chapel.update(g,bloodTransformation(g),{light:.65});
 assert.ok(named(scene,'blood-sea-to-the-horizon').visible);
 assert.ok(named(scene,'cathedral-sinking-ruins-on-blood-sea').visible);
 assert.equal(chapel.stats().bloodSea.horizonRadius,700);
 assert.equal(chapel.stats().bloodSea.damageSources,0);
 assert.equal(named(scene,'cathedral-battle-floor'),floor);
 assert.equal(BLOOD_RULES.radius,28);
 chapel.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});

test('crimson cloud dome, batched blood rain and irregular double-flash need no physics objects',()=>{
 const scene=new THREE.Scene(),storm=createBloodApocalypseSky(scene,{coarse:true}),g=createBloodGame();
 assert.ok(storm.stats().rainStreaks<=150);
 assert.ok(storm.stats().lightningSegments>15);
 storm.update(g);
 assert.equal(storm.root.visible,false);
 g.boss.phase=2;g.boss.state='recovery';
 g.time=12.5;
 storm.update(g);
 assert.ok(named(scene,'blood-crimson-sky-beyond-horizon'));
 assert.ok(named(scene,'blood-perpetual-rain').visible);
 assert.equal(storm.stats().damageSources,0);
 let peak=0;
 for(let t=0;t<40;t+=.015){g.time=t;peak=Math.max(peak,bloodStormEnvelope(g).flash);}
 assert.ok(peak>.8,'lightning must flash at least once every few seconds');
 storm.dispose();storm.dispose();
 assert.ok(!named(scene,'blood-apocalypse-horizon-and-storm'));
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('the new sea requiem is a readable multi-beat attack using real floor footprints',()=>{
 const g=createBloodGame();g.boss.phase=2;
 assert.ok(startBloodPattern(g,'requiem'));
 assert.equal(g.blood.hazards.length,4);
 assert.equal(BLOOD_PATTERNS.requiem.phase,2);
 assert.ok(g.blood.hazards.every(h=>h.warn>=1.2&&h.warn<BLOOD_PATTERNS.requiem.duration));
 assert.ok(g.blood.hazards.every(h=>h.damage>0));
 const field=bloodFloorField(g);
 assert.ok(field?.safety,'visible safe contrast required during a huge wave');
 assert.equal(field.hazards.length,4);
 const footprints=g.blood.hazards.map(bloodHazardFootprint);
 for(let i=0;i<4;i++){
  assert.equal(field.hazards[i].kind,footprints[i].kind);
  assert.equal(field.hazards[i].halfWidth,footprints[i].halfWidth);
 }
 g.player.hp=g.player.maxHp=1e8;
 for(let t=0;t<BLOOD_PATTERNS.requiem.duration+1;t+=.05)stepBlood(g,.05);
 assert.equal(g.status,'playing');
});

test('complete view renders the new blood sky and persists through retry without altering health',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true});
 const g=createBloodGame(),before=g.boss.hp;
 g.boss.phase=2;g.boss.state='transition';g.blood.t=4.2;
 view.update(g,.016);
 assert.ok(view.stats().storm.hasSky);
 assert.ok(named(scene,'blood-apocalypse-horizon-and-storm').visible);
 g.boss.state='recovery';view.update(g,.016);
 assert.equal(g.boss.hp,before);
 view.clear();view.update(createBloodGame(),.016);
 assert.equal(named(scene,'blood-apocalypse-horizon-and-storm').visible,false);
 view.dispose();view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
