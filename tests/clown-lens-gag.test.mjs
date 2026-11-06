import test from 'node:test';
import assert from 'node:assert/strict';
import {clownLensCue,updateClownLens,restoreClownLens} from '../src/clown-lens-gag.mjs';
const game=(name='spotlightSweep',pt=.35)=>({status:'playing',boss:{state:'clown'},clown:{state:'pattern',name,pt}});
function fixture(){const canvas={style:{transform:'translateX(0px)',transformOrigin:'20% 20%'}};return {canvas,doc:{getElementById:()=>({firstElementChild:{shadowRoot:{getElementById:()=>canvas}}})}};}
test('lens cue ends before existing attack impacts',()=>{assert.equal(clownLensCue(game('spotlightSweep',.72)).active,false);assert.equal(clownLensCue(game('carousel',.7)).active,false);});
test('roll and crop stay bounded',()=>{for(const name of ['spotlightSweep','carousel'])for(let t=0;t<2;t+=.005){const c=clownLensCue(game(name,t));assert.ok(Math.abs(c.roll)<=2);assert.ok(c.scale>=1&&c.scale<=1.06);}});
test('ordinary attacks receive no lens gag',()=>assert.equal(clownLensCue(game('clap')).active,false));
test('repeated application does not accumulate transforms',()=>{const {canvas,doc}=fixture(),g=game();updateClownLens(g,doc);const first=canvas.style.transform;updateClownLens(g,doc);assert.equal(canvas.style.transform,first);});
test('transition and loss restore original inline styles',()=>{for(const kind of ['transition','loss']){const {canvas,doc}=fixture(),g=game();updateClownLens(g,doc);if(kind==='transition')g.boss.state='transition';else g.status='lost';updateClownLens(g,doc);assert.equal(canvas.style.transform,'translateX(0px)');assert.equal(canvas.style.transformOrigin,'20% 20%');}});
test('explicit cleanup is idempotent and game data is unchanged',()=>{const {canvas,doc}=fixture(),g=game(),before=structuredClone(g);updateClownLens(g,doc);assert.deepEqual(g,before);restoreClownLens(canvas);restoreClownLens(canvas);assert.equal(canvas.style.transform,'translateX(0px)');});

test('photo shutter uses a white overlay instead of a camera lens distortion',()=>{const g=game('laughBomb',.35);g.clown.showKey='headReturn';g.clown.stageKey='photo';assert.deepEqual(clownLensCue(g),{roll:0,scale:1,active:false});});
