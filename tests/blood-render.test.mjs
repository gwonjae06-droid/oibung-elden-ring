import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,startBloodPattern,stepBlood,damageBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
import {hazardPosition,hazardContains} from '../src/blood-data.mjs';
test('the wing strike shows its actual blade instead of a red ground cone',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene),g=createBloodGame();
 g.player.x=12;g.player.z=7;g.boss.phase=2;startBloodPattern(g,'wing');
 const h=g.blood.hazards[0];h.age=h.warn*.65;view.update(g,.01);
 const groups=[];scene.traverse(o=>{if(o.userData?.spellForm==='blade')groups.push(o);});
 assert.ok(groups.some(o=>o.visible),'the wing has a visible physical spell');
 assert.equal(scene.children.some(o=>o.userData?.hazardId===h.id),false);
 assert.ok(hazardContains(h,{x:h.x,z:h.z}),'authoritative collision remains in simulation');
 view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('real Three meshes cover every blood hazard and release transient geometry',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),g=createBloodGame(),camera=new THREE.PerspectiveCamera(60,2,.1,160);camera.position.set(0,20,35);g.player.hp=1e6;
 const base=scene.children.length;
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  g.boss.phase=spec.phase;startBloodPattern(g,id);for(let t=0;t<spec.duration+.1;t+=.05){stepBlood(g,.05);view.update(g,.05);view.occlude(camera,g);scene.traverse(o=>{assert.ok(Number.isFinite(o.position.x)&&Number.isFinite(o.scale.y));});}
  assert.equal(scene.children.length,base,id+' leaked a hazard mesh');
 }
 // The mandatory tsunami is validated separately; here only teardown after
 // an already-completed wave is relevant to the visual-resource test.
 g.blood.requiredTsunamiStarted=g.blood.requiredTsunamiDone=true;
 damageBlood(g,1e7);view.update(g,.1);assert.equal(g.status,'won');view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
