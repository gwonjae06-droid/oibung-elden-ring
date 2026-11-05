import {qualityPixelRatio,reducedMotion} from '../src/display-preferences.mjs';
import * as REAL_THREE from 'three';
import {buildPlayerAvatar} from '../src/player-avatar.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {runThreeStartup} from '../src/runtime/three-startup.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {runBattleStartup} from '../src/runtime/battle-startup.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

function rig(){
  const values=[];
  class Resource extends EventTarget {constructor(){super();this.disposals=0;values.push(this);}dispose(){this.disposals++;this.dispatchEvent(new Event('dispose'));}}
  class Group {constructor(){this.children=[];this.position={};}add(child){this.children.push(child);child.parent=this;}remove(child){this.children=this.children.filter(c=>c!==child);child.parent=null;}traverse(fn){fn(this);for(const child of this.children)fn(child);}}
  return {values,THREE:{Group,MeshStandardMaterial:Resource,BufferGeometry:Resource,CanvasTexture:Resource}};
}

test('factory failure releases detached resources and child-owned resources exactly once',()=>{
  const r=rig(),error=Error('geometry');let child;
  assert.throws(()=>runThreeStartup(r.THREE,(THREE,own)=>{
    new THREE.BufferGeometry();child=new THREE.CanvasTexture();
    own({dispose(){child.dispose();}});throw error;
  }),e=>e===error);
  assert.ok(r.values.every(value=>value.disposals===1));
});

test('successful factories retain resources and do not keep startup disposal hooks',()=>{
  const r=rig();const resource=runThreeStartup(r.THREE,THREE=>new THREE.BufferGeometry());
  assert.equal(resource.disposals,0);resource.dispose();assert.equal(resource.disposals,1);
});

test('actual player-model factory releases every authored material when geometry allocation fails',()=>{
  const error=Error('geometry allocation'),released=[];
  const namespace=new Proxy(REAL_THREE,{get(t,k){if(k==='BufferGeometry')return class{constructor(){throw error;}};if(k==='MeshStandardMaterial'||k==='LineBasicMaterial')return class extends t[k]{constructor(...a){super(...a);const state={disposals:0};released.push(state);this.addEventListener('dispose',()=>state.disposals++);}};return t[k];}});
  assert.throws(()=>buildPlayerAvatar(['sword'],namespace),e=>e===error);
  assert.ok(released.length>=8);assert.ok(released.every(m=>m.disposals===1));
});

test('main arena rolls back its renderer when initial scene construction fails',()=>{
  const error=Error('main scene'),log=[];
  const context={qualityPixelRatio,reducedMotion,runBattleStartup,document:{getElementById:()=>({})},window:{devicePixelRatio:1},matchMedia:()=>({matches:false}),
    THREE:{WebGLRenderer:class{constructor(){this.shadowMap={};}setPixelRatio(){}dispose(){log.push('renderer');}},Scene:class{constructor(){throw error;}},PCFSoftShadowMap:1}};
  const source=readFileSync(new URL('../src/arena.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export const arenaRuntime','const arenaRuntime');
  assert.throws(()=>vm.runInNewContext(source,context),e=>e===error);assert.deepEqual(log,['renderer']);
});

test('scene cleanup includes shared textures and continues after a geometry failure',()=>{
  const calls=[],texture={isTexture:true,dispose(){calls.push('texture');}},material={map:texture,normalMap:texture,dispose(){calls.push('material');}},geometry={dispose(){calls.push('geometry');throw Error('gpu');}};
  const scene={traverse(fn){fn({geometry,material});fn({geometry,material});},background:texture};
  const report=disposeScene(scene);assert.equal(report.errors.length,1);assert.deepEqual(calls,['geometry','material','texture']);
});
