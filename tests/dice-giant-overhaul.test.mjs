import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POSSESSION,cinematicBeat,spinPose,possessionPose,possessionScale} from '../src/dice-giant-cinematic-data.mjs';
import {createDicePlayerGame,stepDicePlayer} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {HAND_REST,giantHandPose,giantPattern,giantHeadPose,giantHeadExposed,giantHazards,hazardContains,skipGiant} from '../src/dice-giant.mjs';
import {giantImpact} from '../src/dice-giant-hit.mjs';

const from={x:20,y:6,z:20,rotation:[0,0,0,1]};
test('the cinematic reserves exactly three seconds for accelerating spin and seven seconds in total',()=>{
 assert.equal(POSSESSION.spinEnd-POSSESSION.still,3);
 assert.equal(POSSESSION.end,7);
 assert.deepEqual([0,.7,3.62,3.95,4.8,6.2,7].map(cinematicBeat),['still','spin','launch','possess','rise','reveal','complete']);
});
test('the 3D dice orbit, launch, and final enlarged head stay finite and continuous at the launch boundary',()=>{
 for(let t=0;t<=7;t+=.01){const p=possessionPose(from,t);assert.ok([p.x,p.y,p.z,...p.rotation].every(Number.isFinite),t);assert.ok(Math.abs(Math.hypot(...p.rotation)-1)<1e-6,t);}
 const a=spinPose(from,3.6),b=possessionPose(from,3.6),c=possessionPose(from,3.85);
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-7);
 assert.ok(Math.abs(c.x)<1e-7&&Math.abs(c.z+106)<1e-7);
 assert.equal(possessionScale(0),1);assert.equal(possessionScale(7),1.4);
});
test('the hands rest at playable board edges and the hitboxes share the visual poses',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 assert.equal(g.dice.giant.state,'recovery');
 for(let i=0;i<2;i++){
  const h=giantHandPose(g,i);
  assert.ok(Math.abs(h.x)>=60,'edge hand '+i);
  assert.ok(Math.abs(h.z)<=40);
  const hit=giantImpact(g,{x:h.x,y:h.y,z:h.z+13},{x:h.x,y:h.y,z:h.z+8});
  assert.equal(hit?.part,'hand');assert.equal(hit?.index,i);
 }
 assert.equal(HAND_REST.length,2);
});
test('rage begins once below 27.5% maximum HP without adding a third battle phase',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 damageDice(g,676);stepDicePlayer(g,.02);
 assert.equal(g.boss.phase,2);assert.equal(g.dice.giant.temperament,'feral');
 assert.equal(g.dice.giant.rageTriggered,true);
 assert.equal(g.events.filter(x=>x.type==='dice-giant-feral').length,1);
 for(let i=0;i<30;i++)stepDicePlayer(g,.02);
 assert.equal(g.events.filter(x=>x.type==='dice-giant-feral').length,1);
});
test('feral head slam physically lowers the same dice model used for combat',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const p=giantPattern(2,{x:10,z:20},'feral'),s=g.dice.giant;
 Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:0,hazards:p.hazards,duration:p.duration});
 const up=giantHeadPose(g);s.t=1.5;const down=giantHeadPose(g);
 assert.ok(down.y<up.y-20);assert.ok(Math.abs(down.x-10)<1);
 assert.ok(giantHazards(g).some(h=>h.live&&hazardContains(h,{x:10,z:20})));
});
test('all seven feral patterns have a readable safe location during each damage beat',()=>{
 for(let slot=0;slot<7;slot++){
  const p=giantPattern(slot,{x:10,z:15},'feral'),g=createDicePlayerGame();
  g.dice.giant={state:'attack',temperament:'feral',slot,t:0,hazards:p.hazards};
  for(let t=0;t<p.duration;t+=.15){
   g.dice.giant.t=t;const active=giantHazards(g).filter(h=>h.live);
   let safe=false;
   for(let x=-54;x<=54&&!safe;x+=9)for(let z=-54;z<=54;z+=9)if(active.every(h=>!hazardContains(h,{x,z}))){safe=true;break;}
   assert.ok(safe,'feral slot '+slot+' at '+t);
  }
 }
});
test('casino scene has fleeing guests and reactive chips, coins, dice and chess props',()=>{
 const room=readFileSync(new URL('../src/casino-room.mjs',import.meta.url),'utf8');
 const view=readFileSync(new URL('../src/dice-giant-view.mjs',import.meta.url),'utf8');
 assert.match(room,/fleeStart/);assert.match(room,/chandeliers/);
 for(const kind of ['chip','coin','chess','dice'])assert.ok(view.includes(kind));
});

test('coin face alternates deterministically and chooses different readable attacks',()=>{
 const heads=giantPattern(3,{x:0,z:0}),tails=giantPattern(10,{x:0,z:0});
 assert.equal(heads.coinFace,'heads');assert.equal(tails.coinFace,'tails');
 assert.match(heads.name,/앞면/);assert.match(tails.name,/뒷면/);
 assert.notDeepEqual(heads.hazards.map(h=>h.shape),tails.hazards.map(h=>h.shape));
});
test('rook, bishop and knight chess patterns use distinct travel geometries',()=>{
 const rook=giantPattern(4,{x:0,z:0}),bishop=giantPattern(11,{x:0,z:0}),knight=giantPattern(18,{x:0,z:0});
 assert.equal(rook.chessPiece,'rook');assert.equal(bishop.chessPiece,'bishop');assert.equal(knight.chessPiece,'knight');
 assert.ok(rook.hazards.every(h=>h.shape==='rect'));
 assert.ok(bishop.hazards.every(h=>h.shape==='rotated-rect'));
 assert.ok(knight.hazards.every(h=>h.shape==='circle'));
 const h=bishop.hazards[0];
 assert.equal(hazardContains(h,{x:h.x+20,z:h.z-20}),true);
 assert.equal(hazardContains(h,{x:h.x+20,z:h.z+20}),false);
});
test('low-health feral dice head slams repeat up to three times and can be counterattacked',()=>{
 const player={x:10,z:20};
 assert.equal(giantPattern(2,player,'feral',.24).hazards.filter(h=>h.headSlam).length,1);
 assert.equal(giantPattern(2,player,'feral',.17).hazards.filter(h=>h.headSlam).length,2);
 assert.equal(giantPattern(2,player,'feral',.1).hazards.filter(h=>h.headSlam).length,3);
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const pattern=giantPattern(2,player,'feral',.24);
 Object.assign(g.dice.giant,{state:'attack',temperament:'feral',slot:2,t:1.5,hazards:pattern.hazards,duration:pattern.duration});
 g.dice.pose=giantHeadPose(g);
 assert.equal(giantHeadExposed(g),true);
 const hit=giantImpact(g,{x:player.x,y:1.2,z:player.z+17},{x:player.x,y:1.2,z:player.z+1});
 assert.equal(hit?.part,'head');
});
