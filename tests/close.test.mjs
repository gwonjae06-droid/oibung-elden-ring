import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,startPattern,step,patternConfig,attackZone,inZone} from '../src/combat.mjs';
const setup=(phase=1)=>{const g=createGame();g.boss.phase=phase;g.boss.x=g.boss.z=0;g.player.x=0;g.player.z=4;g.boss.wait=99;return g;};
const tick=(g,t)=>{for(let s=0;s<t;s+=1/240)step(g,1/240);};
test('shove is harmless in both phases and gives a standalone recovery',()=>{for(const phase of[1,2]){const g=setup(phase);startPattern(g,'shove');assert.equal(patternConfig(g.boss).damage,0);tick(g,1);assert.equal(g.player.hp,120);assert.ok(g.player.z>7);assert.equal(g.player.action,null);assert.ok(g.boss.recovery>=1.2);}});
test('damage zone warns before it can hurt and shares its exact bounds with collision',()=>{const g=setup();startPattern(g,'stomp');tick(g,.5);assert.equal(g.player.hp,120);assert.ok(attackZone(g.boss).progress>0);tick(g,.4);assert.ok(g.player.hp<120);const z={shape:'circle',x:0,z:0,r:6.5};assert.equal(inZone(z,{x:6.4,z:0}),true);assert.equal(inZone(z,{x:6.6,z:0}),false);});
test('shove can be dodged without damage or forced displacement',()=>{const g=setup();startPattern(g,'shove');g.boss.state='active';g.boss.t=0;g.player.action={kind:'roll',t:.2,total:.52,yaw:0};step(g,1/240);assert.equal(g.player.hp,120);assert.ok(g.player.z<5);});
test('landing and slam use locked ground targets, removed when interrupted',()=>{const g=setup();for(const k of['leap','slam']){startPattern(g,k);const z=attackZone(g.boss);g.player.x=10;assert.equal(attackZone(g.boss).x,z.x);g.boss.state='stagger';assert.equal(attackZone(g.boss),null);}});
