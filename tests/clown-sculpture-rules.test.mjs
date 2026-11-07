import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const clown=readFileSync(new URL('../src/clown-actor.mjs',import.meta.url),'utf8');
const battle=readFileSync(new URL('../src/clown-battle.mjs',import.meta.url),'utf8');
test('clown uses curved sculpted anatomy, woven material, mobile LOD and no flat toy torso',()=>{
 assert.match(clown,/new THREE\.LatheGeometry/);
 assert.match(clown,/MeshPhysicalMaterial/);
 assert.match(clown,/coarse\?32:72/);
 assert.match(clown,/stitched panels/);
 assert.doesNotMatch(clown,/new THREE\.SphereGeometry\(1,20,16\)/);
 assert.match(battle,/createClownActor\(\{coarse\}\)/);
});
