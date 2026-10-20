import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,step,startPattern,PATTERNS,BODY_REACH} from '../src/combat.mjs';
const tick=(g,t)=>{for(let s=0;s<t;s+=1/120)step(g,1/120);};
test('standing right against the boss no longer makes its melee attacks whiff',()=>{
  for(const pattern of Object.keys(PATTERNS).filter(k=>!['wave','retreat','leap'].includes(k))){
    for(const [px,pz] of [[0,-3.2],[3.2,0],[-3.2,0],[0,3.2]]){
      const g=createGame();g.boss.x=0;g.boss.z=0;g.player.x=px;g.player.z=pz;startPattern(g,pattern);g.boss.yaw=0;g.boss.aim=0;g.boss.state='active';g.boss.t=0;g.boss.hit=false;
      const hp=g.player.hp;tick(g,.4);assert.ok(g.player.hp<hp,pattern+' '+px+','+pz);
    }
  }
});
test('the close-range hit still respects invulnerability and range',()=>{
  const far=createGame();far.boss.x=0;far.boss.z=0;far.player.x=0;far.player.z=-BODY_REACH-3.5;startPattern(far,'sweep');far.boss.yaw=0;far.boss.state='active';far.boss.t=0;tick(far,.05);assert.equal(far.player.hp,120);
  const roll=createGame();roll.boss.x=0;roll.boss.z=0;roll.player.x=3.2;roll.player.z=0;roll.player.action={kind:'roll',t:.2,total:.52,yaw:0};startPattern(roll,'sweep');roll.boss.state='active';roll.boss.t=0;step(roll,1/120);assert.equal(roll.player.hp,120);assert.ok(roll.events.some(e=>e.type==='dodge'));
});
test('hits freeze the game briefly and flag heavy blows',()=>{
  const g=createGame('sword');g.boss.wait=99;g.player.x=0;g.player.z=0;g.player.yaw=Math.PI;g.boss.x=0;g.boss.z=-4;act(g,'light');
  let ev=null;for(let i=0;i<300&&!ev;i++){step(g,1/120);ev=g.events.find(e=>e.type==='boss-hit');}
  assert.ok(ev);assert.equal(ev.big,false);assert.ok(g.hitstop>0&&g.hitstop<=.035);
  const t=g.time,a=g.player.action.t;step(g,1/120);assert.equal(g.time,t);assert.equal(g.player.action.t,a);
  for(let i=0;i<10;i++)step(g,1/120);assert.equal(g.hitstop,0);assert.ok(g.time>t);
  const h2=createGame('hammer');h2.boss.wait=99;h2.player.x=0;h2.player.z=0;h2.player.yaw=Math.PI;h2.boss.x=0;h2.boss.z=-4;h2.player.skill.hammerHits=4;act(h2,'skill');
  let e2=null;for(let i=0;i<300&&!e2;i++){step(h2,1/120);e2=h2.events.find(e=>e.type==='boss-hit');}
  assert.equal(e2.big,true);assert.ok(h2.hitstop>.08);
});
