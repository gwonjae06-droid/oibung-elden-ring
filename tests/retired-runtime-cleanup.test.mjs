import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('current dice battle does not construct the old extra-WebGL cutscene',()=>{
 assert.doesNotMatch(read('src/dice-battle.mjs'),/playDiceEntrance|diceEntrancePose|diceEntranceRoll/);
 assert.match(read('src/journey-transition.mjs'),/playDiceCrushEntrance/);
 assert.match(read('src/dice-data.mjs'),/export function diceEntrancePose/);
});
test('inactive portrait and chain effects are never allocated in live dice board',()=>{
 const source=read('src/dice-actor.mjs');
 assert.doesNotMatch(source,/buildGroundSpikeVisuals|groundSpikes\.update/);
 assert.match(source,/buildDiceBoard\(scene\)/);
});
test('clown entrance is standalone and does not import retired transition installer',()=>{
 assert.match(read('src/journey-transition.mjs'),/import\('\.\/clown-entrance\.mjs'\)/);
 assert.doesNotMatch(read('src/clown-entrance.mjs'),/installBossTransition/);
});
