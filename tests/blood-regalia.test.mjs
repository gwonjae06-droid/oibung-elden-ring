import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBloodHead,bloodHeadGeometry} from '../src/blood-head.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test('portrait remains an actual volumetric face with detailed joined features',()=>{
 const geometry=bloodHeadGeometry({coarse:true});geometry.computeBoundingBox();
 assert.ok(geometry.boundingBox.max.z-geometry.boundingBox.min.z>1.1);
 const h=createBloodHead({coarse:true,reduced:true});
 assert.equal(h.group.children.length,2);
 assert.ok(h.group.children[0].isMesh);
 assert.ok(h.group.children[0].children.length>=10,'ears, sideburns, hair and crown are all spatial geometry');
 assert.equal(h.group.children.some(c=>c.isSprite||c.geometry?.type==='PlaneGeometry'),false);
 const g=createBloodGame();h.update(g,{prayer:0},.016);
 g.boss.hp-=250;h.update(g,{prayer:1},.016);
 assert.ok(Number.isFinite(h.group.rotation.x));
 h.clear();assert.equal(h.group.rotation.x,0);h.dispose();h.dispose();geometry.dispose();
});

test('regalia articulates sleeves and fingers and reveals phase-two anatomy without spawning meshes',()=>{
 const root=new THREE.Group(),regalia=createBloodRegalia(root,{coarse:true});
 const game=createBloodGame();
 const meshCount=()=>{let n=0;root.traverse(o=>{if(o.isMesh)n++;});return n;};
 const before=meshCount();assert.ok(before>40,'multiple sculpted torso, hand and garment pieces');
 assert.equal(regalia.arms.length,2);
 assert.ok(regalia.drapes.length>=8);
 regalia.update(game,{veins:0},.016,0);
 assert.equal(regalia.growth.visible,false);
 const initialAngle=regalia.arms[0].arm.rotation.x;
 regalia.update(game,{veins:1},1,1);
 assert.ok(regalia.growth.visible);
 assert.ok(regalia.arms.every(a=>a.thorn.visible));
 assert.ok(regalia.arms[0].arm.rotation.x<initialAngle);
 for(let i=0;i<100;i++){game.time+=.02;regalia.update(game,{veins:1},.02,0);}
 assert.equal(meshCount(),before,'no runtime geometry allocation');
 assert.deepEqual(disposeScene(root).errors,[]);
});

test('complete model resets and clears with phase-one and phase-two head transitions',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=createBloodGame();
 for(let i=0;i<12;i++){g.time+=.1;view.update(g,.1);}
 g.boss.phase=2;g.boss.state='transition';g.blood.t=2.5;
 view.update(g,.1);
 g.boss.state='recovery';view.update(g,.1);
 const named=[];scene.traverse(o=>{if(o.name==='baeseojun-sculpted-head')named.push(o);});
 assert.equal(named.length,1);assert.equal(named[0].parent.visible,false,'the physical portrait yields to the heart core');
 view.clear();view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
