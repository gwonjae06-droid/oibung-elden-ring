import test from 'node:test';
import assert from 'node:assert/strict';
import {createGyuwonGame,stepGyuwon,actGyuwon} from '../src/gyuwon-combat.mjs';
import {actFiveChoreographyAt} from '../src/gyuwon-act-five-choreography.mjs';
import {actFivePerformanceAt,poseActFiveHands} from '../src/gyuwon-act-five-score.mjs';

function at(time){const g=createGyuwonGame('sword',{yearMode:true,seed:8723});g.gyuwon.years.year=5;g.boss.hp=6000;stepGyuwon(g,.01);const m=g.gyuwon.years.musical;m.transition=0;m.clock=null;m.time=time-1;m.turn='player';m.turnActor='ally0';for(let i=0;i<120;i++)stepGyuwon(g,1/120);return {g,m};}
const step=(g,t)=>{for(let i=0;i<Math.ceil(t*120);i++)stepGyuwon(g,1/120);};
const hands=m=>m.enemies.slice(0,2).map(e=>[e.x,e.y,e.z]);

test('flight has high spread arms, an invitation reaches forward, and we crosses both wrists around the chest',()=>{
 const flight=actFiveChoreographyAt(68.7,actFivePerformanceAt(68.7));
 assert.ok(flight.handTargets[0][0]<-20&&flight.handTargets[1][0]>20);
 assert.ok(flight.handTargets.every(p=>p[1]>18));
 const hand=actFiveChoreographyAt(71.6,actFivePerformanceAt(71.6));
 assert.ok(hand.handTargets[1][2]>-8,'the right hand reaches from the back toward the audience');
 const hug=at(76).m;assert.ok(hug.enemies[0].x>3&&hug.enemies[1].x< -3);
 assert.ok(hug.enemies.slice(0,2).every(e=>e.y>16&&e.z< -12));
 assert.ok(Math.abs(hug.enemies[0].z-hug.enemies[1].z)>1.5,'forearms overlap at different depths');
});

test('ally animation, attacks by other parts and broken HP never freeze the singing hands',()=>{
 const {m}=at(71.3);m.actorMotion={actorId:'ally2'};m.raidAttack={part:2,age:.5,wind:1.5};
 m.enemies[0].destroyed=true;m.enemies[0].hp=0;
 const before=hands(m);m.time=75;m.songPerformance=actFivePerformanceAt(75);for(let i=0;i<24;i++)poseActFiveHands(m,1/60);
 assert.notDeepEqual(hands(m)[0],before[0]);assert.notDeepEqual(hands(m)[1],before[1]);
 assert.ok(m.enemies[0].x>3);assert.equal(m.enemies[0].hp,0);assert.equal(m.enemies[0].destroyed,true);
});

test('every party member makes visible contact with a freely performing hand before damage',()=>{
 for(let role=0;role<4;role++){
  const {g,m}=at(70.7);m.turnActor='ally'+role;m.targetIndex=0;
  const hp=m.enemies[0].hp,start=hands(m);assert.equal(actGyuwon(g,'light'),true);
  step(g,.7);assert.equal(m.enemies[0].hp,hp);assert.notDeepEqual(hands(m),start);
  const shot=m.actorMotion.projectiles[0];assert.equal(shot.visible,true);
  step(g,.4);assert.ok(m.enemies[0].hp<hp,'role '+role+' must still connect');
  if(role!==0)assert.equal(shot.hit,true);
 }
});

test('new boss attacks yield to the literal three-line sequence, preserving player turns and the song',()=>{
 for(const time of [65,68.8,71.3,76,82]){const {g,m}=at(time);m.turn='boss';m.turnActor='enemy0';m.raidAttack=null;const hp=m.party.map(p=>p.hp),clock=m.time;step(g,.05);assert.equal(m.raidAttack,null);assert.deepEqual(m.party.map(p=>p.hp),hp);assert.ok(m.time>clock);assert.equal(g.boss.hp,6000);}
});

test('the ending still performs both arms after combat has finished',()=>{
 const {g,m}=at(168);const before=hands(m);step(g,.8);assert.equal(m.turn,'finish');assert.notDeepEqual(hands(m),before);
});
