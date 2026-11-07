import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {runStageVariant} from '../src/clown-stage-shows.mjs';
import {runEncoreVariant} from '../src/clown-encore-shows.mjs';
import {rollPosition} from '../src/clown-pressure.mjs';
import {bombPose} from '../src/clown-visual-data.mjs';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {BLOOD_WHIP,beginBloodWhip} from '../src/blood-whip.mjs';
import {createBloodGame} from '../src/blood-combat.mjs';
import {createBloodWhipView} from '../src/blood-whip-view.mjs';
import {createGyuwonGame,startGyuwonPattern} from '../src/gyuwon-combat.mjs';
import {createGyuwonHazardFx} from '../src/gyuwon-hazard-vfx.mjs';
const near=(x,y)=>Math.abs(x-y)<1e-6;
function fixture(){
 const g={boss:{phase:2,x:0,z:0},player:{x:3,z:12}},c={f:{},vis:{},stageCounts:{runaway:1},seq:0},calls=[];
 const api={
  once(s,key,fn){if(!Object.hasOwn(s.f,key))s.f[key]=fn()??true;return s.f[key];},
  head(){},emit(g,type,data){calls.push({type,...data});},
  zone(g,info){const q={id:calls.length,...info};calls.push({type:'zone',...q});return q;},
  bomb(g,info){calls.push({type:'bomb',...info});}
 };
 return {g,c,calls,api};
}
function advance(f,fn,end){for(let a=0;a<end;){const t=Math.min(end,a+.01);fn(a,t);a=t;}}
test('tilting stage and encore heads have non-damaging launch windups',()=>{
 const f=fixture();advance(f,(a,t)=>runStageVariant('runaway',f.g,f.c,a,t,f.api),4.5);
 const rolls=f.calls.filter(e=>e.type==='bomb'&&e.kind==='roll');
 assert.equal(rolls.length,8);
 for(const q of rolls){
  assert.ok(q.windup>=.35);
  assert.ok(q.warn>=q.windup+q.travel);
  const origin={x:q.from.x,z:q.from.z};
  assert.deepEqual(rollPosition({...q,t:0}),origin);
  assert.deepEqual(rollPosition({...q,t:q.windup-.02}),origin);
  assert.deepEqual(rollPosition({...q,t:q.windup+q.travel+.01}),{x:q.x,z:q.z});
  const pre=bombPose({...q,t:q.windup/2,px:q.from.x,pz:q.from.z});
  assert.ok(near(pre.spin,0));
  assert.ok(pre.stretch<0);
 }
 const encore=fixture();advance(encore,(a,t)=>runEncoreVariant('encore',encore.g,encore.c,a,t,encore.api),2.1);
 const roll=encore.calls.find(e=>e.type==='bomb'&&e.kind==='roll');
 assert.ok(roll&&roll.windup>=.35);
 assert.equal(roll.warn,roll.windup+roll.travel);
});
test('rolling collision cannot damage before its visible launch',()=>{
 const g=createClownGame('sword',{register:false,seed:92});
 g.player.x=0;g.player.z=0;g.player.invuln=0;
 g.clown.state='idle';g.clown.wait=99;g.clown.troupe.members=[];
 g.clown.bombs.push({id:190,kind:'roll',t:0,fly:0,windup:.35,travel:.8,warn:1.15,from:{x:0,y:2.1,z:0},x:0,z:12,px:0,pz:0,hit:false});
 const hp=g.player.hp;
 for(let i=0;i<32;i++)stepClown(g,.01);
 assert.equal(g.player.hp,hp);
 assert.equal(g.clown.bombs[0].hit,false);
 assert.ok(near(g.clown.bombs[0].pz,0));
 for(let i=0;i<18&&g.player.hp===hp;i++)stepClown(g,.01);
 assert.ok(g.player.hp<hp,'the physical contact only starts after warning');
});
test('blood whip has a high-contrast ragged blood seep that does not cause damage',()=>{
 const root=new THREE.Group(),view=createBloodWhipView(root,{coarse:true});
 const g=createBloodGame('bow',{seed:31});g.boss.state='recovery';g.blood.recover=3;g.blood.whipCooldown=0;
 assert.equal(beginBloodWhip(g),true);view.update(g);
 const omen=view.group.getObjectByName('blood-whip-locked-aim-liquid-omen');
 assert.ok(omen.visible);assert.equal(omen.geometry.type,'BufferGeometry');
 assert.ok(omen.geometry.getAttribute('position').count>=120);
 assert.ok(omen.material.opacity>=.3);
 assert.ok(near(omen.rotation.y,g.blood.whip.yaw));
 const first=omen.material.opacity;
 g.blood.whip.age=BLOOD_WHIP.warning*.85;view.update(g);
 assert.ok(omen.material.opacity>first);
 assert.equal(view.stats().damageSources,0);
 g.blood.whip.age=BLOOD_WHIP.warning+.01;view.update(g);
 assert.equal(omen.visible,false);
 view.dispose();assert.equal(root.children.length,0);
});
test('Gyuwon fragments rise brightly before the real collision time',()=>{
 const root=new THREE.Group(),fx=createGyuwonHazardFx(root,{coarse:true});
 const g=createGyuwonGame();assert.ok(startGyuwonPattern(g,'line'));fx.update(g);
 assert.ok(fx.stats().liveHazards>0);
 const m=fx.root.children[0],initial={alpha:m.material.opacity,height:m.scale.y};
 assert.ok(initial.alpha>=.3&&initial.height>=.4);
 assert.equal(fx.stats().damageSources,0);
 g.gyuwon.hazards[0].age=g.gyuwon.hazards[0].warn*.8;fx.update(g);
 assert.ok(m.material.opacity>initial.alpha&&m.scale.y>initial.height);
 assert.ok(g.gyuwon.hazards[0].age<g.gyuwon.hazards[0].warn);
 fx.dispose();assert.equal(root.children.length,0);
});
