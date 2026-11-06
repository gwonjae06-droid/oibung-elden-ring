import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantHazards,giantContactBeat,giantHandPose,giantHeadPose,giantPattern,hazardContains,skipGiant} from '../src/dice-giant.mjs';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';
import {PORTRAIT_BARRAGE} from '../src/dice-portrait-barrage.mjs';

function ready(slot=2,feral=false){
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 if(feral){damageDice(g,1000);stepDice(g,1/120);}
 const s=g.dice.giant,p=giantPattern(slot,{x:0,z:-42},feral?'feral':'controlled',.2);
 Object.assign(s,{state:'attack',slot,temperament:feral?'feral':'controlled',t:0,hazards:p.hazards,duration:p.duration});
 return {g,s,p};
}

test('a thrown chess piece cannot strike an empty 128-unit rectangle',()=>{
 const {g,s,p}=ready(4),h=p.hazards[0];
 const far={x:h.x,z:h.z+45};
 assert.ok(hazardContains(h,far),'the old invisible rectangle encompassed this point');
 s.t=h.start+h.warn+.02;
 const [live]=giantHazards(g);
 assert.equal(live.contactKind,'prop');
 assert.equal(live.shape,'circle');assert.ok(live.r<5);
 assert.equal(hazardContains(live,far),false);
 assert.equal(hazardContains(live,{x:h.x,z:h.z}),true);
 assert.equal(giantContactBeat(live),true);
 s.t=h.start+h.warn+.18;
 assert.equal(giantContactBeat(giantHazards(g)[0]),false,'projectile is gone after landing');
});

test('palm damage tracks the same smoothed three-dimensional palm as the renderer',()=>{
 const {g,s,p}=ready(7),h=p.hazards[0];
 s.t=h.start+h.warn+.015;
 const live=giantHazards(g).find(q=>q.id===h.id);
 const hand=giantHandPose(g,h.handIndex);
 assert.equal(live.contactKind,'palm');
 assert.equal(live.shape,'palm');
 assert.ok(Math.abs(live.x-hand.x)<1e-10);
 assert.ok(Math.abs(live.z-hand.z-3.8)<1e-10);
 assert.equal(hazardContains(live,{x:hand.x,z:hand.z+3.8}),true);
 assert.equal(hazardContains(live,{x:hand.x+23,z:hand.z+3.8}),false);
 assert.equal(giantContactBeat({...live,contactY:50}),false,'airborne fist cannot damage the floor');
 assert.equal(giantContactBeat({...live,contactY:2}),true);
});

test('feral head blast follows the actual model location and only damages on landing',()=>{
 const {g,s,p}=ready(2,true),h=p.hazards[0];
 s.t=h.start+h.warn+.02;
 const live=giantHazards(g)[0],head=giantHeadPose(g);
 assert.equal(live.contactKind,'head');
 assert.ok(Math.hypot(live.x-head.x,live.z-head.z)<1e-9);
 assert.equal(hazardContains(live,{x:head.x+20,z:head.z}),false);
 assert.equal(giantContactBeat(live),true);
 assert.equal(giantContactBeat({...live,contactY:30}),false);
});

test('portrait cards are at least 2.5x slower and can traverse the full board',()=>{
 assert.ok(PORTRAIT_BARRAGE.speed<=8);
 assert.ok(PORTRAIT_BARRAGE.life*PORTRAIT_BARRAGE.speed>70);
 assert.ok(PORTRAIT_BARRAGE.warning>=1.2);
});

test('hit animation never displaces the visible palm from the attackable pose',()=>{
 const scene=new THREE.Scene(),view=buildDiceGiant(scene),{g,s}=ready(7);
 try{
  view.update(g,1/60);
  const h=giantHandPose(g,0),palm=view.root.getObjectByName('sungwon-hand-0-palm');
  s.hands[0]-=24;view.update(g,1/60);
  assert.ok(Math.abs(palm.position.x-h.x)<1e-8);
  assert.ok(Math.abs(palm.position.z-h.z)<1e-8);
  assert.ok(Math.abs(palm.position.y-h.y)<1e-8);
  for(const part of ['sungwon-shoulder-joint-0','sungwon-wrist-sleeve-0']){
   const p=view.root.getObjectByName(part);assert.ok(p?.isMesh);
   assert.ok(p.position.toArray().every(Number.isFinite));
  }
  for(let i=0;i<100;i++){s.t=i*.016;view.update(g,.016);}
  assert.equal(view.root.getObjectByName('sungwon-wrist-sleeve-1').visible,true);
 }finally{assert.equal(view.dispose().errors.length,0);}
});
