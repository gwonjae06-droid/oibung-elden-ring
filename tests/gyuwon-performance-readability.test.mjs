import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=p=>readFileSync(new URL('../src/'+p,import.meta.url),'utf8');
test('final boss circus spectacle batches repeated structures instead of per-object draw calls',()=>{
 const fx=s('gyuwon-spectacle.mjs');
 assert.match(fx,/InstancedMesh\(cube,gold,N\)/);
 assert.match(fx,/InstancedMesh\(sphere,gold,N\)/);
 assert.doesNotMatch(fx,/if\(name==='circus'\)for\(let row=0/);
 assert.match(fx,/clearcoat:\.8/);
});
test('first boss high density meshes retain a mobile mesh budget',()=>{
 const model=s('models.mjs'),arena=s('arena.mjs');
 assert.match(model,/export function buildBoss\(\{coarse=false\}/);
 assert.match(model,/coarse\?32:64/);
 assert.match(arena,/buildBoss\(\{coarse\}\)/);
});
