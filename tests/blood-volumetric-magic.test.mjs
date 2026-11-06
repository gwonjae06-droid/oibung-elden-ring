import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {sampleBloodCrest,bloodVolumetricWaveGeometry,bloodWaveVisualPose} from '../src/blood-volumetric-wave.mjs';
import {GRAND_BLOOD_PATTERNS,grandBloodRiteEnvelope,createGrandBloodRites} from '../src/blood-grand-rites.mjs';
import {bloodQuality,createBloodFluid} from '../src/blood-fluid.mjs';
import {bloodSculptureGeometries} from '../src/blood-sculpture.mjs';
import {createBloodGame,startBloodPattern} from '../src/blood-combat.mjs';
import {BLOOD_RULES,BLOOD_PATTERNS,hazardContains,bloodHazardFootprint,BLOOD_CONTACT_MARGIN,hazardPosition} from '../src/blood-data.mjs';
import {bloodFloorField,BLOOD_SAFE_GROUND_PATTERNS,BLOOD_FLOOR_MAX_HAZARDS} from '../src/blood-spell-fx.mjs';
import {buildBloodView} from '../src/blood-view.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

test('closed 3D blood waves have thickness, rolling crests and complete side caps',()=>{
 for(const segments of [12,20]){
  for(const undertow of [false,true]){
   const g=bloodVolumetricWaveGeometry(segments,{undertow});
   const bb=new THREE.Box3().setFromBufferAttribute(g.getAttribute('position'));
   assert.ok(bb.max.x-bb.min.x>1.9);
   assert.ok(bb.max.y-bb.min.y>(undertow?.18:.9));
   assert.ok(bb.max.z-bb.min.z>.7,'not a flat sheet');
   assert.ok(g.index.count>100&&g.index.count%3===0);
   const P=g.getAttribute('position'),N=g.getAttribute('normal');
   for(const attr of [P,N])for(const x of attr.array)assert.ok(Number.isFinite(x));
   assert.ok(g.boundingSphere.radius>0);
   g.dispose();
  }
 }
 const mid=sampleBloodCrest(.5,Math.PI/2),rear=sampleBloodCrest(.5,Math.PI);
 assert.ok(mid[1]>rear[1]&&mid[2]>rear[2],'curled upper lip needs height and forward overhang');
});
test('shared new shapes stay within the existing polygon budget and lower-tier segment cap',()=>{
 let hi=0,lo=0;
 for(const seg of [12,20]){
  const geos=bloodSculptureGeometries(seg);
  assert.ok(geos.surge&&geos.undertow);
  assert.notEqual(geos.surge,geos.undertow);
  const triangles=Object.values(geos).reduce((n,g)=>n+g.index.count/3,0);
  assert.ok(triangles<=9000, 'shared triangle budget '+triangles);
  if(seg===12)lo=triangles;else hi=triangles;
  for(const geo of Object.values(geos))geo.dispose();
 }
 assert.ok(lo<hi);
});
test('crest grows gradually from warning through actual hit onset and fades after hit ends',()=>{
 const h={age:0,warn:1.2,life:2.3,width:6,id:1};
 const before=bloodWaveVisualPose(h),a=bloodWaveVisualPose({...h,age:.45}),
  ready=bloodWaveVisualPose({...h,age:1.19}),
  hit=bloodWaveVisualPose({...h,age:1.2+.36}),
  done=bloodWaveVisualPose({...h,age:1.2+2.3},1.1);
 assert.ok(before.height<a.height&&a.height<ready.height);
 assert.equal(ready.spray,false);
 assert.equal(hit.spray,true);
 assert.ok(hit.height>ready.height*1.5);
 assert.ok(done.height<hit.height);
 assert.equal(done.spray,false);
 assert.ok(Number.isFinite(hit.width)&&hit.width>=2*h.width);
});
test('hazard-authoritative width, delay and damage are completely unchanged by volumetric rendering',()=>{
 for(const pattern of ['wave','tide','cross','bloodScissors']){
  const g=createBloodGame();g.boss.phase=BLOOD_PATTERNS[pattern].phase;
  assert.equal(startBloodPattern(g,pattern),true);
  const old=g.blood.hazards.map(h=>({id:h.id,warn:h.warn,life:h.life,
   shape:h.shape,width:h.width,damage:h.damage,x:h.x,z:h.z}));
  const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true});
  try{
   const h=g.blood.hazards[0];h.age=h.warn*.6;
   view.update(g,.016);
   const form=scene.children.flatMap(x=>x.children).find(x=>x.userData?.spellForm==='crest');
   const groups=[];scene.traverse(o=>{if(o.userData?.spellForm)groups.push(o);});
   assert.ok(groups.some(x=>x.userData.spellForm==='crest'||x.userData.spellForm==='tide'||
    x.userData.spellForm==='crossing-walls'||x.userData.spellForm==='crisscross-sanguine'));
   assert.deepEqual(g.blood.hazards.map(x=>({id:x.id,warn:x.warn,life:x.life,
    shape:x.shape,width:x.width,damage:x.damage,x:x.x,z:x.z})),old);
   assert.ok(hazardContains({...h,age:h.warn+.03},{x:h.x,z:h.z}));
  }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
 }
});
test('actual wave renderer draws solid primary/undertow masses and prefire spray is hidden',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),
  game=createBloodGame();
 try{
  assert.equal(startBloodPattern(game,'wave'),true);
  const h=game.blood.hazards[0];h.age=h.warn*.7;
  view.update(game,.016);
  const group=scene.getObjectByName('blood-wave-crest-spray')?.parent;
  assert.ok(group&&group.userData.spellForm==='crest');
  assert.equal(group.children[0].isMesh,true);
  const primary=group.children[0].geometry,undertow=group.children[1].geometry;
  assert.notEqual(primary,undertow);
  assert.ok(primary.attributes.position.count>150,'low-tier 3D crest has too few volume vertices');
  assert.equal(scene.getObjectByName('blood-wave-crest-spray').count,0);
  h.age=h.warn+.3;game.blood.t=h.age;game.time+=.35;
  view.update(game,.016);
  const spray=scene.getObjectByName('blood-wave-crest-spray');
  assert.ok(spray.count>0&&spray.count<=8,'coarse spray cap');
  assert.ok(group.children[0].scale.y>5);
  const matrices=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),v=new THREE.Vector3();
  for(let i=0;i<spray.count;i++){spray.getMatrixAt(i,matrices);matrices.decompose(p,q,v);assert.ok([p.x,p.y,p.z,v.x,v.y].every(Number.isFinite));}
  view.clear();assert.equal(spray.count,0);
 }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('grand rites rise at cast time and fade out after recovery without extra gameplay hazard',()=>{
 const scene=new THREE.Scene(),fluid=createBloodFluid(bloodQuality({coarse:true})),
  vfx=createGrandBloodRites(scene,fluid,{coarse:true});
 const g=createBloodGame();
 try{
  g.boss.phase=2;assert.equal(startBloodPattern(g,'ritual'),true);
  vfx.update(g,.016);
  assert.ok(vfx.stats().active);
  const n=vfx.stats().maximumMeshes;
  assert.ok(n<=14);
  assert.equal(vfx.stats().damageSources,0);
  g.blood.t=3.0;
  vfx.update(g,.016);
  assert.ok(vfx.stats().visible>3);
  const crown=scene.getObjectByName('cathedral-massive-suspended-blood-core');
  assert.ok(crown.visible&&crown.scale.x>1);
  const meshes=[];vfx.root.traverse(x=>{if(x.isMesh)meshes.push(x);});
  assert.ok(meshes.every(x=>Object.values(fluid).includes(x.geometry)));
  g.boss.state='recovery';
  vfx.update(g,.05);assert.ok(vfx.stats().active,'immediate disappearance after impact');
  for(let i=0;i<30;i++)vfx.update(g,.05);
  assert.equal(vfx.stats().active,false);
  assert.equal(vfx.stats().maximumMeshes,n,'meshes leaked during animation');
  vfx.clear();assert.equal(vfx.stats().visible,0);
 }finally{vfx.dispose();for(const r of fluid.resources)r.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('all 2nd-phase major blood spells receive overhead or boundary-scale physical theatrics',()=>{
 for(const pattern of ['tide','judgement','ritual','eclipse','rain','pulse']){
  assert.ok(GRAND_BLOOD_PATTERNS[pattern]);
  const g=createBloodGame();g.boss.phase=2;
  assert.ok(startBloodPattern(g,pattern));
  g.blood.t=2.9;
  const e=grandBloodRiteEnvelope(g);
  assert.ok(e.active&&e.lift>.15);
  const scene=new THREE.Scene(),f=createBloodFluid(bloodQuality({coarse:true})),
   v=createGrandBloodRites(scene,f,{coarse:true,reduced:true});
  try{
   v.update(g,.016);
   assert.ok(v.stats().visible>0,pattern+' missing physical cathedral presence');
   assert.equal(v.stats().collidable,false);
  }finally{v.dispose();for(const item of f.resources)item.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
 }
});
test('full cathedral scene persists through every blood pattern without new damage or resource leaks',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true,reduced:true}),g=createBloodGame();
 try{
  const total=scene.children.length,originalHp=g.player.hp;
  for(const [id,spec]of Object.entries(BLOOD_PATTERNS)){
   g.boss.phase=spec.phase;g.status='playing';g.boss.state='recovery';
   assert.ok(startBloodPattern(g,id));
   g.blood.t=spec.duration*.5;g.time+=1.5;
   const before=g.blood.hazards.map(h=>[h.id,h.warn,h.life,h.damage]);
   view.update(g,.016);
   assert.deepEqual(g.blood.hazards.map(h=>[h.id,h.warn,h.life,h.damage]),before);
   assert.equal(scene.children.length,total);
   const rite=scene.getObjectByName('cathedral-blood-grand-rites');
   assert.ok(rite);
   let nr=0;rite.traverse(o=>{if(o.isMesh)nr++;});
   assert.ok(nr<=14);
   view.clear();
   assert.equal(rite.visible,false);
  }
  assert.equal(g.player.hp,originalHp);
 }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});


test('the authoritative liquid footprint agrees with every real blood hitbox at cast and motion times',()=>{
 let samples=0;
 const inside=(f,p)=>{
  const dx=p.x-f.x,dz=p.z-f.z,r=Math.hypot(dx,dz);
  if(f.kind===2)return Math.abs(r-f.r)<=f.halfWidth;
  if(f.kind===3){const si=Math.sin(f.yaw),co=Math.cos(f.yaw);
   return Math.abs(dx*co-dz*si)<=f.halfWidth&&Math.abs(dx*si+dz*co)<=f.halfLength;}
  if(f.kind===4){const ang=Math.atan2(dx,dz)-f.yaw;
   return r>=f.inner&&r<=f.r&&Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))<=f.arc;}
  return r<=f.r;
 };
 for(const [id,spec] of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;
  assert.equal(startBloodPattern(g,id),true);
  for(const h of g.blood.hazards){
   for(const age of [h.warn*.3,h.warn+.015,h.warn+h.life*.6]){
    const hAt={...h,age},f=bloodHazardFootprint(hAt);
    for(let x=-24;x<=24;x+=6)for(let z=-24;z<=24;z+=6){
     const p={x,z};assert.equal(hazardContains(hAt,p),inside(f,p),
      id+' '+h.shape+' '+age+' @ '+x+','+z);samples++;
    }
   }
  }
 }
 assert.ok(samples>10000,'sample all attacks, including translated lanes and expanding rings');
 assert.equal(BLOOD_CONTACT_MARGIN,.55);
});
test('the wet safety field includes simultaneous strikes, future warnings and their exact moving centres',()=>{
 assert.ok(BLOOD_SAFE_GROUND_PATTERNS.has('eclipse'));
 assert.ok(BLOOD_SAFE_GROUND_PATTERNS.has('tide'));
 assert.ok(BLOOD_SAFE_GROUND_PATTERNS.has('ritual'));
 assert.ok(BLOOD_SAFE_GROUND_PATTERNS.has('burst'));
 for(const[id,spec]of Object.entries(BLOOD_PATTERNS)){
  const g=createBloodGame();g.boss.phase=spec.phase;
  startBloodPattern(g,id);
  const before=bloodFloorField(g);
  assert.equal(before.hazards.length,g.blood.hazards.length,id);
  assert.equal(before.safety,BLOOD_SAFE_GROUND_PATTERNS.has(id));
  assert.ok(before.hazards.length<=BLOOD_FLOOR_MAX_HAZARDS);
  for(let i=0;i<g.blood.hazards.length;i++){
   const h=g.blood.hazards[i],shade=before.hazards[i],p=bloodHazardFootprint(h);
   assert.deepEqual(shade.x,p.x);
   assert.deepEqual(shade.z,p.z);
   assert.ok(shade.strength>0&&shade.strength<1);
   h.age=h.warn+.2;
   const shifted=bloodFloorField(g)?.hazards[i];
   assert.ok(shifted?.active,id+' '+i);
   const moved=hazardPosition(h);
   assert.ok(Math.abs(shifted.x-moved.x)<1e-9&&Math.abs(shifted.z-moved.z)<1e-9);
   h.age=0;
  }
  if(g.blood.hazards.length){
   g.blood.hazards[0].hit=true;
   assert.ok(bloodFloorField(g).hazards[0].strength<.1,'spent impact no longer dark');
  }
  g.status='won';assert.equal(bloodFloorField(g),null);
 }
});
test('one GPU-rendered liquid sheet shows contrasting deep danger and bright safety without creating gameplay hazards',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),
  g=createBloodGame();
 try{
  g.boss.phase=2;startBloodPattern(g,'eclipse');
  const h=g.blood.hazards[0];h.age=h.warn*.5;g.time=h.age;view.update(g,.016);
  const floor=scene.getObjectByName('blood-hazard-dark-and-safe-liquid');
  assert.ok(floor&&floor.visible);
  assert.equal(floor.geometry.attributes.position.count,4,'one plane, not per-hazard meshes');
  assert.equal(floor.material.isShaderMaterial,true);
  assert.equal(floor.material.depthWrite,false);
  assert.equal(floor.material.uniforms.uSafe.value,1);
  assert.equal(floor.material.uniforms.uCount.value,1);
  assert.equal(floor.material.uniforms.uFootA.value[0].w,2,'ring is not displayed as a full disk');
  assert.match(floor.material.fragmentShader,/darkBlood/);
  assert.match(floor.material.fragmentShader,/safeBlood/);
  assert.match(floor.material.fragmentShader,/uFootC/);
  assert.ok(floor.material.uniforms.uFootC.value[0].y<1,'warning before hit');
  h.age=h.warn+.01;view.update(g,.016);
  assert.equal(floor.material.uniforms.uFootC.value[0].y,1,'full danger at actual damage onset');
  view.clear();assert.equal(floor.visible,false);
  assert.equal(floor.material.uniforms.uCount.value,0);
 }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});
