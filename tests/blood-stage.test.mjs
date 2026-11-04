import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_STAGES,bloodStage,hazardStage,onsetTime,settleTime} from '../src/blood-stage.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {createBloodParticles} from '../src/blood-particles.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test('the five readable stages are named prepare, start, run, finish, return',()=>{
 assert.deepEqual(BLOOD_STAGES.map(s=>s.label),['준비','시작','진행','완료','복귀']);
});
test('a single hazard moves through ready, start, run and done at its own boundaries',()=>{
 const h={warn:1,life:2,age:0};
 assert.equal(hazardStage(h).id,'ready');
 h.age=1;assert.equal(hazardStage(h).id,'start');
 h.age=1+onsetTime(h)+.01;assert.equal(hazardStage(h).id,'run');
 h.age=1+h.life-settleTime(h)+.01;assert.equal(hazardStage(h).id,'done');
});
test('every real pattern shows prepare, start, run, finish and return in order',()=>{
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;g.player.hp=g.player.maxHp=1e6;startBloodPattern(g,id);
  const seen=[];let last=-1;
  for(let t=0;t<spec.duration+spec.recover+1&&!(seen.includes('return')&&g.boss.state==='pattern');t+=.01){
   stepBlood(g,.01);const s=bloodStage(g);if(s.index<0)continue;
   assert.ok(s.index>=last,id+' went backwards to '+s.id);assert.ok(s.progress>=0&&s.progress<=1);last=s.index;if(!seen.includes(s.id))seen.push(s.id);
  }
  assert.deepEqual(seen,['ready','start','run','done','return'],id);
 }
});
test('blood visuals never change the authoritative combat state',()=>{
 for(const id of ['rain','pulse','tide']){
  const spec=BLOOD_PATTERNS[id],plain=createBloodGame(),shown=createBloodGame(),scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true});
  for(const g of [plain,shown]){g.boss.phase=spec.phase;g.player.hp=g.player.maxHp=1e6;startBloodPattern(g,id);}
  for(let t=0;t<spec.duration+1;t+=.05){stepBlood(plain,.05);stepBlood(shown,.05);view.update(shown,.05);}
  assert.equal(JSON.stringify([shown.blood,shown.boss,shown.player]),JSON.stringify([plain.blood,plain.boss,plain.player]),id);
  view.dispose();disposeScene(scene);
 }
});
test('puddles spread gradually instead of appearing at full size',()=>{
 const scene=new THREE.Scene(),q=bloodQuality({}),fluid=createBloodFluid(q),fx=createBloodParticles(scene,fluid,q),pools=scene.children[1],m=new THREE.Matrix4(),p=new THREE.Vector3(),r=new THREE.Quaternion(),s=new THREE.Vector3();
 fx.puddle(0,0,2);let time=0;const sizes=[];
 for(const target of [.1,1,3]){while(time<target){fx.update(.05,time);time+=.05;}pools.getMatrixAt(0,m);m.decompose(p,r,s);sizes.push(s.x);}
 assert.ok(sizes[0]<sizes[1]*.6,'early '+sizes);assert.ok(sizes[2]>sizes[0]*2,'late '+sizes);fx.clear();disposeScene(scene);
});
test('puddles slide back into the boss during recovery and ripples stay within their cap',()=>{
 const scene=new THREE.Scene(),q=bloodQuality({coarse:true}),fluid=createBloodFluid(q),fx=createBloodParticles(scene,fluid,q);
 fx.puddle(10,0,1.5);for(let t=0;t<5;t+=.05)fx.update(.05,t,{retract:{x:0,z:0}});assert.equal(fx.puddles,0);
 for(let i=0;i<200;i++){fx.ripple(i%9,0,{});assert.ok(fx.ripples<=q.ripples);}
 for(let t=0;t<5;t+=.05)fx.update(.05,t);assert.equal(fx.ripples,0);fx.clear();disposeScene(scene);
});
