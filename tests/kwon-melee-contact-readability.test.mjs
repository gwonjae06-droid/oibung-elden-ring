import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startPattern,step,attackZone,inZone,swordSegment,bladeHits,sweptBladeHits,HUG_TIME,patternConfig} from '../src/combat.mjs';
import {impactDue} from '../src/effects-data.mjs';
import {kwonDangerLevel} from '../src/kwon-danger-veil.mjs';

const encounter=(pattern,phase=1)=>{
 const g=createGame('sword',{register:false,seed:82});
 const b=g.boss;b.x=0;b.z=0;b.yaw=0;b.phase=phase;b.stun=0;
 startPattern(g,pattern);
 b.state='active';b.t=0;b.queue=[];b.hit=false;
 g.player.action=null;g.player.invuln=0;
 return g;
};

test('sword-only signatures never create a separate invisible circular or sector collider',()=>{
 for(const name of ['backsweep','spiderPrison','lastStance']){
  const g=encounter(name);
  for(const state of ['windup','active']){
   g.boss.state=state;
   assert.equal(attackZone(g.boss),null,name+' '+state);
  }
 }
 for(const name of ['stomp','slam','leap']){
  const g=encounter(name);assert.ok(attackZone(g.boss)?.r>3,name);
 }
});

test('rear slash misses a nearby player behind the actual blade',()=>{
 for(const phase of [1,2]){
  const g=encounter('backsweep',phase),p=g.player,b=g.boss;
  p.x=0;p.z=-3.5;
  assert.equal(attackZone(b),null);
  assert.equal(bladeHits(p,swordSegment(b)),false);
  const hp=p.hp;
  for(let i=0;i<16;i++)step(g,1/120);
  assert.equal(p.hp,hp,'no damage merely for standing behind the boss');
 }
});

test('a near-centre safe pocket does not take the former radial last-stance damage',()=>{
 const g=encounter('lastStance',2),b=g.boss,p=g.player;
 p.x=b.x;p.z=b.z;
 const hp=p.hp;
 assert.equal(attackZone(b),null);
 step(g,1/120);
 assert.equal(p.hp,hp,'a visually absent sword must not score a free radial hit');
 assert.equal(g.bossShots.length,0,'projectiles still follow their authored release time');
});

test('swept blade catches real motion between frames, never unrelated proximity',()=>{
 const before={a:{x:-4,y:1.4,z:4},b:{x:-1,y:1.4,z:4}};
 const after={a:{x:1,y:1.4,z:4},b:{x:4,y:1.4,z:4}};
 assert.equal(bladeHits({x:0,z:4},before),false);
 assert.equal(bladeHits({x:0,z:4},after),false);
 assert.equal(sweptBladeHits({x:0,z:4},before,after),true);
 assert.equal(sweptBladeHits({x:0,z:-3},before,after),false);
 assert.equal(sweptBladeHits({x:0,z:4},{a:{x:2,y:5,z:4},b:{x:3,y:5,z:4}},
  {a:{x:-2,y:5,z:4},b:{x:-3,y:5,z:4}}),false,'airborne blade must pass through player height');
});

test('close-range response is readable and pushes only in the boss facing direction',()=>{
 for(const phase of [1,2]){
  const front=encounter('shove',phase);front.player.x=0;front.player.z=4;
  const zone=attackZone(front.boss);
  assert.equal(zone.kind,'push');assert.equal(zone.shape,'cone');
  assert.ok(inZone(zone,front.player));
  assert.equal(inZone(zone,{x:0,z:-3}),false);
  const before=front.player.z;
  step(front,1/120);
  assert.ok(front.player.z>before+2.5,'frontal shoved player is displaced');
  assert.equal(front.player.hp,front.player.maxHp,'no invisible chip damage');

  const rear=encounter('shove',phase);rear.player.x=0;rear.player.z=-4;
  const initial=rear.player.z;step(rear,1/120);
  assert.equal(rear.boss.hit,false,'rear player must not trigger the frontal shove collider');
  assert.equal(rear.player.hp,rear.player.maxHp);
 }
});

test('a prolonged hug selects a telegraphed stomp rather than awarding automatic damage',()=>{
 const g=createGame('sword',{register:false,seed:20});
 g.boss.x=g.boss.z=0;g.boss.yaw=0;g.boss.state='idle';g.boss.wait=100;
 g.boss.hug=HUG_TIME+.1;g.player.x=0;g.player.z=2.5;
 const hp=g.player.hp;
 step(g,1/120);
 assert.equal(g.boss.state,'windup');
 assert.equal(g.boss.pattern,'shove');
 assert.equal(g.player.hp,hp);
 assert.equal(g.boss.hit,false);
});

test('stomp/landing impact rendering happens at their actual hurt beat',()=>{
 for(const pattern of ['slam','leap','stomp']){
  const g=encounter(pattern),b=g.boss,cfg=patternConfig(b);
  const fraction=pattern==='slam'?.84:pattern==='leap'?.7:.4;
  b.state='windup';b.t=10;
  assert.equal(impactDue(b,cfg.active),false);
  b.state='active';b.t=cfg.active*(fraction-.02);
  assert.equal(impactDue(b,cfg.active),false);
  b.t=cfg.active*fraction+1e-9;
  assert.equal(impactDue(b,cfg.active),true);
 }
});

test('screen danger shading no longer falsely warns of invisible melee AoE',()=>{
 for(const pattern of ['backsweep','lastStance','spiderPrison']){
  const g=encounter(pattern),b=g.boss,p=g.player;
  b.state='windup';b.t=patternConfig(b).wind*.9;
  p.x=b.x;p.z=b.z;
  assert.equal(kwonDangerLevel(g),0,pattern);
 }
});
