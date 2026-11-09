import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownBalletDuet} from '../src/clown-ballet-duet-view.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {balletSculptPose,blendBalletPose} from '../src/clown-ballet-choreography.mjs';
import {createBalletTorsoGeometry,createBalletMuscleLimbGeometry,BALLET_REFERENCE_MODEL} from '../src/clown-ballet-anatomy.mjs';

test('a male lead and a faceless sculpted ballerina enter together and reset cleanly',()=>{
 const scene=new THREE.Scene();
 const duet=createClownBalletDuet(scene,{coarse:true,reduced:true});
 const g=createClownGame('sword',{register:false});
 duet.prepareGpuWarmup();
 assert.equal(duet.root.visible,true);
 duet.finishGpuWarmup();
 assert.equal(duet.root.visible,false);
 g.boss.phase=3;g.boss.state='transition';g.boss.t=2.9;g.clown.state='transition';
 duet.update(g,1/60);
 assert.equal(duet.root.visible,true);
 assert.ok(duet.root.getObjectByName('o-seulwoo-male-ballet-dancer'));
 assert.ok(duet.root.getObjectByName('his-faceless-wood-carved-ballerina-spouse'));
 assert.ok(duet.root.getObjectByName('articulated-ballet-thigh'));
 assert.ok(duet.root.getObjectByName('anatomical-dancer-waist-ribcage-and-shoulders'));
 const statue=duet.root.getObjectByName('his-faceless-wood-carved-ballerina-spouse');
 assert.ok(statue.getObjectByName('unmarked-smooth-wooden-face'));
 assert.ok(statue.getObjectByName('sculpted-classical-ballet-bun'));
 assert.ok(statue.getObjectByName('reference-white-ballet-leotard'));
 assert.equal(statue.getObjectByName('layered-sculpted-ballerina-tutu'),undefined);
 assert.ok(statue.getObjectByName('sculpted-ballerina-palm'));
 assert.ok(statue.getObjectByName('ballet-ankle-hinge'));
 assert.equal(statue.getObjectByName('carved-eyes'),undefined);
 assert.equal(statue.getObjectByName('mournful-lips'),undefined);
 assert.equal(statue.getObjectByName('gold-tear-grain'),undefined);
 assert.ok(statue.getObjectByName('anatomical-dancer-waist-ribcage-and-shoulders').geometry.attributes.position.count>600);
 const lead=duet.root.getObjectByName('o-seulwoo-male-ballet-dancer');
 assert.ok(lead.getObjectByName('sculpted-male-pectoral'));
 assert.ok(lead.getObjectByName('sculpted-abdominal-muscle'));
 assert.equal(lead.getObjectByName('layered-sculpted-ballerina-tutu'),undefined);
 assert.equal(lead.getObjectByName('reference-white-ballet-leotard'),undefined);
 assert.equal(lead.getObjectByName('anatomical-dancer-waist-ribcage-and-shoulders').material.length,2);
 g.boss.state='clown';g.clown.state='idle';g.clown.pt=0;
 duet.update(g,1/60);
 const partner=duet.root.getObjectByName('his-faceless-wood-carved-ballerina-spouse');
 assert.ok(Number.isFinite(partner.position.x));
 assert.ok(Number.isFinite(partner.position.z));
 duet.reset();assert.equal(duet.root.visible,false);
 duet.dispose();assert.equal(scene.children.includes(duet.root),false);
});


test('ballet poses change continuously, mirror the partner and tolerate frame drops',()=>{
 const lead=balletSculptPose({time:1.31,beat:1.4,active:true,pulse:1,lead:true,pattern:'balletFouette'});
 const partner=balletSculptPose({time:1.31,beat:1.4,active:true,pulse:1,lead:false,pattern:'balletFouette'});
 assert.ok(lead.leftLegLift!==partner.leftLegLift||lead.rightLegLift!==partner.rightLegLift);
 assert.ok(lead.chestYaw*partner.chestYaw<0);
 const rest=balletSculptPose({time:0,beat:0,active:false,lead:false});
 const a=blendBalletPose(rest,partner,1/60);
 const b=blendBalletPose(a,partner,1/60);
 assert.ok(Math.abs(b.chestYaw-partner.chestYaw)<Math.abs(a.chestYaw-partner.chestYaw));
 const noFrame=blendBalletPose(a,partner,0);
 assert.equal(noFrame.chestYaw,a.chestYaw);
 const skipped=blendBalletPose(a,partner,6);
 const bound=blendBalletPose(a,partner,.05);
 assert.equal(skipped.chestYaw,bound.chestYaw);
 for(const value of Object.values(skipped))assert.ok(Number.isFinite(value));
});

