import {annualFloor} from '../src/gyuwon-annual-progress.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {startGyuwonYearCast,GYUWON_EXAM_MAX_REACH,GYUWON_SUBJECT_SECONDS} from '../src/gyuwon-years.mjs';
import {createGyuwonYearsFx} from '../src/gyuwon-years-fx.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {YEAR_PHYSICAL_CUES} from '../src/gyuwon-year-cues.mjs';
import {GYUWON_GACHA_OUTCOMES,gyuwonGachaResultAngle} from '../src/gyuwon-gacha-wheel.mjs';
const game=(year=1)=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:9});
 g.gyuwon.years.year=year;g.gyuwon.years.mode='combat';
 g.player.invuln=1000;return g;
};
test('five short exam rounds are nonviolent',()=>{
 const g=game(1),e=g.gyuwon.years;
 g.player.x=21;g.player.z=19;g.boss.x=-3;g.boss.z=-2;
 e.cast=null;e.recover=0;g.boss.hp=annualFloor(g);e.season=48;e.signatureUsed=true;
 stepGyuwon(g,.03);assert.equal(e.mode,'exam');
 for(let i=0;i<5;i++){
  assert.equal(e.subject,i);assert.equal(g.gyuwon.hazards.length,0);
  if(i<4){e.subjectT=GYUWON_SUBJECT_SECONDS-.012;stepGyuwon(g,.023);}
 }
});
test('original 2D illustrations are reused on sixth-year standees, photo cards and goods',()=>{
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(6);startGyuwonYearCast(g,'figures');
 fx.update(g);
 const dolls=stage.getObjectByName('gyuwon-figurines-and-photocards');
 assert.equal(dolls.children.length,6);
 for(const fig of dolls.children){
  const sprite=fig.getObjectByName('gyuwon-2d-anime-girl-illustration');
  assert.ok(sprite?.isSprite);
  assert.ok(sprite.material.map?.isTexture);
  assert.equal(fig.getObjectByName('gyuwon-figurine-face'),undefined);
 }
 for(const id of ['photocard','merch']){
  startGyuwonYearCast(g,id);fx.update(g);
  assert.ok(stage.getObjectByName(
   id==='photocard'?'gyuwon-anime-photocard-2d-illustration':'gyuwon-anime-2d-merch-portrait'));
 }
 fx.dispose();
});
test('cigarette moves with the right wrist and has separate filter, paper, ember and vapor',()=>{
 const stage=new THREE.Group(),actor=createGyuwonActor(stage,{coarse:true});
 const g=game(1);startGyuwonYearCast(g,'smoke');
 g.gyuwon.years.castT=1.1;actor.update(g,0,.016);
 const cig=stage.getObjectByName('gyuwon-cigarette-handheld-rig');
 assert.ok(cig?.visible);
 assert.ok(stage.getObjectByName('gyuwon-cigarette-white-paper'));
 assert.ok(stage.getObjectByName('gyuwon-cigarette-filter'));
 assert.ok(stage.getObjectByName('gyuwon-cigarette-glowing-ember'));
 assert.ok(stage.getObjectByName('gyuwon-cigarette-actual-exhaled-smoke'));
 assert.equal(cig.parent.name,'gyuwon-wrist-pivot');
 actor.dispose();
});
test('rifle and bow are distinct hand-held objects, and the arrow is never gun geometry',()=>{
 const stage=new THREE.Group(),actor=createGyuwonActor(stage,{coarse:true});
 const g=game(4);
 startGyuwonYearCast(g,'sniper');actor.update(g,0,.016);
 assert.ok(stage.getObjectByName('gyuwon-fourth-year-rifle-rig')?.visible);
 assert.equal(stage.getObjectByName('gyuwon-fourth-year-bow-rig')?.visible,false);
 assert.ok(stage.getObjectByName('gyuwon-rifle-long-barrel'));
 assert.ok(stage.getObjectByName('gyuwon-rifle-wooden-stock'));
 assert.ok(stage.getObjectByName('gyuwon-rifle-trigger-grip'));
 assert.ok(stage.getObjectByName('gyuwon-rifle-left-support-grip')?.visible);
 startGyuwonYearCast(g,'archery');actor.update(g,0,.016);
 assert.equal(stage.getObjectByName('gyuwon-fourth-year-rifle-rig')?.visible,false);
 assert.ok(stage.getObjectByName('gyuwon-fourth-year-bow-rig')?.visible);
 assert.ok(stage.getObjectByName('gyuwon-bow-live-drawn-string'));
 assert.ok(stage.getObjectByName('gyuwon-fourth-year-nocked-arrow')?.visible);
 actor.dispose();
});
test('seven-year roulette stops on its fixed authored outcome and attacks as falling real prizes',()=>{
 assert.equal(GYUWON_GACHA_OUTCOMES.length,6);
 assert.ok(Number.isFinite(gyuwonGachaResultAngle(3)));
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(7);startGyuwonYearCast(g,'donation');
 fx.update(g);
 const root=stage.getObjectByName('gyuwon-seven-year-suneung-gacha-roulette');
 assert.ok(root?.visible);
 const wheel=root.getObjectByName('gyuwon-six-segment-rotating-suneung-wheel');
 const start=wheel.rotation.z;
 g.gyuwon.years.castT=3.2;
 fx.update(g);
 assert.notEqual(wheel.rotation.z,start);
 assert.ok(root.getObjectByName('gyuwon-gacha-fixed-arrow-pointer'));
 assert.ok(g.gyuwon.hazards.length>=1);
 assert.ok(g.gyuwon.hazards.every(h=>['year-gacha-prize','year-stream-pulse','year-vehicle'].includes(h.visual)&&h.warn>=3));
 g.gyuwon.hazards[0].age=g.gyuwon.hazards[0].warn-.01;
 fx.update(g);
 assert.ok(stage.getObjectByName('gyuwon-gacha-falling-prize-capsule'));
 fx.dispose();
});
test('octopus limbs are seamless deforming skins, never separate cylinder segments',()=>{
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(8);startGyuwonYearCast(g,'octoStrike');fx.update(g);
 const root=stage.getObjectByName('gyuwon-eight-octopus-arms');
 const skins=root.children.filter(o=>o.name==='gyuwon-seamless-soft-octopus-tentacle');
 assert.equal(skins.length,8);
 assert.ok(skins.every(o=>o.geometry.getAttribute('position').count>100));
 assert.equal(root.children.filter(o=>o.isMesh&&!o.isInstancedMesh&&o.geometry.type==='CylinderGeometry').length,0,'continuous limbs may have real instanced suction cups');
 const pos=skins[0].geometry.getAttribute('position').array.slice();
 g.time+=.3;g.gyuwon.hazards[0].age=g.gyuwon.hazards[0].warn*.7;fx.update(g);
 assert.ok(skins[0].geometry.getAttribute('position').array.some((v,i)=>Math.abs(v-pos[i])>.001));
 fx.dispose();
});
test('years no longer create a broadcast-cone panel or a combined rifle-and-bow prop',()=>{
 assert.equal(YEAR_PHYSICAL_CUES.includes('year-stream'),false);
 const stage=new THREE.Group(),fx=createGyuwonYearsFx(stage,{coarse:true});
 const g=game(7);startGyuwonYearCast(g,'chatstorm');fx.update(g);
 assert.equal(stage.getObjectByName('gyuwon-live-cone-surface'),undefined);
 assert.ok(g.gyuwon.hazards.every(h=>h.shape==='ring'&&h.visual==='year-stream-pulse'));
 assert.ok(stage.getObjectByName('gyuwon-continuous-physical-pressure-crest'));
 assert.equal(stage.getObjectByName('gyuwon-snipergun-and-bow'),undefined);
 fx.dispose();
});

