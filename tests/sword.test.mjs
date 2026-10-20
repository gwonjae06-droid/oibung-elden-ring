import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step,startPattern,beginSequence,swordPose,swordSegment,bodyPoint,bodyPose,bladeHits,SWORD,PATTERNS,segmentDistance} from '../src/combat.mjs';
test('one blade retains its length and root follows the same body transform as the face',()=>{
  for(const phase of [1,2])for(const pattern of Object.keys(PATTERNS))for(const state of ['windup','active','recovery','idle'])for(const t of [0,.1,.3,1]){
    const g=createGame(),b=g.boss;Object.assign(b,{phase,pattern,state,t});
    const p=swordPose(b),s=swordSegment(b);assert.ok(Math.abs(Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y,s.b.z-s.a.z)-SWORD.length)<1e-6);
    for(const v of Object.values(p))assert.ok(Number.isFinite(v));
    if(state==='idle'){const root=bodyPoint(b,SWORD);assert.equal(p.y,root.y);assert.equal(p.z,root.z);}
  }
});
test('an elevated section of the blade cannot hit even when the tip reaches player height',()=>{
  const seg={a:{x:0,y:6,z:0},b:{x:0,y:0,z:6}};
  assert.equal(bladeHits({x:0,z:1},seg),false);assert.equal(bladeHits({x:0,z:5},seg),true);
  assert.equal(bladeHits({x:3,z:5},seg),false);
});
test('the overhead pose rises high; the finishing slash can reach ground targets in phase two',()=>{
  const g=createGame(),b=g.boss;b.phase=2;b.pattern='slam';b.state='windup';b.t=PATTERNS.slam.wind;
  assert.ok(swordSegment(b).b.y>8);
  b.state='active';b.t=PATTERNS.slam.active*.95;const s=swordSegment(b);
  assert.ok(s.b.y<1);assert.ok(bladeHits({x:s.b.x,z:s.b.z},s));
});
test('physical attack damages only once per swing',()=>{
  const g=createGame();startPattern(g,'sweep');g.boss.state='active';g.boss.t=.1;
  const seg=swordSegment(g.boss);g.player.x=(seg.a.x+seg.b.x)/2;g.player.z=(seg.a.z+seg.b.z)/2;
  step(g,1/240);assert.equal(g.player.hp,95);
  for(let i=0;i<4;i++){g.player.invuln=0;step(g,1/240);}assert.equal(g.player.hp,95);
});
test('standing transition is bounded and continuous',()=>{
  const b=createGame().boss;b.phase=2;b.state='transition';let last=0;
  for(let i=0;i<=180;i++){b.t=i/100;const p=bodyPose(b);assert.ok(p.standing>=last&&p.standing<=1);assert.ok(p.standing-last<.02);last=p.standing;}
  assert.equal(last,1);
});
test('leap is airborne before landing, so it cannot deal phantom aerial hits',()=>{
  const g=createGame();startPattern(g,'leap');g.boss.state='active';g.boss.t=.15;g.boss.leapSpeed=0;
  g.player.x=0;g.player.z=0;assert.ok(bodyPose(g.boss).lift>2);step(g,1/240);assert.equal(g.player.hp,120);
});
