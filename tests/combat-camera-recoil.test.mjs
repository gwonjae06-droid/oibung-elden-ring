import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatImpact} from '../src/combat-impact.mjs';
const cam=(x=0,y=0,z=0)=>({position:{x,y,z},updateMatrixWorld(){}});
function setup(){const fx=createCombatImpact({boss:'kwon'}),g={weapon:'sword',boss:{x:0,z:0,hp:100,maxHp:100},player:{x:1,z:0,hp:80,maxHp:100}};fx.event({type:'player-hit',amount:20},g);return {fx,g};}
test('repeated camera draws do not accumulate recoil',()=>{const {fx}=setup(),c=cam();for(let i=0;i<20;i++)fx.camera(c);assert.ok(Math.abs(c.position.x-.44)<1e-9);fx.dispose();});
test('paused update loops hold one recoil offset',()=>{const {fx}=setup(),c=cam();for(let i=0;i<20;i++){fx.update(0,false);fx.camera(c);}assert.ok(Math.abs(c.position.x-.44)<1e-9);assert.ok(Math.abs(c.position.y-.13)<1e-9);fx.dispose();});
test('reset restores the baseline position',()=>{const {fx}=setup(),c=cam();fx.camera(c);fx.reset();assert.deepEqual(c.position,{x:0,y:0,z:0});fx.dispose();});
test('external engine position becomes the next baseline',()=>{const {fx}=setup(),c=cam();fx.camera(c);Object.assign(c.position,{x:10,y:5,z:-3});fx.camera(c);fx.reset();assert.deepEqual(c.position,{x:10,y:5,z:-3});fx.dispose();});
test('dispose restores camera position exactly once',()=>{const {fx}=setup(),c=cam(2,3,4);fx.camera(c);fx.dispose();fx.dispose();assert.deepEqual(c.position,{x:2,y:3,z:4});});
test('invalid positions are not changed into NaN',()=>{const {fx}=setup(),c=cam();c.position.x=undefined;fx.camera(c);assert.equal(c.position.x,undefined);fx.dispose();});
test('switching camera restores previous camera',()=>{const {fx}=setup(),a=cam(),b=cam(2,3,4);fx.camera(a);fx.camera(b);assert.deepEqual(a.position,{x:0,y:0,z:0});fx.dispose();assert.deepEqual(b.position,{x:2,y:3,z:4});});
test('camera presentation never mutates combat state',()=>{const {fx,g}=setup(),before=structuredClone(g),c=cam();fx.camera(c);fx.update(0,false);fx.camera(c);fx.dispose();assert.deepEqual(g,before);});
