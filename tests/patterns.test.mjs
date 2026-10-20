import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,beginSequence,chooseOpening,startPattern,step,act,CINEMATIC,cinematicPose,SEQUENCES,PHASE_ONE,patternConfig,PATTERNS} from '../src/combat.mjs';
const tick=(g,t,input={})=>{for(let s=0;s<t;s+=1/240)step(g,1/240,input);};
const safe=g=>{g.player.x=18;g.player.z=18;g.player.invuln=100;};
test('phase one keeps guaranteed final punish windows, including the new close-range openings',()=>{
  for(const k of Object.keys(PHASE_ONE)){const g=createGame();safe(g);beginSequence(g,k);for(let i=0;i<3000&&!g.boss.punishable;i++)step(g,1/240);assert.ok(g.boss.punishable,k);assert.ok(g.boss.recovery>=.95,k);const id=g.boss.attackId;tick(g,.8);assert.equal(g.boss.attackId,id,k);assert.equal(g.boss.state,'recovery',k);}
});
test('phase two disciplines finish their complete combos, never indefinite spam',()=>{
  for(const [k,sequence] of Object.entries(SEQUENCES)){const g=createGame();safe(g);g.boss.phase=2;beginSequence(g,k);const got=[];let id=-1;
    for(let i=0;i<6000;i++){if(g.boss.attackId!==id){id=g.boss.attackId;got.push(g.boss.pattern);}if(g.boss.punishable)break;step(g,1/240);}
    assert.deepEqual(got,sequence);assert.ok(g.boss.punishable,k);assert.ok(g.boss.recovery>=.8&&g.boss.recovery<=1.05,k);}
});
test('transition freezes movement and blocks actions',()=>{
  const g=createGame();g.boss.phase=2;g.boss.state='transition';g.boss.t=0;g.player.hp=70;
  for(const a of ['light','heavy','heal','roll','skill'])assert.equal(act(g,a),false);
  tick(g,CINEMATIC+.1);assert.ok(g.events.some(e=>e.type==='armed'));assert.equal(cinematicPose(g.boss).equip,1);
});
test('phase two short attacks accelerate, finishers remain delayed',()=>{
  const b=createGame().boss;b.pattern='jab';const one=patternConfig(b);b.phase=2;assert.ok(patternConfig(b).wind<one.wind);
  b.pattern='slam';assert.ok(patternConfig(b).wind>=1);
  for(const k of Object.keys(PATTERNS)){b.pattern=k;const c=patternConfig(b);assert.ok(Number.isFinite(c.wind)&&c.wind>0,k);assert.ok(Number.isFinite(c.recover),k);}
});
test('healing at range provokes draw or execution and choices avoid repetition',()=>{
  const g=createGame();g.boss.phase=2;g.player.action={kind:'heal'};
  for(let i=0;i<10;i++){const k=chooseOpening(g);assert.ok(['draw','execution'].includes(k));assert.notEqual(k,g.boss.lastOpening);g.boss.lastOpening=k;}
});
