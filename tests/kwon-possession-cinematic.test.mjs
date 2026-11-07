import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createGame,step,swordPose,swordSegment,SWORD,CINEMATIC,patternConfig,kwonVisibleHurtShapes,PHASE_THREE} from '../src/combat.mjs';
import {KWON_THIRD_PATTERNS,KWON_THIRD_COMBOS,KWON_POSSESSION,
 kwonThirdTransition,kwonThirdBodyDrag,kwonThirdScreenRift,
 makeKwonFractures,kwonFractureContact} from '../src/kwon-third-phase.mjs';
import {createKwonThirdPhaseView} from '../src/kwon-third-phase-view.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('unskippable 5.2s transformation: blade wakes, grows, severs its owner, and leaves a limp puppet',()=>{
 const beats=[.3,1.2,1.9,2.28,3.4,4.25,5.15].map(kwonThirdTransition);
 assert.equal(beats[0].bladeGrowth,0);
 assert.ok(beats[1].bladeWake>0);
 assert.ok(beats[2].bladeGrowth>0&&beats[2].betrayalSwing>0);
 assert.ok(beats[3].impact>0);
 assert.ok(beats[4].slump>.8&&beats[4].skyScar===0);
 assert.ok(beats[5].skyScar>0&&beats[5].split>0);
 assert.equal(beats[6].split,0);
 const g=createGame('sword',{register:false});g.boss.phase=3;g.boss.state='transition';g.boss.t=0;
 for(let i=0;i<Math.ceil(CINEMATIC*120);i++)step(g,1/120);
 assert.equal(g.boss.state,'idle');assert.deepEqual(g.kwonFractures,[]);
});
test('third-act sword visual length and physical segment use the same 1.38-scale blade',()=>{
 const g=createGame('sword',{register:false}),b=g.boss;
 const first=swordPose({...b,phase:2,state:'idle'});
 const third=swordPose({...b,phase:3,state:'idle'});
 assert.equal(first.length,SWORD.length);
 assert.ok(Math.abs(third.length/SWORD.length-KWON_POSSESSION.swordScale)<1e-10);
 const seg=swordSegment({...b,phase:3,state:'idle'});
 const actual=Math.hypot(seg.b.x-seg.a.x,seg.b.y-seg.a.y,seg.b.z-seg.a.z);
 assert.ok(Math.abs(actual-third.length)<1e-10,'world blade endpoint must match visible blade length');
 const atWake=swordPose({...b,phase:3,state:'transition',t:.8});
 const atSlash=swordPose({...b,phase:3,state:'transition',t:2.15});
 assert.ok(atSlash.length>atWake.length&&atSlash.x<atWake.x-1,'actual sword cuts owner on camera');
});
test('third-act body stays below and behind the independently flying sword and keeps player-target hitbox',()=>{
 const g=createGame('sword',{register:false}),b=g.boss;b.phase=3;b.state='idle';
 const d=kwonThirdBodyDrag(b),shapes=kwonVisibleHurtShapes(b);
 assert.ok(d.slump>.95&&d.y<0&&d.z<0);
 assert.equal(shapes.some(s=>s.id==='head'),false,'the head still belongs to the blade');
 const first=kwonVisibleHurtShapes({...b,phase:2,state:'idle'});
 assert.ok(shapes[0].z<first[0].z,'body hitbox follows trailing torso');
 assert.ok(shapes[0].y<first[0].y,'body hitbox follows collapsed torso');
});
test('slow third-act attacks preserve readable windups, long heavy recoveries, and no fast jab/cross combos',()=>{
 for(const [name,v] of Object.entries(KWON_THIRD_PATTERNS)){
  assert.ok(v.wind>=1.1,name+' must show visible anticipation');
  assert.ok(v.active>=.39,name+' swing must have tangible weight');
  assert.ok(v.recover>=1.6,name+' must give a punishable recovery');
 }
 for(const moves of Object.values(KWON_THIRD_COMBOS))
  assert.ok(moves.every(x=>!['jab','cross','reverse'].includes(x)));
 for(const move of Object.keys(KWON_THIRD_PATTERNS)){
  const g=createGame('sword',{register:false});g.boss.phase=3;g.boss.pattern=move;
  assert.ok(patternConfig(g.boss).wind>=1.1);
 }
 assert.ok(Object.keys(PHASE_THREE).length>=7);
});
test('world fracture damage stays bound to real 3D travelling strike, never a full-screen mask',()=>{
 const boss={x:0,z:0,yaw:0};
 const cracks=makeKwonFractures(boss,'heavenSplit',11);
 assert.equal(cracks.length,5);
 assert.ok(cracks.every(q=>!kwonFractureContact(q,{x:4,z:11})));
});

test('3D self-betrayal, ground fracture and severed moon mesh pool remain bounded',()=>{
 const scene=new THREE.Scene(),view=createKwonThirdPhaseView(scene);
 const boss={x:0,z:0,yaw:0,phase:3,state:'transition',t:2.3};
 const g={boss,kwonFractures:[]};view.update(g);
 assert.ok(view.root.getObjectByName('kwon-blade-severs-master')?.visible);
 assert.ok(view.root.getObjectByName('kwon-betrayal-wound-rift'));
 boss.state='active';boss.t=.45;g.kwonFractures=makeKwonFractures(boss,'heavenSplit',30);
 g.kwonFractures[0].age=.9;view.update(g);
 assert.equal(view.stats().live,5);
 assert.ok(view.root.getObjectByName('kwon-split-falling-moon'));
 view.dispose();assert.equal(scene.children.length,0);view.dispose();
});
test('arena wires detached 3D blade, body IK, physical shattered world and non-text cutscenes',()=>{
 const arena=read('src/arena.mjs'),stance=read('src/boss-stance.mjs');
 assert.match(arena,/swordGroup\\.parent!==bossRoot/);
 assert.match(arena,/swordGroup\\.parent!==bossModel/);
 assert.match(arena,/swordGroup\\.scale\\.set/);
 assert.match(arena,/brokenWorld\\.update\\(game/);
 assert.match(arena,/brokenWorld\\.reset\\(\\)/);
 assert.match(arena,/lunarStorm\\.update\\(game\\)/);
 assert.match(stance,/drag=kwonThirdBodyDrag\\(b\\)/);
 assert.match(stance,/gripMode=false/);
 assert.match(stance,/caption\\.textContent=''/);
 assert.doesNotMatch(arena,/worldCleave|createKwonWorldCleave/);
});
