import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,actGyuwon,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {jumpGyuwonToFifthYear} from '../src/gyuwon-years.mjs';
import {summonActFiveEncore} from '../src/gyuwon-giant-raid.mjs';
import {actFivePerformanceAt} from '../src/gyuwon-act-five-score.mjs';
import {actFiveCameraDirection} from '../src/gyuwon-act-five-camera.mjs';
import {createActFiveStagecraft} from '../src/gyuwon-act-five-stagecraft.mjs';

test('opening semicolon entry goes straight to a fresh playable fifth year',()=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:12345}),events=[];
 assert.equal(jumpGyuwonToFifthYear(g,(type,data)=>events.push({type,...data})),true);
 const m=g.gyuwon.years.musical;
 assert.equal(g.gyuwon.years.year,5);
 assert.equal(g.gyuwon.years.mode,'musical');
 assert.equal(g.boss.hp,6000);
 assert.equal(m.year,5);assert.equal(m.kind,'turn');assert.equal(m.giantRaid,true);
 assert.equal(m.enemies.length,5);
 assert.equal(jumpGyuwonToFifthYear(g),false);
 assert.ok(events.some(v=>v.type==='gyuwon-musical-act'&&v.year===5));
});
test('when all five original parts are shattered, a physical sixth target returns without resurrecting them',()=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:18});
 jumpGyuwonToFifthYear(g);
 const m=g.gyuwon.years.musical;m.transition=0;m.time=64;m.clock=null;
 for(const e of m.enemies){e.active=true;e.destroyed=true;e.hp=0;}
 m.partBreaks=5;m.actorMotion=null;m.turn='support';m.turnActor=null;
 assert.equal(summonActFiveEncore(m),true);
 const encore=m.enemies[5];
 assert.equal(m.targetIndex,5);assert.equal(encore.encore,true);
 assert.ok(encore.hp>0);assert.equal(m.enemies.length,6);
 assert.equal(m.partBreaks,5);
 assert.equal(actGyuwon(g,'target5'),true);
 assert.ok(m.queue.some(e=>e.id==='enemy5'));
 assert.ok(m.enemies.slice(0,5).every(e=>e.destroyed&&e.hp===0));
 m.turn='player';m.turnActor='ally0';encore.hp=1;
 assert.equal(actGyuwon(g,'light'),true);
 for(let i=0;i<100;i++)stepGyuwon(g,1/120);
 assert.equal(encore.destroyed,true);
 assert.equal(m.partBreaks,5,'original parts are never regenerated or counted twice');
 m.actorMotion=null;m.turn='support';m.turnActor=null;
 for(let i=0;i<175;i++)stepGyuwon(g,1/120);
 assert.equal(m.enemies[5],encore,'reuse one real collider instead of leaking objects');
 assert.equal(encore.destroyed,false);
 assert.ok(m.encoreCount>=2);
 assert.ok(m.enemies.slice(0,5).every(e=>e.destroyed));
 assert.equal(g.status,'playing');
});
test('the encore cannot appear before the stage is empty or after finale assembly',()=>{
 const g=createGyuwonGame('sword',{yearMode:true});jumpGyuwonToFifthYear(g);
 const m=g.gyuwon.years.musical;
 assert.equal(summonActFiveEncore(m),false);
 m.enemies.forEach(e=>{e.active=true;e.destroyed=true;e.hp=0;});
 m.time=168;assert.equal(summonActFiveEncore(m),false);
 assert.equal(m.enemies.length,5);
});
test('the sung shot plan changes composition and retains telegraphed combat readability',()=>{
 const one=(gesture,time)=>actFiveCameraDirection({time,songPerformance:{gesture,weight:1,progress:.5}},1.6);
 const doors=one('doors',13),sea=one('sea',21),king=one('king',29),flight=one('flight',68);
 assert.notDeepEqual(doors.position,sea.position);
 assert.notDeepEqual(sea.target,king.target);
 assert.notDeepEqual(flight.target,doors.target);
 for(const shot of [doors,sea,king,flight]){
  assert.ok(shot.fov>=45&&shot.fov<=54);
  assert.ok([...Object.values(shot.position),...Object.values(shot.target)].every(Number.isFinite));
 }
 const portrait=actFiveCameraDirection({time:21,songPerformance:{gesture:'sea'}},.7);
 assert.ok(portrait.position.z>sea.position.z+20);
 const warning=actFiveCameraDirection({time:21,songPerformance:{gesture:'sea'},
  raidAttack:{age:1,wind:1.4,victim:'ally0'},party:[{id:'ally0',x:6,y:0}]});
 assert.ok(warning.fov>=52);
});
test('the scenic stage changes real 3D object visibility on the aligned original audio clock',()=>{
 const parent=new THREE.Group(),head=new THREE.Group();parent.add(head);
 const scene=createActFiveStagecraft(parent,head,{coarse:true});
 const check=(time,name)=>{scene.update({time,songPerformance:actFivePerformanceAt(time)});const obj=parent.getObjectByName(name);assert.ok(obj,name);assert.equal(obj.visible,true,name);};
 check(20.5,'act-five-lyric-ocean');
 check(31,'act-five-knight-sword-and-shield');
 check(35,'act-five-shared-heart');
 check(54.8,'act-five-dancing-roles');
 check(68.5,'act-five-physical-dream-wings');
 check(97,'act-five-many-stories');
 check(130,'act-five-many-stories');
 scene.dispose();
});
