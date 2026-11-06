import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWhiteCathedral,WHITE_CATHEDRAL_LAYOUT as L} from '../src/blood-white-cathedral.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {bloodTransformation} from '../src/blood-transformation.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const named=(scene,name)=>{const a=[];scene.traverse(o=>{if(o.name===name)a.push(o);});return a;};
const get=(scene,name)=>{const o=named(scene,name)[0];assert.ok(o,'Missing '+name);return o;};

test('sacred white cathedral includes architectural depth and reference-inspired spatial landmarks',()=>{
 const scene=new THREE.Scene(),chapel=createWhiteCathedral(scene);
 const s=chapel.stats();
 assert.equal(s.windows,12);
 assert.equal(s.panes,240);
 assert.equal(s.pews,12);
 assert.ok(s.tiles>70);
 assert.equal(s.roofPanels,14);
 assert.ok(s.hasAltar);
 for(const item of ['blood-white-cathedral','cathedral-battle-floor','cathedral-marble-floor-tiles',
 'cathedral-central-aisle','cathedral-gilded-aisle-inlay','cathedral-fluted-nave-columns',
 'cathedral-vault-panel','cathedral-vault-rib','cathedral-rose-window','cathedral-rose-stained-petal',
 'cathedral-lancet-gothic-frame','cathedral-stained-glass-panes','cathedral-crucifix',
 'cathedral-marble-sculpture-body','cathedral-pew-seats','cathedral-angel-relief',
 'cathedral-sunlight-shaft','cathedral-sunlit-dust'])get(scene,item);
 assert.ok(named(scene,'cathedral-vault-rib').length>=12,'missing high nave geometry');
 assert.ok(named(scene,'cathedral-rose-stained-petal').length>=20,'rose window lacks leadwork');
 assert.ok(get(scene,'cathedral-stained-glass-panes').isInstancedMesh);
 assert.ok(get(scene,'cathedral-stained-glass-panes').instanceColor,'stained glass needs varied colours');
 assert.ok(chapel.glassMaterial.transparent);
 assert.equal(chapel.glassMaterial.depthWrite,false);
 assert.equal(L.combatRadius,32);
 chapel.dispose();assert.equal(named(scene,'blood-white-cathedral').length,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('solid furniture and pillars cannot obstruct the expanded playable radius',()=>{
 const scene=new THREE.Scene(),chapel=createWhiteCathedral(scene,{coarse:true});
 for(const name of ['cathedral-pew-seats','cathedral-pew-backs','cathedral-pew-legs','cathedral-fluted-nave-columns']){
  const instance=get(scene,name),m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();
  for(let i=0;i<instance.count;i++){
   instance.getMatrixAt(i,m);m.decompose(p,q,scale);
   assert.ok(Math.abs(p.x)>=L.minSolidRadius,'playable arena blocked by '+name);
  }
 }
 const altar=get(scene,'cathedral-sanctuary');
 assert.ok(Math.abs(altar.position.z)-7>L.combatRadius);
 assert.equal(get(scene,'cathedral-marble-floor-tiles').count,chapel.stats().tiles);
 chapel.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});

test('white light beams and stained glass react to transition without hiding the cathedral',()=>{
 const scene=new THREE.Scene(),chapel=createWhiteCathedral(scene,{reduced:true,coarse:true}),g=createBloodGame();
 const shaft=get(scene,'cathedral-sunlight-shaft'),dust=get(scene,'cathedral-sunlit-dust');
 assert.ok(named(scene,'cathedral-sunlight-shaft').length>=4);
 chapel.update(g,bloodTransformation(g),{light:1});
 const bright=shaft.material.opacity,opacity=chapel.glassMaterial.opacity;
 g.boss.phase=2;g.boss.state='transition';g.blood.t=1;
 chapel.update(g,bloodTransformation(g),{light:.5});
 assert.ok(shaft.material.opacity<bright,'darkness should mute rays rather than wash out combat');
 assert.ok(dust.material.opacity>=0);
 assert.ok(chapel.glassMaterial.opacity<=opacity);
 g.boss.state='recovery';g.blood.t=0;
 chapel.update(g,bloodTransformation(g),{light:1});
 assert.ok(shaft.material.opacity>0);
 chapel.dispose();chapel.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('complete boss view keeps sacred nave, combat state and lifecycle isolated',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true});
 const game=createBloodGame(),hp=game.boss.hp;
 for(let i=0;i<25;i++){game.time+=.04;view.update(game,.04);}
 assert.equal(game.boss.hp,hp,'visuals must not change damage state');
 assert.ok(get(scene,'cathedral-rose-window'));
 assert.ok(get(scene,'cathedral-crucifix'));
 assert.ok(get(scene,'cathedral-stained-glass-panes'));
 view.clear();view.dispose();view.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});
