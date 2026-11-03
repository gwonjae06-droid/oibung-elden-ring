import test from 'node:test';import assert from 'node:assert/strict';
import {createDisposerScope} from '../src/runtime/disposer.mjs';
import {readFileSync} from 'node:fs';

test('disposer runs in reverse order, once, and continues after a failure',()=>{const seen=[],scope=createDisposerScope(()=>seen.push('error'));scope.add(()=>seen.push('first'));scope.add(()=>{seen.push('throws');throw Error('expected');});scope.add(()=>seen.push('last'));scope.dispose();scope.dispose();assert.deepEqual(seen,['last','throws','error','first']);assert.equal(scope.disposed,true);});

test('removing a cleanup handle leaves other cleanups active',()=>{const seen=[],scope=createDisposerScope();const cancel=scope.add(()=>seen.push('cancelled'));scope.add(()=>seen.push('kept'));cancel();cancel();scope.dispose();assert.deepEqual(seen,['kept']);});

test('adding cleanup after disposal executes it immediately',()=>{const seen=[],scope=createDisposerScope();scope.dispose();scope.add(()=>seen.push('late'));assert.deepEqual(seen,['late']);});

test('game UI owns observers, RAF, dialogs, intro and its screen-fx handle',()=>{const s=readFileSync(new URL('../src/game-ui.mjs',import.meta.url),'utf8');assert.match(s,/return control/);assert.match(s,/scope\.add\(\(\)=>observer\.disconnect\(\)\)/);assert.match(s,/cancelAnimationFrame|cancelAnimationFrame/);assert.match(s,/screenFx\?\.dispose/);assert.match(s,/installations\.delete\(doc\)/);assert.match(s,/view\.skip\(\)/);});
