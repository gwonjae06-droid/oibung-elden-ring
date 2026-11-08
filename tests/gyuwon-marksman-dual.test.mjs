import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createGyuwonGame,stepGyuwon} from '../src/gyuwon-combat.mjs';
import {startGyuwonYearCast} from '../src/gyuwon-years.mjs';
import {createGyuwonActor} from '../src/gyuwon-actor.mjs';
import {gyuwonWeaponPose,GYUWON_BOW_SOCKET} from '../src/gyuwon-year-choreography.mjs';
import {MARKSMAN_VOLLEYS,MARKSMAN_BURST_ROUNDS,MARKSMAN_BOW_PER_VOLLEY,
 MARKSMAN_COVER_HP,resolveAnnualArrowCover,resolveAnnualProjectileCover}
 from '../src/gyuwon-nightmare-mechanics.mjs';

const make=()=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:496});
 g.gyuwon.years.year=4;g.player.x=0;g.player.z=17;
 g.player.invuln=1e5;startGyuwonYearCast(g,'ultimateMarksman');
 return g;
};

test('210 rifle rounds AND 60 moving bow arrows are streamed as 30 simultaneous volleys',()=>{
 const g=make(),e=g.gyuwon.years;
 assert.equal(e.cover.length,5);
 assert.ok(e.cover.every(c=>c.hp===MARKSMAN_COVER_HP&&c.maxHp===1800));
 const bullets=new Set(),arrows=new Set(),groups=new Map();
 let maxLive=0;
 for(let i=0;i<1450&&e.cast;i++){
  for(const h of g.gyuwon.hazards){
   if(h.signature!=='ultimateMarksman')continue;
   if(h.visual==='year-bullet')bullets.add(h.id);
   if(h.marksmanBow){
    arrows.add(h.id);
    assert.equal(h.visual,'year-arrow');
    assert.equal(h.shape,'circle');
    assert.ok(h.warn>=1.05&&h.life>=1.4);
    assert.ok(Number.isFinite(h.vx)&&Number.isFinite(h.vz));
   }
   if(h.marksmanVolley!==undefined){
    if(!groups.has(h.marksmanVolley))groups.set(h.marksmanVolley,{gun:new Set(),bow:new Set()});
    groups.get(h.marksmanVolley)[h.marksmanBow?'bow':'gun'].add(h.id);
   }
  }
  maxLive=Math.max(maxLive,g.gyuwon.hazards.length);
  stepGyuwon(g,1/60);
 }
 assert.equal(bullets.size,MARKSMAN_VOLLEYS*MARKSMAN_BURST_ROUNDS);
 assert.equal(arrows.size,MARKSMAN_VOLLEYS*MARKSMAN_BOW_PER_VOLLEY);
 assert.equal(groups.size,30);
 for(const [id,part] of groups){
  assert.equal(part.gun.size,7,'rifle volley '+id);
  assert.equal(part.bow.size,2,'arrow volley '+id);
 }
 assert.ok(maxLive<75,'streamed FX must not allocate all 270 missiles simultaneously');
 assert.equal(e.marksmanVolleys,30);
});

test('arrows obey the SAME physical destructible cover, blocking the player until it breaks',()=>{
 const g=make(),e=g.gyuwon.years;
 const arrow=g.gyuwon.hazards.find(h=>h.marksmanBow);
 const speed=Math.hypot(arrow.vx,arrow.vz);
 assert.ok(speed>=27);
 const c={x:arrow.x+arrow.vx/speed*8,z:arrow.z+arrow.vz/speed*8,
  hp:MARKSMAN_COVER_HP,maxHp:MARKSMAN_COVER_HP,hitAt:-1000,brokenAt:null};
 e.cover=[c];
 arrow.age=arrow.warn+.34;
 let impacts=0;const hit=resolveAnnualArrowCover(g,arrow,.34,()=>impacts++);
 assert.equal(hit,true);
 assert.equal(arrow.hit,true);
 assert.equal(arrow.coverStopped,true);
 assert.equal(c.hp,MARKSMAN_COVER_HP-arrow.damage);
 assert.equal(impacts,1);
 const next={...arrow,age:arrow.warn+.34,hit:false,coverStopped:false};
 assert.equal(resolveAnnualArrowCover(g,next,.34,()=>{}),true);
 c.hp=0;
 const free={...arrow,age:arrow.warn+.34,hit:false,coverStopped:false};
 assert.equal(resolveAnnualArrowCover(g,free,.34,()=>{}),false);
 assert.equal(free.hit,false);
});

test('rifle still impacts cover, and both weapon arms and the mechanical bow are visibly mounted',()=>{
 const g=make(),scene=new THREE.Group(),actor=createGyuwonActor(scene,{coarse:true});
 const pose=gyuwonWeaponPose(g.gyuwon.years,g.gyuwon.hazards);
 assert.equal(pose.dual,true);assert.equal(pose.rifle,true);assert.equal(pose.bow,true);
 assert.ok(GYUWON_BOW_SOCKET.side<0);
 for(let t=0;t<110;t++){stepGyuwon(g,1/120);actor.update(g,0,1/120);}
 const gun=scene.getObjectByName('gyuwon-fourth-year-rifle-rig');
 const bow=scene.getObjectByName('gyuwon-fourth-year-bow-rig');
 const autoloader=scene.getObjectByName('gyuwon-mechanical-bow-autoloader');
 const handSupport=scene.getObjectByName('gyuwon-rifle-left-support-grip');
 assert.ok(gun?.visible&&bow?.visible&&autoloader?.visible);
 assert.equal(handSupport?.visible,false);
 const h=g.gyuwon.hazards.find(h=>h.visual==='year-bullet');
 const sx=h.muzzleX,sz=h.muzzleZ;
 g.gyuwon.years.cover=[{x:sx+Math.sin(h.yaw)*8,z:sz+Math.cos(h.yaw)*8,
  hp:1800,maxHp:1800,hitAt:-1000,brokenAt:null}];
 const copy={...h};
 resolveAnnualProjectileCover(g,copy,()=>{});
 assert.ok(copy.length<9);
 actor.dispose();
});

test('ordinary bow pose is unaffected by the marksman dual-wield mode',()=>{
 const g=createGyuwonGame('sword',{yearMode:true,seed:496});
 g.gyuwon.years.year=4;
 startGyuwonYearCast(g,'archery');
 const pose=gyuwonWeaponPose(g.gyuwon.years,g.gyuwon.hazards);
 assert.equal(pose.dual,false);
 assert.equal(pose.rifle,false);
 assert.equal(pose.bow,true);
});
