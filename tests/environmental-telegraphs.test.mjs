import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {kwonEnvironmentCue,clownEnvironmentCue,diceEnvironmentCue,bloodEnvironmentCue} from '../src/environmental-telegraphs.mjs';
import {buildDiceGiant} from '../src/dice-giant-view.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantPattern,skipGiant,giantHazards} from '../src/dice-giant.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';

test('common attacks draw no exact hitbox; special attacks use environment cues',()=>{
 for(const name of ['sweep','thrust','backsweep','rush','jab','shove'])assert.equal(kwonEnvironmentCue({active:false},name),null,name);
 for(const name of ['slam','leap','stomp'])assert.equal(kwonEnvironmentCue({active:false},name),'stone-tremor',name);
 assert.equal(kwonEnvironmentCue({active:true},'slam'),null);
 const z={state:'warn',visual:false,shape:'circle',blast:true};
 assert.equal(clownEnvironmentCue(z,'juggle'),null);
 assert.equal(clownEnvironmentCue(z,'fireHoop'),'stage-light');
 assert.equal(clownEnvironmentCue(z,'fireHoop',true),null);
 assert.equal(clownEnvironmentCue({...z,visual:true},'humanCannon'),null);
 assert.equal(clownEnvironmentCue({...z,state:'burst'},'fireHoop'),null);
 assert.equal(bloodEnvironmentCue('wing'),null);
 assert.equal(bloodEnvironmentCue('eclipse'),'blood-coalescence');
 assert.equal(diceEnvironmentCue({headSlam:true,live:false},{}),'falling-shadow');
 assert.equal(diceEnvironmentCue({headSlam:true,live:true},{}),null);
 assert.equal(diceEnvironmentCue({handIndex:0,live:false},{}),'falling-shadow');
});
test('Sungwon falling shadows are smaller than the real hazard and disappear on impact',()=>{
 const scene=new T.Scene(),view=buildDiceGiant(scene),g=createDicePlayerGame();
 try{
  damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
  const s=g.dice.giant,p=giantPattern(7,{x:0,z:-40});
  Object.assign(s,{state:'attack',slot:7,t:.3,hazards:p.hazards,duration:p.duration});
  view.update(g,.016);
  const shadows=view.root.children.filter(o=>o.isMesh&&o.material?.color?.getHex?.()===0x100c13);
  assert.ok(shadows.some(o=>o.visible));
  assert.ok(shadows.filter(o=>o.visible).every(o=>o.scale.x<6),'shadows must never trace the collider');
  const haz=giantHazards(g)[0];assert.ok(haz.r||haz.w);
  s.t=p.hazards[0].warn+.02;view.update(g,.016);
  assert.ok(shadows.length>0);
 }finally{assert.deepEqual(view.dispose().errors,[]);}
});
test('blood specials gather visible 3D matter without creating a floor hitbox overlay',()=>{
 const scene=new T.Scene(),view=buildBloodView(scene),g=createBloodGame();
 try{
  g.boss.phase=2;startBloodPattern(g,'eclipse');
  const h=g.blood.hazards[0];h.age=h.warn*.65;view.update(g,.016);
  const group=[];scene.traverse(o=>{if(o.userData?.spellForm==='corona')group.push(o);});
  assert.ok(group.some(o=>o.visible));
  assert.ok(view.stats().hazards>0);
  assert.ok(scene.children.every(o=>o.userData?.hazardId!==h.id));
 }finally{view.dispose();}
});
