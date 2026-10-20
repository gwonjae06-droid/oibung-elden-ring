import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossFlow,flowAlpha,wrapDelta,FLOW_RATE} from '../src/boss-flow.mjs';
const obj=()=>({position:{x:0,y:0,z:0},rotation:{x:0,y:0},parent:null});
function rig(){const scene={},root=obj(),model=obj(),sword=obj();root.parent=scene;model.parent=root;sword.parent=model;return {scene,root,sword};}
const game=state=>({boss:{state}});
test('strikes follow the logic quickly while wind-up and recovery flow more gently',()=>{
  const dt=1/60;
  assert.ok(flowAlpha('active',dt)>flowAlpha('windup',dt));assert.ok(flowAlpha('windup',dt)>flowAlpha('recovery',dt));
  for(const k of Object.keys(FLOW_RATE)){const a=flowAlpha(k,dt);assert.ok(a>0&&a<1,k);}
  assert.equal(flowAlpha('idle',0),0);assert.equal(flowAlpha('idle',-1),0);assert.equal(flowAlpha('idle',99),flowAlpha('idle',.05));
});
test('a sudden pose change is blended over several frames instead of snapping',()=>{
  const {scene,root,sword}=rig(),flow=createBossFlow(sword,scene),g=game('recovery');
  sword.position.y=5;sword.rotation.y=1.4;sword.rotation.x=.7;flow.update(1/60,g);
  sword.position.y=2;sword.rotation.y=0;sword.rotation.x=-.6;flow.update(1/60,g);
  assert.ok(sword.position.y>2&&sword.position.y<5);assert.ok(sword.rotation.y>0&&sword.rotation.y<1.4);
  const first=sword.position.y;
  for(let i=0;i<120;i++){sword.position.y=2;sword.rotation.y=0;sword.rotation.x=-.6;flow.update(1/60,g);}
  assert.ok(Math.abs(sword.position.y-2)<.01&&Math.abs(sword.rotation.y)<.01);assert.ok(first>sword.position.y);
});
test('every frame the smoothed pose moves monotonically toward a held target with no overshoot',()=>{
  const {scene,sword}=rig(),flow=createBossFlow(sword,scene),g=game('windup');
  sword.rotation.y=0;flow.update(1/60,g);let prev=0;
  for(let i=0;i<90;i++){sword.rotation.y=1.3;flow.update(1/60,g);assert.ok(sword.rotation.y>=prev-1e-12&&sword.rotation.y<=1.3+1e-12);prev=sword.rotation.y;}
});
test('the body turn takes the short way around the circle',()=>{
  const {scene,root,sword}=rig(),flow=createBossFlow(sword,scene),g=game('windup');
  root.rotation.y=3.0;flow.update(1/60,g);
  root.rotation.y=-3.0;flow.update(1/60,g);
  const moved=wrapDelta(3.0,root.rotation.y);assert.ok(moved>0&&moved<0.283,String(moved));
  assert.ok(Math.abs(wrapDelta(Math.PI-.1,-Math.PI+.1)-.2)<1e-9);
});
test('a new game snaps to the target and a paused frame holds the pose',()=>{
  const {scene,root,sword}=rig(),flow=createBossFlow(sword,scene);
  const g1=game('idle');sword.position.x=3;flow.update(1/60,g1);sword.position.x=9;flow.update(0,g1);assert.equal(sword.position.x,3);
  const g2=game('idle');sword.position.x=9;root.rotation.y=2;flow.update(1/60,g2);assert.equal(sword.position.x,9);assert.equal(root.rotation.y,2);
  flow.reset();sword.position.x=-4;flow.update(1/60,g2);assert.equal(sword.position.x,-4);
});
test('the root is found by walking up to the scene child',()=>{
  const {scene,root,sword}=rig(),flow=createBossFlow(sword,scene),g=game('idle');
  root.rotation.y=1;flow.update(1/60,g);root.rotation.y=2;flow.update(1/60,g);assert.ok(root.rotation.y>1&&root.rotation.y<2);
});
