import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecoverySfx} from '../src/recovery-sfx.mjs';
import {createPlayerHitFeedback,PLAYER_HIT_MP3_URL} from '../src/player-hit-feedback.mjs';
import {createDicePlayerGame,diceFaceDamageable} from '../src/dice-player.mjs';
import {damageDice} from '../src/dice-combat.mjs';
import {giantPattern,giantHeadPose,giantHeadExposed,giantHazards,skipGiant,GIANT} from '../src/dice-giant.mjs';
import {readFileSync} from 'node:fs';

test('native heal MP3 plays without an AudioContext for potions and lifesteal, even after reset',async()=>{
 const sounds=[];
 class AudioClip{
  constructor(src){this.src=src;this.volume=1;this.currentTime=0;sounds.push(this);}
  play(){this.played=(this.played||0)+1;return Promise.resolve();}
  pause(){}
  load(){}removeAttribute(){}
 }
 const s=createRecoverySfx({AudioClass:AudioClip,random:()=>0,now:()=>1234,coarse:()=>false,muted:()=>false,schedule:()=>({unref(){}}),cancel:()=>{}});
 assert.equal(s.event({type:'healed'}),false,'completion must never play twice');
 assert.equal(s.event({type:'heal-start'}),true);
 assert.ok(sounds.some(a=>a.src.endsWith('/assets/sfx/heal.mp3')&&a.played));
 s.clear();
 assert.equal(s.activeCount,0);
 assert.equal(s.event({type:'skill-heal',amount:25}),true);
 assert.ok(sounds.some(a=>a.played));
 s.dispose();assert.equal(s.event({type:'heal-start'}),false);
});
test('mute remains respected and a canceled potion does not produce the heal sample',()=>{
 const s=createRecoverySfx({muted:()=>true,AudioClass:class{constructor(){throw Error('mute bypass')}}});
 assert.equal(s.event({type:'heal-start'}),false);
 assert.equal(s.event({type:'healed'}),false);
 s.dispose();
});
test('feral head slam holds its head against table for 1.5 seconds',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);g.dice.giant.state='recovery';
 const s=g.dice.giant,p=giantPattern(2,{x:10,z:-42},'feral',.24),h=p.hazards[0];
 assert.equal(h.active,1.5);
 Object.assign(s,{state:'attack',temperament:'feral',slot:2,t:0,hazards:p.hazards,duration:p.duration});
 s.t=h.start+h.warn+.1;const a=giantHeadPose(g);
 s.t=h.start+h.warn+1.3;const b=giantHeadPose(g);
 assert.ok(a.y<=11&&b.y<=11,'head must stay lowered for the duration');
 assert.equal(giantHeadExposed(g),true);
 s.t=h.start+h.warn+h.active+.7;assert.ok(giantHeadPose(g).y>25,'head must withdraw after the hold');
});
test('frenzied phase 3 has one-second tremor and exactly five rapid slams with independent hit flags',()=>{
 const g=createDicePlayerGame();damageDice(g,1500);skipGiant(g);
 const s=g.dice.giant,p=giantPattern(7,{x:12,z:-43},'feral',.24);
 assert.equal(p.hazards.length,5);
 assert.ok(p.hazards.every(h=>h.headSlam&&h.rapid&&h.start>=1));
 assert.ok(p.hazards.every((h,i)=>i===0||h.start>p.hazards[i-1].start));
 assert.ok(p.duration<6,'five strikes should be a rapid barrage');
 Object.assign(s,{state:'attack',temperament:'feral',slot:7,t:.5,hazards:p.hazards,duration:p.duration});
 const before=giantHeadPose(g);s.t=.65;const after=giantHeadPose(g);
 assert.notEqual(before.x,after.x,'head should vibrate before first slam');
 s.t=p.hazards[4].start+p.hazards[4].warn+.05;
 assert.ok(giantHeadPose(g).y<=11,'fifth slam reaches the table');
 assert.equal(giantHazards(g).filter(h=>h.live).length,1);
});
test('all six cube faces become damageable only in feral phase three',()=>{
 const g=createDicePlayerGame();
 for(let face=0;face<6;face++){
  assert.equal(diceFaceDamageable(g,{face}),face===0,'phase-one armored face unexpectedly vulnerable: '+face);
 }
 const other={...g,dice:{...g.dice,giant:{temperament:'controlled'}}};
 for(let face=0;face<6;face++)assert.equal(diceFaceDamageable(other,{face}),face===0);
 other.dice.giant.temperament='feral';
 for(let face=0;face<6;face++)assert.equal(diceFaceDamageable(other,{face}),true,'phase-three face '+face+' is blocked');
});
test('damage feedback is visual immediately and hit.mp3 remains optional until uploaded',()=>{
 const layers=[];
 function layer(){
  const classes=new Set();
  return {style:{},className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},setAttribute(){},remove(){this.removed=true;},append(){},get offsetWidth(){return 20;}};
 }
 const root={ownerDocument:{createElement:()=>layer()},append(...els){layers.push(...els);},appendChild(el){layers.push(el);return el;}};
 const fx=createPlayerHitFeedback(root,{AudioClass:null});
 assert.equal(fx.hit({type:'player-hit',amount:0}),false);
 assert.equal(fx.hit({type:'player-hit',amount:32}),true);
 assert.equal(layers[1].classList.contains('active'),true);
 assert.equal(fx.hit({type:'hurt',amount:8}),true);
 assert.equal(fx.hit({type:'player-crushed'}),true);
 assert.ok(PLAYER_HIT_MP3_URL.endsWith('/assets/sfx/hit.mp3'));
 fx.clear();assert.equal(layers[1].classList.contains('active'),false);
 fx.dispose();assert.equal(layers[1].removed,true);
});
test('the casino top-right narrative panel hides during the possession cutscene',()=>{
 const ui=readFileSync(new URL('../src/dice-ui.mjs',import.meta.url),'utf8');
 const battle=readFileSync(new URL('../src/dice-battle.mjs',import.meta.url),'utf8');
 assert.ok(ui.includes("giant.state==='transition'"));
 assert.ok(battle.includes("$('giant-hud').hidden=cutscene;"));
});
