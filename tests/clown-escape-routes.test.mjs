import test from 'node:test';
import assert from 'node:assert/strict';
import {
 clownThreatCovers,clownEscapeRoutes,balanceClownTroupeWarning,
 protectClownEscapeFromDirector,balanceClownMeleeOpening
} from '../src/clown-escape-routes.mjs';
import {createClownGame,stepClown,startClownPattern} from '../src/clown-combat.mjs';
import {setCircusAct,CIRCUS_MEMBER_CADENCE} from '../src/clown-troupe.mjs';
import {createLegacyEcho,beginLegacyEchoAttack} from '../src/clown-legacy-echo.mjs';

function world(){
 return {player:{x:0,z:0,weapon:'sword'},
  boss:{x:0,z:-13},clown:{time:0,zones:[],waves:[],troupe:{members:[]}}};
}
let nextTestZoneId=1;
function hazard(source,shape,props={}){
 return {id:nextTestZoneId++,age:0,state:'warn',
  warn:1.42,source,damage:18,shape,...props};
}

test('escape search models real circle/lane/cone hitboxes and respects arena boundary',()=>{
 assert.ok(clownThreatCovers({shape:'circle',x:0,z:0,r:3},{x:2.5,z:0}));
 assert.ok(!clownThreatCovers({shape:'circle',x:0,z:0,r:3},{x:5,z:0}));
 assert.ok(clownThreatCovers({shape:'lane',x:0,z:0,yaw:0,len:9,w:2},
  {x:0.3,z:4.0}));
 assert.ok(!clownThreatCovers({shape:'lane',x:0,z:0,yaw:0,len:9,w:2},
  {x:5.0,z:4.0}));
 assert.ok(clownThreatCovers({shape:'cone',x:0,z:0,yaw:0,r:8,half:.6},
  {x:1,z:4}));
 assert.ok(!clownThreatCovers({shape:'cone',x:0,z:0,yaw:0,r:8,half:.6},
  {x:7,z:0}));
 const g=world(),routes=clownEscapeRoutes(g);
 assert.ok(routes.length>=20);
 assert.ok(routes.every(p=>Math.hypot(p.x,p.z)<=23));
 g.player.x=22.2;g.boss.x=9;
 assert.ok(clownEscapeRoutes(g).every(p=>Math.hypot(p.x,p.z)<=23));
});

