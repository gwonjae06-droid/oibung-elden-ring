import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame} from '../src/dice-player.mjs';
import {damageDice,stepDice} from '../src/dice-combat.mjs';
import {giantPattern,giantPosture,skipGiant} from '../src/dice-giant.mjs';
import {createDiceSlamFeedback} from '../src/dice-slam-feedback.mjs';
function readyThird(){
 const g=createDicePlayerGame();damageDice(g,1000);skipGiant(g);stepDice(g,1/120);
 damageDice(g,1000);g.player.hp=g.player.maxHp=5000;g.player.invuln=999;
 const s=g.dice.giant,p=giantPattern(2,{x:0,z:-42},'feral',1/3);
 Object.assign(s,{state:'attack',t:0,slot:2,hazards:p.hazards,duration:p.duration});
 g.events.length=0;return {g,s,p};
}
test('head impact event happens once at the real warning boundary',()=>{
 const {g,s,p}=readyThird(),h=p.hazards[0],when=h.start+h.warn;
 for(let n=0;n<Math.floor((when-.03)*120);n++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-head-impact').length,0);
 for(let n=0;n<12;n++)stepDice(g,1/120);
 const hits=g.events.filter(e=>e.type==='dice-giant-head-impact');
 assert.equal(hits.length,1);assert.equal(hits[0].x,h.x);assert.equal(hits[0].z,h.z);
 for(let n=0;n<100;n++)stepDice(g,1/120);
 assert.equal(g.events.filter(e=>e.type==='dice-giant-head-impact').length,1);
 assert.equal(s.hazards[0].impactAnnounced,true);
});
test('chest braces and then moves its weight into the head strike',()=>{
 const {g,s,p}=readyThird(),h=p.hazards[0];
 s.t=h.start+h.warn-.2;const raised=giantPosture(g);
 s.t=h.start+h.warn+.06;const landed=giantPosture(g);
 assert.ok(raised.weight>0);assert.ok(landed.weight>raised.weight);
 assert.ok(landed.lean>raised.lean);assert.ok(landed.head.y<raised.head.y);
});
test('camera impulse, brief hit-stop and reset form a single finite response',()=>{
 const beat=createDiceSlamFeedback(),camera={position:{x:0,y:20,z:0}},target={y:8};
 assert.equal(beat.event({type:'unknown'}),false);
 assert.equal(beat.event({type:'dice-giant-head-impact',x:10}),true);
 assert.ok(beat.hold>=.06);assert.equal(beat.tick(1/60),0);
 assert.equal(beat.apply(camera,target),true);
 assert.notEqual(camera.position.y,20);assert.ok(target.y<8);
 let resumed=false;for(let i=0;i<12;i++)if(beat.tick(1/60)>0)resumed=true;
 assert.ok(resumed);assert.equal(beat.hold,0);
 beat.reset();assert.equal(beat.energy,0);assert.equal(beat.apply(camera,target),false);
});
test('motion reduction removes forced camera motion and gameplay pause',()=>{
 const beat=createDiceSlamFeedback({reduced:true}),camera={position:{x:0,y:20,z:0}},target={y:8};
 beat.event({type:'dice-giant-head-impact',rapid:true});
 assert.equal(beat.tick(1/60),1/60);assert.equal(beat.apply(camera,target),false);
 assert.equal(camera.position.y,20);assert.equal(target.y,8);
});
test('paused scene does not spend its pending impact beat',()=>{
 const beat=createDiceSlamFeedback();beat.event({type:'dice-giant-head-impact'});
 const h=beat.hold;beat.tick(.3,false);assert.equal(beat.hold,h);
});
