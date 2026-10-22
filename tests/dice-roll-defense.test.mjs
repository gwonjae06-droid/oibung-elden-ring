import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {diceInvulnerable} from '../src/dice-defense.mjs';
import {beginChainSweep} from '../src/dice-chain-sweep.mjs';
function game(weapon='sword'){const g=createDicePlayerGame(weapon);Object.assign(g.player,{x:10,z:0});g.dice.state='recovery';g.dice.t=0;g.dice.spikeCooldown=999;return g;}
function advance(g,time){for(let left=time;left>1e-9&&g.status==='playing';){const h=Math.min(.01,left);stepDicePlayer(g,h);left-=h;}}
function roll(g,time){assert.equal(actDice(g,'roll',{x:1,z:0}),true);advance(g,time);}
function card(g){g.dice.groundSpikes={kind:'portrait-barrage',stage:'active',t:0,tempo:1,cards:[{x:g.player.x,z:g.player.z,dx:1,dz:0,delay:0,launched:true,alive:true,age:0}]};}
function chain(g){const w=beginChainSweep(g);w.stage='active';w.t=.3;return w;}
function land(g){Object.assign(g.dice,{state:'jump',t:1.599,from:{x:0,z:0},to:{x:0,z:0,index:60}});}
test('actual roll input and player stepping enter protection for all four weapons',()=>{for(const weapon of ['sword','hammer','bow','cards']){const g=game(weapon);roll(g,.1);assert.equal(diceInvulnerable(g.player),true);assert.equal(g.player.invuln,0);assert.equal(g.player.stamina,75);}});
test('shared roll window has exact start/end boundaries',()=>{const g=game();assert.equal(actDice(g,'roll'),true);for(const [time,expected]of [[.074999,false],[.075,true],[.35,true],[.350001,false]]){g.player.action.t=time;assert.equal(diceInvulnerable(g.player),expected);}});
for(const [time,damage]of [[.04,18],[.1,0],[.4,18]])test('portrait contact after actual roll at '+time+' seconds',()=>{const g=game();roll(g,time);card(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,120-damage);assert.equal(g.dice.groundSpikes,null);});
test('dodged chain resolves once and never applies delayed damage or slow',()=>{const g=game();roll(g,.1);const w=chain(g);stepDicePlayer(g,.01);assert.equal(w.resolved,true);assert.equal(g.player.hp,120);assert.equal(g.player.slow,undefined);advance(g,.35);assert.equal(g.player.hp,120);assert.equal(g.player.slow,undefined);});
test('late chain contact damages and slows',()=>{const g=game();roll(g,.4);chain(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,98);assert.equal(g.player.slow.factor,.6);});
for(const [time,damage]of [[.04,44],[.1,0],[.4,44]])test('stomp outside body after actual roll at '+time+' seconds',()=>{const g=game();roll(g,time);land(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,120-damage);assert.ok(g.events.some(e=>e.type==='dice-stomp'));});
test('charge body crush ignores active roll and explicit invulnerability',()=>{const g=game();roll(g,.1);assert.equal(diceInvulnerable(g.player),true);g.player.invuln=1;const point={x:g.player.x,z:g.player.z,index:60};Object.assign(g.dice,{state:'charge',t:0,from:point,to:point});stepDicePlayer(g,.01);assert.equal(g.status,'lost');assert.equal(g.deathCause,'crush');assert.equal(g.player.hp,0);});
test('deep descending roll contact still crushes during roll protection',()=>{const g=game();roll(g,.1);g.player.invuln=1;Object.assign(g.player,{x:12,z:0});Object.assign(g.dice,{state:'rolling',t:.63,from:{x:0,z:0,index:60},to:{x:12,z:0,index:61},base:[0,0,0,1],rollTime:.7});stepDicePlayer(g,.01);assert.equal(g.status,'lost');assert.equal(g.deathCause,'crush');});
test('landing directly on the body footprint still kills a rolling player',()=>{const g=game();roll(g,.1);Object.assign(g.player,{x:0,z:0});land(g);stepDicePlayer(g,.01);assert.equal(g.status,'lost');assert.equal(g.deathCause,'crush');});
test('roll ends without persisting protection or fabricating an invulnerability timer',()=>{const g=game();roll(g,.54);assert.equal(g.player.action,null);assert.equal(g.player.invuln,0);assert.equal(diceInvulnerable(g.player),false);card(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,102);});
test('failed roll input does not grant protection',()=>{const g=game();g.player.stamina=24;assert.equal(actDice(g,'roll'),false);assert.equal(diceInvulnerable(g.player),false);card(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,102);});
test('explicit invulnerability still works without rolling',()=>{const g=game();g.player.invuln=.2;card(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,120);assert.equal(g.player.action,null);});
