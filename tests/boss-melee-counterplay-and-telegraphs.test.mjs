import test from 'node:test';
import assert from 'node:assert/strict';
import {BOSS_AUTONOMY,createBossAutonomy,stepBossAutonomy} from '../src/boss-autonomy.mjs';
import {BLOOD_CONTACT_MARGIN,bloodHazardFootprint,hazardContains} from '../src/blood-data.mjs';
import {DICE_RULES} from '../src/dice-data.mjs';
import {DICE_PATTERNS} from '../src/dice-combat.mjs';
import {createBloodManeuver,sampleBloodWalk} from '../src/blood-footwork.mjs';
import {clownDangerSpotlightCue,clownSpotlightLayout} from '../src/clown-danger-spotlight.mjs';

test('normal boss movement runs at 70 percent and close melee is not continuously kited',()=>{
 assert.equal(BOSS_AUTONOMY.movementScale,.70);
 const b={x:0,z:0},p={x:20,z:0};
 stepBossAutonomy(createBossAutonomy(1),b,p,1/120,{speed:10,sideSpeed:0,arena:25});
 assert.ok(Math.abs(b.x-7/120)<1e-9,'far pursuit speed is 70% of specified movement speed');
 const close={x:0,z:0},state=createBossAutonomy(4),target={x:0,z:2.4};
 for(let i=0;i<120;i++)stepBossAutonomy(state,close,target,1/120,{spacing:4,speed:10,sideSpeed:0});
 assert.ok(Math.hypot(close.x-target.x,close.z-target.z)<3.5,'boss stays inside melee reach after one second');
});
test('blood king steps toward distant targets without retreating far from nearby swords',()=>{
 const b={x:0,z:0,yaw:0},far=createBloodManeuver(b,{x:0,z:14},1.24,0,1);
 const near=createBloodManeuver(b,{x:0,z:2.4},1.24,0,1);
 assert.ok(sampleBloodWalk({...far,t:1.24}).z>0);
 assert.ok(sampleBloodWalk({...near,t:1.24}).z>-.5);
});
test('blood rings have a forgiving damage band visibly bounded by blood FX',()=>{
 assert.equal(BLOOD_CONTACT_MARGIN,.28);
 const ring={shape:'ring',x:0,z:0,r:8,width:1.4,grow:0,age:1.3,warn:1};
 const f=bloodHazardFootprint(ring);
 assert.ok(f.halfWidth<ring.width);
 assert.ok(hazardContains(ring,{x:8,z:0}));
 assert.equal(hazardContains(ring,{x:9.3,z:0}),false);
});
test('dice ordinary and frenzy rolls are slower but committed charging velocity is unchanged',()=>{
 assert.equal(DICE_RULES.rollTime,1);
 assert.ok(Math.abs(DICE_PATTERNS.frenzyRollTime-(.38/.7))<1e-9);
 assert.equal(DICE_PATTERNS.chargeTime,.5);
});
test('physical circus charges advertise their trajectory without damage or tutorial text',()=>{
 const dash={state:'warn',shape:'lane',x:1,z:2,yaw:0,len:14,w:5,warn:.9,age:.2,damage:0,visual:true,chargeCue:true};
 assert.equal(clownDangerSpotlightCue(dash),true);
 assert.equal(clownSpotlightLayout(dash).sz,7);
 assert.equal(clownDangerSpotlightCue({...dash,chargeCue:false}),false);
});
