import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';
import {buildCasinoRoom} from '../src/casino-room.mjs';
import {createDicePlayerGame,stepDicePlayer} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {giantHeadPose,giantPattern,skipGiant,GIANT} from '../src/dice-giant.mjs';

test('real Three.js casino scene and giant meshes render-update through every possession beat',()=>{
 const scene=new THREE.Scene(),giant=buildDiceGiant(scene),room=buildCasinoRoom(THREE,scene);
 const g=createDicePlayerGame();
 const camera=new THREE.PerspectiveCamera(70,1,.1,400);
 camera.position.set(0,40,40);
 try{
  giant.update(g,1/60);room.update(g.time,g,1/60);
  damageDice(g,1500);assert.equal(g.dice.giant.state,'transition');
  for(const t of [0,.4,.6,1,2,3.59,3.61,3.85,4.2,4.5,5,5.7,6.5,6.99]){
   g.dice.giant.t=t;g.dice.pose=giantHeadPose(g);
   assert.doesNotThrow(()=>{giant.update(g,1/60);room.update(t,g,1/60);giant.occlude(camera,g.player);},'transition beat '+t);
  }
  skipGiant(g);stepDicePlayer(g,.02);
  for(const state of ['recovery','attack','wounded','dead']){
   g.dice.giant.state=state;g.dice.giant.t=state==='wounded'?1.2:1.5;
   g.dice.giant.slot=2;g.dice.giant.temperament='feral';
   g.dice.giant.hazards=giantPattern(2,{x:0,z:-42},'feral').hazards;
   g.dice.pose=giantHeadPose(g);
   assert.doesNotThrow(()=>{giant.update(g,1/60);room.update(g.time,g,1/60);giant.occlude(camera,g.player);},state);
  }
 }finally{giant.dispose();}
});
