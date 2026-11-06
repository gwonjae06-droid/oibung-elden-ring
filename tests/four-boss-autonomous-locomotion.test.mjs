import test from 'node:test';
import assert from 'node:assert/strict';
import {createBossAutonomy,stepBossAutonomy} from '../src/boss-autonomy.mjs';
import {createGame,step as stepKwon} from '../src/combat.mjs';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {createBloodGame,startBloodPattern,stepBlood} from '../src/blood-combat.mjs';
import {bloodFootTargets,sampleBloodWalk,createBloodManeuver,BLOOD_COUNTER_WINDOW} from '../src/blood-footwork.mjs';
import {createDiceGame,stepDice,damageDice} from '../src/dice-combat.mjs';
import {createDicePlayerGame,stepDicePlayer} from '../src/dice-player.mjs';
import {nextDiceRoamTile} from '../src/dice-autonomy.mjs';
import {DICE_BOARD,DICE_RULES as DICE} from '../src/dice-data.mjs';
import {giantHandPose,giantHeadPose,skipGiant} from '../src/dice-giant.mjs';

const stepFor=(fn,g,t,input={})=>{for(let i=0;i<Math.ceil(t*120);i++)fn(g,1/120,input);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
test('smooth autonomous footwork can approach, circle and yield while preserving bounds',()=>{
 const run=seed=>{
  const s=createBossAutonomy(seed),b={x:0,z:0},p={x:15,z:0},trace=[];
  for(let i=0;i<120;i++){
   const move=stepBossAutonomy(s,b,p,1/120,{arena:23,spacing:7,speed:7,sideSpeed:3});
   trace.push([b.x,b.z,move.moving]);
  }
  return {s,b,trace};
 };
 const a=run(73),b=run(73),c=run(74);
 assert.deepEqual(a.trace,b.trace,'same encounter seed must produce reproducible paths');
 assert.notDeepEqual(a.trace,c.trace,'autonomous lateral decisions vary between attempts');
 assert.ok(distance(a.b,{x:15,z:0})<15,'boss must visibly close distance');
 assert.ok(Math.abs(a.b.z)>.3,'boss must not only run in a straight line');
 for(const row of a.trace)assert.ok(row.every(Number.isFinite));
 const crowded={x:0,z:0},state=createBossAutonomy(22),player={x:0,z:2};
 for(let i=0;i<120;i++)stepBossAutonomy(state,crowded,player,1/120,{spacing:7,arena:23});
 assert.ok(distance(crowded,player)>2.5,'boss must create room instead of face-hugging');
 const border={x:22,z:0};
 for(let i=0;i<250;i++)stepBossAutonomy(state,border,{x:60,z:60},1/120,{arena:23});
 assert.ok(Math.hypot(border.x,border.z)<=23.0000001);
});
test('Kwon visibly pursues distant targets, circles at medium range, and plants during punish recovery',()=>{
 for(const phase of [1,2]){
  const g=createGame('sword',{register:false,seed:44});g.boss.phase=phase;
  g.boss.state='idle';g.boss.wait=5;g.player.x=0;g.player.z=20;
  const start=distance(g.boss,g.player);
  stepFor(stepKwon,g,.55);
  assert.ok(start-distance(g.boss,g.player)>2.5,'idle Kwon is actively pursuing');
  assert.ok(Math.abs(g.boss.x)>.1,'distant Kwon also changes lateral position');
  const b=g.boss;b.state='recovery';b.pattern='sweep';b.queue=[];b.recovery=1;b.t=0;
  const location={x:b.x,z:b.z};
  stepFor(stepKwon,g,.3);
  assert.deepEqual({x:b.x,z:b.z},location,'full attack punish window stays stationary');
 }
});
test('Clown independently paces and side-steps with real gait odometer, not new attacks',()=>{
 for(const phase of [1,2]){
  const g=createClownGame('sword',{register:false,seed:129});g.boss.phase=phase;
  const c=g.clown;c.state='idle';c.wait=4;
  g.player.x=12;g.player.z=4;
  const from={x:g.boss.x,z:g.boss.z},before=distance(from,g.player);
  stepFor(stepClown,g,.9);
  assert.ok(distance(g.boss,from)>2,'clown needs substantial independent movement');
  assert.ok(c.odo>2,'actual displacement drives gait');
  assert.ok(distance(g.boss,g.player)<before,'clown closes distance while flanking');
  assert.equal(c.state,'idle','locomotion does not create an invisible attack');
  assert.equal(c.zones.length,0);
 }
});
test('Blood keeps the complete safe counter window before a distinct, articulated reposition walk',()=>{
 for(const phase of [1,2]){
  const g=createBloodGame('sword',{seed:55});g.boss.phase=phase;g.player.hp=1e6;
  g.player.x=16;g.player.z=9;startBloodPattern(g,phase===1?'wave':'wing');
  const duration=phase===1?3.8:2.9;
  stepFor(stepBlood,g,duration+.04);
  assert.equal(g.boss.state,'recovery');
  const start={x:g.boss.x,z:g.boss.z};
  const recover=g.blood.recover;
  stepFor(stepBlood,g,recover-.05);
  assert.equal(g.boss.state,'recovery');
  const planted={x:g.boss.x,z:g.boss.z};
  const remains=g.blood.recover;
  assert.ok(remains<=.07);
  const hp=g.player.hp;
  stepFor(stepBlood,g,remains+.02);
  assert.equal(g.boss.state,'maneuver');
  assert.ok(g.blood.hazards.length===0,'independent footwork has no phantom spells');
  const before={x:g.boss.x,z:g.boss.z};
  stepFor(stepBlood,g,.88);
  assert.equal(g.boss.state,'maneuver');
  const pose=bloodFootTargets(g),walk=sampleBloodWalk(g.blood.walk);
  assert.ok(walk.moving||walk.t>0);
  assert.ok(distance(g.boss,before)>.55,'Blood king circles even outside authored attack motion');
  assert.ok(pose.every(t=>Number.isFinite(t.x)&&Number.isFinite(t.y)&&Number.isFinite(t.z)));
  assert.equal(g.player.hp,hp,'no damage from non-attacking boss movement');
  assert.ok(distance(g.boss,start)<7,'no sudden teleport');
  assert.ok(BLOOD_COUNTER_WINDOW>=1.5);
 }
});
test('Blood maneuver chooses radial retreat when crowded and a sideways stride',()=>{
 const b={x:0,z:0,yaw:0};
 const far=createBloodManeuver(b,{x:0,z:20},1.24,0,1);
 const near=createBloodManeuver(b,{x:0,z:2},1.24,0,1);
 assert.ok(far.steps>0&&near.steps>0);
 const endFar=sampleBloodWalk({...far,t:1.24}),endNear=sampleBloodWalk({...near,t:1.24});
 assert.ok(endFar.z>0,'distant opponent gets approached');
 assert.ok(endNear.z<0,'crowded boss creates distance');
 assert.ok(Math.abs(endFar.x)>.15&&Math.abs(endNear.x)>.15,'both actions include a sidestep');
});
test('Casino cube independently mixes direct rolls with legal lateral tiles, never slides/teleports',()=>{
 const center=60,g={index:center,moves:0,roamBias:0,frenzyRemaining:0},target={x:0,z:24};
 const direct=nextDiceRoamTile(g,target);
 assert.equal(Math.abs(DICE_BOARD[direct].z-DICE_BOARD[center].z),DICE.edge);
 g.moves=2;
 const flank=nextDiceRoamTile(g,target);
 assert.equal(DICE_BOARD[flank].z,DICE_BOARD[center].z,'third neutral roll flanks laterally');
 assert.notEqual(DICE_BOARD[flank].x,DICE_BOARD[center].x);
 for(let i=0;i<DICE_BOARD.length;i++)for(let k=0;k<8;k++){
  const n=nextDiceRoamTile({index:i,moves:k,roamBias:k%3,frenzyRemaining:0},target),a=DICE_BOARD[i],b=DICE_BOARD[n];
  assert.ok(b);
  assert.equal(Math.abs(b.x-a.x)+Math.abs(b.z-a.z),DICE.edge,'only one real cardinal roll');
 }
 const sim=createDiceGame({seed:21}),old={x:sim.dice.pose.x,z:sim.dice.pose.z};
 stepDice(sim,.1,{freezeBoss:true});
 assert.deepEqual({x:sim.dice.pose.x,z:sim.dice.pose.z},old,'freeze blocks autonomous dice roll');
});
test('Giant Sungwon naturally watches with his head and moves physical palms during non-attacking recovery',()=>{
 const g=createDicePlayerGame('sword',{seed:74});
 damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const q=g.dice.giant;assert.equal(q.state,'recovery');
 const hp=g.player.hp;
 const first=giantHandPose(g,0),head=giantHeadPose(g);
 stepFor(stepDicePlayer,g,1.4);
 assert.equal(q.state,'recovery');
 const hand=giantHandPose(g,0),neck=giantHeadPose(g);
 assert.ok(distance(first,hand)>.15||Math.abs(first.y-hand.y)>.15);
 assert.ok(distance(head,neck)>.04||Math.abs(head.y-neck.y)>.04);
 assert.equal(q.hazards.length,0,'idle hands are non-damaging');
 assert.equal(g.player.hp,hp);
});
