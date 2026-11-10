import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createGyuwonGame,actGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {jumpGyuwonToFifthYear} from '../src/gyuwon-years.mjs';
import {actFiveChoreographyAt} from '../src/gyuwon-act-five-choreography.mjs';
import {actFivePerformanceAt} from '../src/gyuwon-act-five-score.mjs';
import {actFiveMouthAt,actFiveInstrumentalAt} from '../src/gyuwon-act-five-vocal-acting.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGiantGyuwon} from '../src/gyuwon-giant-actor.mjs';
import {createActFiveWings} from '../src/gyuwon-act-five-wings.mjs';
import {createGyuwonFiveSixBridge} from '../src/gyuwon-five-six-bridge.mjs';
import {gyuwonFiveToSixExit,gyuwonRunnerBridgeAt} from '../src/gyuwon-runner-director.mjs';

test('mouth follows aligned original sung windows, but remains shut through genuine instrumental spans',()=>{
 const sung=actFiveMouthAt(2.15);
 assert.equal(sung.singing,true);assert.ok(sung.openness>0);
 for(const t of [0,84.5,87,140,174.2]){
  const mouth=actFiveMouthAt(t);assert.equal(mouth.singing,false);
  assert.equal(mouth.openness,0);
 }
 assert.equal(actFiveMouthAt(21).singing,true);
 assert.ok(actFiveMouthAt(21).openness<=1);
});
test('instrumental bridges keep deliberate acting; waist chest and shoulders articulate in independently weighted bounds',()=>{
 for(const t of [0,84.5,87.2,139,149,160,173.7]){
  const p=actFivePerformanceAt(t);
  assert.ok(p.weight>.3);assert.ok(p.gesture!=='idle');
  const pose=actFiveChoreographyAt(t,p);
  assert.equal(pose.waist.length,3);assert.equal(pose.chest.length,3);
  assert.ok(Math.abs(pose.waist[0])<.34);assert.ok(Math.abs(pose.chest[0])<.35);
  assert.ok(pose.shoulders.length===2);
  assert.ok(pose.lean.x<=1.3&&pose.lean.z>=-1.9);
 }
 assert.equal(actFiveInstrumentalAt(84).vocal,false);
});
test('the giant face deformation never writes into the shared original portrait geometry',()=>{
 const scene=new T.Scene(),source=createGyuwonActor(scene,{coarse:true});
 const root=new T.Group(),giant=createGiantGyuwon(root,source.root,{coarse:true});
 const face=giant.head.getObjectByName('gyuwon-anatomical-face');
 const master=source.root.getObjectByName('gyuwon-anatomical-face');
 assert.ok(giant.photoMouth.affected>0);
 assert.notEqual(face.geometry,master.geometry);
 const baseline=face.geometry.attributes.position.array.slice();
 const masterBaseline=master.geometry.attributes.position.array.slice();
 const g=createGyuwonGame('sword',{yearMode:true});jumpGyuwonToFifthYear(g);
 const m=g.gyuwon.years.musical;
 m.time=2.15;m.songPerformance=actFivePerformanceAt(m.time);
 for(let i=0;i<8;i++)giant.update(m,1/60);
 assert.ok(giant.photoMouth.last.openness>0);
 assert.ok(giant.photoMouth.interior.visible);
 assert.notDeepEqual(Array.from(face.geometry.attributes.position.array),Array.from(baseline));
 assert.deepEqual(Array.from(master.geometry.attributes.position.array),Array.from(masterBaseline));
 assert.notEqual(giant.waist.rotation.x,0);
 assert.notEqual(giant.torso.rotation.x,0);
 const old=giant.waist.rotation.x;giant.update(m,0);assert.equal(giant.waist.rotation.x,old);
 m.time=85;m.songPerformance=actFivePerformanceAt(85);
 giant.update(m,1/60);
 assert.equal(giant.photoMouth.last.singing,false);
 assert.equal(giant.photoMouth.interior.visible,false);
 giant.dispose();source.dispose();
});
test('the flight word unfolds one physical pair from the back, without ambient swarms',()=>{
 const parent=new T.Group(),wings=createActFiveWings(parent,{coarse:true});
 for(let i=0;i<30;i++)wings.update({time:68.5,songPerformance:actFivePerformanceAt(68.5)},1/60);
 assert.equal(wings.root.parent,parent);assert.equal(wings.stats().pairs,1);assert.equal(wings.root.visible,true);
 for(let i=0;i<60;i++)wings.update({time:72,songPerformance:actFivePerformanceAt(72)},1/60);
 assert.equal(wings.root.visible,false);wings.dispose();assert.equal(parent.children.length,0);
});

test('five-to-six preserves the actual 3D performance and stage transition instead of a black-only handoff',()=>{
 const g=createGyuwonGame('sword',{yearMode:true});jumpGyuwonToFifthYear(g);
 const before=g.gyuwon.years.musical;
 assert.ok(before.giantRaid);
 before.clock={source:'media',time:180,duration:180,ended:true,afterEnd:1.2};
 stepGyuwon(g,1/60);
 const six=g.gyuwon.years.musical;
 assert.equal(six.year,6);assert.equal(six.handoffFromFive,before);
 assert.equal(six.entryDuration,2.7);
 assert.equal(gyuwonRunnerBridgeAt(0).paint,0);
 assert.ok(gyuwonRunnerBridgeAt(4).paint>0);
 assert.equal(gyuwonRunnerBridgeAt(8).paint,1);
 const stage=new T.Group(),bridge=createGyuwonFiveSixBridge(stage,{coarse:true});
 bridge.update({exit:gyuwonFiveToSixExit(172)});
 assert.ok(bridge.root.visible);
 bridge.update({exit:1,entryTime:4});
 assert.ok(bridge.foliage.some(f=>f.bloom.visible));
 assert.equal(bridge.gate.parent,bridge.root);
 bridge.dispose();assert.equal(stage.children.length,0);
});
