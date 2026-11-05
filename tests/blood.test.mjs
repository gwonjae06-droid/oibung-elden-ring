import test from 'node:test';
import assert from 'node:assert/strict';
import {createBloodGame,actBlood,stepBlood,startBloodPattern,damageBlood,skipBloodTransition} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardContains,hazardPosition} from '../src/blood-data.mjs';
import {freshProfile,loadProfile,newRun,finishAttempt,advanceJourney} from '../src/journey-state.mjs';
import {createEncounterStore} from '../src/encounter-state.mjs';
import {score} from '../src/boss-score.mjs';
const advance=(g,seconds,input={})=>{for(let t=0;t<seconds-1e-8;t+=.01)stepBlood(g,.01,input);};
test('all twenty-two patterns have warnings, bounded shapes, a safe point and melee recovery',()=>{
 assert.equal(bloodPool(1).length,11);assert.equal(bloodPool(2).length,11);
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;g.player.x=8;g.player.z=8;g.player.hp=g.player.maxHp=1e6;
  assert.ok(startBloodPattern(g,id));assert.ok(g.blood.hazards.length);assert.ok(g.blood.hazards.every(h=>h.warn>=.6));
  const hp=g.player.hp;advance(g,.5);assert.equal(g.player.hp,hp,id+' damaged before warning');
  // Evaluate the complete field every beat, including simultaneous hazards.
  for(let t=.5;t<spec.duration;t+=.1){const active=g.blood.hazards.filter(h=>h.age>=h.warn&&h.age<h.warn+h.life);let safe=false;for(let x=-24;x<=24&&!safe;x+=3)for(let z=-24;z<=24;z+=3)if(Math.hypot(x,z)<26&&active.every(h=>!hazardContains(h,{x,z}))){safe=true;break;}assert.ok(safe,id+' has no safe area at '+t);advance(g,.1);}
  advance(g,.2);assert.equal(g.boss.state,'recovery',id);assert.equal(g.blood.elevation,0);assert.equal(g.blood.hazards.length,0);assert.ok(g.blood.recover>1.5);
 }
});
test('half health waits for current attack, freezes all damage, transitions once without transition healing',()=>{
 const g=createBloodGame();startBloodPattern(g,'wave');advance(g,.3);damageBlood(g,3400);const before=g.boss.hp;assert.equal(g.boss.phase,1);assert.equal(g.boss.state,'pattern');advance(g,BLOOD_PATTERNS.wave.duration+.1);assert.equal(g.boss.state,'transition');assert.equal(g.boss.phase,2);assert.equal(damageBlood(g,99999),0);assert.equal(actBlood(g,'light'),false);assert.equal(g.blood.hazards.length,0);const hp=g.boss.hp;assert.equal(hp,before+g.events.filter(e=>e.type==='boss-drain').reduce((n,e)=>n+e.amount,0));advance(g,.4);assert.equal(g.boss.hp,hp);assert.ok(skipBloodTransition(g));stepBlood(g,.01);assert.equal(g.boss.state,'recovery');assert.equal(g.blood.elevation,0);advance(g,.2);assert.equal(g.events.filter(e=>e.type==='phase').length,1);
});
test('real attacks can damage and defeat the grounded core with every weapon',()=>{
 for(const weapon of ['sword','hammer','bow','cards']){
  const g=createBloodGame(weapon);g.boss.phase=2;g.blood.transitioned=true;g.boss.hp=40;g.blood.recover=10;g.player.z=-2;assert.ok(actBlood(g,'light'));advance(g,1.3);assert.equal(g.status,'won',weapon);assert.equal(g.blood.hazards.length,0);assert.equal(g.projectiles.length,0);assert.ok(g.stats.damage>0);
 }
});
test('airborne core resists melee then lands close enough for a counterattack',()=>{
 const g=createBloodGame();g.boss.phase=2;g.player.z=-2;startBloodPattern(g,'eclipse');advance(g,.5);assert.ok(g.blood.elevation>2);const hp=g.boss.hp;assert.ok(actBlood(g,'light'));advance(g,.6);assert.equal(g.boss.hp,hp);advance(g,BLOOD_PATTERNS.eclipse.duration-1.1+.2);assert.equal(g.boss.state,'recovery');assert.equal(g.blood.elevation,0);assert.ok(actBlood(g,'light'));advance(g,.4);assert.ok(g.boss.hp<hp);
});
test('chain slow leaves a full-speed roll and enough warning to escape the fountain',()=>{
 const g=createBloodGame();g.player.x=5;g.player.z=5;startBloodPattern(g,'chain');const chainOnset=g.blood.hazards[0].warn;advance(g,chainOnset+.03);assert.ok(g.blood.slow>0);assert.ok(actBlood(g,'roll',{x:1}));advance(g,.55);assert.ok(g.player.x>9.8&&g.player.x<11,'roll matches shared 10-unit dodge, not the former 18-unit dash');const hp=g.player.hp;advance(g,1.1);assert.equal(g.player.hp,hp);
});
test('zero time freezes hazards, invalid input is ignored and victory clears all attacks',()=>{
 const g=createBloodGame();startBloodPattern(g,'fountain');const snapshot=JSON.stringify(g);for(const dt of[0,NaN,-1,Infinity])stepBlood(g,dt);assert.equal(JSON.stringify(g),snapshot);g.boss.phase=2;damageBlood(g,99999);assert.equal(g.status,'won');assert.equal(g.blood.hazards.length,0);const won=JSON.stringify(g);stepBlood(g,1);assert.equal(JSON.stringify(g),won);assert.equal(createBloodGame().boss.phase,1);
});
test('legacy clears never unlock the fourth seal, and 3/4 boss records stay distinct',()=>{
 const old={version:2,clears:1,records:[{time:10,weapon:'sword',mode:'story',deaths:0}],memories:[],defeated:[]};const p=loadProfile({getItem:()=>JSON.stringify(old)});assert.deepEqual(p.defeated,['kwon','clown','dice']);assert.equal(p.records[0].bossCount,3);assert.equal(p.version,4);
 p.run=newRun();p.run.stage=2;assert.equal(finishAttempt(p,{won:true,time:2}),'flame');advanceJourney(p.run);assert.equal(p.run.stage,3);assert.equal(finishAttempt(p,{won:true,time:3}),'complete');assert.equal(p.records[1].bossCount,4);assert.equal(p.memories.at(-1).id,'blood');
 const store=createEncounterStore();store.register(createBloodGame());assert.equal(store.read().bossId,'blood');assert.ok(score('blood',1,0).length);assert.notDeepEqual(score('blood',1,0),score('blood',2,0));
});
