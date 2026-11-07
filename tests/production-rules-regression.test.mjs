import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('all five boss HUDs avoid live pattern names, danger coaching and counterattack instructions',()=>{
 assert.match(src('arena.mjs'),/setText\('boss-action',''\)/);
 assert.match(src('clown-battle.mjs'),/\$\('boss-action'\)\.textContent=''/);
 for(const file of ['dice-ui.mjs','blood-ui.mjs','gyuwon-ui.mjs'])
  assert.match(src(file),/\$\('boss-action'\)\.textContent=''/,file);
 assert.doesNotMatch(src('clown-combat.mjs'),/action = PATTERNS\[c\.name\]\.name/);
});
test('blood monumental cinematic has no player-controlled skip button, key or skip API',()=>{
 const battle=src('blood-battle.mjs');
 assert.doesNotMatch(battle,/skipEpicButton|epic\.skip\(|KeyC'&&epic/);
 assert.doesNotMatch(src('blood-epic-cinematics.mjs'),/function skip\(|\bisFraming,skip,/);
 assert.doesNotMatch(src('blood-epic-script.mjs'),/skipKey/);
});
