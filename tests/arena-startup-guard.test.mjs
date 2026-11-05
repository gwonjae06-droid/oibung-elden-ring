import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('arena startup treats already-evaluated reducedMotion as boolean, never as function',()=>{
 const src=readFileSync(new URL('../src/arena.mjs',import.meta.url),'utf8');
 assert.match(src,/\breduceMotion\s*=\s*reducedMotion\(\)/,'arena gets value from getter once');
 assert.doesNotMatch(src,/\breduceMotion\s*\(\s*\)/,'regression: a boolean is not callable');
 const usage=src.match(/reduced:reduceMotion\b/g)||[];
 assert.ok(usage.length>=3,'every first-boss graphics module needs the same boolean');
 for(const moduleName of ['createBossAtmosphere','createCinematicWorld','createCinematicImpactFx'])
  assert.match(src,new RegExp(moduleName+'\\(scene,[^\\n]*reduced:reduceMotion'));
});
test('production bootstrap uses a fresh arena import and exposes real errors instead of blaming WebGL',()=>{
 const page=readFileSync(new URL('../spider-combat.html',import.meta.url),'utf8');
 const mapMatch=page.match(/<script type="importmap">([\s\S]*?)<\/script>/);
 assert.ok(mapMatch,'import map not found');
 const imports=JSON.parse(mapMatch[1]).imports;
 const version=new URL(imports['./src/arena.mjs'],'https://game.test').searchParams.get('v');
 assert.ok(version&&version!=='chapter-one-v3');
 assert.equal(imports['./src/arena.mjs?visual=chapter-one-v3'],imports['./src/arena.mjs']);
 assert.ok(page.includes('bootstrap.mjs?v='+version));
 assert.match(page,/초기화 오류:/);
 assert.doesNotMatch(page,/WebGL 2 지원을 확인한 뒤/,'do not misreport code exceptions as WebGL errors');
});
