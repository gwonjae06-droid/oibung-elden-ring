import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleQualityGovernor,createEncounterQuality} from '../src/battle-quality-governor.mjs';
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

test('per-boss resolution policy favors full quality and lowers GPU pixels only under sustained load',()=>{
 const mobile=createEncounterQuality({coarse:true}),desktop=createEncounterQuality();
 assert.equal(mobile.scale,.95);assert.equal(desktop.scale,1);
 for(let i=0;i<240;i++){mobile.sample(1/25);desktop.sample(1/25);}
 assert.ok(mobile.scale>=.65&&mobile.scale<.95);
 assert.ok(desktop.scale>=.7&&desktop.scale<1);
 const reduced=mobile.scale;
 for(let i=0;i<300;i++)mobile.sample(1/60);
 assert.ok(mobile.scale>=reduced);
});

test('physical screen resolution caps internal WebGL pixels on smaller desktop and landscape screens',()=>{
 const win={innerWidth:1280,innerHeight:720},shell={style:{}};
 const canvas={ownerDocument:{defaultView:win},closest:()=>shell};
 const values=[],renderer={setPixelRatio(){},setSize:(w,h)=>values.push([w,h])},camera={updateProjectionMatrix(){}};
 resizeBattleViewport(renderer,camera,canvas,1);
 assert.deepEqual(values[0],[1280,720]);
 assert.equal(camera.aspect,16/9);
 win.innerWidth=844;win.innerHeight=390;
 resizeBattleViewport(renderer,camera,canvas,1);
 assert.deepEqual(values[1],[800,450]);
 assert.ok(values[1][0]<values[0][0]&&values[1][1]<values[0][1]);
});
