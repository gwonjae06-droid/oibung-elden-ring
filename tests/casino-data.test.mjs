import test from 'node:test';
import assert from 'node:assert/strict';
import {DICE_BOARD,DICE_RULES as R} from '../src/dice-data.mjs';
import {CASINO_COLORS as C,boardHalf,feltIndex,gridLines,chipStacks,pillars} from '../src/casino-data.mjs';
test('grid has 24 segments with six coordinates each',()=>{const p=gridLines(),h=boardHalf()+R.edge/2;assert.equal(p.length,(R.side+1)*2*6);for(let i=0;i<p.length;i+=3){assert.equal(p[i+1],0);assert.ok(Number.isFinite(p[i])&&Number.isFinite(p[i+2]));assert.ok(Math.abs(p[i])<=h&&Math.abs(p[i+2])<=h);}for(const t of DICE_BOARD){for(let i=0;i<p.length;i+=6){if(p[i]===p[i+3])assert.notEqual(p[i],t.x);if(p[i+2]===p[i+5])assert.notEqual(p[i+2],t.z);}}});
test('felt alternates',()=>{assert.notEqual(feltIndex(0,0),feltIndex(0,1));assert.notEqual(feltIndex(0,0),feltIndex(1,0));assert.equal(feltIndex(0,0),feltIndex(1,1));});
test('props remain outside the board and deterministic',()=>{const e=boardHalf()+R.tileWidth/2;assert.deepEqual(chipStacks(),chipStacks());assert.notDeepEqual(chipStacks(28,1),chipStacks(28,2));assert.equal(pillars().length,12);for(const p of chipStacks())assert.ok(Math.max(Math.abs(p.x),Math.abs(p.z))>=e+9);for(const p of pillars())assert.ok(Math.max(Math.abs(p.x),Math.abs(p.z))>=e+35);for(const v of C.chips)assert.ok(Number.isInteger(v));});
