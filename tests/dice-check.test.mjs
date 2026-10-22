import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
test('removed dice diagnostic HTML stays absent',()=>{assert.equal(existsSync(new URL('../dice-check.html',import.meta.url)),false);});
