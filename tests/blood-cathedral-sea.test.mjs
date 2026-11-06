import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CATHEDRAL_BLOOD_SEA,createCathedralBloodSea} from '../src/blood-cathedral-sea.mjs';
import {createWhiteCathedral} from '../src/blood-white-cathedral.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_RULES} from '../src/blood-data.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const named=(scene,name)=>{let found=null;scene.traverse(o=>{if(o.name===name)found=o;});return found;};
const near=(v,w,p=.01)=>Math.abs(v-w)<p;

test('animated blood sea fills the cathedral rectangle but leaves the entire gameplay disk dry',()=>{
 const scene=new THREE.Scene(),sea=createCathedralBloodSea(scene,{radius:BLOOD_RULES.radius});
 const s=sea.stats(),surface=named(scene,'cathedral-blood-sea-surface');
 assert.ok(surface?.isMesh);assert.equal(s.radius,32);
 assert.equal(s.isDecorative,true);assert.equal(s.damageSources,0);
 assert.ok(s.innerRadius>32.4&&s.innerRadius<32.9);
 assert.ok(s.halfWidth<42,'sea must not run through cathedral masonry');
 assert.ok(s.halfLength<48,'sea must not run through sanctuary end-wall');
 assert.ok(s.ripples>=20&&s.reflections>=14);
 assert.ok(named(scene,'cathedral-dry-marble-shoreline'));
 assert.ok(named(scene,'cathedral-crimson-lapping-shore'));
 assert.ok(named(scene,'cathedral-blood-sea-stained-glass-reflections')?.isInstancedMesh);
 assert.ok(named(scene,'cathedral-blood-sea-ripple-instances')?.isInstancedMesh);
 const geometry=surface.geometry,pos=geometry.getAttribute('position'),index=geometry.getIndex();
 let minRadius=Infinity;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z);
  minRadius=Math.min(minRadius,r);
  assert.ok(r>=32.38,'sea vertex encroaches on combat radius: '+r);
  assert.ok(Math.abs(x)<=CATHEDRAL_BLOOD_SEA.halfWidth+.001);
  assert.ok(Math.abs(z)<=CATHEDRAL_BLOOD_SEA.halfLength+.001);
 }
 assert.ok(index&&index.count>24,'sea must be triangulated around its circular hole');
 for(let i=0;i<index.count;i+=3){
  const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
  const x=(pos.getX(a)+pos.getX(b)+pos.getX(c))/3;
  const z=(pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/3;
  assert.ok(Math.hypot(x,z)>32,'sea triangle would render across playable ground');
 }
 assert.ok(near(surface.position.y,CATHEDRAL_BLOOD_SEA.surfaceHeight));
 assert.equal(named(scene,'cathedral-crimson-blood-sea'),sea.root);
 sea.dispose();sea.dispose();assert.equal(named(scene,'cathedral-crimson-blood-sea'),null);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('moving sea reacts to boss phase without altering boss/player health or mechanics',()=>{
 const scene=new THREE.Scene(),sea=createCathedralBloodSea(scene);
 const g=createBloodGame(),initial={hp:g.boss.hp,playerHp:g.player.hp,radius:BLOOD_RULES.radius};
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
 sea.water.onBeforeCompile(shader);
 assert.ok(shader.uniforms.uSeaTime&&shader.uniforms.uSeaFrenzy);
 assert.match(shader.vertexShader,/transformed\.y/);
 assert.match(shader.fragmentShader,/vSeaSheen/);
 g.time=3.25;sea.update(g);
 assert.equal(shader.uniforms.uSeaTime.value,3.25);
 assert.equal(shader.uniforms.uSeaFrenzy.value,0);
 g.boss.phase=2;sea.update(g);
 assert.equal(shader.uniforms.uSeaFrenzy.value,1);
 assert.ok(sea.water.emissiveIntensity>.33);
 assert.equal(g.boss.hp,initial.hp);
 assert.equal(g.player.hp,initial.playerHp);
 assert.equal(BLOOD_RULES.radius,initial.radius);
 sea.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('mobile sea uses fewer instanced ripples and respects reduced-motion setting',()=>{
 const scene=new THREE.Scene(),sea=createCathedralBloodSea(scene,{coarse:true,reduced:true});
 assert.equal(sea.stats().ripples,10);
 assert.equal(sea.stats().reflections,7);
 assert.ok(named(scene,'cathedral-blood-sea-surface').geometry.getAttribute('position').count<160);
 const game=createBloodGame();game.time=8;sea.update(game);
 assert.equal(sea.stats().damageSources,0);
 sea.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
test('full blood view retains white playable island and animated crimson sea across retries',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true});
 const game=createBloodGame(),hp=game.boss.hp;
 for(let i=0;i<15;i++){game.time+=.05;view.update(game,.05);}
 const shore=named(scene,'cathedral-dry-marble-shoreline');
 assert.ok(shore);
 assert.ok(named(scene,'cathedral-blood-sea-surface'));
 assert.equal(view.stats().bloodSea.radius,BLOOD_RULES.radius);
 assert.equal(view.stats().bloodSea.damageSources,0);
 assert.equal(game.boss.hp,hp);
 view.clear();view.update(createBloodGame(),.02);
 assert.ok(named(scene,'cathedral-blood-sea-surface'),'the scene should persist across reset');
 view.dispose();view.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});
