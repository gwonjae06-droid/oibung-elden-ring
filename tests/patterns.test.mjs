import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,swordPose,PATTERNS,ORDER,TEMPO,angleDelta} from '../src/combat.mjs';
const tick=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)step(g,1/120,input);};
const place=(g,x,z)=>{g.player.x=x;g.player.z=z;};
test('new patterns are registered with names and positive timings',()=>{
  for(const k of ['leap','whirl']){const c=PATTERNS[k];assert.ok(c.name);assert.ok(c.wind>0&&c.active>0&&c.recover>0&&c.damage>0);}
});
test('phase 1 can leap but never whirls; phase 2 can whirl',()=>{
  let g=createGame();g.boss.wait=0;g.boss.sequence=ORDER[1].indexOf('leap');place(g,0,2);step(g,1/120);assert.equal(g.boss.pattern,'leap');
  g=createGame();g.boss.wait=0;g.boss.phase=2;g.boss.sequence=ORDER[2].indexOf('whirl');place(g,0,2);step(g,1/120);assert.equal(g.boss.pattern,'whirl');
  g=createGame();for(let i=0;i<ORDER[1].length*2;i++){g.boss.wait=0;g.boss.state='idle';g.boss.sequence=i;place(g,0,2);step(g,1/120);assert.notEqual(g.boss.pattern,'whirl');}
});
test('leap telegraph is harmless and the landing hits once for 42',()=>{
  const g=createGame();place(g,0,6);startPattern(g,'leap');tick(g,1.0);assert.equal(g.player.hp,120);
  tick(g,1.0);assert.equal(g.player.hp,78);
  g.player.invuln=0;tick(g,1.2);assert.equal(g.player.hp,78);
});
test('leap closes distance toward where the player stood',()=>{
  const g=createGame();place(g,0,8);const before=Math.hypot(g.player.x-g.boss.x,g.player.z-g.boss.z);
  startPattern(g,'leap');tick(g,1.3+.45);
  const after=Math.hypot(g.player.x-g.boss.x,g.player.z-g.boss.z);
  assert.ok(after<before-4,'before '+before+' after '+after);
});
test('leap can be dodged by moving out of the landing zone',()=>{
  const g=createGame();place(g,0,6);startPattern(g,'leap');tick(g,PATTERNS.leap.wind/TEMPO+.1);place(g,16,6);tick(g,1.0);assert.equal(g.player.hp,120);
});
test('whirl sweeps a full circle and hits a player in the ring exactly once',()=>{
  const g=createGame();g.boss.phase=2;place(g,0,2);const start=g.boss.yaw;
  startPattern(g,'whirl');const y0=g.boss.yaw;tick(g,3.5);
  assert.equal(g.player.hp,90);assert.ok(Math.abs(angleDelta(y0,g.boss.yaw))<0.2,'yaw drift '+angleDelta(y0,g.boss.yaw));
  assert.ok(start!==undefined);
});
test('whirl does nothing to a player outside its reach',()=>{
  const g=createGame();g.boss.phase=2;place(g,0,-4+11);startPattern(g,'whirl');tick(g,PATTERNS.whirl.wind/(1.15*TEMPO)+PATTERNS.whirl.active+.1);assert.equal(g.player.hp,120);
});
test('phase 2 chains thrust into slam and leap into sweep, once',()=>{
  let g=createGame();g.boss.phase=2;place(g,20,-4);startPattern(g,'thrust');
  let seen=[];for(let i=0;i<120*6&&seen.length<3;i++){step(g,1/120);if(!seen.length||seen[seen.length-1]!==g.boss.pattern)seen.push(g.boss.pattern);}
  assert.deepEqual(seen.slice(0,2),['thrust','slam']);
  g=createGame();g.boss.phase=2;place(g,20,-4);startPattern(g,'leap');
  seen=[];for(let i=0;i<120*6&&seen.length<3;i++){step(g,1/120);if(!seen.length||seen[seen.length-1]!==g.boss.pattern)seen.push(g.boss.pattern);}
  assert.deepEqual(seen.slice(0,2),['leap','sweep']);
});
test('phase 1 never chains patterns',()=>{
  const g=createGame();place(g,20,-4);startPattern(g,'thrust');const seen=[];
  for(let i=0;i<120*5;i++){step(g,1/120);if(g.boss.state==='idle'&&!seen.includes('idle'))seen.push('idle');if(g.boss.pattern!=='thrust')seen.push(g.boss.pattern);}
  assert.ok(!seen.includes('slam'));
});
test('sword poses stay finite for every pattern and state',()=>{
  const g=createGame();
  for(const name of Object.keys(PATTERNS))for(const state of ['windup','active','recovery'])for(const t of [0,.3,5]){
    g.boss.pattern=name;g.boss.state=state;g.boss.t=t;
    const p=swordPose(g.boss);for(const v of Object.values(p))assert.ok(Number.isFinite(v),name+state+t);
  }
});
