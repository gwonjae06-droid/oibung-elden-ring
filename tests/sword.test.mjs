import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,swordPose,swordSegment,bodyPoint,handPoint,cinematicPose,SWORD,PATTERNS,BOSS_SCALE,bladeHits} from '../src/combat.mjs';
test('boss is 40 percent larger and greatsword length is 8.55',()=>{assert.equal(BOSS_SCALE,1.4);assert.equal(SWORD.length,8.55);const b=createGame().boss;assert.ok(Math.abs(bodyPoint(b,{x:1,y:2,z:3}).x-1.4)<1e-9);});
test('one blade keeps its exact length in every phase, state and strike',()=>{
  const b=createGame().boss;for(const phase of [1,2])for(const pattern of Object.keys(PATTERNS))for(const state of ['windup','active','recovery','idle','transition'])for(const t of [0,.1,.5,3.5,5.2]){
    Object.assign(b,{phase,pattern,state,t});const p=swordPose(b),s=swordSegment(b);for(const x of Object.values(p))assert.ok(Number.isFinite(x));assert.ok(Math.abs(Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y,s.a.z-s.b.z)-SWORD.length)<1e-6);}
});
test('equipped sword root moves away from the neck to the two hand grip',()=>{
  const b=createGame().boss;b.phase=2;b.state='idle';const p=swordPose(b);assert.equal(p.x,.4);assert.equal(p.y,5.2);assert.equal(p.z,2.4);
  const l=handPoint(b,-1),r=handPoint(b,1);assert.ok(Math.abs(Math.hypot(l.x-r.x,l.y-r.y,l.z-r.z)-.7)<1e-8);
  assert.ok(Math.hypot(p.y-bodyPoint(b,SWORD).y,p.z-bodyPoint(b,SWORD).z)>1);
});
test('detachment path is continuous and never teleports between neck and hands',()=>{
  const b=createGame().boss;b.phase=2;b.state='transition';let prev=null;
  for(let i=0;i<=520;i++){b.t=i/100;const p=swordPose(b);if(prev)assert.ok(Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z)<.15);prev=p;}
});
test('overhead blade only damages at player height, not below an airborne section',()=>{
  const s={a:{x:0,y:7,z:0},b:{x:0,y:0,z:7}};assert.equal(bladeHits({x:0,z:1},s),false);assert.equal(bladeHits({x:0,z:6},s),true);
});
