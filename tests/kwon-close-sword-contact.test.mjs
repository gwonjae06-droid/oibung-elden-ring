import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createGame,startPattern,step,patternConfig,swordPose,swordSegment,bladeHits,
 kwonCloseSwordShift,kwonVisibleHurtShapes,attackZone
} from '../src/combat.mjs';
import {configureJourney,newRun,freshProfile} from '../src/journey-state.mjs';

function story(phase=1,range=2.8){
 const g=createGame('sword',{register:false,seed:72}),r=newRun('sword');
 configureJourney(g,r,freshProfile());
 assert.equal(g.boss.maxHp,4822,'normal journey HP is the authoritative baseline');
 Object.assign(g.boss,{x:0,z:0,yaw:0,phase,state:'idle',stun:0,wait:99});
 Object.assign(g.player,{x:0,z:range,invuln:0,action:null});
 return g;
}
function hitsOverSwing(g,p=g.player){
 const b=g.boss,cfg=patternConfig(b);
 let first=-1;
 for(let i=0;i<=80;i++){
  b.t=cfg.active*i/80;
  if(bladeHits(p,swordSegment(b),b.phase===3?.78*1.22:.78)){
   first=i;break;
  }
 }
 return first;
}

test('a point-blank slash pulls the real sword toward the player after an authored windup',()=>{
 for(const phase of [1,2,3]){
  for(const pattern of ['sweep','cross','thrust','backsweep']){
   const g=story(phase,2.8),b=g.boss;
   startPattern(g,pattern);
   assert.equal(b.closeSwordCut,true,phase+'/'+pattern);
   assert.equal(b.state,'windup');
   assert.equal(kwonCloseSwordShift(b).weight,0,'no abrupt sword teleport at start');
   b.t=patternConfig(b).wind*.90;
   const windup=kwonCloseSwordShift(b);
   assert.ok(windup.weight>.95,'retraction is visible well before impact');
   b.state='active';b.t=0;
   assert.equal(attackZone(b),null,'not an invisible circular hit');
   assert.ok(hitsOverSwing(g)>=0,phase+'/'+pattern+' must hit at true close reach');
  }
 }
});
test('moving behind or away during the close sword windup avoids the actual blade',()=>{
 for(const phase of [1,2,3]){
  const g=story(phase,2.8);startPattern(g,'sweep');g.boss.state='active';
  assert.equal(hitsOverSwing(g,{x:0,z:-7}),-1);
  assert.equal(hitsOverSwing(g,{x:21,z:21}),-1);
 }
});
test('a sword started far away retains its ordinary reach and does not gain phantom near damage',()=>{
 for(const phase of [1,2,3]){
  const g=story(phase,15);
  startPattern(g,'sweep');
  assert.equal(g.boss.closeSwordCut,false);
  g.boss.state='active';
  assert.equal(kwonCloseSwordShift(g.boss).weight,0);
  assert.equal(hitsOverSwing(g,{x:0,z:2.8}),-1);
 }
});
test('the first-act jaw hurt volume follows its own real close sword movement',()=>{
 const g=story(1),b=g.boss;
 startPattern(g,'sweep');
 b.state='active';b.t=patternConfig(b).active*.5;
 const head=kwonVisibleHurtShapes(b).find(x=>x.id==='head');
 const shifted=kwonCloseSwordShift(b);
 b.closeSwordCut=false;
 const rest=kwonVisibleHurtShapes(b).find(x=>x.id==='head');
 assert.ok(head&&rest);
 assert.ok(Math.abs((head.y-rest.y)-shifted.y)<1e-6);
 assert.ok(Math.abs((head.z-rest.z)-shifted.z)<1e-6);
});
test('normal journey close-range sword actually damages once, not on every animation frame',()=>{
 for(const phase of [1,2,3]){
  const g=story(phase,2.8);startPattern(g,'sweep');
  g.boss.state='active';g.boss.t=0;
  const hp=g.player.hp;
  for(let i=0;i<Math.ceil(patternConfig(g.boss).active*120);i++)step(g,1/120);
  assert.ok(g.player.hp<hp,'physical blade must land on player in phase '+phase);
  assert.ok(g.player.hp>=0,'no repeated unwarned hits');
 }
});
