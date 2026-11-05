import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {GIANT,giantPattern,giantHazards,hazardContains,skipGiant,giantHandPose,giantHeadPose,giantHeadExposed} from '../src/dice-giant.mjs';
import {giantImpact} from '../src/dice-giant-hit.mjs';
const advance=(g,t)=>{for(let n=0;n<Math.ceil(t*120);n++)stepDicePlayer(g,1/120);};
function ready(weapon='sword'){const g=createDicePlayerGame(weapon);damageDice(g,g.boss.maxHp*.51);skipGiant(g);advance(g,.02);g.player.hp=g.player.maxHp=999;return g;}
test('the public player engine starts possession at two-thirds health exactly once and protects the cutscene',()=>{
 const g=createDicePlayerGame();g.projectiles.push({});g.player.action={kind:'attack'};
 damageDice(g,999);assert.equal(g.boss.phase,1);damageDice(g,1);assert.equal(g.dice.giant.state,'transition');assert.equal(g.boss.hp,2000);assert.equal(g.projectiles.length,0);assert.equal(g.player.action,null);
 assert.equal(damageDice(g,999),0);assert.equal(actDice(g,'light'),false);const hp=g.player.hp;advance(g,4);assert.equal(g.player.hp,hp);assert.equal(g.dice.giant.state,'transition');
 skipGiant(g);advance(g,.02);assert.equal(g.dice.giant.state,'recovery');assert.equal(g.events.filter(e=>e.type==='dice-possession').length,1);assert.equal(g.boss.phase2PendingDesign,false);
});
for(const weapon of ['sword','hammer','bow','cards'])test(weapon+' can destroy a reachable hand with real attacks without any stagger, and the boss keeps fighting',()=>{
 const g=ready(weapon);g.player.x=-22;g.player.z=-52;g.dice.stun=60;let tries=0;const start=g.boss.hp;
 while(!g.dice.giant.destroyed[0]&&tries++<80){g.player.stamina=100;actDice(g,'light');advance(g,1.3);}
 assert.equal(g.dice.giant.destroyed[0],true);assert.equal(g.dice.giant.hands[0],0);
 assert.notEqual(g.dice.giant.state,'wounded');assert.ok(g.boss.hp<start,'hand damage also drains the boss');
});
test('hand impact uses the rendered pose and the head is exposed only by a feral head slam',()=>{
 const g=ready();const hand=giantHandPose(g,0),hit=giantImpact(g,{x:hand.x,y:1.2,z:hand.z+13},{x:hand.x,y:1.2,z:hand.z+9});assert.equal(hit.part,'hand');assert.equal(hit.index,0);
 const s=g.dice.giant,p=giantPattern(2,{x:0,z:0},'feral',.24);Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:0,hazards:p.hazards,duration:p.duration});
 assert.equal(giantHeadExposed(g),false);
 s.t=1.5;g.dice.pose=giantHeadPose(g);assert.equal(giantHeadExposed(g),true);
 const h=p.hazards[0],photo=giantImpact(g,{x:h.x,y:1.2,z:h.z+17},{x:h.x,y:1.2,z:h.z+1});assert.equal(photo?.part,'head');
});
test('seven deterministic patterns leave a safe position at every damage beat and lock their targets',()=>{
 for(let slot=0;slot<7;slot++){const p={x:20,z:20},pattern=giantPattern(slot,p),snapshot=JSON.stringify(pattern);p.x=-40;assert.equal(JSON.stringify(pattern),snapshot);
  const g=ready();Object.assign(g.dice.giant,{state:'attack',t:0,slot,hazards:pattern.hazards});
  for(let t=0;t<pattern.duration;t+=.1){g.dice.giant.t=t;const hazards=giantHazards(g).filter(h=>h.live);let safe=false;for(let x=-60;x<=60&&!safe;x+=6)for(let z=-60;z<=60;z+=6)if(hazards.every(h=>!hazardContains(h,{x,z}))){safe=true;break;}assert.ok(safe,'safe route for '+slot+' at '+t);}
 }
});
test('warnings never deal early damage, ordinary roll protection works, and pause freezes attacks',()=>{
 const g=ready(),pattern=giantPattern(0,{x:0,z:0});Object.assign(g.dice.giant,{state:'attack',t:0,slot:0,hazards:pattern.hazards,duration:pattern.duration});g.player.x=-20;g.player.z=0;
 const hp=g.player.hp;advance(g,1);assert.equal(g.player.hp,hp);g.player.invuln=1;advance(g,.2);assert.equal(g.player.hp,hp);
 g.dice.stun=1;const t=g.dice.giant.t;advance(g,.3);assert.equal(g.dice.giant.t,t);
});
test('unprotected impacts hurt once; death cancels all hazards and retry gets a fresh phase-one game',()=>{
 const g=ready(),pattern=giantPattern(2,{x:0,z:0});Object.assign(g.dice.giant,{state:'attack',t:0,slot:2,hazards:pattern.hazards,duration:pattern.duration});g.player.x=g.player.z=0;const hp=g.player.hp;
 // Thrown dice warnings were lengthened, so advance through the actual live
 // hazard window instead of assuming the pre-balance 1.5-second impact.
 advance(g,pattern.hazards[0].start+pattern.hazards[0].warn+.12);
 assert.ok(g.player.hp<hp);const after=g.player.hp;advance(g,.05);assert.equal(g.player.hp,after);
 damageDice(g,99999);assert.equal(g.status,'won');assert.deepEqual(giantHazards(g),[]);assert.equal(g.dice.giant.state,'dead');assert.equal(g.events.filter(e=>e.type==='victory').length,1);
 const fresh=createDicePlayerGame();assert.equal(fresh.boss.phase,1);assert.equal(fresh.dice.giant,undefined);assert.equal(fresh.boss.hp,fresh.boss.maxHp);
});
test('the dropped head starts from its actual defeated position and settles on the table',()=>{
 const g=ready();g.dice.giant.state='recovery';g.dice.giant.t=1;advance(g,.02);const from={...g.dice.pose};damageDice(g,99999);
 const start=giantHeadPose(g);assert.equal(start.y,from.y);assert.equal(start.z,from.z);
 g.dice.giant.deathVisual=4;const end=giantHeadPose(g);assert.ok(Math.abs(end.y-6)<1e-8);assert.ok(end.rotation.every((v,i)=>Math.abs(v-(i===3?1:0))<1e-8));
});
