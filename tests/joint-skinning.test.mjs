import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWeightedJoint} from '../src/joint-skinning.mjs';
import {buildPlayer} from '../src/models.mjs';
import {samplePlayerMotion} from '../src/player-motion-data.mjs';
import {applyPlayerMotion} from '../src/player-motion.mjs';
import {createBloodRegalia} from '../src/blood-regalia.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {collectSceneResources,disposeScene} from '../src/runtime/scene-resources.mjs';

const weapons=['sword','hammer','bow','cards'];
const game=weapon=>({weapon,status:'playing',time:0,player:{x:0,z:0,yaw:0,action:null,skill:{}},boss:{state:'idle',x:0,z:4}});
function worldVertex(mesh,i){
 const v=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i);
 mesh.applyBoneTransform(i,v);
 return mesh.localToWorld(v);
}
test('weighted skinning blends two real bones and bends without detaching the upper edge',()=>{
 const scene=new THREE.Scene(),parent=new THREE.Group(),child=new THREE.Group();
 scene.add(parent);child.position.y=-.4;parent.add(child);
 const material=new THREE.MeshStandardMaterial({color:0x333333});
 const mesh=createWeightedJoint(THREE,parent,child,material,{name:'test-sleeve',length:.24,radius:.1});
 assert.equal(mesh.isSkinnedMesh,true);
 assert.equal(mesh.skeleton.bones.length,2);
 const pos=mesh.geometry.attributes.position,weights=mesh.geometry.attributes.skinWeight;
 const top=0,bottom=pos.count-1;
 assert.ok(weights.getX(top)>.999);
 assert.ok(weights.getY(bottom)>.999);
 for(let i=0;i<pos.count;i++){
  const sum=weights.getX(i)+weights.getY(i);
  assert.ok(Math.abs(sum-1)<1e-6);
 }
 scene.updateWorldMatrix(true,true);
 const upper0=worldVertex(mesh,top).clone(),lower0=worldVertex(mesh,bottom).clone();
 child.rotation.z=.7;scene.updateWorldMatrix(true,true);
 const upper1=worldVertex(mesh,top),lower1=worldVertex(mesh,bottom);
 assert.ok(upper1.distanceTo(upper0)<1e-5);
 assert.ok(lower1.distanceTo(lower0)>.02);
 assert.ok([...lower1.toArray(),...upper1.toArray()].every(Number.isFinite));
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('player wrist/knee/elbow/ankle liners skin eight joints and keep gameplay unchanged',()=>{
 const scene=new THREE.Scene(),player=buildPlayer(weapons);scene.add(player.rig);
 const skins=player.presentationParts.jointSkins;
 assert.equal(skins.length,8);
 assert.equal(new Set(skins.map(m=>m.name)).size,8);
 assert.ok(skins.every(m=>m.isSkinnedMesh&&m.skeleton.bones.length===2));
 const g=game('sword'),initial=JSON.stringify(g);
 const resources=collectSceneResources(scene).size;
 const points=skins.map(m=>worldVertex(m,0).clone());
 for(let frame=0;frame<80;frame++){
  g.time=frame/60;
  const pose=samplePlayerMotion(g,frame*.13,4.5,{moveZ:1});
  applyPlayerMotion(player.presentationParts,pose,'sword',g.time,4.5);
  scene.updateWorldMatrix(true,true);
  for(const m of skins){
   const p=worldVertex(m,m.geometry.attributes.position.count-1);
   assert.ok(p.toArray().every(Number.isFinite));
  }
  assert.equal(collectSceneResources(scene).size,resources);
 }
 assert.equal(g.player.x,0);assert.equal(g.player.z,0);
 assert.deepEqual(player.rig.position.toArray(),[0,0,0]);
 assert.notDeepEqual(points[0].toArray(),worldVertex(skins[0],0).toArray());
 assert.deepEqual(disposeScene(scene).errors,[]);
});
test('Blood rig skins all four limb hinges in coarse mode and recycles existing resources',()=>{
 const scene=new THREE.Scene(),rig=createBloodRegalia(scene,{coarse:true,reduced:true}),g=createBloodGame();
 assert.equal(rig.jointSkins.length,8);
 assert.ok(rig.jointSkins.every(m=>m.isSkinnedMesh&&m.skeleton.bones.length===2));
 const baseline=collectSceneResources(scene).size;
 for(let i=0;i<72;i++){
  g.time+=1/60;
  rig.update(g,{veins:i/72},1/60,.25,{body:{lean:.18,roll:.1},arms:[{raise:.3,elbow:.2},{raise:.55,elbow:-.3}],walk:{moving:true,feet:[.2,-.2]}});
  scene.updateWorldMatrix(true,true);
  for(const m of rig.jointSkins)assert.ok(worldVertex(m,m.geometry.attributes.position.count-1).toArray().every(Number.isFinite));
  assert.equal(collectSceneResources(scene).size,baseline);
 }
 rig.resetPose();rig.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});
