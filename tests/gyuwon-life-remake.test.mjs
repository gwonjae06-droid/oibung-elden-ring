import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGyuwonLifeActor,gyuwonLifeAge} from '../src/gyuwon-life-actor.mjs';
import {GYUWON_LIFE_SHOTS,GYUWON_LIFE_SECONDS,gyuwonLifeFrame,createGyuwonLifeEpilogue} from '../src/gyuwon-life-epilogue.mjs';
import {gyuwonLifeCameraAt,GYUWON_LIFE_SCENE} from '../src/gyuwon-life-stage-3d.mjs';
import {batchLifeSet} from '../src/gyuwon-life-set-batch.mjs';
test('the story and dialogue through the phone are preserved word for word',()=>{
 assert.deepEqual(GYUWON_LIFE_SHOTS.filter(s=>s.at<147).map(s=>s.line),[
  '다양한 것들을 경험해보니 알꺼같아. 지금 내가 살아가는 삶이 목적이 없더라도 열심히 살아보자',
  '있는 힘껏 놀고, 새로운 사람을 만나고, 마음껏 웃었다.','열심히 공부했다. 모르는 것이 생기면 다시 물었다.',
  '열심히 일했다. 서툰 첫날에도 끝까지 해냈다.','열심히 아르바이트했다. 손님에게 마지막까지 웃으며 인사했다.',
  '열심히 사랑했다. 그 사람과 나란히 걷기 시작했다.','두 사람은 서로의 내일을 함께 살아가기로 했다.',
  '가정을 꾸리고 아이를 낳았다. 평범한 하루가 가장 큰 모험이 되었다.','아빠, 이게 뭐야?','아~ 이거? 이건 말이야, 아빠가 옛날에.....',''
 ]);
});
test('return starts inside the same bedroom cloud and the reverse dolly stays continuous',()=>{
 assert.equal(GYUWON_LIFE_SCENE.realization,'room');
 assert.deepEqual(gyuwonLifeCameraAt('realization',0).position,[0,4.75,-.35]);
 for(const boundary of [6/18,11/18]){
  const before=gyuwonLifeCameraAt('realization',boundary-.00001),after=gyuwonLifeCameraAt('realization',boundary+.00001);
  assert.ok(new T.Vector3(...before.position).distanceTo(new T.Vector3(...after.position))<.001);
  assert.ok(new T.Vector3(...before.target).distanceTo(new T.Vector3(...after.target))<.001);
 }
});
test('aging is monotonic from youth to parenthood and changes only the film instance',()=>{
 const scene=new T.Group(),source=createGyuwonActor(scene,{coarse:true}),actor=createGyuwonLifeActor(scene,source.root,{coarse:true});
 const sourceFace=source.root.getObjectByName('gyuwon-anatomical-face');
 const base=Float32Array.from(sourceFace.geometry.attributes.position.array),sourceColour=sourceFace.material.color.getHex();
 let previous=26;
 for(const s of GYUWON_LIFE_SHOTS.filter(s=>s.at<147))for(const q of [0,.5,1]){
  const age=gyuwonLifeAge(s.id,q);assert.ok(age>=previous);previous=age;
 }
 actor.pose({age:26});const young=actor.head.getObjectByName('life-anatomical-hair-cap').material.color.clone();
 actor.pose({age:58});const old=actor.head.getObjectByName('life-anatomical-hair-cap').material.color;
 assert.ok(old.r>young.r+.2);assert.ok(actor.head.getObjectByName('life-forehead-wrinkle').material.opacity>.3);
 assert.notEqual(actor.face.geometry,sourceFace.geometry);assert.notEqual(actor.face.material,sourceFace.material);
 assert.deepEqual(sourceFace.geometry.attributes.position.array,base);assert.equal(sourceFace.material.color.getHex(),sourceColour);
 actor.dispose();source.dispose();
});
test('partner and child reuse a connected anatomical rig without sharing the protagonist photograph',()=>{
 const scene=new T.Group(),source=createGyuwonActor(scene,{coarse:true});
 for(const role of ['partner','child']){
  const a=createGyuwonLifeActor(scene,source.root,{role,coarse:true});
  assert.equal(a.face.material.map,null);assert.equal(a.torso.geometry.type,'LatheGeometry');assert.ok(a.torso.geometry.attributes.position.count>200);
  for(const arm of a.arms){assert.equal(arm.elbow.parent,arm.shoulder);assert.equal(arm.wrist.parent,arm.elbow);}
  a.pose({age:30,sit:1});a.root.updateMatrixWorld(true);a.reach(0,new T.Vector3(-.3,1.9,.8));
  assert.ok(a.arms[0].wrist.getWorldPosition(new T.Vector3()).toArray().every(Number.isFinite));
  a.dispose();
 }
 source.dispose();
});
function harness(){
 const listeners=new Map(),elements=[];
 const element=()=>({hidden:false,dataset:{},style:{},textContent:'',innerHTML:'',setAttribute(){},appendChild(){},remove(){},querySelector(){return element();}});
 const doc={defaultView:{},addEventListener(k,v){listeners.set(k,v);},removeEventListener(k){listeners.delete(k);},createElement(){const e=element();elements.push(e);return e;}};
 const shell=element(),pending=[];let completed=0,disposed=0,starts=0;
 const film=createGyuwonLifeEpilogue(doc,shell,{onComplete:()=>completed++,finaleFactory:()=>{starts++;let resolve;const finished=new Promise(r=>resolve=r);pending.push(resolve);return {finished,dispose(){disposed++;resolve(false);}};}});
 return {film,listeners,pending,elements,get completed(){return completed;},get starts(){return starts;},get disposed(){return disposed;}};
}
test('original corridor owns completion: elapsed outer time never bypasses its final credits',async()=>{
 const h=harness();h.film.start();h.film.update(146.9);assert.equal(h.starts,0);
 h.film.update(.11);assert.equal(h.starts,1);h.film.update(200);assert.equal(h.starts,1);assert.equal(h.completed,0);
 h.pending[0](true);await Promise.resolve();assert.equal(h.completed,1);assert.equal(h.film.active,false);
 h.film.dispose();assert.equal(h.completed,1);
});
test('reset and disposal cancel the corridor and cannot publish a stale completion',async()=>{
 const h=harness();h.film.start();h.film.update(147);h.film.reset();h.pending[0](true);await Promise.resolve();assert.equal(h.completed,0);
 h.film.start();h.film.update(147);assert.equal(h.starts,2);h.film.dispose();h.pending[1](true);await Promise.resolve();assert.equal(h.completed,0);assert.equal(h.listeners.size,0);
});
test('hidden-tab gaps do not skip life shots and user-visible skip controls are absent',()=>{
 const h=harness();h.film.start();h.film.update(5);h.listeners.get('visibilitychange')();h.film.update(300);
 assert.equal(h.film.frame().time,5);assert.equal(h.starts,0);
 assert.ok(h.elements.every(e=>!/<button|skip|gy-ending-gate/.test(e.innerHTML)));h.film.dispose();
});
test('static set batching preserves world geometry while reducing repeated draw objects',()=>{
 const root=new T.Group(),material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry(1,1,1);
 root.position.set(2,0,4);root.rotation.y=.4;
 for(let i=0;i<5;i++){const m=new T.Mesh(geometry,material);m.position.set(i,1,0);root.add(m);}
 root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root),batch=batchLifeSet(root),after=new T.Box3().setFromObject(root);
 assert.equal(root.children.length,1);assert.ok(before.min.distanceTo(after.min)<.00001);assert.ok(before.max.distanceTo(after.max)<.00001);
 batch.dispose();geometry.dispose();material.dispose();
});
