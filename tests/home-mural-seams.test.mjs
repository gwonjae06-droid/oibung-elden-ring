import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MURAL_SEALS,renderJourneyArt,JOURNEY_ART} from '../src/journey-art.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('main mural uses one photographic layer with no duplicate wallpaper or white sweep',()=>{
 const css=read('journey.css'),markup=renderJourneyArt('home');
 assert.equal(markup,JOURNEY_ART);
 assert.match(markup,/j-stone-wall/);
 assert.equal((markup.match(/class="j-stone-wall"/g)||[]).length,2,'responsive alternatives, only one visible');
 assert.match(markup,/preserveAspectRatio="xMidYMid slice"/);
 assert.doesNotMatch(markup,/j-relief-sheen|stone-hot-inlay|stone-passing-light/);
 assert.doesNotMatch(css,/\.j-photographic\{background:[^}]*url\(/);
 assert.match(css,/#journey \.j-photographic\{background-color:#090c0d;background-image:none\}/);
 assert.match(css,/\.j-photographic \.mural-grooves\{animation:none;clip-path:none\}/);
 assert.match(css,/animation:inlay-ignite 2\.8s ease-out both/,'a boss victory must fill the relief instead of glinting');
 assert.match(css,/#journey\[data-screen='home'\] \.groove-inlay\{animation:none\}/,'remove the looping sparkle');
 assert.match(css,/#journey \.j-temple svg\{width:100%;height:100%;margin:0;overflow:hidden\}/);
});
test('view-specific clipping IDs do not collide between SVG variants or cutscene halves',()=>{
 const markup=[renderJourneyArt('home'),renderJourneyArt('transition-left'),renderJourneyArt('transition-right')].join('');
 const ids=[...markup.matchAll(/<clipPath id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,6);assert.equal(new Set(ids).size,ids.length);
 for(const id of ids)assert.ok(markup.includes('url(#'+id+')'),'emblem masks reference the local unique clip');
 const redIds=[...markup.matchAll(/<filter id="(stone-crimson-fire-[^"]+)"/g)].map(m=>m[1]);
 assert.equal(redIds.length,6,'each SVG gets a private crimson-emission filter');
 assert.equal(new Set(redIds).size,redIds.length,'a reused filter can create SVG rendering seams');
 for(const id of redIds)assert.ok(markup.includes('filter="url(#'+id+')"'));
 assert.match(markup,/feColorMatrix type="matrix"/);
 assert.doesNotMatch(markup,/j-relief-sheen|stone-hot-inlay|stone-passing-light/);
 assert.equal((JOURNEY_ART.match(/data-emblem="/g)||[]).length,MURAL_SEALS.length*2);
 const transition=read('src/journey-transition.mjs');
 assert.match(transition,/renderJourneyArt\("transition-left"\)/);
 assert.match(transition,/renderJourneyArt\("transition-right"\)/);
});
test('browser receives cache-busted CSS and new mural module instead of stale page assets',()=>{
 const html=read('spider-combat.html'),journey=read('src/journey.mjs');
 assert.match(html,/journey\.css\?art=blood-boss-v1&v=home-crimson-fill-20261107/);
 assert.match(html,/src\/journey\.mjs\?v=home-crimson-fill-20261107/);
 assert.match(journey,/journey-art\.mjs\?art=home-crimson-fill-20261107/);
});

test('defeated bosses glow crimson, undefeated bosses stay dark, and mirror uses saved gyuwon ID',()=>{
 const css=read('journey.css');
 for(const [id,boss] of [['kwon','kwon'],['clown','clown'],['dice','dice'],['blood','blood'],['gyuwon','mirror']]){
  assert.ok(css.includes("data-defeated~='"+id+"'")&&css.includes("data-boss='"+boss+"'"),id+' must use its actual progress flag');
 }
 assert.match(css,/\.j-relief \.j-relief-photo\{filter:brightness\(\.78\) saturate\(\.7\)\}/);
 assert.match(css,/\.j-relief \.groove-inlay\{opacity:\.94;mix-blend-mode:screen\}/);
 assert.doesNotMatch(css,/#journey\[data-screen='home'\] \.groove-inlay\{animation:temple-fire/);
});
