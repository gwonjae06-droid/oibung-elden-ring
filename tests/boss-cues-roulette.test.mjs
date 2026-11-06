import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startPattern,step,patternConfig} from '../src/combat.mjs';
import {createDiceGame,stepDice,damageDice} from '../src/dice-combat.mjs';
import {beginDiceRoulette,rouletteFiringAngle,DICE_ROULETTE} from '../src/dice-roulette-attack.mjs';

function advance(g,seconds,input={}){for(let left=seconds;left>1e-8;){const dt=Math.min(.04,left);stepDice(g,dt,input);left-=dt;}}
function die(){
 const g=createDiceGame();g.dice.pose={x:0,y:6,z:0,rotation:[0,0,0,1],angle:0,dx:1,dz:0};
 g.dice.from={x:0,z:0,index:60};g.dice.to={x:12,z:0,index:61};g.dice.index=60;
 g.player.x=0;g.player.z=24;g.player.invuln=0;g.boss.phase=2;return g;
}
test('Kwon grave sword releases from his blade, never the pre-locked player target',()=>{
 const g=createGame('sword',{register:false});g.boss.phase=2;
 g.boss.x=0;g.boss.z=0;g.player.x=0;g.player.z=12;
 startPattern(g,'graveSword');assert.equal(g.boss.zone,null);
 g.boss.t=patternConfig(g.boss).wind;step(g,1/120);
 // Stepping away does not change the wave's physical origin.
 g.player.z=20;g.boss.t=patternConfig(g.boss).active*.38;
 step(g,1/120);
 assert.equal(g.bossShots.length,3);
 assert.ok(g.bossShots.every(s=>Math.hypot(s.x,s.z)<5&&s.minArmTime>=.3));
 assert.ok(g.bossShots.every(s=>Math.hypot(s.x-g.player.x,s.z-g.player.z)>7));
 const hp=g.player.hp;step(g,.05);assert.equal(g.player.hp,hp);
});
test('roulette displays a finite count before firing any projectile',()=>{
 const g=die();assert.equal(beginDiceRoulette(g,'count'),true);
 assert.equal(g.dice.state,'roulette-spin');assert.equal(g.dice.roulette.count,2);
 assert.equal(g.dice.rouletteShots.length,0);
 advance(g,1.2);assert.equal(g.dice.rouletteShots.length,0);
 assert.ok(g.events.some(e=>e.type==='dice-roulette-spin'&&e.count===2));
 advance(g,.8);assert.ok(g.events.some(e=>e.type==='dice-roulette-result'&&e.count===2));
 assert.ok(g.events.some(e=>e.type==='dice-roulette-release'));
 assert.ok(g.dice.rouletteShots.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.z)));
});
test('jackpot exposes a symmetric split pattern and freezes with the boss',()=>{
 const g=die();g.dice.rouletteTurn=1;beginDiceRoulette(g,'jackpot');
 const r=g.dice.roulette;assert.equal(r.count,5);
 const angles=Array.from({length:r.count},(_,i)=>rouletteFiringAngle(r,i));
 assert.ok(angles.every(Number.isFinite));assert.ok(angles[0]<r.aim&&angles.at(-1)>r.aim);
 const before=r.t;advance(g,1,{freezeBoss:true});assert.equal(r.t,before);
 advance(g,3);assert.ok(g.events.some(e=>e.type==='dice-roulette-release'&&e.kind==='jackpot'));
});
test('roulette shot is harmless while emerging beside a melee fighter',()=>{
 const g=die();g.player.z=8.1;g.player.invuln=0;
 beginDiceRoulette(g,'count');advance(g,DICE_ROULETTE.spin+.12);
 assert.equal(g.player.hp,120);advance(g,.3);
 assert.equal(g.player.hp,120,'the new shot must travel before its hitbox arms');
});
test('roulette coins are cleared on boss victory',()=>{
 const g=die();beginDiceRoulette(g,'count');advance(g,2);
 assert.ok(g.dice.rouletteShots.length>0);
 damageDice(g,3000);
 assert.equal(g.status,'won');assert.equal(g.dice.roulette,null);
 assert.equal(g.dice.rouletteShots.length,0);
});

test('grave sword at long range cannot deal target-locked or sword-segment damage before projectiles arrive',()=>{
 const g=createGame('sword',{register:false});g.boss.phase=2;
 g.boss.x=0;g.boss.z=0;g.boss.yaw=0;g.player.x=0;g.player.z=16;
 startPattern(g,'graveSword');
 assert.equal(g.boss.zone,null,'grave sword must never lock an invisible impact circle');
 const duration=patternConfig(g.boss).wind+patternConfig(g.boss).active+.4;
 for(let t=0;t<duration;t+=1/120)step(g,1/120);
 assert.equal(g.player.hp,120,'boss swing may not deal remote damage');
 assert.equal(g.bossShots.length,3,'the three visible projectiles still exist');
 for(let t=duration;t<3.36;t+=1/120)step(g,1/120);
 assert.ok(g.player.hp<120,'a visible traveling wave still causes a legitimate hit');
});
test('grave sword projectile-only behavior survives repeated casts and cannot inherit slam impact zones',()=>{
 const g=createGame('sword',{register:false});g.boss.phase=2;
 g.boss.x=0;g.boss.z=0;g.player.x=9;g.player.z=15;
 for(let i=0;i<2;i++){
  startPattern(g,'graveSword');
  assert.equal(g.boss.zone,null);
  const wind=patternConfig(g.boss).wind;
  g.boss.t=wind;step(g,1/120);
  g.boss.t=patternConfig(g.boss).active*.35;
  g.player.invuln=0;const hp=g.player.hp;
  step(g,1/120);
  assert.equal(g.player.hp,hp,'no invisible area hit during the release frame');
  g.bossShots.length=0;
 }
 startPattern(g,'slam');
 assert.ok(g.boss.zone,'the separate warned heavenly execution keeps its authored target');
});
