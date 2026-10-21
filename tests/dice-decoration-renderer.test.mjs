import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDiceDecorations} from '../src/dice-decoration-renderer.mjs';
// Structural doubles exercise object construction, not WebGL rendering.
class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){Object.assign(this,{x,y,z});return this;}copy(v){return this.set(v.x,v.y,v.z);}multiplyScalar(n){return this.set(this.x*n,this.y*n,this.z*n);}}
class Group{constructor(){this.children=[];this.position=new Vector3();this.scale=new Vector3(1,1,1);this.rotation={};this.quaternion={setFromUnitVectors:(a,b)=>{this.normal=b;}};}add(o){this.children.push(o);}}
class Mesh extends Group{constructor(geometry,material){super();Object.assign(this,{geometry,material});}}
class Material{constructor(p){Object.assign(this,p);this.color={setHex:v=>{this.hex=v;}};}}
class Geometry{constructor(){this.attributes={position:{count:3,getX:i=>i-1,getY:()=>0},uv:{setXY(){}}};}}
const T={Vector3,Group,Mesh,MeshStandardMaterial:Material,SphereGeometry:Geometry,ConeGeometry:Geometry};
const make=()=>{const root=new Group(),api=buildDiceDecorations(T,root,8,{ember:1,emissive:2});return {root,api,pips:root.children.flatMap(f=>f.children.filter(o=>o.name==='sungwon-face-pip')),spikes:root.children.flatMap(f=>f.children.filter(o=>o.name==='dice-face-spike'))};};
test('renderer constructs 21 portrait pips and 21 numbered spikes',()=>{const {root,pips,spikes}=make();assert.equal(root.children.length,6);assert.equal(pips.length,21);assert.equal(spikes.length,21);assert.deepEqual(root.children.map(f=>f.children.length),[2,12,4,10,6,8]);});
test('all pips share one photo texture and retain their visible meshes',()=>{const {api,pips}=make(),texture={id:'portrait'};api.setTexture(texture);for(const p of pips){assert.equal(p.material.map,texture);assert.equal(p.material.hex,0xffffff);assert.ok(p.scale.z>.6);assert.equal(p.castShadow,true);}});
test('spikes have an outward axis and shared emissive material',()=>{const {root,spikes}=make();assert.deepEqual(root.children.map(f=>[f.normal.x,f.normal.y,f.normal.z]),[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]);for(const s of spikes){assert.equal(s.rotation.x,Math.PI/2);assert.equal(s.scale.y,1.28);assert.equal(s.material,spikes[0].material);}});
test('entrance without a clock does not create NaN animation',()=>{const {api,spikes}=make();for(const time of [undefined,NaN,0,2]){api.update(time);assert.ok(Number.isFinite(spikes[0].material.emissiveIntensity));}});
test('actor loads texture into decorations and preserves board geometry',()=>{const s=readFileSync(new URL('../src/dice-actor.mjs',import.meta.url),'utf8');for(const token of ['buildDiceDecorations(THREE,root,e,H)','decorations.setTexture(texture)','decorations.update(time)','new THREE.CircleGeometry(1,64)','texture?.dispose()','i===DICE_PHOTO_FACE?photoMaterial:iron'])assert.ok(s.includes(token),token);assert.ok(!s.includes('photoPips'));assert.ok(!s.includes('new THREE.Circle('));});
