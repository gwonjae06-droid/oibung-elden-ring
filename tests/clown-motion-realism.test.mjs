import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {solveFixedLimb,smoothYaw,stageFootTarget,circusFootPhasing} from '../src/clown-performance-rig.mjs';
import {clownCuePalette,createClownDangerSpotlight,clownSpotlightLayout} from '../src/clown-danger-spotlight.mjs';
import {createClownTheatreCues,clownTheatreCueKind} from '../src/clown-theatre-cues.mjs';
import {createClownActor} from '../src/clown-ringmaster-actor.mjs';
import {createCircusTroupeView} from '../src/clown-troupe-view.mjs';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
test('new two-bone rig has fixed upper and lower lengths at all targets',()=>{
 for(let i=0;i<1000;i++){
  const a=[Math.sin(i*.1),3.5,Math.cos(i*.21)],b=[Math.cos(i)*2,2.1+Math.sin(i*.12)*3,2*Math.sin(i*.19)];
  const r=solveFixedLimb(a,b,{upper:1.38,lower:1.32,pole:[1,-.22,.5]});
  assert.ok(Math.abs(distance(r.start,r.joint)-1.38)<1e-7);
  assert.ok(Math.abs(distance(r.joint,r.end)-1.32)<1e-7);
  assert.ok(r.end.every(Number.isFinite));
 }
});
test('shortest-path yaw and stance do not snap around the PI seam',()=>{
 const before=Math.PI-.02,after=-Math.PI+.02,next=smoothYaw(before,after,1/60,10);
 assert.ok(Math.abs(next-before)<.01);
 const a=circusFootPhasing(0,1,-1),b=circusFootPhasing(0,1,1);
 assert.ok(a.lift>=0&&b.lift>=0);assert.ok(a.support!==b.support);
 const grounded=stageFootTarget([0,-1,1],x=>x,x=>x,{soleRadius:.29,worldScale:1.25,plant:true});
 assert.equal(grounded[1],.29*1.25);
});
test("the ringmaster's grounded shoes remain above stage throughout neutral phases",()=>{
 const actor=createClownActor({coarse:true}),g=createClownGame('sword',{register:false});
 actor.root.scale.setScalar(1.25);
 for(const phase of[1,2]){
  g.boss.phase=phase;g.boss.state='clown';g.clown.state='idle';
  for(let i=0;i<20;i++){g.clown.time+=1/60;actor.update(g,1/60);}
  actor.root.updateWorldMatrix(true,true);
  let feet=0;
  actor.root.traverse(m=>{if(m.name==='solid-floor-contact-shoe'){
   const y=m.getWorldPosition(new THREE.Vector3()).y;
   assert.ok(Number.isFinite(y)&&y>=.29*1.25-.05&&y<=.29*1.25+.08,phase+': '+y);
   feet++;
  }});
  assert.equal(feet,2);
 }
});
test('new choir and puppet shadow effects follow true warnings and dispose afterwards',()=>{
 const scene=new THREE.Scene(),effects=createClownTheatreCues(scene,{coarse:true});
 const g={time:0,clown:{zones:[
  {id:1,state:'warn',age:.3,warn:1.3,shape:'lane',x:1,z:3,len:14,w:2.7,yaw:.2,sound:'choir'},
  {id:2,state:'warn',age:.4,warn:1.4,shape:'lane',x:-2,z:4,len:10,w:2.7,yaw:0,sound:'puppet'}]}};
 assert.equal(clownTheatreCueKind(g.clown.zones[0]),'choir');
 effects.update(g,1/60);assert.equal(effects.stats().active,2);
 assert.ok(effects.root.getObjectByName('resonant-choir-air-ring'));
 assert.ok(effects.root.getObjectByName('tensioned-strings-over-actual-puppet-lane'));
 g.clown.zones[0].state='burst';g.clown.zones[1].state='burst';
 effects.update(g,1/60);assert.equal(effects.stats().active,0);
 effects.dispose();
});
test('performance stage glow colors distinguish fire, choir, puppet and phantom without invented warnings',()=>{
 const sounds=['infernalHoops','choir','puppet','falseRingmaster'];
 const colors=sounds.map(sound=>clownCuePalette({sound}).color);
 assert.equal(new Set(colors).size,4);
 const scene=new THREE.Scene(),z={shape:'circle',state:'warn',x:0,z:0,r:3,warn:1.3,age:.5,damage:21,sound:'choir'};
 const object=createClownDangerSpotlight(THREE,scene,z);
 assert.ok(object.userData.spotlightUpdate);
 object.userData.spotlightUpdate(z);
 assert.ok(clownSpotlightLayout(z).sx>0);
 const gobo=object.getObjectByName('clown-spotlit-danger-footprint');
 assert.equal(gobo.material.uniforms.uTint.value.getHex(),clownCuePalette(z).color);
 disposeScene(object);
});
test('living troupe spawns with real leg joints and has correct singer mouth proportions',()=>{
 const game=createClownGame('sword',{register:false});
 const scene=new THREE.Scene(),created=[],view=createCircusTroupeView(scene,{
  coarse:true,onActorCreated:group=>created.push(group)});
 for(let i=0;i<90;i++)stepClown(game,1/60);
 view.update(game,1/60);
 assert.ok(created.length>=3);
 assert.ok(view.root.getObjectByName('articulated-troupe-thigh'));
 assert.ok(view.root.getObjectByName('constrained-troupe-knee'));
 for(const entry of created){
  const shoes=entry.getObjectsByProperty('name','solid-stage-shoe');
  assert.equal(shoes.length,2);
  for(const m of shoes){
   const y=m.getWorldPosition(new THREE.Vector3()).y;
   assert.ok(Number.isFinite(y)&&y>=-.04,'stage penetration '+y);
  }
  if(entry.name==='circus-member-chorister'){
   const jaw=entry.getObjectByName('singing-mask-mouth');
   assert.ok(jaw.scale.y<.4,'the singer mouth is no longer a 2.2m slab');
  }
 }
 view.dispose();
});
