import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BLOOD_WHIP,bloodWhipDuration,bloodWhipPath,bloodWhipExtension,
 bloodWhipCanStart,beginBloodWhip,stepBloodWhip,bloodWhipContact} from '../src/blood-whip.mjs';
import {createBloodWhipView} from '../src/blood-whip-view.mjs';
import {createBloodGame,stepBlood} from '../src/blood-combat.mjs';
import {BLOOD_PATTERNS} from '../src/blood-data.mjs';

function ready(phase=1){
 const g=createBloodGame('bow',{seed:914});
 g.boss.phase=phase;g.boss.state='recovery';
 g.blood.recover=2.5;g.blood.whipCooldown=0;
 return g;
}
test('blood-whip only threatens genuinely distant targets and never during cinematic or concurrent impact',()=>{
 const g=ready();
 g.player.z=g.boss.z+9;
 assert.equal(bloodWhipCanStart(g),false,'near combat has no extra retaliation');
 g.player.z=g.boss.z+19;
 assert.equal(bloodWhipCanStart(g),true);
 g.blood.whipCooldown=.1;assert.equal(bloodWhipCanStart(g),false);
 g.blood.whipCooldown=0;
 g.boss.phase=2;g.boss.state='pattern';g.blood.pattern='requiem';g.blood.t=1;
 g.blood.patternDuration=BLOOD_PATTERNS.requiem.duration;g.blood.hazards=[];
 assert.equal(bloodWhipCanStart(g),false,'epic 2P camera may never overlap a side whip');
 g.boss.phase=1;g.blood.pattern='bloodStatues';g.blood.t=.8;
 g.blood.patternDuration=BLOOD_PATTERNS.bloodStatues.duration;
 g.blood.hazards=[{age:.8,warn:2.9,life:.7}];
 assert.equal(bloodWhipCanStart(g),true,'a sufficiently long unoccupied windup is eligible');
 g.blood.hazards[0].warn=2.25;
 assert.equal(bloodWhipCanStart(g),false,'upcoming large damage blocks an interstitial whip');
});
test('the physical cord is target-locked, has a long readable windup, and hits at most once',()=>{
 const g=ready();assert.equal(beginBloodWhip(g),true);
 const w=g.blood.whip,original=bloodWhipPath(w);
 assert.ok(g.events.some(e=>e.type==='blood-whip-warning'&&e.duration>=.9));
 let hits=0;
 for(let i=0;i<Math.ceil((BLOOD_WHIP.warning-.04)*120);i++){
  stepBloodWhip(g,1/120,()=>hits++);
 }
 assert.equal(hits,0,'no early hit while the hand is still winding up');
 assert.equal(bloodWhipContact(w,g.player),false);
 for(let i=0;i<Math.ceil((BLOOD_WHIP.extension+BLOOD_WHIP.linger+.11)*120);i++)
  stepBloodWhip(g,1/120,()=>hits++);
 assert.equal(hits,1,'one extending cable means one damaging contact');
 assert.deepEqual(original,bloodWhipPath(w),'the cord does not home after release');
 assert.equal(g.blood.whip,null);
 assert.ok(g.blood.whipCooldown>0,'the response is cooldown limited');
});
test('moving sideways, roll invulnerability and transformation prevent unfair counter-hits',()=>{
 const g=ready();beginBloodWhip(g);
 g.player.x+=6;
 let contacts=0;
 for(let i=0;i<Math.ceil((bloodWhipDuration+.1)*120);i++)
  stepBloodWhip(g,1/120,()=>contacts++);
 assert.equal(contacts,0,'sidestepping the warning is a valid escape');
 const dodge=ready();dodge.player.invuln=2;
 const before=dodge.player.hp;
 stepBlood(dodge,1.53);
 assert.equal(dodge.player.hp,before,'dodging/iframing the cable prevents damage');
 const phase=ready();beginBloodWhip(phase);
 phase.boss.state='transition';
 stepBloodWhip(phase,.01);
 assert.equal(phase.blood.whip,null,'the transformation cancels an unfinished counter');
});
test('whip has a visible physical cable, wrist anchor and ground aim omen with pooled geometry',()=>{
 const scene=new THREE.Scene(),hand=new THREE.Group();scene.add(hand);
 hand.position.set(1,4.5,0);
 const root=new THREE.Group();scene.add(root);
 const view=createBloodWhipView(root,{coarse:true,hand});
 const g=ready();beginBloodWhip(g);
 view.update(g);
 assert.equal(view.group.visible,true);
 assert.equal(view.stats().damageSources,0);
 assert.ok(view.group.getObjectByName('blood-whip-locked-aim-liquid-omen').visible);
 const first=view.group.getObjectByName('blood-whip-physical-segment-0');
 assert.ok(first.visible,'initial arm coil is visible before the attack');
 const aim=bloodWhipPath(g.blood.whip);
 assert.ok(Math.abs(view.group.getObjectByName('blood-whip-locked-aim-liquid-omen').position.z-aim.z)<1e-6);
 g.blood.whip.age=BLOOD_WHIP.warning+BLOOD_WHIP.extension;
 view.update(g);
 assert.equal(view.group.getObjectByName('blood-whip-locked-aim-liquid-omen').visible,false);
 assert.ok(view.group.children.filter(o=>o.name.startsWith('blood-whip-physical-segment')&&o.visible).length>=10);
 assert.equal(bloodWhipExtension(g.blood.whip),1);
 view.dispose();assert.equal(view.group.parent,null);
});
