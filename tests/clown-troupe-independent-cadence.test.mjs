import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownGame,stepClown} from '../src/clown-combat.mjs';
import {setCircusAct,stepCircusTroupe,
 CIRCUS_MEMBER_CADENCE,circusMemberAttackInterval} from '../src/clown-troupe.mjs';

const fixture=(stage=3)=>{
 const g=createClownGame('sword',{register:false,seed:33});
 g.boss.phase=stage===1?1:2;g.boss.state='clown';g.clown.horrorStage=stage;
 g.clown.state='pattern';g.clown.name='directorBatonRake';
 g.player.invuln=1e9;
 setCircusAct(g,stage);
 // Previously these three unrelated global locks completely stopped NPC attacks.
 g.clown.troupe.globalCooldown=1000;
 g.clown.punish=true;g.clown.stunT=1;g.clown.noSeparate=true;
 return g;
};
function run(g,seconds){
 const dt=1/60,events=[],hazards=[],alive=new Map();
 for(const m of g.clown.troupe.members.filter(x=>!x.legacy)){
  alive.set(m.id,m);m.cooldown=.2+(alive.size-1)*.34;
 }
 for(let i=0;i<Math.round(seconds/dt);i++){
  g.clown.time+=dt;g.time+=dt;
  stepCircusTroupe(g,dt,{
   zone:(_game,z)=>{hazards.push(z);return z;},
   emit:(_game,type,data)=>{
    if(type==='clown-troupe-cast'||type==='clown-legacy-echo-cast')
     events.push({type,id:data.id,wind:data.wind,time:g.clown.time});
   },
   hurt:()=>{}
  });
 }
 return {events,hazards,alive};
}
test('every normal performer has its own bounded 3-4 second attack interval',()=>{
 for(let i=0;i<30;i++){
  const interval=circusMemberAttackInterval({id:i,attackCount:i%5});
  assert.ok(interval>=CIRCUS_MEMBER_CADENCE.min&&interval<=CIRCUS_MEMBER_CADENCE.max);
 }
 assert.equal(circusMemberAttackInterval({id:8,attackCount:4}),
  circusMemberAttackInterval({id:8,attackCount:4}),'cadence must be reproducible');
 const g=fixture(3),{events,hazards,alive}=run(g,23);
 const byMember=new Map();
 for(const e of events.filter(e=>e.type==='clown-troupe-cast')){
  const group=byMember.get(e.id)||[];
  group.push(e.time);byMember.set(e.id,group);
  assert.ok(e.wind>=1.05,'every hit must still be visibly telegraphed');
 }
 assert.equal(byMember.size,alive.size,'every active member must attack, even during the director pattern');
 for(const [id,times] of byMember){
  assert.ok(times.length>=4,'member '+id+' attacks too infrequently');
  for(let i=1;i<times.length;i++){
   const gap=times[i]-times[i-1];
   assert.ok(gap>=3.0&&gap<=4.03,
    'member '+id+' should attack every 3-4 seconds, got '+gap.toFixed(3));
  }
 }
 assert.ok(events.filter(x=>x.type==='clown-troupe-cast').length>=28);
 assert.ok(hazards.every(z=>z.warn>=1.05||z.damage===0),
  'ordinary cast collision hazards must keep their anticipation');
});
test('ordinary attackers do not need the director to stop casting',()=>{
 const g=fixture(1);
 const {events}=run(g,14);
 const normal=events.filter(x=>x.type==='clown-troupe-cast');
 assert.ok(normal.length>=8,'3 stage-one actors should attack alongside the boss');
 assert.equal(g.clown.state,'pattern');
 assert.ok(g.clown.troupe.globalCooldown>900,
  'global clock should be ignored without being mutated by every independent cast');
});
test('the boss can start the next show even while performers are mid-cast',()=>{
 const g=createClownGame('sword',{register:false,seed:19});
 g.player.invuln=99999;g.clown.state='idle';g.clown.wait=.003;
 g.startGrace=0;setCircusAct(g,1);
 g.clown.troupe.members[0].cast=1.6;
 stepClown(g,1/60);
 assert.equal(g.clown.state,'pattern','the director must not wait for endless troupe attacks');
 assert.ok(g.clown.name);
});
test('phase-change cutscene remains attack-free, and minis keep their separate slower recovery',()=>{
 const g=fixture(2),m=g.clown.troupe.members.find(x=>x.legacy);
 assert.ok(m);
 m.cooldown=0;
 g.boss.state='transition';
 let events=run(g,1.5).events;
 assert.equal(events.length,0,'the non-skippable cutscene is still protected');
 g.boss.state='clown';g.clown.state='pattern';
 g.clown.troupe.globalCooldown=100;
 m.cooldown=.01;
 events=run(g,10).events.filter(x=>x.type==='clown-legacy-echo-cast');
 assert.ok(events.length>=1,'legacy miniboss must not be starved by independent ordinary performers');
 for(const id of new Set(events.map(e=>e.id)){
  const times=events.filter(e=>e.id===id).map(e=>e.time);
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=6.4-1/60);
 }
});
