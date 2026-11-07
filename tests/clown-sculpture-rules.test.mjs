import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const actor=readFileSync(new URL('../src/clown-ringmaster-actor.mjs',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/clown-battle.mjs',import.meta.url),'utf8');
test('actual live clown uses articulated asymmetrical PBR ringmaster, not photograph spheres',()=>{
 assert.match(actor,/LatheGeometry/);
 assert.match(actor,/MeshPhysicalMaterial/);
 assert.match(actor,/solid-floor-contact-shoe/);
 assert.match(actor,/hand-sculpted-porcelain-face/);
 assert.match(actor,/antique-conductor-baton/);
 assert.match(scene,/clown-ringmaster-actor.mjs/);
 assert.match(scene,/createCircusTroupeView/);
 assert.doesNotMatch(scene,/createClownActor\(\{coarse\}\).*createClownHead/s);
});
