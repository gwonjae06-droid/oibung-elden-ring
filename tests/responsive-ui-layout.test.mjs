import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('short desktop viewport and overlays stay inside the device viewport',()=>{
 const css=read('style.css');
 assert.match(css,/#arena\{min-height:0\}/);
 assert.match(css,/#arena \.overlay\{max-height:100dvh;overscroll-behavior:contain/);
 assert.match(css,/#arena \.weapon-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(pointer:coarse\) and \(orientation:landscape\) and \(max-width:600px\)/);
});
test('fixed journey action bar and forge have narrow-screen wrap rules',()=>{
 const css=read('journey.css'),forge=read('forge.css');
 assert.match(css,/#journey \.j-select-actions\{max-width:calc\(100% - 16px\)\}/);
 assert.match(css,/#journey \.j-select-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/#journey \.j-selected-route\{flex:1;/);
 assert.match(forge,/overflow-wrap:anywhere/);
});
test('cloned boss battle styles and boss health bar use narrow-safe dimensions',()=>{
 const css=read('src/hud-layout.mjs'),html=read('spider-combat.html');
 assert.match(css,/width:min\(320px,30vw\)!important/);
 assert.match(css,/#arena \.boss-hud #boss-value\{display:none!important\}/);
 assert.match(css,/text-overflow:ellipsis/);
 for(const name of ['blood-ui','gyuwon-ui','dice-ui'])assert.match(read('src/'+name+'.mjs'),/style\.css\?v=ui-safe-layout-v2-20261107/);
 assert.match(html,/style\.css\?v=ui-safe-layout-v2-20261107/);
});

test('visible combat overlays cover the home button and no duplicate dice exits are rendered',()=>{
 const css=read('style.css'),session=read('src/battle-session.mjs'),hud=read('src/hud-layout.mjs');
 assert.match(css,/#arena \.overlay\{z-index:80;/);
 assert.match(session,/oibung:home/);
 assert.match(hud,/home\.addEventListener\('keydown',keydown\)/);
 assert.doesNotMatch(read('src/dice-ui.mjs'),/광대전 결과로/);
 assert.match(read('spider-combat.html'),/gyuwon-ui\.mjs\?v=ui-safe-layout-v2-20261107/);
});
