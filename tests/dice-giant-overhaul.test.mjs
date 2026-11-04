import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {POSSESSION,cinematicBeat,spinPose,possessionPose,possessionScale} from '../src/dice-giant-cinematic-data.mjs';
import {createDicePlayerGame,stepDicePlayer} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {HAND_REST,GIANT,strikeGiantHand,giantHandPose,giantPattern,giantPropType,giantHeadPose,giantPosture,giantHeadExposed,giantHazards,hazardContains,skipGiant} from '../src/dice-giant.mjs';
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
 assert.equal(possessionScale(0),1);assert.ok(Math.abs(possessionScale(7)-1.4)<1e-10);
});
test('the hands rest at playable board edges and the hitboxes share the visual poses',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 assert.equal(g.dice.giant.state,'recovery');
 for(let i=0;i<2;i++){
  const h=giantHandPose(g,i);
  assert.ok(Math.abs(h.x)<30,'body-front hand '+i);
  assert.ok(h.z<=-50&&h.z>=-67,'both hands lie on the boss-facing edge');
  const hit=giantImpact(g,{x:h.x,y:h.y,z:h.z+13},{x:h.x,y:h.y,z:h.z+8});
  assert.equal(hit?.part,'hand');assert.equal(hit?.index,i);
 }
 assert.equal(HAND_REST.length,2);
});
test('rage begins exactly at 1000 HP, turning the battle into phase three once',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDicePlayer(g,.02);
 damageDice(g,999);stepDicePlayer(g,.02);
 assert.equal(g.boss.phase,2);assert.equal(g.dice.giant.temperament,'controlled');
 damageDice(g,1);stepDicePlayer(g,.02);
 assert.equal(g.boss.phase,3);assert.equal(g.dice.giant.temperament,'feral');
 assert.equal(g.dice.giant.rageTriggered,true);
 for(let i=0;i<30;i++)stepDicePlayer(g,.02);
 assert.equal(g.events.filter(x=>x.type==='dice-giant-feral').length,1);
});
test('feral head slam physically lowers the same dice model used for combat',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const p=giantPattern(2,{x:10,z:20},'feral'),s=g.dice.giant;
 Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:0,hazards:p.hazards,duration:p.duration});
 const up=giantHeadPose(g);s.t=1.5;const down=giantHeadPose(g);
 assert.ok(down.y<up.y-20);assert.ok(Math.abs(down.x-10)<1);
 assert.ok(giantHazards(g).some(h=>h.live&&hazardContains(h,{x:p.hazards[0].x,z:p.hazards[0].z})));
});
test('feral head slam rears up slowly and then drops within a fifth of a second',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const p=giantPattern(2,{x:10,z:20},'feral',.24),s=g.dice.giant,h=p.hazards[0];
 Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:0,hazards:p.hazards,duration:p.duration});
 s.t=h.warn-.2;const raised=giantHeadPose(g);s.t=h.warn+.02;const slammed=giantHeadPose(g);
 assert.ok(raised.y>20,'head is still raised 0.2s before impact');
 assert.ok(slammed.y<8,'head is on the table right after impact');
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
 const heads=giantPattern(3,{x:0,z:0}),tails=giantPattern(3+9,{x:0,z:0});
 assert.equal(heads.coinFace,'heads');assert.equal(tails.coinFace,'tails');
 assert.match(heads.name,/앞면/);assert.match(tails.name,/뒷면/);
 assert.notDeepEqual(heads.hazards.map(h=>h.shape),tails.hazards.map(h=>h.shape));
});
test('rook, bishop and knight chess patterns use distinct travel geometries',()=>{
 const rook=giantPattern(4,{x:0,z:0}),bishop=giantPattern(4+9,{x:0,z:0}),knight=giantPattern(4+18,{x:0,z:0});
 assert.equal(rook.chessPiece,'rook');assert.equal(bishop.chessPiece,'bishop');assert.equal(knight.chessPiece,'knight');
 assert.ok(rook.hazards.every(h=>h.shape==='rect'));
 assert.ok(bishop.hazards.every(h=>h.shape==='rotated-rect'));
 assert.ok(knight.hazards.every(h=>h.shape==='circle'));
 const h=bishop.hazards[0];
 assert.equal(hazardContains(h,{x:h.x+20,z:h.z-20}),true);
 assert.equal(hazardContains(h,{x:h.x+20,z:h.z+20}),false);
});
test('feral head slams chain two to four times by health and can be counterattacked',()=>{
 const player={x:10,z:20};
 assert.equal(giantPattern(2,player,'feral',.24).hazards.filter(h=>h.headSlam).length,2);
 assert.equal(giantPattern(2,player,'feral',.17).hazards.filter(h=>h.headSlam).length,3);
 assert.equal(giantPattern(2,player,'feral',.1).hazards.filter(h=>h.headSlam).length,4);
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const pattern=giantPattern(2,player,'feral',.24);
 Object.assign(g.dice.giant,{state:'attack',temperament:'feral',slot:2,t:1.5,hazards:pattern.hazards,duration:pattern.duration});
 g.dice.pose=giantHeadPose(g);
 assert.equal(giantHeadExposed(g),true);
 const h=pattern.hazards[0];const hit=giantImpact(g,{x:h.x,y:1.2,z:h.z+17},{x:h.x,y:1.2,z:h.z+1});
 assert.equal(hit?.part,'head');
});

