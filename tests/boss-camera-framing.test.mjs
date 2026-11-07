import test from 'node:test';
import assert from 'node:assert/strict';
import {KWON_CAMERA_REFERENCE,BOSS_CAMERA_SCALE,matchedBossCamera} from '../src/boss-camera-framing.mjs';
const player={x:0,z:12},boss={x:0,z:0};
test('Kwon's 58-degree 9.5m 0.4-pitch camera remains the combat baseline',()=>{
 const K=KWON_CAMERA_REFERENCE;
 assert.deepEqual([K.fov,K.distance,K.pitch],[58,9.5,.4]);
 const a=matchedBossCamera('gyuwon',{player,boss,yaw:Math.PI,pitch:.4,headHeight:1.6});
 assert.equal(a.distance,9.5);assert.equal(a.fov,58);
 assert.ok(Math.abs(a.position.y-(1.5+Math.sin(.4)*9.5))<1e-10);
 assert.equal(a.focus.z,12-12*.45);
});
test('all bosses use the same screen midpoint bias with size-only clearance',()=>{
 const frames=Object.keys(BOSS_CAMERA_SCALE).map(kind=>matchedBossCamera(kind,{player,boss,yaw:Math.PI,pitch:.4,locked:true,headHeight:3}));
 const dist=frames.map(f=>f.distance);
 assert.ok(dist[0]>9.5&&dist[0]<13);
 assert.ok(dist[1]>=13&&dist[1]<15);
 assert.ok(dist[2]>9.5&&dist[2]<12);
 assert.equal(dist[3],9.5);
 for(const frame of frames){
  assert.equal(frame.fov,58);assert.equal(frame.focus.z,12-12*.45);
  assert.ok(frame.position.y<8,'combat framing should not float far above the fight');
 }
});
test('free camera uses yaw without automatically looking at the distant boss',()=>{
 const v=matchedBossCamera('blood',{player,boss:{x:20,z:-30},yaw:0,locked:false,headHeight:28});
 assert.deepEqual(v.focus,{x:0,y:1.6,z:12});
 assert.ok(v.position.z<player.z);
});
test('giant clearance and mobile portrait reserve are restrained',()=>{
 const ordinary=matchedBossCamera('dice',{player,boss,yaw:0,aspect:1});
 const large=matchedBossCamera('dice',{player,boss,yaw:0,aspect:.6,extraDistance:3});
 assert.ok(large.distance>ordinary.distance+3);
 assert.ok(large.distance<ordinary.distance+6);
});
