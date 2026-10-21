import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownCollapse} from '../src/clown-collapse.mjs';
const won=()=>({status:'won',boss:{state:'dead'}});
test('victory initially holds upright then falls gradually',()=>{const c=createClownCollapse(),g=won();assert.equal(c.update(g,.05).roll,0);let p;for(let i=0;i<10;i++)p=c.update(g,.05);assert.ok(p.roll>0&&p.roll<1.35);assert.ok(p.bodyDrop>0&&p.bodyDrop<4);});
test('collapse finishes before the existing result screen delay',()=>{const c=createClownCollapse(),g=won();let p;for(let i=0;i<30;i++)p=c.update(g,.05);assert.equal(p.done,true);assert.equal(p.roll,1.35);assert.equal(p.bodyDrop,4);assert.equal(p.ballShift,3);});
test('pause and hidden tabs do not advance collapse',()=>{const c=createClownCollapse(),g=won();for(let i=0;i<100;i++){c.update(g,0);c.update(g,.05,true);}assert.equal(c.update(g,0).roll,0);});
test('retry and boss replacement clear old collapse progress',()=>{const c=createClownCollapse(),g=won();for(let i=0;i<30;i++)c.update(g,.05);g.status='playing';g.boss.state='clown';assert.equal(c.update(g,.05),null);g.status='won';g.boss.state='dead';assert.equal(c.update(g,0).fall,0);assert.equal(c.update(won(),0).fall,0);});
test('player defeat never triggers clown victory collapse',()=>{const c=createClownCollapse();assert.equal(c.update({status:'lost',boss:{state:'clown'}},.05),null);});
