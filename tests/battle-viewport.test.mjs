import test from 'node:test';
import assert from 'node:assert/strict';
import {battleViewportSize,resizeBattleViewport} from '../src/battle-viewport.mjs';
test('every screen fits the same undistorted 16:9 view without clipping',()=>{
 for(const [width,height]of [[1920,1080],[1280,1024],[3440,1440],[844,390],[1366,768],[600,800]]){
  const s=battleViewportSize(width,height);assert.ok(Math.abs(s.width/s.height-16/9)<1e-10);
  assert.ok(s.left>=-1e-8&&s.top>=-1e-8);assert.ok(s.width<=width+1e-8&&s.height<=height+1e-8);
 }
});
test('rendering budget follows the smaller physical viewport while keeping the 16:9 projection',()=>{
 const win={innerWidth:3440,innerHeight:1440},shell={style:{}},canvas={ownerDocument:{defaultView:win},closest:()=>shell};let sizes=[],ratios=[];
 const renderer={setPixelRatio:n=>ratios.push(n),setSize:(w,h)=>sizes.push([w,h])},camera={updateProjectionMatrix(){}};
 resizeBattleViewport(renderer,camera,canvas);resizeBattleViewport(renderer,camera,canvas);assert.equal(sizes.length,1);
 win.innerWidth=1280;win.innerHeight=1024;resizeBattleViewport(renderer,camera,canvas);
 assert.deepEqual(sizes,[[1600,900],[1280,720]]);assert.deepEqual(ratios,[1,1]);assert.equal(camera.aspect,16/9);assert.equal(shell.style.minHeight,'0');
});
