import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCinematicWorld} from '../src/cinematic-graphics.mjs';
import {createClownEncoreTent} from '../src/clown-tent-transformation.mjs';

test('reflection probes allocate exactly width * height * RGBA bytes',()=>{
 for(const coarse of [false,true]){
  const scene=new THREE.Scene(),renderer={toneMapping:0,toneMappingExposure:1,outputColorSpace:THREE.SRGBColorSpace};
  const world=createCinematicWorld(scene,renderer,{profile:'clown',coarse});
  const image=scene.environment.image;
  assert.equal(image.data.byteLength,image.width*image.height*4);
  assert.equal(image.data.byteLength,coarse?2048:8192);
  world.dispose();
 }
});
test('clown generated textures are bounded while other desktop profiles retain detail',()=>{
 for(const [profile,size]of [['clown',128],['dice',256]]){
  const scene=new THREE.Scene(),renderer={toneMapping:0,toneMappingExposure:1,outputColorSpace:THREE.SRGBColorSpace};
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshStandardMaterial());scene.add(mesh);
  const world=createCinematicWorld(scene,renderer,{profile});world.apply(mesh);
  assert.equal(mesh.material.normalMap.image.width,size);
  world.dispose();mesh.geometry.dispose();mesh.material.dispose();
 }
});
test('tent stops buffer uploads after morph and reset restores exact positions, colors and normals',()=>{
 for(const coarse of [false,true])for(const reduced of [false,true]){
  const root=new THREE.Group(),geo=new THREE.PlaneGeometry(8,12,4,4);
  geo.setAttribute('color',new THREE.Float32BufferAttribute(Array(geo.attributes.position.count*3).fill(.7),3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial());mesh.name='circus-vaulted-ivory-velvet-canopy';root.add(mesh);
  const initial={position:Array.from(geo.attributes.position.array),normal:Array.from(geo.attributes.normal.array),color:Array.from(geo.attributes.color.array)};
  const tent=createClownEncoreTent(root,{coarse,reduced});
  let normalCalls=0;const originalCompute=geo.computeVertexNormals.bind(geo);geo.computeVertexNormals=()=>{normalCalls++;return originalCompute();};
  const game={status:'playing',boss:{phase:2,hp:5076},events:[]},before=structuredClone(game);
  for(let i=0;i<400;i++)tent.update(game,.05);
  assert.notDeepEqual(Array.from(geo.attributes.position.array),initial.position);
  assert.equal(normalCalls,coarse?0:1);
  const versions=[geo.attributes.position.version,geo.attributes.color.version,geo.attributes.normal.version],writes=tent.stats().bufferUpdates;
  for(let i=0;i<200;i++)tent.update(game,.05);
  assert.deepEqual([geo.attributes.position.version,geo.attributes.color.version,geo.attributes.normal.version],versions);
  assert.equal(tent.stats().bufferUpdates,writes);
  assert.deepEqual(game,before);
  tent.reset();
  assert.deepEqual(Array.from(geo.attributes.position.array),initial.position);
  assert.deepEqual(Array.from(geo.attributes.normal.array),initial.normal);
  assert.deepEqual(Array.from(geo.attributes.color.array),initial.color);
  assert.equal(normalCalls,coarse?0:1,'reset restores cached normals without recomputing');
  assert.equal(tent.shadow.visible,false);
  tent.dispose();tent.dispose();geo.dispose();mesh.material.dispose();
 }
});
