import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuScore} from '../src/menu-score.mjs';
test('overture waits for a gesture and stops all scheduled voices on battle entry and disposal',()=>{
 let created=0,closed=0,stopped=0,cleared=0;const intervals=[],frequencies=[];
 const param=()=>({value:0,setValueAtTime(v){assert.ok(Number.isFinite(v));},exponentialRampToValueAtTime(v){assert.ok(Number.isFinite(v)&&v>0);}});
 const node=()=>({connect(){},disconnect(){}});
 const win={AudioContext:class{constructor(){created++;this.currentTime=0;this.state='running';this.destination={};}resume(){return Promise.resolve();}close(){closed++;return Promise.resolve();}createGain(){return {...node(),gain:param()};}createDynamicsCompressor(){return node();}createBiquadFilter(){return {...node(),frequency:{value:0}};}createOscillator(){const frequency={value:0};return {...node(),frequency,start(){frequencies.push(frequency.value);},stop(){stopped++;}};}},setInterval:fn=>{intervals.push(fn);return 1;},clearInterval(){cleared++;}};
 const music=createMenuScore(win);music.update(true);assert.equal(created,0);music.unlock();intervals[0]();assert.equal(created,1);assert.ok(frequencies.length>=6);assert.ok(frequencies.every(v=>v>0&&Number.isFinite(v)));
 const before=stopped;music.update(false);assert.ok(stopped>before);music.dispose();assert.equal(closed,1);assert.equal(cleared,1);music.unlock();assert.equal(created,1);
});
