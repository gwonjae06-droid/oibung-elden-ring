import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_TSUNAMI,bloodTsunamiFlanks,bloodTsunamiWave,bloodTsunamiApproach} from '../src/blood-tsunami.mjs';
import {BLOOD_PATTERNS,bloodPool,hazardPosition,hazardContains,bloodHazardFootprint} from '../src/blood-data.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {bloodFloorField} from '../src/blood-spell-fx.mjs';
import {createBloodEpicCinematics} from '../src/blood-epic-cinematics.mjs';
import {disposeScene} from '../src/runtime/scene-resources.mjs';

const make=()=>{
 const g=createBloodGame('sword',{seed:92});
 g.boss.phase=2;g.player.hp=g.player.maxHp=1e7;
 assert.ok(startBloodPattern(g,'requiem'));
 return g;
};
const lateral=(g,offset)=>({
 x:g.blood.origin.x+Math.cos(g.blood.hazards[0].yaw)*offset,
 z:g.blood.origin.z-Math.sin(g.blood.hazards[0].yaw)*offset
});

test('horizon tsunami is four travelling damage flanks with a genuine boss-centred safe aperture',()=>{
 const g=make(),h=g.blood.hazards;
 assert.equal(h.length,4);
 assert.deepEqual(h.map(x=>[x.row,x.side]),[[0,-1],[0,1],[1,-1],[1,1]]);
 assert.ok(h.every(x=>x.tsunami&&x.shape==='lane'));
 assert.equal(BLOOD_TSUNAMI.safeHalfWidth,4.65);
 assert.ok(BLOOD_TSUNAMI.horizonDistance>500);
 assert.ok(h.every(x=>x.life>6&&Math.abs(Math.hypot(x.vx,x.vz)-BLOOD_TSUNAMI.speed)<1e-8));
 assert.ok(BLOOD_PATTERNS.requiem.duration>h.at(-1).warn+h.at(-1).life);
 assert.equal(bloodPool(2).filter(x=>x==='requiem').length,1);
 const boss=g.blood.origin;
 const left=lateral(g,-16),right=lateral(g,16);
 for(const row of [0,1]){
  const pair=h.filter(x=>x.row===row);
  const age=pair[0].warn+(BLOOD_TSUNAMI.startDistance+row*BLOOD_TSUNAMI.rowOffset)/BLOOD_TSUNAMI.speed;
  for(const x of pair)x.age=age;
  assert.equal(pair.some(x=>hazardContains(x,boss)),false,'the boss location must be a real hole');
  assert.equal(pair.some(x=>hazardContains(x,left)),true,'left flank must actually sweep the arena');
  assert.equal(pair.some(x=>hazardContains(x,right)),true,'right flank must actually sweep the arena');
  for(const side of [-1,1]){
   const justInside=lateral(g,side*(BLOOD_TSUNAMI.safeHalfWidth-.04));
   const justOutside=lateral(g,side*(BLOOD_TSUNAMI.safeHalfWidth+.15));
   assert.equal(pair.some(x=>hazardContains(x,justInside)),false,'painted safe region must be physically safe');
   assert.equal(pair.some(x=>hazardContains(x,justOutside)),true,'wave must not have an invisible free shoulder');
  }
  for(const flank of pair){
   const c=hazardPosition(flank),foot=bloodHazardFootprint(flank);
   assert.equal(foot.kind,3);assert.equal(foot.x,c.x);assert.equal(foot.z,c.z);
  }
 }
});

test('the gigantic physical wall travels continuously from the horizon through and past the entire arena',()=>{
 const g=make(),h=g.blood.hazards[0],angles=[];
 const checkpoints=[0,.6,2.56,h.warn,h.warn+1,h.warn+4.29,h.warn+5.25];
 for(const t of checkpoints){g.blood.t=t;const w=bloodTsunamiWave(g,0);assert.ok(w);angles.push(w.distance);}
 for(let i=1;i<angles.length;i++)assert.ok(angles[i]<angles[i-1],'wall must always approach, never teleport back to its spawn');
 assert.ok(angles[0]>500,'first visible wave must be at the horizon');
 assert.ok(angles[4]<BLOOD_TSUNAMI.startDistance,'real wave must cross the sky-to-collision handoff');
 assert.ok(angles.at(-1)<-28,'the wall must exit the far side of the playable arena');
 assert.ok(h.warn>2.56,'camera must return before the live wave advances');
 const first= h.warn + (BLOOD_TSUNAMI.startDistance-28)/BLOOD_TSUNAMI.speed;
 assert.ok(first>2.56+3,'there must be a readable player reaction window');
});

