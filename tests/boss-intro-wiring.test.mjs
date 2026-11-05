import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all four boss entry points start the same cinematic gate',()=>{
 for(const [boss,path] of [['kwon','src/arena.mjs'],['clown','src/clown-battle.mjs'],['dice','src/dice-battle.mjs'],['blood','src/blood-battle.mjs']]){
  const code=source(path);
  assert.match(code,new RegExp("createBossIntroGate\\(document,[^\\n]*'"+boss+"'"),boss);
  assert.match(code,/intro:introGate\.begin/,boss+' is exposed to the journey controller');
  assert.match(code,/!introGate\.blocked/,boss+' has gameplay/inputs gated');
  assert.match(code,/introGate\.cancel\(\)/,boss+' disposes the cutscene');
 }
});
test('journey waits until the modal closes, then reveals the boss without a numeric countdown',()=>{
 const journey=source('src/journey.mjs');
 assert.match(journey,/dialog\.close\(\);readBattleSession\(root\)\?\.intro\?\.\(\)/);
 assert.doesNotMatch(journey,/봉인이 풀립니다/);
 assert.equal(source('src/journey-state.mjs').includes('game.startGrace=0'),true);
});
