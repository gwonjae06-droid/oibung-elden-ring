import test from 'node:test';
import assert from 'node:assert/strict';
import {clownHurtShapes,bloodHurtShapes} from '../src/boss-hit-regions.mjs';
import {kwonMeleeContact,kwonProjectileContact} from '../src/kwon-hurtbox.mjs';
import {createGame,createGame as createKwonGame,step,act,encounterBossHurtShapes,WEAPONS} from '../src/combat.mjs';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {createBloodGame,actBlood,stepBlood} from '../src/blood-combat.mjs';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {giantImpact,GIANT_HAND_PARTS} from '../src/dice-giant-hit.mjs';
import {diceSegmentImpact} from '../src/dice-hit.mjs';
import {DICE_RULES} from '../src/dice-data.mjs';

const stepFor=(g,fn,seconds)=>{for(let t=0;t<seconds-1e-8;t+=.01)fn(g,Math.min(.01,seconds-t));};
const clown=phase=>{
 const g=createClownGame('sword',{register:false});g.boss.phase=phase;g.clown.wait=100;
 return g;
};
const blood=phase=>{
 const g=createBloodGame('sword');g.boss.phase=phase;g.blood.transitioned=phase===2;
 g.boss.state='recovery';g.blood.recover=100;return g;
};
const far={x:8,y:1.75,z:0},farEnd={x:5,y:1.75,z:0};

