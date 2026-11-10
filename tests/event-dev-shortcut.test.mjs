import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

test('the regular journey tags event game states before developer shortcut handlers read them',()=>{
 const script=readFileSync(fileURLToPath(new URL('../src/journey.mjs',import.meta.url)),'utf8');
 assert.match(script,/configure=g=>\{configureJourney\(g,r,profile\);if\(eventMode\)g\.odenPrizeEvent=true;/);
});