test('new 3-4s troupe hit adapts to a reachable physical corridor instead of flooding it',()=>{
 const g=world();
 const boss=hazard('director','circle',{x:3.8,z:0,r:6.3});
 g.clown.zones.push(boss);
 assert.ok(clownEscapeRoutes(g).length>0,'there was room to dodge the director');
 const member=hazard('troupe','circle',{x:-3.8,z:0,r:6.3});
 const planned=balanceClownTroupeWarning(g,member);
 assert.ok(clownEscapeRoutes(g,{additional:[planned]}).length>0,
  'independent cast must leave a walkable safe destination');
 assert.equal(boss.damage,18,'director's signature cannot be nerfed');
 assert.equal(boss.x,3.8,'director danger is never silently moved');
 assert.equal(planned.warn,1.42,'telegraph and attack cadence are unchanged');
 assert.equal(planned.source,'troupe');
 assert.ok(planned.escapeAdjusted||planned.feint,
  'the dangerously convergent member attack should be adjusted');
});

test('an impossible all-enclosing troupe attack becomes an honest harmless feint',()=>{
 const g=world(),attack=hazard('troupe','circle',{x:0,z:0,r:11});
 const response=balanceClownTroupeWarning(g,attack);
 assert.equal(response.feint,true);
 assert.equal(response.damage,0);
 assert.equal(response.visual,true);
 assert.ok(clownEscapeRoutes(g,{additional:[response]}).length>0);
});

test('director pattern arriving AFTER a troupe warning still preserves an escape lane',()=>{
 const g=world();
 const original=hazard('troupe','circle',{x:-3.8,z:0,r:6.3});
 const director=hazard('director','circle',{x:3.8,z:0,r:6.3});
 g.clown.zones.push(original);
 assert.ok(clownEscapeRoutes(g).length>0);
 const changed=protectClownEscapeFromDirector(g,director);
 assert.equal(changed,true,'the troupe, not the director, must adapt');
 assert.ok(clownEscapeRoutes(g,{additional:[director]}).length>0);
 assert.equal(director.damage,18);
 assert.equal(director.x,3.8);
 assert.ok(original.escapeAdjusted||original.feint);
 // Once a warning has been seen for a while, never teleport it.
 const late=world(),old=hazard('troupe','circle',{x:-3.8,z:0,r:6.3,age:.36});
 late.clown.zones.push(old);
 protectClownEscapeFromDirector(late,director);
 assert.equal(old.x,-3.8);
 assert.equal(old.z,0);
});

test('actual melee weapon sweeps participate in safe-route detection',()=>{
 const g=world();g.boss.x=0;g.boss.z=-15;
 const member={id:13,role:'bladeDancer',melee:null,down:false};
 g.clown.troupe.members.push(member);
 const p={kind:'bladeDancer',from:{x:0,z:4},yaw:Math.PI,
  start:0,wind:1.12,travel:.24,stride:2.4,
  impacts:[1.25,2.3,3.1],hit:[false,false,false]};
 const result=balanceClownMeleeOpening(g,member,p);
 assert.ok(Number.isFinite(result.yaw));
 assert.ok(clownEscapeRoutes(g).length>0,'old threats remain dodgeable');
 member.melee=result;
 if(!result.feint)assert.ok(clownEscapeRoutes(g).length>0,
  'actual physical blade's future contact cannot close every path');
});

test('full third-act independent cast pressure keeps a route for many starting seeds',()=>{
 for(let seed=1;seed<=12;seed++){
  const g=createClownGame('sword',{register:false,seed});
  g.player.x=0;g.player.z=0;g.player.invuln=1e5;
  g.boss.x=0;g.boss.z=-14;g.boss.phase=2;g.boss.state='clown';
  g.clown.horrorStage=3;g.clown.state='idle';g.clown.wait=100;
  setCircusAct(g,3);
  g.clown.zones.push(hazard('director','circle',
   {x:3.8,z:0,r:3,warn:1.35}));
  let sawCast=0,highestPressure=0,adjustments=0;
  for(let tick=0;tick<1200;tick++){
   stepClown(g,1/60);
   if(g.status!=='playing')break;
   const dangers=g.clown.zones.filter(z=>z.state==='warn'&&z.damage>0);
   highestPressure=Math.max(highestPressure,dangers.length);
   adjustments+=g.clown.zones.filter(z=>z.age<.02&&z.escapeAdjusted).length;
   if(tick%12===0){
    const pending=g.clown.zones.filter(z=>z.state==='warn'&&z.source==='troupe');
    if(pending.length)assert.ok(clownEscapeRoutes(g).length>0,
     'a reachable route must survive ordinary cast collision (seed '+seed+', tick '+tick+')');
   }
  }
  sawCast=g.clown.troupe.members.filter(m=>!m.legacy).reduce((n,m)=>n+(m.attackCount||0),0);
  assert.ok(sawCast>=25,'ordinary cast activity should stay aggressive, seed '+seed);
  assert.equal(CIRCUS_MEMBER_CADENCE.min,3.05);
  assert.ok(highestPressure>=1);
  assert.ok(adjustments>=0);
 }
});

test('legacy head projectile follows the rebalanced actual impact position',()=>{
 const g={boss:{x:0,z:0},player:{x:2,z:4},clown:{time:1},nextId:1};
 const mini=createLegacyEcho(g,0);
 const s=beginLegacyEchoAttack(g,mini,{
  zone:(_game,z)=>({...z,x:z.x+1.6,z:z.z-.9}),
  emit:()=>{}
 });
 assert.equal(s.kind,'headBomb');
 assert.equal(s.shots.length,1);
 assert.equal(s.shots[0].x,s.aim.x+1.6);
 assert.equal(s.shots[0].z,s.aim.z-.9);
});
