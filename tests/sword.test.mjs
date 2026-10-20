import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/combat.mjs';
import {createGame,step,startPattern,swordPose,swordSegment,SWORD,PATTERNS,segmentDistance} from '../src/combat.mjs';
const tick=(g,seconds,input={})=>{for(let t=0;t<seconds;t+=1/120)step(g,1/120,input);};
const setBoss=(g,pattern,state,t)=>{g.boss.pattern=pattern;g.boss.state=state;g.boss.t=t;};
test('the boss has exactly one sword: the old two-jaw API is gone',()=>{
  assert.equal(C.jawPose,undefined);assert.equal(C.jawSegments,undefined);
  const g=createGame(),seg=swordSegment(g.boss);
  assert.ok(!Array.isArray(seg));assert.ok(seg.a&&seg.b);
});
test('the sword is huge and keeps its length in every pose',()=>{
  assert.ok(SWORD.length>=6);
  const g=createGame();
  for(const name of Object.keys(PATTERNS))for(const state of ['windup','active','recovery'])for(const t of [0,.2,.5,1.5]){
    setBoss(g,name,state,t);g.boss.yaw=.7;
    const {a,b}=swordSegment(g.boss);
    const len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    assert.ok(Math.abs(len-SWORD.length)<1e-6,name+state+t+' length '+len);
  }
});
test('at rest the sword is carried forward and low in front of the face',()=>{
  const g=createGame(),{a,b}=swordSegment(g.boss);
  assert.ok(b.z-g.boss.z>SWORD.z+5,'tip must be well ahead of the boss');
  assert.ok(Math.abs(b.x-g.boss.x)<0.01);
  assert.ok(a.y>2&&b.y<1.2,'root at chin height, tip lowered: '+a.y+' '+b.y);
});
test('a horizontal sweep really crosses from one side to the other',()=>{
  const g=createGame();
  setBoss(g,'sweep','active',0);const s0=swordPose(g.boss).yaw;
  setBoss(g,'sweep','active',PATTERNS.sweep.active);const s1=swordPose(g.boss).yaw;
  assert.ok(s0>1&&s1<-1,'sweep yaw '+s0+' -> '+s1);
  setBoss(g,'reverse','active',0);const r0=swordPose(g.boss).yaw;
  setBoss(g,'reverse','active',PATTERNS.reverse.active);const r1=swordPose(g.boss).yaw;
  assert.ok(r0<-1&&r1>1,'reverse yaw '+r0+' -> '+r1);
});
test('overhead patterns raise the sword high before they strike',()=>{
  const g=createGame();
  for(const name of ['slam','leap','cross']){
    setBoss(g,name,'windup',PATTERNS[name].wind);
    const {b}=swordSegment(g.boss);assert.ok(b.y>4,name+' tip only '+b.y);
  }
});
test('thrust pulls the sword back, then drives it forward',()=>{
  const g=createGame();
  setBoss(g,'thrust','windup',PATTERNS.thrust.wind);const back=swordSegment(g.boss).a.z-g.boss.z;
  setBoss(g,'thrust','active',PATTERNS.thrust.active);const fwd=swordSegment(g.boss).a.z-g.boss.z;
  assert.ok(fwd-back>2,'travel '+(fwd-back));
});
test('whirl holds the sword straight out to the side',()=>{
  const g=createGame();setBoss(g,'whirl','active',.3);
  const {a,b}=swordSegment(g.boss);
  assert.ok(Math.abs(b.x-a.x)>6&&b.y<2,'dx '+(b.x-a.x));
});
test('a sweep hurts a player standing on the blade, exactly once, for its damage',()=>{
  const g=createGame();startPattern(g,'sweep');setBoss(g,'sweep','active',PATTERNS.sweep.active*.5);
  const {a,b}=swordSegment(g.boss);
  g.player.x=(a.x+b.x)/2;g.player.z=(a.z+b.z)/2;step(g,1/120);
  assert.equal(g.player.hp,120-PATTERNS.sweep.damage);
  for(let i=0;i<6;i++){g.player.invuln=0;step(g,1/120);}
  assert.equal(g.player.hp,120-PATTERNS.sweep.damage);
});
test('the blade is a line: a player well off to its side is safe',()=>{
  const g=createGame();startPattern(g,'thrust');setBoss(g,'thrust','active',0);
  const {a,b}=swordSegment(g.boss);
  g.player.x=(a.x+b.x)/2+4;g.player.z=(a.z+b.z)/2;
  assert.ok(segmentDistance(g.player,a,b)>SWORD.width);
  step(g,1/120);assert.equal(g.player.hp,120);
});
test('a raised sword cannot hit, even directly beneath it',()=>{
  const g=createGame();startPattern(g,'slam');setBoss(g,'slam','active',PATTERNS.slam.active*.1);
  const {a,b}=swordSegment(g.boss);
  g.player.x=(a.x+b.x)/2;g.player.z=(a.z+b.z)/2;step(g,1/120);
  assert.equal(g.player.hp,120);
});
test('the slam shockwave reaches just past the sword tip, but no further, and hits for 39',()=>{
  const near=createGame();startPattern(near,'slam');setBoss(near,'slam','active',PATTERNS.slam.active*.9);
  let {a,b}=swordSegment(near.boss);
  const len=Math.hypot(b.x-a.x,b.z-a.z),ux=(b.x-a.x)/len,uz=(b.z-a.z)/len;
  near.player.x=b.x+ux*1.8;near.player.z=b.z+uz*1.8;
  assert.ok(segmentDistance(near.player,a,b)>SWORD.width,'must be outside the blade itself');
  step(near,1/120);
  assert.equal(near.player.hp,120-PATTERNS.slam.damage);
  const far=createGame();startPattern(far,'slam');setBoss(far,'slam','active',PATTERNS.slam.active*.9);
  ({a,b}=swordSegment(far.boss));
  far.player.x=b.x+ux*4;far.player.z=b.z+uz*4;step(far,1/120);
  assert.equal(far.player.hp,120);
});
test('the sword stays attached to the boss when it moves and turns',()=>{
  const g=createGame();g.boss.x=5;g.boss.z=3;g.boss.yaw=Math.PI/2;
  const {a}=swordSegment(g.boss);
  assert.ok(Math.hypot(a.x-5,a.z-3)>SWORD.z-.01&&Math.hypot(a.x-5,a.z-3)<SWORD.z+.01);
  assert.ok(a.x>5,'rotated root should be on +x for yaw pi/2');
});
test('the sword relaxes back to the carry pose after a strike',()=>{
  const g=createGame();setBoss(g,'sweep','recovery',PATTERNS.sweep.recover);
  const p=swordPose(g.boss);
  assert.ok(Math.abs(p.yaw)<1e-9&&Math.abs(p.pitch-.25)<1e-9&&Math.abs(p.z-SWORD.z)<1e-9);
});
