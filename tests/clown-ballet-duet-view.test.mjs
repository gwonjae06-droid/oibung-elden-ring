import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createClownBalletDuet} from '../src/clown-ballet-duet-view.mjs';
import {createClownGame} from '../src/clown-combat.mjs';
import {balletSculptPose,blendBalletPose} from '../src/clown-ballet-choreography.mjs';

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
 assert.ok(statue.getObjectByName('layered-sculpted-ballerina-tutu'));
 assert.ok(statue.getObjectByName('sculpted-ballerina-palm'));
 assert.ok(statue.getObjectByName('ballet-ankle-hinge'));
 assert.equal(statue.getObjectByName('carved-eyes'),undefined);
 assert.equal(statue.getObjectByName('mournful-lips'),undefined);
 assert.equal(statue.getObjectByName('gold-tear-grain'),undefined);
 assert.ok(statue.getObjectByName('anatomical-dancer-waist-ribcage-and-shoulders').geometry.attributes.position.count>600);
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
