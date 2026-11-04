import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatImpact,hitstopSeconds,IMPACT_FEEL} from '../src/combat-impact.mjs';
import {createBossCues,BOSS_DIE_MAX_MS} from '../src/boss-cues.mjs';

const game=(hp=100)=>({weapon:'sword',status:'playing',time:5,boss:{x:0,z:0,hp,maxHp:300,phase:1},player:{x:0,z:5,hp:75,maxHp:100,stamina:50,invuln:0},events:[]});
const model=()=>({position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0},scale:{x:1,y:1,z:1}});

test('distinct four-boss recoil profiles are finite and tailored to body mass',()=>{
 assert.deepEqual(Object.keys(IMPACT_FEEL),['kwon','clown','dice','blood']);
 assert.ok(IMPACT_FEEL.clown.squash>IMPACT_FEEL.dice.squash);
 assert.ok(IMPACT_FEEL.dice.recoil<IMPACT_FEEL.blood.recoil);
 assert.ok(hitstopSeconds(250,true)>hitstopSeconds(20,false));
});
test('hit response adds rendering-only recoil, never changes damage, hitbox or game clocks',()=>{
 for(const boss of ['kwon','clown','dice','blood']){
  const g=game(),before=JSON.stringify(g),fx=createCombatImpact({boss});
  assert.equal(fx.event({type:'boss-hit',amount:40},g),true);
  assert.equal(JSON.stringify(g),before);
  const m=model();fx.update(.016);fx.bossPose(m);
  assert.ok(m.position.z<0,boss+' boss recoils away from attacker');
  assert.ok(m.scale.y<1);
  const cam=model();fx.camera(cam);assert.ok(Number.isFinite(cam.position.y));
  fx.dispose();
 }
});
test('player hits and crushes trigger player recoil, ignored events do not',()=>{
 const g=game(),fx=createCombatImpact({boss:'dice'}),p=model();
 assert.equal(fx.event({type:'swing'},g),false);
 assert.equal(fx.event({type:'player-hit',amount:0},g),false);
 g.player.hp=40;assert.equal(fx.event({type:'player-hit',amount:35},g),true);
 fx.update(.03);fx.playerPose(p);assert.ok(p.position.z>0);
 assert.ok(fx.trails.player.value>=fx.trails.player.current);
 assert.equal(fx.event({type:'player-crushed'},g),true);
 fx.reset();assert.equal(fx.frozen,false);assert.equal(fx.trails.player.value,null);
 fx.dispose();
});
test('impact timers pause safely and hitstop durations are presentation-only',()=>{
 const g=game(),fx=createCombatImpact({boss:'clown'});
 fx.event({type:'boss-hit',amount:130,big:true},g);
 assert.equal(fx.frozen,true);
 fx.update(.05,false);assert.equal(fx.frozen,true);
 fx.update(.08,true);assert.equal(fx.frozen,false);
 fx.dispose();
 assert.equal(fx.event({type:'boss-hit',amount:25},g),false);
});
class Clip{
 static all=[];
 constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.volume=0;Clip.all.push(this);}
 play(){this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}removeAttribute(){}load(){}
}
test('bossdie never plays longer than 3 seconds and reset cancels its deadline',()=>{
 Clip.all=[];let clock=null,canceled=[];
 const cues=createBossCues({AudioClass:Clip,storage:{getItem:()=>null},schedule:cb=>(clock=cb,9),cancel:id=>canceled.push(id)});
 assert.equal(BOSS_DIE_MAX_MS,3000);
 cues.play('die');let audio=Clip.all.at(-1);assert.equal(audio.paused,false);
 assert.equal(typeof audio.ontimeupdate,'function');
 audio.currentTime=3;audio.ontimeupdate();assert.equal(audio.paused,true);
 assert.ok(canceled.includes(9));
 cues.play('die');assert.equal(audio.paused,false);
 clock();assert.equal(audio.paused,true);
 cues.play('die');cues.dispose();assert.equal(audio.paused,true);
});