test('vibration starts distant, peaks near the player and is not a fake early hit',()=>{
 const g=make(),h=g.blood.hazards[0];
 g.blood.t=.2;
 const distant=bloodTsunamiApproach(g);
 assert.ok(distant.intensity<=.02);
 g.blood.t=h.warn+(BLOOD_TSUNAMI.startDistance-55)/BLOOD_TSUNAMI.speed;
 const nearer=bloodTsunamiApproach(g);
 assert.ok(nearer.intensity>distant.intensity);
 g.blood.t=h.warn+BLOOD_TSUNAMI.startDistance/BLOOD_TSUNAMI.speed;
 const peak=bloodTsunamiApproach(g);
 assert.ok(peak.intensity>=nearer.intensity);
 assert.ok(peak.intensity>.85);
 assert.equal(g.blood.hazards.every(x=>!x.hit),true);
});

test('actual battle never damages the refuge, but damages the approaching lateral wall',()=>{
 const original=make(),a=original.blood.hazards[0];
 const impactAt=a.warn+BLOOD_TSUNAMI.startDistance/BLOOD_TSUNAMI.speed;
 original.player.x=original.blood.origin.x;
 original.player.z=original.blood.origin.z;
 original.player.invuln=0;original.player.action=null;
 for(let t=0;t<=BLOOD_PATTERNS.requiem.duration;t+=.05)stepBlood(original,.05);
 assert.equal(original.player.hp,original.player.maxHp,'a player sheltered at the casting spot must survive both crests');
 const g=make(),h=g.blood.hazards[0],impact=h.warn+BLOOD_TSUNAMI.startDistance/BLOOD_TSUNAMI.speed;
 const outside=lateral(g,14);
 g.player.x=outside.x;g.player.z=outside.z;
 for(const x of g.blood.hazards)x.age=impact-.08;
 g.blood.t=impact-.08;g.player.invuln=0;g.player.action=null;
 const hp=g.player.hp;
 for(let i=0;i<10;i++)stepBlood(g,.02);
 assert.ok(g.player.hp<hp,'the true approaching wall must inflict damage outside the hole');
});

test('rendered 30-metre wave has the same two side flanks and glowing safe opening',()=>{
 const g=make(),scene=new THREE.Scene(),fx=createBloodEpicCinematics(scene,{coarse:true});
 const root=scene.getObjectByName('blood-tsunami-horizon-disaster');
 const crest=scene.getObjectByName('blood-tsunami-split-thirty-metre-crest');
 const under=scene.getObjectByName('blood-tsunami-massive-rolling-undertow');
 const refuge=scene.getObjectByName('blood-tsunami-boss-refuge-on-the-floor');
 assert.ok(root&&crest?.isInstancedMesh&&under?.isInstancedMesh&&refuge);
 assert.ok(scene.getObjectByName('blood-tsunami-visible-refuge-aperture-0'));
 assert.equal(fx.stats().tsunami.damageSources,0);
 g.blood.t=.3;fx.update(g);
 assert.equal(fx.waveRoot.visible,true);
 assert.equal(root.visible,true);
 assert.equal(crest.count,4);
 assert.ok(refuge.visible);
 assert.equal(refuge.position.x,g.blood.origin.x);
 const far=fx.waveRoot.position.clone();
 g.blood.t=g.blood.hazards[0].warn+.2;fx.update(g);
 assert.ok(fx.waveRoot.position.distanceTo(new THREE.Vector3(g.boss.x,0,g.boss.z))<
  far.distanceTo(new THREE.Vector3(g.boss.x,0,g.boss.z)));
 g.blood.t=g.blood.hazards[0].warn+3.8;fx.update(g);
 assert.equal(root.visible,true,'the visual remains during the damaging passage');
 const snapshot=JSON.stringify(g);fx.update(g);
 assert.equal(JSON.stringify(g),snapshot,'rendering must not move the boss, player or hazards');
 fx.dispose();fx.dispose();
 assert.deepEqual(disposeScene(scene).errors,[]);
});

test('the sanctuary is reflected in the shader danger union and survives reduced-motion tier',()=>{
 const game=make(),field=bloodFloorField(game);
 assert.ok(field.safety&&field.hazards.length===4);
 assert.ok(field.hazards.every(x=>x.kind===3));
 const scene=new THREE.Scene(),fx=createBloodEpicCinematics(scene,{coarse:true,reduced:true});
 game.blood.t=1;fx.update(game);
 assert.ok(fx.waveRoot.visible,'reduced motion still sees the real distant tsunami');
 assert.equal(fx.isFraming(game),false,'reduced-motion tier never hijacks input');
 assert.equal(typeof fx.skip,'undefined','cutscenes remain unskippable');
 const rain=fx.stats().tsunami;
 assert.ok(rain.cappedSpray<=12);
 assert.ok(rain.flanks===4);
 fx.dispose();assert.deepEqual(disposeScene(scene).errors,[]);
});
