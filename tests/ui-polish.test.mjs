import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('journey choice changes preserve focused control and scroll rather than returning to the first button',()=>{
 const code=read('src/journey.mjs');
 assert.match(code,/function show\(content,\{preserve=false\}/);
 assert.match(code,/dialog\.scrollTop=scroll/);
 assert.match(code,/target\?\.focus\?\.\(\{preventScroll:true\}\)/);
 assert.match(code,/select\(true\)/);
 assert.match(code,/forge\(true\)/);
});
test('one journey entry, compact two-column layout and mobile-fixed launch control',()=>{
 const html=read('src/journey.mjs'),css=read('journey.css');
 assert.match(html,/시련 시작 · 보스 선택/);
 assert.doesNotMatch(html,/button\('bosses'/);
 assert.match(html,/j-select-layout/);
 assert.match(html,/j-select-actions/);
 assert.match(css,/\.j-select-actions\{position:fixed/);
 assert.match(css,/\.j-select-layout\{display:grid/);
});
test('refund requires confirmation and the forge has a responsive two-column desktop layout',()=>{
 const view=read('src/forge-view.mjs'),journey=read('src/journey.mjs'),css=read('forge.css');
 assert.match(view,/forge-refund-cancel/);
 assert.match(view,/forge-refund-confirm/);
 assert.match(journey,/refundConfirmWeapon===forgeWeapon&&refundForgeWeapon/);
 assert.match(css,/\.j-forge-detail\{display:grid/);
});
test('mobile records are cards, landscape combat HUD keeps touch and boss status separate',()=>{
 const view=read('src/journey.mjs'),css=read('journey.css'),battle=read('style.css');
 assert.match(view,/class="j-record-cards"/);
 assert.match(css,/@media\(max-width:1000px\)/);
 assert.match(css,/\.j-record-cards\{display:grid/);
 assert.match(battle,/@media\(pointer:coarse\) and \(orientation:landscape\)/);
 assert.match(battle,/#arena \.boss-hud\{top:auto/);
 for(const boss of ['blood-ui','gyuwon-ui']){
  assert.doesNotMatch(read('src/'+boss+'.mjs'),/bottom:10px!important/);
 }
});
