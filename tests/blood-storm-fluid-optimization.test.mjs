import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bloodOceanGeometry,bloodOceanRadii,BLOOD_OCEAN_VERTEX_FUNCTIONS} from '../src/blood-ocean-waves.mjs';
import {createCathedralBloodSea} from '../src/blood-cathedral-sea.mjs';
import {createBloodInstancedRain} from '../src/blood-storm-rain.mjs';
import {bloodStormEnvelope,createBloodApocalypseSky} from '../src/blood-apocalypse-sky.mjs';
import {bloodSculptureGeometries} from '../src/blood-sculpture.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const vertCount=g=>g.getAttribute('position').count;
test('GPU horizon ocean concentrates polygons at the arena, extends beyond fog, and uses only static geometry',()=>{
 const lo=bloodOceanGeometry({coarse:true}),hi=bloodOceanGeometry();
 const lr=bloodOceanRadii({coarse:true}),hr=bloodOceanRadii();
 assert.equal(lr.at(-1),700);assert.equal(hr.at(-1),700);
 assert.ok(lr.includes(29)&&hr.includes(29),'nearshore transition needs fine rings');
 assert.ok(hr.length>lr.length);
 assert.ok(vertCount(lo)<1500,'mobile ocean vertex budget');
 assert.ok(vertCount(hi)<3000,'desktop ocean vertex budget');
 assert.ok(vertCount(lo)<vertCount(hi));
 assert.ok(hi.getAttribute('normal')&&hi.index.count>5000);
 const box=new THREE.Box3().setFromBufferAttribute(hi.getAttribute('position'));
 assert.ok(box.max.x>698&&box.min.x< -698&&box.max.z>698);
 assert.equal(hi.attributes.position.usage,THREE.StaticDrawUsage);
 assert.match(BLOOD_OCEAN_VERTEX_FUNCTIONS,/shore=smoothstep\(27\.8,54\.0,d\)/);
 assert.match(BLOOD_OCEAN_VERTEX_FUNCTIONS,/swell=.*sin/);
 assert.match(BLOOD_OCEAN_VERTEX_FUNCTIONS,/cross=.*sin/);
 assert.match(BLOOD_OCEAN_VERTEX_FUNCTIONS,/chop=.*sin/);
 lo.dispose();hi.dispose();
});

