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
test('arena.mjs only imports three and the combat module',()=>{
  const specs=[...arena.matchAll(/from '([^']+)'/g)].map(m=>m[1]).sort();
  assert.deepEqual(specs,['./combat.mjs','three']);
  assert.ok(existsSync(join(root,'src/combat.mjs')));
});
test('imported combat names are exported by combat.mjs',()=>{
  const names=arena.match(/import \{([^}]+)\} from '\.\/combat\.mjs'/)[1].split(',').map(s=>s.trim());
  const combat=read('src/combat.mjs');
  for(const n of names)assert.match(combat,new RegExp('export (?:const|function) '+n+'\\b'),n+' is not exported');
});
test('all four starting weapons are selectable in the menu',()=>{
  for(const w of ['sword','hammer','bow','cards'])assert.ok(html.includes('data-weapon="'+w+'"'),w);
});
