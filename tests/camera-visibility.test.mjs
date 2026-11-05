import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCameraVisibility} from '../src/camera-visibility.mjs';
import {createWhiteCathedral} from '../src/blood-white-cathedral.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
function rig(){
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 const source=new THREE.MeshStandardMaterial({color:0x345678});
 const wall=new THREE.Mesh(new THREE.BoxGeometry(8,8,1),source);wall.position.set(0,2,4);root.add(wall);
 const camera=new THREE.PerspectiveCamera(60,1,.1,100);camera.position.set(0,2,8);camera.lookAt(0,1.4,0);
 const control=createCameraVisibility(scene,{roots:[root],targets:()=>[{x:0,y:1.4,z:0}]});
 return {scene,root,source,wall,camera,control,before:()=>scene.onBeforeRender(null,scene,camera),after:()=>scene.onAfterRender(null,scene,camera)};
}
test('corridor uses isolated hashed materials without hiding whole meshes or changing source opacity',()=>{
 const f=rig(),actor=new THREE.Mesh(f.wall.geometry,f.source);f.scene.add(actor);f.before();
 assert.equal(f.wall.visible,true);assert.notEqual(f.wall.material,f.source);assert.equal(f.wall.material.alphaHash,true);
 assert.equal(actor.material,f.source);assert.equal(f.source.alphaHash,false);assert.equal(f.source.opacity,1);
 const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <alphahash_fragment>'};
 f.wall.material.onBeforeCompile(shader);assert.equal(shader.uniforms.cutawayCount.value,1);
 assert.deepEqual(shader.uniforms.cutawayOrigin.value.toArray(),[0,2,8]);
 assert.match(shader.vertexShader,/instanceMatrix\*cutawayPosition/);
 assert.match(shader.fragmentShader,/diffuseColor.a\*=cutawayVisibility/);
 f.after();assert.equal(f.wall.material,f.source);f.control.dispose();disposeScene(f.scene);
});
test('instance transforms, current animated matrices and actors never undergo cutaway mutations',()=>{
 const f=rig(),mesh=new THREE.InstancedMesh(f.wall.geometry,f.source,2000),matrix=new THREE.Matrix4();
 for(let i=0;i<mesh.count;i++)mesh.setMatrixAt(i,matrix.makeTranslation(i%50,2,4));f.root.add(mesh);
 const before=new Float32Array(mesh.instanceMatrix.array);mesh.raycast=()=>{throw Error('triangle query forbidden');};f.wall.raycast=mesh.raycast;
 f.before();assert.deepEqual(mesh.instanceMatrix.array,before);assert.equal(f.control.stats.raycasts,0);
 f.after();mesh.setMatrixAt(0,matrix.makeTranslation(3,2,1));f.before();f.after();
 const read=new THREE.Matrix4();mesh.getMatrixAt(0,read);assert.equal(read.elements[12],3);assert.equal(read.elements[14],1);
 f.control.dispose();disposeScene(f.scene);
});
test('phase animation, shader hooks, hidden scenery and exclusion flags are preserved',()=>{
 const f=rig();let originalHook=0;f.source.onBeforeCompile=()=>originalHook++;
 const excluded=new THREE.Mesh(f.wall.geometry,f.source);excluded.userData.cameraOcclusion=false;f.root.add(excluded);
 f.before();const material=f.wall.material;f.after();f.source.color.setHex(0xff2211);f.source.emissiveIntensity=.7;
 f.before();assert.equal(f.wall.material,material);assert.equal(material.color.getHex(),0xff2211);assert.equal(material.emissiveIntensity,.7);
 material.onBeforeCompile({uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <alphahash_fragment>'});assert.equal(originalHook,1);
 assert.equal(excluded.material,f.source);f.after();f.root.visible=false;f.before();assert.equal(f.control.stats.meshes,0);
 f.control.dispose();disposeScene(f.scene);
});
test('disposal restores interrupted draws, releases owned materials once and chains existing callbacks',()=>{
 const f=rig();f.control.dispose();let before=0,after=0,released=0;
 const oldBefore=()=>before++,oldAfter=()=>{after++;assert.equal(f.wall.material,f.source);};
 f.scene.onBeforeRender=oldBefore;f.scene.onAfterRender=oldAfter;
 const c=createCameraVisibility(f.scene,{roots:[f.root],targets:[{x:0,y:1,z:0}]});f.before();
 f.wall.material.addEventListener('dispose',()=>released++);f.after();assert.equal(before,1);assert.equal(after,1);
 f.before();c.dispose();c.dispose();assert.equal(released,1);assert.equal(f.wall.material,f.source);
 assert.equal(f.scene.onBeforeRender,oldBefore);assert.equal(f.scene.onAfterRender,oldAfter);disposeScene(f.scene);
});
test('real cathedral batches are covered without any instance upload or raycast',()=>{
 const scene=new THREE.Scene(),map=createWhiteCathedral(scene,{coarse:true}),camera=new THREE.PerspectiveCamera();
 const snapshots=[];map.root.traverse(o=>{if(o.isInstancedMesh)snapshots.push([o,o.instanceMatrix.version,new Float32Array(o.instanceMatrix.array)]);});
 const c=createCameraVisibility(scene,{roots:[map.root],targets:[{x:26,y:1.4,z:0}]});camera.position.set(49,9,0);
 c.prepare(camera);assert.ok(c.stats.instances>0);assert.equal(c.stats.raycasts,0);c.restore();
 for(const[o,version,array]of snapshots){assert.equal(o.instanceMatrix.version,version);assert.deepEqual(o.instanceMatrix.array,array);}
 c.dispose();map.dispose();disposeScene(scene);
});