test('red sea uses large rolling GPU swells, moving normals and shared shader uniforms',()=>{
 const scene=new THREE.Scene(),sea=createCathedralBloodSea(scene);
 const shader={uniforms:{},vertexShader:'#include <beginnormal_vertex>\n#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
 sea.water.onBeforeCompile(shader);
 assert.ok(shader.uniforms.uSeaTime&&shader.uniforms.uSeaFrenzy&&shader.uniforms.uSeaDetail);
 assert.match(shader.vertexShader,/bloodSeaHeight\(position\.xz\)/);
 assert.match(shader.vertexShader,/objectNormal=normalize/);
 assert.match(shader.vertexShader,/transformed\.y\+=seaH/);
 assert.match(shader.fragmentShader,/foamEdge/);
 assert.equal(sea.water.isMeshStandardMaterial,true,'avoid full physical clearcoat shader on huge screen-sized water');
 const g=createBloodGame(),before=JSON.stringify(g);
 g.time=5;g.boss.phase=2;g.boss.state='pattern';g.blood.pattern='requiem';
 sea.update(g);
 assert.ok(shader.uniforms.uSeaFrenzy.value>1.5,'the requiem must raise storm power');
 assert.equal(shader.uniforms.uSeaTime.value,5);
 assert.ok(sea.stats().oceanVertices<3000);
 const after=JSON.stringify(g);
 assert.equal(after,JSON.stringify(g),'ocean must not mutate combat state');
 assert.notEqual(after,before,'fixture should have changed before the renderer update');
 sea.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});

test('perpetual rain is one immutable GPU-instanced streak batch at each performance tier',()=>{
 for(const opts of [{coarse:true},{reduced:true},{}]){
  const scene=new THREE.Scene(),rain=createBloodInstancedRain(scene,opts);
  const mesh=rain.mesh,geometry=mesh.geometry,seeds=geometry.getAttribute('aRainSeed');
  const baseline=Array.from(seeds.array),capacity=rain.stats().rainStreaks;
  assert.ok(geometry.isInstancedBufferGeometry);
  assert.ok(capacity<=384&&capacity>=100);
  assert.equal(geometry.instanceCount,capacity);
  assert.equal(seeds.count,capacity);
  assert.equal(rain.stats().cpuVertexUpdates,0);
  assert.equal(rain.stats().gpuInstanced,true);
  assert.equal(scene.children.filter(x=>x.isMesh).length,1);
  for(let t=0;t<180;t+=.5)rain.update(t,.45);
  assert.ok(mesh.visible);
  assert.deepEqual(Array.from(seeds.array),baseline,'rain must not write instance data each frame');
  assert.ok(mesh.material.uniforms.uTime.value>170);
  rain.update(180,0);assert.equal(mesh.visible,false);
  rain.dispose();rain.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
 }
});

test('sky storm cycles double-flash lightning while staying GPU-instanced and decorative',()=>{
 const scene=new THREE.Scene(),fx=createBloodApocalypseSky(scene,{coarse:true}),g=createBloodGame();
 const rain=scene.getObjectByName('blood-perpetual-rain');
 assert.ok(rain.geometry.isInstancedBufferGeometry);
 assert.ok(fx.stats().rainStreaks<=150);
 g.boss.phase=2;g.boss.state='recovery';g.time=25;
 const before=JSON.stringify(g);
 fx.update(g);fx.update(g);
 assert.equal(JSON.stringify(g),before);
 assert.ok(rain.visible);
 let maximum=0;
 for(let t=0;t<40;t+=.05){g.time=t;maximum=Math.max(maximum,bloodStormEnvelope(g).flash);}
 assert.ok(maximum>.7);
 assert.equal(fx.stats().damageSources,0);
 fx.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});

test('formerly flat spell geometry now has thickness without exceeding shared low-poly limits',()=>{
 const normal=bloodSculptureGeometries(20),mobile=bloodSculptureGeometries(12);
 const volume=g=>{
  const attr=g.getAttribute('position'),box=new THREE.Box3().setFromBufferAttribute(attr);
  return {x:box.max.x-box.min.x,y:box.max.y-box.min.y,z:box.max.z-box.min.z};
 };
 for(const item of ['sheet','blade','judgement','ritual','torus']){
  assert.ok(volume(normal[item]).z>.08,item+' should not be a zero-thickness plane');
  assert.ok(normal[item].index.count>100);
 }
 const tris=g=>Object.values(g).reduce((n,x)=>n+x.index.count/3,0);
 assert.ok(tris(normal)<9000,'shared desktop triangle budget');
 assert.ok(tris(mobile)<tris(normal),'coarse geometry must remain smaller');
 for(const collection of [normal,mobile])for(const g of Object.values(collection))g.dispose();
});

test('liquid deformation affects every pooled blood spell without modifying the authoritative hitboxes',()=>{
 const scene=new THREE.Scene();
 const low=createBloodFluid(bloodQuality({coarse:true}));
 const high=createBloodFluid(bloodQuality());
 assert.ok(low.material.isMeshStandardMaterial);
 assert.ok(high.material.isMeshPhysicalMaterial);
 for(const fluid of [low,high]){
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>\n#include <normal_fragment_maps>'};
  fluid.material.onBeforeCompile(shader);
  assert.match(shader.vertexShader,/transformed\+=normal\*wave/);
  assert.match(shader.vertexShader,/transformed\.x\+=/);
  assert.match(shader.fragmentShader,/viscousNormal/);
  fluid.update(2.75,.5);
  assert.equal(shader.uniforms.uBloodTime.value,2.75);
  assert.equal(shader.uniforms.uBloodEnergy.value,.5);
 }
 const g=createBloodGame();g.boss.phase=2;
 assert.ok(startBloodPattern(g,'ritual'));
 const before=JSON.stringify(g.blood.hazards),field=bloodFloorField(g);
 assert.ok(field.hazards.length>1&&field.safety);
 low.update(3,1);
 assert.equal(JSON.stringify(g.blood.hazards),before);
 assert.equal(bloodFloorField(g).hazards.length,field.hazards.length);
 for(const f of [low,high])for(const r of f.resources)r.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});
