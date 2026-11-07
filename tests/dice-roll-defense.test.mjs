import test from 'node:test';
import assert from 'node:assert/strict';
import {createDicePlayerGame,actDice,stepDicePlayer} from '../src/dice-player.mjs';
import {diceInvulnerable} from '../src/dice-defense.mjs';
import {DICE_PATTERNS} from '../src/dice-combat.mjs';
import {playerIncomingDamage} from '../src/weapon-stats.mjs';
function game(weapon='sword'){const g=createDicePlayerGame(weapon);Object.assign(g.player,{x:10,z:0});g.dice.state='recovery';g.dice.t=0;return g;}
function advance(g,time){for(let left=time;left>1e-9&&g.status==='playing';){const h=Math.min(.01,left);stepDicePlayer(g,h);left-=h;}}
function roll(g,time){assert.equal(actDice(g,'roll',{x:1,z:0}),true);advance(g,time);}
function land(g){Object.assign(g.dice,{state:'jump',t:1.599,from:{x:0,z:0},to:{x:0,z:0,index:60}});}
test('actual roll input and player stepping enter protection for all four weapons',()=>{for(const weapon of ['sword','hammer','bow','cards']){const g=game(weapon);roll(g,.1);assert.equal(diceInvulnerable(g.player),true);assert.equal(g.player.invuln,0);assert.equal(g.player.stamina,78.7);}});
test('shared roll window has exact start/end boundaries',()=>{const g=game();assert.equal(actDice(g,'roll'),true);for(const [time,expected]of [[.074999,false],[.075,true],[.35,true],[.350001,false]]){g.player.action.t=time;assert.equal(diceInvulnerable(g.player),expected);}});
for(const [time,damage]of [[.04,44],[.1,0],[.4,44]])test('stomp outside body after actual roll at '+time+' seconds',()=>{const g=game();roll(g,time);land(g);stepDicePlayer(g,.01);assert.equal(g.player.hp,g.player.maxHp-(damage===44?playerIncomingDamage(g,damage):damage));assert.ok(g.events.some(e=>e.type==='dice-stomp'));});
test('charge is not a rolling crush and obeys roll immunity',()=>{
 const g=game();roll(g,.1);assert.equal(diceInvulnerable(g.player),true);g.player.invuln=1;
 const point={x:g.player.x,z:g.player.z,index:60};
 Object.assign(g.dice,{state:'charge',t:0,from:point,to:point,pose:{...g.dice.pose,x:point.x,z:point.z}});
 stepDicePlayer(g,.01);
 assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp);
 assert.equal(g.events.filter(e=>e.type==='player-crushed').length,0);
});
test('deep descending roll contact still crushes during roll protection',()=>{const g=game();roll(g,.1);g.player.invuln=1;Object.assign(g.player,{x:12,z:0});Object.assign(g.dice,{state:'rolling',t:.63,from:{x:0,z:0,index:60},to:{x:12,z:0,index:61},base:[0,0,0,1],rollTime:.7});stepDicePlayer(g,.01);assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp-playerIncomingDamage(g,DICE_PATTERNS.stompDamage));assert.ok(g.player.traits.crush>0);});
test('warned landing obeys active dodge invulnerability',()=>{
 const g=game();roll(g,.1);Object.assign(g.player,{x:0,z:0});land(g);stepDicePlayer(g,.01);
 assert.equal(g.status,'playing');assert.equal(g.player.hp,g.player.maxHp);
 assert.equal(g.player.traits?.crush||0,0);
});

test('roll immunity cannot accidentally activate a removed attack slot',()=>{const g=game();roll(g,.1);assert.equal('facePattern' in g.dice,false);assert.equal('groundSpikes' in g.dice,false);});
