import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginSequence,chooseOpening,startPattern,step,act,CINEMATIC,cinematicPose,SEQUENCES,patternConfig} from '../src/combat.mjs';
const tick=(g,t,input={})=>{for(let s=0;s<t;s+=1/240)step(g,1/240,input);};
const safe=g=>{g.player.x=18;g.player.z=18;g.player.invuln=100;};
test('phase one keeps guaranteed final punish windows',()=>{
  for(const k of ['rush','sweep','thrust','leap']){const g=createGame();safe(g);beginSequence(g,k);for(let i=0;i<3000&&!g.boss.punishable;i++)step(g,1/240);assert.ok(g.boss.punishable);assert.ok(g.boss.recovery>=.95);const id=g.boss.attackId;tick(g,.8);assert.equal(g.boss.attackId,id);assert.equal(g.boss.state,'recovery');}
});
test('six phase two disciplines finish their complete combos, never indefinite spam',()=>{
  for(const [k,sequence] of Object.entries(SEQUENCES)){const g=createGame();safe(g);g.boss.phase=2;beginSequence(g,k);const got=[];let id=-1;
    for(let i=0;i<5000;i++){if(g.boss.attackId!==id){id=g.boss.attackId;got.push(g.boss.pattern);}if(g.boss.punishable)break;step(g,1/240);}
    assert.deepEqual(got,sequence);assert.ok(g.boss.punishable,k);assert.ok(g.boss.recovery>=.8&&g.boss.recovery<=1.05);}
});
test('transition freezes movement and blocks attacks, heals and boss damage until equipped',()=>{
  const g=createGame();g.boss.phase=2;g.boss.state='transition';g.boss.t=0;g.player.hp=70;
  for(const a of ['light','heavy','heal','roll'])assert.equal(act(g,a),false);
  const p={x:g.player.x,z:g.player.z,hp:g.player.hp},hp=g.boss.hp;
  tick(g,CINEMATIC-.1,{x:1,z:1});assert.equal(g.boss.state,'transition');assert.equal(g.player.x,p.x);assert.equal(g.player.z,p.z);assert.equal(g.player.hp,p.hp);assert.equal(g.boss.hp,hp);
  tick(g,.2);assert.notEqual(g.boss.state,'transition');assert.ok(g.events.some(e=>e.type==='armed'));assert.equal(cinematicPose(g.boss).equip,1);
});
test('the cutscene rises, reaches, detaches and equips in that order',()=>{
  const b=createGame().boss;b.phase=2;b.state='transition';
  for(const [t,key] of [[1,'standing'],[2.4,'reach'],[3.4,'detach'],[4.5,'equip']]){b.t=t;const c=cinematicPose(b);assert.ok(c[key]>0&&c[key]<1);}
  b.t=2;assert.equal(cinematicPose(b).detach,0);b.t=CINEMATIC;assert.equal(cinematicPose(b).equip,1);
});
test('phase two short attacks accelerate, heavy finishers remain deliberately delayed',()=>{
  const b=createGame().boss;b.pattern='jab';const one=patternConfig(b);b.phase=2;assert.ok(patternConfig(b).wind<one.wind);
  b.pattern='slam';assert.ok(patternConfig(b).wind>=1);assert.ok(patternConfig(b).damage>45);
});
test('healing at range provokes draw or execution and choices avoid immediate repetition',()=>{
  const g=createGame();g.boss.phase=2;g.player.action={kind:'heal'};
  for(let i=0;i<10;i++){const k=chooseOpening(g);assert.ok(['draw','execution'].includes(k));assert.notEqual(k,g.boss.lastOpening);g.boss.lastOpening=k;}
});
