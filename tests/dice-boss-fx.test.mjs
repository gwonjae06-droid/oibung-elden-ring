import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDiceBossFx,diceBossFxCue} from '../src/dice-boss-fx.mjs';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {skipGiant} from '../src/dice-giant.mjs';

const first=()=>createDicePlayerGame();
function phaseTwo(){
 const g=first();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);g.events.length=0;return g;
}
function phaseThree(){
 const g=phaseTwo();damageDice(g,1000);g.events.length=0;return g;
}
test('phase-specific effects are driven by simulation events, not pre-damage danger footprints',()=>{
 const g=first(),a=diceBossFxCue({type:'dice-impact',x:8,z:-8},g);
 assert.equal(a.kind,'landing');assert.equal(a.phase,1);assert.equal(a.x,8);
 assert.equal(diceBossFxCue({type:'dice-stomp',x:0,z:0},g).kind,'stomp');
 assert.equal(diceBossFxCue({type:'dice-jump-warning'},g),null);
 assert.equal(diceBossFxCue({type:'dice-charge-warning'},g),null);
 assert.equal(diceBossFxCue({type:'dice-warning'},g),null);
 const b=phaseTwo();
 assert.equal(diceBossFxCue({type:'dice-giant-hand-destroyed',index:1},b).kind,'hand-break');
 assert.equal(diceBossFxCue({type:'dice-giant-hand-recovered',index:0},b).phase,2);
 assert.equal(diceBossFxCue({type:'dice-giant-hand-hit',index:99},b),null);
 const c=phaseThree();
 assert.equal(diceBossFxCue({type:'dice-giant-feral'},c).phase,3);
 assert.deepEqual(diceBossFxCue({type:'dice-giant-head-impact',x:12,z:-40,rapid:true},c),
 {kind:'head-slam',phase:3,x:12,y:1.1,z:-40,power:.83});
});
test('real Three.js pool survives all phases, keeps a fixed capacity and disposes cleanly',()=>{
 const scene=new THREE.Scene(),fx=createDiceBossFx(scene),g=first();
 try{
  assert.equal(fx.root.name,'sungwon-boss-impact-fx');
  for(let i=0;i<120;i++)fx.event({type:'dice-impact',x:(i%12)*2,z:-10},g);
  fx.update(1/60,g);
  assert.ok(fx.stats().particles>0);assert.ok(fx.stats().particles<=fx.stats().capacity);
  const a=phaseTwo();fx.event({type:'dice-giant-hand-destroyed',index:0},a);
  fx.update(1/60,a);assert.ok(fx.stats().particles>0);
  const b=phaseThree();fx.event({type:'dice-giant-feral'},b);
  fx.event({type:'dice-giant-head-impact',x:4,z:-43},b);
  fx.update(.016,b);
  assert.ok(fx.stats().waves>0);assert.ok(fx.stats().flash>0);
  scene.traverse(o=>{assert.ok(Number.isFinite(o.position.x)&&Number.isFinite(o.position.y)&&Number.isFinite(o.position.z));});
  for(let i=0;i<150;i++)fx.update(.05,b);
  assert.equal(fx.stats().particles,0);assert.equal(fx.stats().waves,0);
  fx.event({type:'victory'},b);fx.update(.016,b);assert.ok(fx.stats().particles>0);
  fx.clear();assert.equal(fx.stats().particles,0);
 }finally{assert.deepEqual(fx.dispose().errors,[]);}
 assert.ok(!scene.children.includes(fx.root));
 assert.deepEqual(fx.dispose().errors,[]);
});
test('mobile and reduced motion effects are capped and never alter health or boss state',()=>{
 const scene=new THREE.Scene(),fx=createDiceBossFx(scene,{coarse:true,reduced:true}),g=phaseThree();
 const hp=g.player.hp,bossHp=g.boss.hp,state=g.dice.giant.state;
 try{
  fx.event({type:'dice-giant-head-impact',x:2,z:-40},g);
  fx.update(.05,g);
  assert.ok(fx.stats().particles<=55);
  assert.equal(g.player.hp,hp);assert.equal(g.boss.hp,bossHp);
  assert.equal(g.dice.giant.state,state);
  fx.update(0,g);assert.equal(g.boss.hp,bossHp);
 }finally{fx.dispose();}
});
