import test from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,BALL_LIMIT} from '../src/clown-combat.mjs';
import {CIRCUS_LAYOUT,CIRCUS_SCENERY_SPREAD} from '../src/clown-radiant-circus.mjs';
import {BLOOD_RULES} from '../src/blood-data.mjs';
import {WHITE_CATHEDRAL_LAYOUT} from '../src/blood-white-cathedral.mjs';
import {CATHEDRAL_BLOOD_SEA} from '../src/blood-cathedral-sea.mjs';
import {GYUWON_RULES} from '../src/gyuwon-data.mjs';
test('arena sizes match physics, scenic clearance and ground geometry',()=>{
 assert.equal(ARENA,27);assert.equal(BALL_LIMIT,23.25);
 assert.equal(BLOOD_RULES.radius,32);assert.equal(GYUWON_RULES.radius,30);
 assert.equal(CIRCUS_LAYOUT.playableRadius,27);
 assert.ok(CIRCUS_LAYOUT.floorRadius>ARENA+1);
 assert.ok(CIRCUS_LAYOUT.columnsRadius>ARENA+8);
 assert.equal(CIRCUS_SCENERY_SPREAD,27/23);
 assert.equal(WHITE_CATHEDRAL_LAYOUT.combatRadius,32);
 assert.ok(WHITE_CATHEDRAL_LAYOUT.minSolidRadius>32);
 assert.ok(CATHEDRAL_BLOOD_SEA.halfWidth>35);
});
