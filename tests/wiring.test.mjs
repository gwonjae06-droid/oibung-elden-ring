import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(join(root,f),'utf8');
const html=read('spider-combat.html'),arena=read('src/arena.mjs');
test('page loads an arena module that exists',()=>{
  const m=html.match(/import\('(\.\/[^']+)'\)/);
  assert.ok(m,'spider-combat.html must import a game module');
  assert.ok(existsSync(join(root,m[1])),m[1]+' is missing');
});
test('every element id used by arena.mjs exists in spider-combat.html',()=>{
  const ids=new Set([...arena.matchAll(/(?:\$|setText|setBar)\('([\w-]+)'/g)].map(m=>m[1]));
  assert.ok(ids.size>25);
  const missing=[...ids].filter(id=>!html.includes('id="'+id+'"'));
  assert.deepEqual(missing,[]);
});
test('arena.mjs only imports three, the combat module and the audio module',()=>{
  const specs=[...arena.matchAll(/from '([^']+)'/g)].map(m=>m[1]).sort();
  assert.deepEqual(specs,['./audio.mjs','./combat.mjs','three']);
  assert.ok(existsSync(join(root,'src/combat.mjs')));
  assert.ok(existsSync(join(root,'src/audio.mjs')));
});
test('imported combat names are exported by combat.mjs',()=>{
  const names=arena.match(/import \{([^}]+)\} from '\.\/combat\.mjs'/)[1].split(',').map(s=>s.trim());
  const combat=read('src/combat.mjs');
  for(const n of names)assert.match(combat,new RegExp('export (?:const|function) '+n+'\\b'),n+' is not exported');
});
test('all four starting weapons are selectable in the menu',()=>{
  for(const w of ['sword','hammer','bow','cards'])assert.ok(html.includes('data-weapon="'+w+'"'),w);
});
test('every sound name arena.mjs asks for exists in audio.mjs',async()=>{
  const {createAudio}=await import('../src/audio.mjs');
  const names=new Set(createAudio().names);
  const used=new Set([...arena.matchAll(/audio\.play\('([\w-]+)'(?!\s*\+)/g)].map(m=>m[1]));
  for(const map of arena.matchAll(/(?:TELEGRAPH_SOUND|SWING_SOUND)=\{([^}]*)\}/g))
    for(const v of map[1].matchAll(/:'([\w-]+)'/g))used.add(v[1]);
  for(const w of ['sword','hammer','bow','cards'])used.add('swing-'+w);
  assert.ok(used.size>15,'found only '+used.size+' sound names');
  assert.deepEqual([...used].filter(n=>!names.has(n)),[]);
});
test('every boss pattern has a telegraph and a swing sound',async()=>{
  const m=read('src/combat.mjs').match(/export const PATTERNS = \{([\s\S]*?)\n\};/);
  const keys=m?[...m[1].matchAll(/^\s{2}(\w+):\{name:/gm)].map(x=>x[1]):[];
  assert.ok(keys.length>=5,'could not read the boss pattern list');
  for(const k of keys){
    assert.match(arena,new RegExp('TELEGRAPH_SOUND=\\{[^}]*\\b'+k+':'),k+' has no telegraph sound');
    assert.match(arena,new RegExp('SWING_SOUND=\\{[^}]*\\b'+k+':'),k+' has no swing sound');
  }
});
