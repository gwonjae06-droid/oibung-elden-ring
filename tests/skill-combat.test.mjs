import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,step,skillView} from '../src/combat.mjs';
import {STANDARD_COOLDOWN} from '../src/skills.mjs';
const tick=(g,t,input={})=>{for(let s=0;s<t;s+=1/120)step(g,1/120,input);};
const arena=g=>{g.boss.wait=999;g.player.x=0;g.player.z=0;g.player.yaw=Math.PI;g.boss.x=0;g.boss.z=-4;};
const swing=g=>{g.player.stamina=100;g.player.action=null;g.player.yaw=Math.PI;assert.ok(act(g,'light'));tick(g,1.2);};
test('sword skill speeds attacks up and expires after five seconds, then waits for the standard cooldown',()=>{
  const slow=createGame();arena(slow);act(slow,'light');const base=slow.player.action.total;
  const g=createGame();arena(g);assert.ok(act(g,'skill'));assert.equal(act(g,'skill'),false);act(g,'light');assert.ok(g.player.action.total<base*.6);
  tick(g,5.1);act(g,'light');assert.ok(Math.abs(g.player.action.total-base)<1e-9);assert.equal(act(g,'skill'),false);tick(g,STANDARD_COOLDOWN);g.player.action=null;assert.ok(act(g,'skill'));
});
test('hammer skill has no cooldown, needs four hitting basics, slams hard and lifesteals',()=>{
  const g=createGame('hammer');arena(g);assert.equal(act(g,'skill'),false);
  for(let i=0;i<4;i++){assert.equal(skillView(g).ready,false);swing(g);}
  assert.equal(g.player.skill.hammerHits,4);assert.equal(skillView(g).ready,true);
  g.boss.state='idle';g.boss.poise=0;const hp=g.boss.hp;g.player.maxHp=400;g.player.hp=50;assert.ok(act(g,'skill'));tick(g,1.2);
  const dealt=hp-g.boss.hp;assert.ok(dealt>114*2.9);assert.ok(Math.abs(g.player.hp-(50+dealt*.35))<1e-6);assert.equal(g.player.skill.hammerHits,0);assert.equal(act(g,'skill'),false);
});
test('hammer swings that miss do not charge the skill',()=>{const g=createGame('hammer');arena(g);g.boss.z=-20;for(let i=0;i<4;i++)swing(g);assert.equal(g.player.skill.hammerHits,0);});
test('bow stores three piercing charges, spends one each shot and refills over time',()=>{
  const g=createGame('bow');arena(g);for(let i=0;i<3;i++){g.player.action=null;assert.ok(act(g,'skill'),String(i));}assert.equal(g.player.skill.charges,0);g.player.action=null;assert.equal(act(g,'skill'),false);
  tick(g,STANDARD_COOLDOWN+.1);assert.equal(g.player.skill.charges,1);
  const n=createGame('bow');arena(n);act(n,'skill');tick(n,.3);assert.equal(n.projectiles.length,1);assert.equal(n.projectiles[0].piercing,true);
  tick(n,1.5);assert.ok(1800-n.boss.hp>68*2.9);assert.equal(n.stats.hits,1);
});
test('piercing arrow removes boss waves in its path',()=>{
  const g=createGame('bow');arena(g);g.bossShots.push({id:99,x:0,z:-1,yaw:Math.PI,speed:0,life:5,damage:30});act(g,'skill');tick(g,.45);assert.equal(g.bossShots.length,0);
});
test('card skill locks the card shown at the click time',()=>{
  for(const [wait,card] of [[0,'blue'],[.7,'red'],[1.3,'yellow']]){const g=createGame('cards');arena(g);tick(g,wait);assert.equal(skillView(g).card,card);act(g,'skill');assert.ok(g.events.some(e=>e.type==='skill-cast'&&e.flavor===card));}
});
test('blue card gives 50 percent faster movement for three seconds only',()=>{
  const run=(blue)=>{const g=createGame('cards');arena(g);g.boss.x=20;g.boss.z=-20;if(blue)act(g,'skill');const z0=g.player.z;tick(g,1,{x:0,z:-1});return Math.abs(g.player.z-z0);};
  const normal=run(false),fast=run(true);assert.ok(Math.abs(fast/normal-1.5)<.02);
  const g=createGame('cards');arena(g);g.boss.x=20;g.boss.z=-20;act(g,'skill');tick(g,3.1);const z0=g.player.z;tick(g,1,{x:0,z:-1});assert.ok(Math.abs(Math.abs(g.player.z-z0)/normal-1)<.02);
});
test('red card boosts only the next attack by 50 percent',()=>{
  const g=createGame('cards');arena(g);g.player.skill.cycle=.7;act(g,'skill');swing(g);const first=1800-g.boss.hp;g.boss.hp=1800;swing(g);const second=1800-g.boss.hp;
  assert.ok(Math.abs(first/second-1.5)<1e-9);assert.equal(g.player.skill.nextRed,false);
});
test('yellow card stuns for one second once, even with a three card volley',()=>{
  const g=createGame('cards');arena(g);g.boss.wait=0;g.player.skill.cycle=1.3;act(g,'skill');g.player.yaw=Math.PI;act(g,'light');tick(g,.45);
  assert.ok(g.boss.stun>.4&&g.boss.stun<=1);assert.equal(g.events.filter(e=>e.type==='skill-stun').length,1);
  const st=g.boss.state;tick(g,.3);assert.equal(g.boss.state,st);tick(g,1);assert.equal(g.boss.stun,0);
});
test('cards use the standard cooldown and skills are blocked during the phase cutscene',()=>{
  const g=createGame('cards');arena(g);assert.ok(act(g,'skill'));assert.equal(g.player.skill.cooldown,STANDARD_COOLDOWN);assert.equal(act(g,'skill'),false);
  const h=createGame('sword');h.boss.phase=2;h.boss.state='transition';assert.equal(act(h,'skill'),false);
});