test('Kwon and clown never share the same hard-coded boss hurtbox',()=>{
 const k=createGame('sword',{register:false}),c=clown(1);
 assert.ok(encounterBossHurtShapes(k).some(x=>x.id==='abdomen'));
 assert.deepEqual(encounterBossHurtShapes(c).map(x=>x.id),['ball','torso','head']);
 assert.ok(!encounterBossHurtShapes(c).some(x=>x.id==='abdomen'));
});
test('Clown riding ball is hittable in phase one with the real forward blade',()=>{
 const g=clown(1),shapes=clownHurtShapes(g);
 assert.equal(shapes[0].id,'ball');
 assert.ok(kwonMeleeContact(shapes,{x:0,z:0},{reach:2.85,yaw:Math.PI,height:1.85}));
 assert.equal(kwonMeleeContact(shapes,{x:8,z:0},{reach:2.85,yaw:Math.PI,height:1.85}),null);
 assert.equal(kwonProjectileContact(shapes,{x:0,y:14,z:0},{x:0,y:14,z:-8}),null,'a high shot cannot hit an invisible cylinder');
 const hp=g.boss.hp;g.player.z=0;g.player.yaw=Math.PI;
 assert.equal(act(g,'light'),true);stepFor(g,stepClown,.5);
 assert.ok(g.boss.hp<hp,'player sword must connect with visible ball');
});
test('Clown phase-two body stands on the floor and grows paws only during a hunt',()=>{
 const g=clown(2),stand=clownHurtShapes(g);
 assert.ok(stand.some(v=>v.id==='head')&&stand.some(v=>v.id==='torso'));
 assert.ok(!stand.some(v=>['ball','mount-head','left-paw','right-paw'].includes(v.id)));
 assert.ok(stand.find(v=>v.id==='head').y>stand.find(v=>v.id==='torso').y);
 g.clown.state='pattern';g.clown.name='feralSkitter';g.clown.pt=1.9;
 g.clown.beastRecoverAt=5;
 const hunt=clownHurtShapes(g);
 assert.ok(hunt.some(v=>v.id==='left-paw')&&hunt.some(v=>v.id==='right-paw'));
 assert.ok(hunt.find(v=>v.id==='head').z>g.boss.z+2);
});
test('blood boss has robe, chest, arms, legs and head at true different heights',()=>{
 const g=blood(1),parts=bloodHurtShapes(g);
 assert.ok(['robe','abdomen','chest','left-arm','right-arm','left-leg','right-leg','head'].every(id=>parts.some(v=>v.id===id)));
 assert.ok(parts.find(v=>v.id==='head').y>5);
 assert.ok(kwonMeleeContact(parts,{x:0,z:-2},{reach:2.85,yaw:Math.PI,height:1.85}));
 assert.equal(kwonProjectileContact(parts,{x:0,y:14,z:-2},{x:0,y:14,z:-6}),null);
});
test('blood boss melee in wrong direction cannot damage even inside the old range',()=>{
 const g=blood(1),hp=g.boss.hp;g.player.z=-2;g.player.yaw=0;
 assert.equal(actBlood(g,'light'),true);g.player.action.yaw=0;stepFor(g,stepBlood,.5);
 assert.equal(g.boss.hp,hp);
});
test('blood boss ground-level bow actually hits robe when grounded',()=>{
 const g=createBloodGame('bow');g.boss.phase=2;g.blood.transitioned=true;
 g.boss.state='recovery';g.blood.recover=100;g.player.z=-2;
 const hp=g.boss.hp;assert.equal(actBlood(g,'light'),true);stepFor(g,stepBlood,.75);
 assert.ok(g.boss.hp<hp);
 const ev=g.events.find(e=>e.type==='boss-hit');
 assert.equal(ev?.part,'robe');assert.ok(Number.isFinite(ev?.y));
});
test('blood boss airborne height moves hurt volumes without a phantom grounded body',()=>{
 const g=blood(2);g.blood.elevation=9;
 assert.equal(kwonProjectileContact(bloodHurtShapes(g),{x:0,y:.38,z:-2},{x:0,y:.38,z:-7}),null);
 assert.ok(bloodHurtShapes(g).some(x=>x.id==='blood-core'));
 assert.ok(!bloodHurtShapes(g).some(x=>x.id==='head'),'transformed head should not leave an old hitbox');
});
test('dice first-phase cube uses actual 3D rotated-box faces, never a distance circle',()=>{
 const g=createDicePlayerGame('sword'),q=g.dice.pose;
 assert.equal(diceSegmentImpact({x:q.x-12,y:20,z:q.z},{x:q.x+12,y:20,z:q.z},q),null);
 assert.ok(diceSegmentImpact({x:q.x-12,y:2,z:q.z},{x:q.x+12,y:2,z:q.z},q));
 assert.equal(diceSegmentImpact({x:q.x+11,y:2,z:q.z+11},{x:q.x+7,y:2,z:q.z+7},q),null);
});
test('giant hand uses curved palm and fingers instead of rectangular empty corners',()=>{
 assert.equal(GIANT_HAND_PARTS[0].id,'palm');
 const g={time:0,player:{x:0,z:0},dice:{giant:{state:'recovery',temperament:'controlled',hands:[340,340],
  destroyed:[false,false],revive:[0,0],hazards:[],smooth:[{x:-22,y:2,z:-64},{x:22,y:2,z:-64}]}}};
 const real=giantImpact(g,{x:-22,y:1.2,z:-52},{x:-22,y:1.2,z:-58});
 assert.equal(real?.part,'hand');
 const corner=giantImpact(g,{x:-22+7.7,y:4.4,z:-64+9.8},{x:-22+7.7,y:4.4,z:-64+9.8});
 assert.equal(corner,null,'old box accepted this air corner despite no mesh there');
 g.dice.giant.destroyed[0]=true;
 assert.equal(giantImpact(g,{x:-22,y:1.2,z:-52},{x:-22,y:1.2,z:-58}),null,'destroyed hands have no lingering hitboxes');
});
test('near-miss attacks never reward damage or stats for all non-dice grounded bodies',()=>{
 for(const [type,g,fn]of [['kwon',createKwonGame('sword',{register:false}),step],['clown',clown(1),stepClown],['blood',blood(1),stepBlood]]){
  if(type==='kwon')g.boss.wait=100;
  const hp=g.boss.hp,gained=g.stats.hits;
  g.player.x=11;g.player.z=11;g.player.yaw=0;assert.ok(act(g,'light'));
  stepFor(g,fn,.55);
  assert.equal(g.boss.hp,hp,type+' empty air cannot damage');
  assert.equal(g.stats.hits,gained,type+' missing swings cannot grant hits');
 }
});
