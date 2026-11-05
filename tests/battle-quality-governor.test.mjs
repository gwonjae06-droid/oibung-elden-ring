import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleQualityGovernor} from '../src/battle-quality-governor.mjs';
import {resizeBattleViewport} from '../src/battle-viewport.mjs';

test('sustained GPU lag steps render resolution down without skipping simulation time',()=>{
 const scales=[],q=createBattleQualityGovernor({onChange:s=>scales.push(s)});
 for(let window=0;window<4;window++)for(let i=0;i<75;i++)q.sample(1/25);
 assert.ok(q.scale<=.7,'slow 25 fps should trigger a substantial pixel budget reduction');
 assert.ok(q.scale>=.65,'minimum internal resolution is bounded');
 assert.ok(scales.length>=2,'quality changes are gradual, not unbounded');
});
test('quality recovers cautiously only after consistently smooth frames',()=>{
 const q=createBattleQualityGovernor({initial:.7}),scale=q.scale;
 for(let window=0;window<2;window++)for(let i=0;i<180;i++)q.sample(1/60);
 assert.equal(q.scale,scale,'short streak should not thrash GPU allocations');
 for(let i=0;i<180;i++)q.sample(1/60);
 assert.ok(q.scale>scale,'sustained 60 fps permits a single slow recovery');
 q.sample(.05,false);
 assert.equal(q.scale,Math.round(q.scale*100)/100);
});
test('render scale changes internal pixel budget only, not locked HUD geometry',()=>{
 const win={innerWidth:1600,innerHeight:900},shell={style:{}};
 const canvas={ownerDocument:{defaultView:win},closest:()=>shell};
 const sizes=[];
 const renderer={setPixelRatio(){},setSize:(w,h)=>sizes.push([w,h])};
 const camera={updateProjectionMatrix(){}};
 resizeBattleViewport(renderer,camera,canvas);
 resizeBattleViewport(renderer,camera,canvas,.8);
 resizeBattleViewport(renderer,camera,canvas,.8);
 resizeBattleViewport(renderer,camera,canvas,.65);
 assert.deepEqual(sizes,[[1600,900],[1280,720],[1040,585]]);
 assert.equal(camera.aspect,16/9);
 assert.equal(shell.style.width,'1600px');
 assert.equal(shell.style.height,'900px');
});
