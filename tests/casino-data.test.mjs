import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_BOARD,DICE_RULES as R} from '../src/dice-data.mjs';
import {CASINO_COLORS as C,boardHalf,feltIndex,gridLines,chipStacks,pillars} from '../src/casino-data.mjs';

test('the grid has one line per cell edge in both directions and stays on the board',()=>{
 const pts=gridLines(),h=boardHalf()+R.edge/2;
 assert.equal(pts.length,(R.side+1)*2*2*6);
 for(const v of pts)assert.ok(Number.isFinite(v));
 for(let i=0;i<pts.length;i+=3){assert.equal(pts[i+1],0);assert.ok(Math.abs(pts[i])<=h+1e-9&&Math.abs(pts[i+2])<=h+1e-9);}
 const xs=new Set();for(let i=0;i<pts.length;i+=3)xs.add(Math.round(pts[i]));
 for(const t of DICE_BOARD)assert.ok(!xs.has(Math.round(t.x)),'a cell centre must not lie on a grid line');
});

test('felt colours alternate like a checkerboard',()=>{
 assert.notEqual(feltIndex(0,0),feltIndex(0,1));
 assert.notEqual(feltIndex(0,0),feltIndex(1,0));
 assert.equal(feltIndex(0,0),feltIndex(1,1));
 assert.equal(C.felt.length,2);
});

test('chip stacks and pillars never overlap the playable board',()=>{
 const edge=boardHalf()+R.tileWidth/2;
 for(const c of chipStacks()){assert.ok(Math.max(Math.abs(c.x),Math.abs(c.z))>=edge+9,'chip too close');assert.ok(c.height>=3&&c.height<=9);assert.ok(c.color>=0&&c.color<C.chips.length);}
 for(const p of pillars()){assert.ok(Math.max(Math.abs(p.x),Math.abs(p.z))>=edge+35,'pillar too close');assert.ok(Number.isFinite(p.height));}
});

test('layouts are deterministic and counts are respected',()=>{
 assert.deepEqual(chipStacks(),chipStacks());
 assert.notDeepEqual(chipStacks(28,1),chipStacks(28,2));
 assert.equal(chipStacks(16).length,16);
 assert.equal(pillars(8).length,8);
 assert.equal(pillars().length,12);
 for(const c of [...chipStacks(),...pillars()]){assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.z));}
});

test('the palette is made of distinct colour integers',()=>{
 const all=[...C.felt,C.rim,C.gold,C.floor,...C.neon,C.sky,C.fog];
 for(const v of [...all,...C.chips])assert.ok(Number.isInteger(v)&&v>=0&&v<=0xffffff);
 assert.equal(new Set(C.chips).size,C.chips.length);
 assert.notEqual(C.neon[0],C.neon[1]);
});
