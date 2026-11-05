import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {CINEMATIC_PROFILES,CINEMATIC_SURFACES,buildCinematicTextureData,createCinematicWorld} from '../src/cinematic-graphics.mjs';
import {createCinematicImpactFx} from '../src/cinematic-impact-fx.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';

test('every playable boss and future Gyuwon share one explicit physically based style vocabulary',()=>{
 for(const key of ['kwon','clown','dice','blood','gyuwon']){
  assert.ok(CINEMATIC_PROFILES[key]);
  assert.ok(CINEMATIC_PROFILES[key].exposure>=1);
  assert.ok(CINEMATIC_PROFILES[key].reflection>0);
 }
 assert.ok(Object.keys(CINEMATIC_SURFACES).length>=8);
 assert.ok(CINEMATIC_SURFACES.marble.roughness>CINEMATIC_SURFACES.blood.roughness);
 assert.ok(CINEMATIC_SURFACES.metal.metalness>CINEMATIC_SURFACES.skin.metalness);
});
test('procedural surface maps are deterministic, varied, valid RGBA and Blender-free',()=>{
 for(const kind of Object.keys(CINEMATIC_SURFACES)){
  const data=buildCinematicTextureData(kind,32);
  assert.equal(data.color.length,32*32*4);
  assert.equal(data.normal.length,32*32*4);
  assert.equal(data.roughness.length,32*32*4);
  assert.ok(new Set(data.color).size>4,kind+' diffuse is flat');
  assert.ok(new Set(data.normal).size>4,kind+' normal map is flat');
  assert.ok(new Set(data.roughness).size>4,kind+' roughness map is flat');
  assert.deepEqual(data.color,buildCinematicTextureData(kind,32).color);
  assert.notDeepEqual(data.color,buildCinematicTextureData(kind,32,123).color);
 }
 assert.throws(()=>buildCinematicTextureData('alien'),/Unknown physical surface/);
 assert.throws(()=>buildCinematicTextureData('wood',1024),/size/);
});
test('shared PBR factory preserves original authored face/basecolor textures and does not change collision meshes',()=>{
 const scene=new THREE.Scene(),renderer={toneMapping:THREE.NoToneMapping,toneMappingExposure:1,outputColorSpace:THREE.LinearSRGBColorSpace};
 const originally=renderer.outputColorSpace;
 const root=new THREE.Group();root.name='cathedral-model';scene.add(root);
 const originalMap=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 const mat=new THREE.MeshStandardMaterial({color:0xc0a890,map:originalMap,roughness:.76});
 const geometry=new THREE.BoxGeometry(1,1,1),mesh=new THREE.Mesh(geometry,mat);
 mesh.name='cathedral-marble-floor-tiles';root.add(mesh);
 const hazard=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xff0000}));
 hazard.name='damage-warning';root.add(hazard);
 const untouched=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:0xffffff}));
 untouched.userData.skipCinematicMaterial=true;root.add(untouched);
 const world=createCinematicWorld(scene,renderer,{profile:'blood',coarse:true});
 assert.equal(world.apply(root),1);assert.equal(world.apply(root),0,'idempotent apply');
 assert.equal(mat.map,originalMap,'must preserve photos and authored textures');
 assert.ok(mat.normalMap?.isDataTexture);
 assert.ok(mat.roughnessMap?.isDataTexture);
 assert.equal(mat.normalMap.image.width,64);
 assert.equal(world.stats().materials,1);
 assert.equal(renderer.toneMapping,THREE.ACESFilmicToneMapping);
 assert.equal(scene.environment.mapping,THREE.EquirectangularReflectionMapping);
 assert.equal(scene.environment.image.width,32);
 assert.equal(scene.environment.image.height,16);
 assert.equal(hazard.material.isMeshBasicMaterial,true);
 assert.equal(hazard.material.normalMap,undefined);
 assert.equal(untouched.material.normalMap,null);
 assert.ok(scene.getObjectByName('cinematic-boss-silhouette-fill'));
 const oldIntensity=scene.environmentIntensity;
 world.update({boss:{phase:2}},.05);assert.ok(scene.environmentIntensity<oldIntensity);
 world.dispose();world.dispose();
 assert.equal(renderer.toneMapping,THREE.NoToneMapping);assert.equal(renderer.outputColorSpace,originally);
 assert.equal(scene.environment,null);assert.equal(mat.map,originalMap);
 assert.equal(mat.normalMap,null);assert.equal(mat.roughnessMap,null);
 assert.equal(scene.getObjectByName('cinematic-boss-silhouette-fill'),undefined);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('material surfaces remain bounded on desktop and mobile, no per-object dynamic shadow lights',()=>{
 for(const coarse of [false,true]){
  const scene=new THREE.Scene(),renderer={toneMapping:THREE.NoToneMapping,toneMappingExposure:1,outputColorSpace:THREE.LinearSRGBColorSpace};
  const world=createCinematicWorld(scene,renderer,{profile:'dice',coarse});
  const material=new THREE.MeshPhysicalMaterial({color:0xccaa77,roughness:.6,metalness:.7});
  const root=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),material);root.name='casino-gilded-metal';scene.add(root);
  assert.equal(world.apply(root),1);
  assert.equal(material.map.image.width,coarse?64:256);
  const fill=scene.getObjectByName('cinematic-boss-silhouette-fill');
  assert.ok(fill?.isDirectionalLight);assert.equal(fill.castShadow,false);
  assert.equal(fill.intensity,coarse?0:CINEMATIC_PROFILES.dice.fill);
  assert.equal(world.stats().shadowLightsAdded,0);
  world.dispose();assert.equal(scene.environment,null);
  assert.deepEqual(disposeScene(scene).errors,[]);
 }
});
test('3D fragment pool gives bosses responsive contact while leaving damage state unchanged',()=>{
 const scene=new THREE.Scene(),fx=createCinematicImpactFx(scene,{profile:'clown',coarse:true});
 const g={player:{x:2,z:4,hp:100},boss:{x:10,z:-3,hp:200},status:'playing'};
 const before=structuredClone(g),matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),q=new THREE.Quaternion(),size=new THREE.Vector3();
 fx.mesh.getMatrixAt(0,matrix);matrix.decompose(pos,q,size);
 assert.equal(size.length(),0,'all idle fragments must be hidden');
 fx.event({type:'boss-hit',amount:18},g);
 fx.update(.016);
 assert.ok(fx.mesh.visible);assert.equal(fx.stats().poolSize,24);
 assert.ok(fx.stats().active>0);assert.equal(fx.stats().physicsCollisions,0);
 fx.event({type:'player-hit',amount:7},g);fx.update(.016);
 assert.deepEqual(g,before,'appearance must not mutate game or damage simulation');
 for(let i=0;i<100;i++)fx.update(.05);
 assert.equal(fx.mesh.visible,false);
 fx.event({type:'dice-warning'},g);fx.update(.016);
 assert.equal(fx.mesh.visible,false,'telegraph may not spawn fake hit feedback');
 fx.event({type:'clown-blast',x:0,z:0},g);fx.update(.016);
 assert.ok(fx.mesh.visible);fx.reset();assert.equal(fx.mesh.visible,false);
 fx.dispose();fx.dispose();assert.equal(scene.children.length,0);
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('all four real boss entrypoints use the same graphics and hit event bridge',()=>{
 const paths=['arena','clown-battle','dice-battle','blood-battle'];
 for(const name of paths){
  const contents=readFileSync(new URL('../src/'+name+'.mjs',import.meta.url),'utf8');
  assert.match(contents,/createCinematicWorld/);
  assert.match(contents,/createCinematicImpactFx/);
  assert.match(contents,/cinematic\.apply/);
  assert.match(contents,/contactFx\.event/);
  assert.match(contents,/contactFx\.update/);
  assert.match(contents,/contactFx\.reset/);
  assert.match(contents,/startup\.own\(/);
 }
});

test('authored normal strengths remain intact and cathedral phase lighting cannot re-enable mobile rim light',()=>{
 const scene=new THREE.Scene(),renderer={toneMapping:THREE.NoToneMapping,toneMappingExposure:1,outputColorSpace:THREE.LinearSRGBColorSpace};
 const map=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1),normal=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1);
 const mat=new THREE.MeshStandardMaterial({color:0xc3b2a1,map,normalMap:normal});
 mat.normalScale.set(.77,.65);
 const node=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat);scene.add(node);
 const world=createCinematicWorld(scene,renderer,{profile:'kwon',coarse:true});
 world.apply(node,{actor:true});
 assert.equal(mat.map,map);assert.equal(mat.normalMap,normal);
 assert.equal(mat.normalScale.x,.77);assert.equal(mat.normalScale.y,.65);
 world.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
 const scene2=new THREE.Scene(),view=buildBloodView(scene2,{coarse:true,reduced:true});
 const world2=createCinematicWorld(scene2,renderer,{profile:'blood',coarse:true});
 const rim=scene2.getObjectByName('cinematic-boss-silhouette-fill');
 assert.equal(rim.intensity,0);
 const game=createBloodGame();view.update(game,.016);
 assert.equal(rim.intensity,0,'blood cathedral phase lighting must not override mobile quality');
 view.dispose();world2.dispose();
 assert.deepEqual(disposeScene(scene2).errors,[]);
});
