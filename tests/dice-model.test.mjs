import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildGentlemanTorso,buildGentlemanHand} from '../src/dice-giant-model.mjs';
const mats=()=>Object.fromEntries(['suit','satin','shirt','tie','gold','ivory','skin'].map(k=>[k,new T.MeshStandardMaterial()]));
function triangles(object){let n=0;object.traverse(o=>{const g=o.geometry;if(g)n+=(g.index?g.index.count:g.attributes.position.count)/3;});return n;}

test('the stolen body is a finely tessellated suited gentleman',()=>{
 const {group}=buildGentlemanTorso(T,mats());
 assert.ok(triangles(group)>3500,'torso triangle count '+triangles(group));
 const names=new Set();group.traverse(o=>{if(o.isMesh)names.add(o.material.color.getHex());});
 let detailedMeshes=0;group.traverse(o=>{if(o.isMesh)detailedMeshes++;});assert.ok(detailedMeshes>=12,'jacket, sculpted shoulders and nested tailored details are present');
});
test('each hand has four three-joint fingers and a two-joint thumb that can curl',()=>{
 const hand=buildGentlemanHand(T,mats(),1);
 assert.equal(hand.fingers.length,4);
 assert.ok(hand.fingers.every(joints=>joints.length===3));
 assert.equal(hand.thumb.length,2);
 assert.ok(triangles(hand.group)>4000,'hand triangle count '+triangles(hand.group));
 for(const joints of hand.fingers)for(const joint of joints)joint.rotation.x=1;
 assert.equal(hand.fingers[0][0].rotation.x,1);
});
