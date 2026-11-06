import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GYUWON_PATTERNS} from '../src/gyuwon-data.mjs';
import {GYUWON_MOTION_STYLE} from '../src/gyuwon-motion.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('five live battle HUDs do not expose pattern names or dodge advice',()=>{
 for(const file of ['arena.mjs','clown-battle.mjs','dice-ui.mjs','blood-ui.mjs','gyuwon-ui.mjs']){
  const src=read('src/'+file);
  if(file==='arena.mjs')assert.match(src,/setText\('boss-action',''\)/,file);
  else assert.match(src,/\$\('boss-action'\)\.textContent=''/,file);
 }
 assert.match(read('spider-combat.html'),/<p id="boss-action" aria-hidden="true"><\/p>/);
});
test('player-facing cutscene skip controls and shortcuts remain absent',()=>{
 const battle=read('src/blood-battle.mjs');
 assert.doesNotMatch(battle,/skipEpicButton|epic\.skip\(/);
 assert.doesNotMatch(read('src/blood-epic-cinematics.mjs'),/\bskip,reset\b/);
 assert.doesNotMatch(read('src/dice-battle.mjs'),/skip-giant/);
 assert.doesNotMatch(read('src/blood-ui.mjs'),/skipBloodTransition|hud\.skip/);
});
test('every Gyuwon attack has distinct authored motion',()=>{
 assert.deepEqual(Object.keys(GYUWON_MOTION_STYLE).sort(),Object.keys(GYUWON_PATTERNS).sort());
});
test('five bosses record performance evidence without inventing a confirmed bottleneck',()=>{
 for(const id of ['arena','clown-battle','dice-battle','blood-battle','gyuwon-battle'])
  assert.match(read('src/'+id+'.mjs'),/createFramePerformanceAudit/);
 assert.match(read('src/runtime/performance-audit.mjs'),/confirmedCause:null/);
});

test('dice defeat results never reveal boss attack solutions or dodge instructions',()=>{
 const dice=read('src/dice-battle.mjs');
 assert.doesNotMatch(dice,/손을 부수거나 머리 박기 후|다음 칸을 보고 옆으로 피한 뒤/);
});