test('in-place possession trembles and grows before firing toward the patron',()=>{
 const stationary=spinPose(from,3.5);
 assert.ok(Math.abs(stationary.x-from.x)<2,'spin should not orbit across the arena');
 assert.ok(Math.abs(stationary.z-from.z)<2);
 assert.ok(possessionScale(3.59)>1.30);
 const launch=possessionPose(from,3.8);
 assert.ok(launch.z<from.z-20,'shoots toward the back patron');
});
test('torso accompanies the head during the slump instead of extending the neck',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);
 const p=giantPattern(2,{x:10,z:15},'feral'),s=g.dice.giant;
 Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:1.5,hazards:p.hazards,duration:p.duration});
 const posture=giantPosture(g),head=giantHeadPose(g);
 assert.ok(posture.lean>.9,'torso must lean into the blow');
 assert.ok(head.y<11&&head.z>-56&&head.z<-30,'head reaches reachable table edge');
 assert.ok(Math.abs(posture.bodyX-head.x)<12,'shoulders follow the head');
});
test('broken hands stop their own attacks for eight seconds without forcing the feral phase',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDicePlayer(g,.02);
 g.player.invuln=999;g.player.hp=g.player.maxHp=5000;
 const s=g.dice.giant,before=s.hands[0],bossBefore=g.boss.hp;
 assert.equal(giantImpact(g,{x:-22,y:2,z:-51},{x:-22,y:2,z:-60})?.part,'hand');
 const dealt=strikeGiantHand(g,0,before+20);damageDice(g,dealt);
 assert.equal(dealt,before);assert.equal(g.boss.hp,bossBefore-before);
 assert.equal(s.hands[0],0);assert.equal(s.destroyed[0],true);
 assert.equal(s.state,'recovery','no stagger state');
 assert.equal(giantImpact(g,{x:-22,y:2,z:-51},{x:-22,y:2,z:-60}),null);
 assert.equal(strikeGiantHand(g,0,100),0,'cannot hit a vanished hand');
 strikeGiantHand(g,1,s.hands[1]);
 assert.deepEqual(s.destroyed,[true,true]);
 stepDicePlayer(g,.02);
 assert.equal(s.temperament,'controlled');assert.equal(g.boss.phase,2);
 for(let i=0;i<970;i++)stepDicePlayer(g,1/120);
 assert.deepEqual(s.destroyed,[false,false]);
 assert.equal(s.hands[0],GIANT.handHp);
 assert.equal(g.boss.phase,2,'hand recovery cannot heal the boss or skip a phase');
});
test('disabled hands cannot produce warnings or hitboxes even if a pattern is in progress',()=>{
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDicePlayer(g,.02);
 const s=g.dice.giant,p=giantPattern(7,{x:0,z:0});
 s.hands=[0,0];s.destroyed=[true,true];s.disabledFor=[8,8];
 Object.assign(s,{state:'attack',temperament:'controlled',slot:7,t:1.4,hazards:p.hazards,duration:p.duration});
 assert.deepEqual(giantHazards(g),[]);
 assert.equal(giantImpact(g,{x:-22,y:2,z:-51},{x:-22,y:2,z:-60}),null);
});
test('controlled phase two flicks chips, dice, coins and chess pieces from hands held in front of the body',()=>{
 const kinds={1:'chip',2:'dice',3:'coin',4:'chess'};
 for(const [slot,kind] of Object.entries(kinds)){
  const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);stepDicePlayer(g,.02);g.player.hp=g.player.maxHp=9999;
  const s=g.dice.giant,p=giantPattern(Number(slot),{x:0,z:0});
  Object.assign(s,{state:'attack',temperament:'controlled',slot:Number(slot),t:0,hazards:p.hazards,duration:p.duration});
  assert.ok(p.hazards.every(h=>giantPropType(s,h)===kind),'prop type for slot '+slot);
  for(let n=0;n<Math.ceil(p.duration*60)&&s.state==='attack';n++){
   stepDicePlayer(g,1/60);
   for(const i of [0,1]){const h=giantHandPose(g,i);assert.ok(Math.abs(h.x)<36&&h.z<-52,'hand stays in front of the body during slot '+slot);}
  }
 }
});
test('hand health bars float above the hands, there is no stagger state, and only the hand crumbles',()=>{
 const view=readFileSync(new URL('../src/dice-giant-view.mjs',import.meta.url),'utf8');
 const sim=readFileSync(new URL('../src/dice-giant.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/dice-ui.mjs',import.meta.url),'utf8');
 assert.match(view,/bars\.forEach/);assert.match(view,/pose\.y\+11/);assert.match(view,/crumble/);
 assert.doesNotMatch(sim,/wounded/);assert.doesNotMatch(ui,/wounded/);assert.doesNotMatch(ui,/giant-poise/);
});
test('cinematic includes missing patron head and white spray while phase two remains dark',()=>{
 const room=readFileSync(new URL('../src/casino-room.mjs',import.meta.url),'utf8');
 const view=readFileSync(new URL('../src/dice-giant-view.mjs',import.meta.url),'utf8');
 const dread=readFileSync(new URL('../src/dice-dread-audio.mjs',import.meta.url),'utf8');
 assert.match(room,/p\.head\.visible=!?\(/);
 assert.match(view,/sprayAge/);assert.match(view,/0xf8f2e5/);
 assert.match(dread,/lowpass/);assert.match(dread,/setTargetAtTime/);
});