test('fouette and mirrored silk establish distinct safe, softened pose targets',()=>{
 const rest=balletSculptPose({time:2,beat:0,active:false,lead:false});
 const turn=balletSculptPose({time:2,beat:2,active:true,pulse:1,lead:false,pattern:'balletFouette'});
 const silk=balletSculptPose({time:2,beat:2,active:true,pulse:1,lead:false,pattern:'balletMirrorVeils'});
 assert.ok(turn.leftPointe>rest.leftPointe);
 assert.ok(silk.leftReach>rest.leftReach);
 assert.notEqual(turn.leftReach,silk.leftReach);
 const last=blendBalletPose(rest,turn,1/60);
 assert.ok(Math.abs(last.chestRoll-rest.chestRoll)<Math.abs(turn.chestRoll-rest.chestRoll));
});

test('photo-reference signature poses are anatomically distinct and remain bounded',()=>{
 const female=balletSculptPose({time:4,beat:3.4,showcase:1,active:false,lead:false});
 const male=balletSculptPose({time:4,beat:3.4,showcase:1,active:false,lead:true});
 const neutral=balletSculptPose({time:4,beat:3.4,showcase:0,active:false,lead:false});
 assert.ok(BALLET_REFERENCE_MODEL.female.includes('pointe'));
 assert.ok(BALLET_REFERENCE_MODEL.male.includes('black'));
 assert.ok(female.rightLegLift>1.0,'high passe must bend one leg visibly');
 assert.ok(female.leftPointe>neutral.leftPointe+.6,'supporting foot must go on pointe');
 assert.ok(female.leftArmY>4.7&&female.rightArmY>4.9,'woman should hold curved high arm line');
 assert.ok(male.bodyLift>.36,'male should show airborne leap');
 assert.ok(male.chestRoll>.4,'airborne arch should bend laterally');
 assert.ok(male.leftArmY>4.6&&male.rightArmY<3.1,'asymmetric extended arm silhouette');
 for(const p of [female,male])for(const k of Object.values(p))assert.ok(Number.isFinite(k));
});

test('continuous loft anatomy is high-poly on desktop with correct outward normals and no NaNs',()=>{
 for(const lead of [false,true]){
  for(const coarse of [true,false]){
   const mesh=createBalletTorsoGeometry(THREE,{lead,coarse});
   const upper=createBalletMuscleLimbGeometry(THREE,{kind:'upperArm',coarse});
   assert.ok(mesh.attributes.position.count>(coarse?1000:5000));
   assert.ok(mesh.groups.some(g=>g.materialIndex===0));
   assert.ok(mesh.groups.some(g=>g.materialIndex===1));
   assert.ok(upper.attributes.normal.count>200);
   for(const geo of [mesh,upper]){
    const pos=geo.attributes.position;
    const normal=geo.attributes.normal;
    for(let i=0;i<pos.count;i++){
     assert.ok(Number.isFinite(pos.getX(i)));
     assert.ok(Number.isFinite(pos.getY(i)));
     assert.ok(Number.isFinite(pos.getZ(i)));
     assert.ok(Number.isFinite(normal.getX(i)));
    }
   }
   // Vertex phi=0 lies on the forward-facing side: positive Z normals.
   const index=mesh.attributes.position.count/(coarse?43:105);
   const mid=Math.floor((coarse?42:104)*.55)*index;
   assert.ok(mesh.attributes.normal.getZ(mid)>.25,'outward PBR normal required');
   mesh.dispose();upper.dispose();
  }
 }
});