test('the blood explosion does not visually grow from a tiny harmless puddle after lethal-radius contact begins',()=>{
 const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),
  g=createBloodGame();
 try{
  startBloodPattern(g,'burst');
  const h=g.blood.hazards[0];h.age=h.warn+.002;g.time=h.age;view.update(g,.016);
  const groups=[];scene.traverse(o=>{if(o.userData?.spellForm==='implosion')groups.push(o);});
  assert.equal(groups.length,1);
  const blood=groups[0].children[0];
  assert.ok(blood.scale.x>=h.r*.94,'explosion volume must cover the first damaging frame');
 }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
});

test('projectiles and dive finish swelling before they are allowed to damage the player',()=>{
 for(const id of ['orbs','vortex','dive']){
  const scene=new THREE.Scene(),view=buildBloodView(scene,{coarse:true}),
   g=createBloodGame();g.boss.phase=BLOOD_PATTERNS[id].phase;
  try{
   startBloodPattern(g,id);
   const hazard=g.blood.hazards[0];
   hazard.age=hazard.warn*.98;g.time=hazard.age;view.update(g,.016);
   const groups=[];scene.traverse(o=>{if(o.userData?.spellForm)groups.push(o);});
   const group=groups[0],base=group.children[0].scale.x;
   hazard.age=hazard.warn+.001;g.time=hazard.age;
   view.update(g,.016);
   assert.ok(group.children[0].scale.x>=hazard.r*.93,id+' impact body is smaller than hit radius');
   assert.ok(group.children[0].scale.x<=base*1.2,id+' volume snaps open only after the damage begins');
  }finally{view.dispose();assert.deepEqual(disposeScene(scene).errors,[]);}
 }
});
