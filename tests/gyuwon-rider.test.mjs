import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {startGyuwonYearCast} from '../src/gyuwon-years.mjs';
import {sampleRide,ridePose,rideFrame} from '../src/gyuwon-year-choreography.mjs';
import {hazardPosition,hazardContains} from '../src/gyuwon-data.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {gyuwonHurtShapes} from '../src/boss-hit-regions.mjs';
const fixture=id=>{const g=createGyuwonGame('sword',{yearMode:true,seed:42});g.gyuwon.years.year=id.includes('Scooter')||id==='scooter'?2:1;g.player.invuln=1e5;startGyuwonYearCast(g,id);return g;};
const until=(g,time)=>{while(g.gyuwon.years.castT+1e-8<time)stepGyuwon(g,Math.min(1/120,time-g.gyuwon.years.castT));};

test('each vehicle completes a fast perimeter lap, winds up, rushes and rejoins the outside route',()=>{
 for(const id of ['bike','scooter','ultimateBike','ultimateScooter']){
  const g=fixture(id),e=g.gyuwon.years,track=e.rideTrack,orbit=track.find(s=>s.cruise),rush=track.find(s=>s.stage==='rush');
  assert.ok(orbit.b-orbit.a>=Math.PI*2);
  const a=sampleRide(orbit,orbit.start+.3),b=sampleRide(orbit,orbit.start+.31);
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)/.01>45,'perimeter travel must keep its speed');
  assert.ok(rush.start-orbit.end>=.77,'visible front-wheel lift precedes every impact');
  assert.ok(track.some(s=>s.cruise&&s.start>rush.end),'the charge must return to circling');
  const duration=e.castDuration;assert.ok(duration>track.at(-1).end);
  until(g,track.at(-1).end-.05);assert.ok(e.cast,'the old short cast duration cannot cut off the ride');
 }
});

test('the charge locks the live target during its wheelie and cannot home after that warning',()=>{
 const g=fixture('bike'),e=g.gyuwon.years,prep=e.rideTrack.find(s=>s.stage==='windup');
 until(g,prep.start-.02);g.player.x=7;g.player.z=4;
 until(g,prep.start+.02);assert.deepEqual(prep.target,{x:7,z:4});
 const end={...prep.rush.to};g.player.x=-12;g.player.z=-11;until(g,prep.end+.12);
 assert.deepEqual(prep.rush.to,end);
 const hit=g.gyuwon.hazards.find(h=>h.rideSegment===prep.rush),f=prep.rush.from,t=prep.target;
 const cross=(end.x-f.x)*(t.z-f.z)-(end.z-f.z)*(t.x-f.x);
 assert.ok(Math.abs(cross)<1e-7,'real travel line passes through the warned target');
 assert.deepEqual(hazardPosition(hit),sampleRide(prep.rush,hit.age));
});

test('standing on the warned line is hit once while a sideways escape avoids the rush',()=>{
 for(const dodge of [false,true]){
  const g=fixture('scooter'),e=g.gyuwon.years,prep=e.rideTrack.find(s=>s.stage==='windup');
  g.player.x=0;g.player.z=0;until(g,prep.start+.03);
  g.player.invuln=0;const hp=g.player.hp;
  if(dodge){const yaw=prep.aimYaw;g.player.x=Math.cos(yaw)*8;g.player.z=-Math.sin(yaw)*8;}
  until(g,prep.rush.end+.01);
  assert.equal(g.player.hp<hp,!dodge);
  assert.equal(g.events.filter(e=>e.type==='hurt').length,dodge?0:1);
 }
});

test('the rider, spinning wheels and raised vehicle share a rear-axle transform and reset after dismount',()=>{
 for(const id of ['bike','scooter']){
  const g=fixture(id),e=g.gyuwon.years,scene=new THREE.Group(),actor=createGyuwonActor(scene,{coarse:true}),fx=createGyuwonYearsFx(scene,{coarse:true});
  const prep=e.rideTrack.find(s=>s.stage==='windup');until(g,prep.start-.05);fx.update(g);
  until(g,prep.end-.01);for(let i=0;i<20;i++)actor.update(g,0,.05);fx.update(g);
  const vehicle=scene.getObjectByName(id==='bike'?'gyuwon-motorbike':'gyuwon-electric-scooter');scene.updateMatrixWorld(true);
  const front=vehicle.getObjectByName(vehicle.name+'-front-wheel'),rear=vehicle.getObjectByName(vehicle.name+'-rear-wheel');
  const a=front.getWorldPosition(new THREE.Vector3()),b=rear.getWorldPosition(new THREE.Vector3());
  assert.ok(a.y-b.y>.95,'the front axle must clearly rise before the rush');
  assert.ok(front.rotation.x>1,'wheel spokes turn with actual route travel');
  assert.ok(vehicle.position.distanceTo(actor.root.position)<1e-7);
  assert.ok(vehicle.quaternion.angleTo(actor.root.quaternion)<1e-7);
  const head=gyuwonHurtShapes(g).find(p=>p.id==='anatomical-head');
  const local=new THREE.Vector3(0,3.5,0).applyMatrix4(actor.root.matrixWorld);
  assert.ok(local.distanceTo(new THREE.Vector3(head.x,head.y,head.z))<.03,'raised head collision follows the mounted rig');
  const pose=ridePose(e),frame=rideFrame(pose);assert.ok(frame.y>0&&pose.wheelie>.45);
  g.gyuwon.years.cast=null;actor.update(g,0,.05);fx.update(g);
  assert.equal(vehicle.visible,false);assert.equal(actor.root.rotation.x,0);assert.equal(actor.root.rotation.z,0);
  actor.dispose();fx.dispose();
 }
});
