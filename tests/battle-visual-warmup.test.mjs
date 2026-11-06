import test from 'node:test';
import assert from 'node:assert/strict';
import {collectBattleTextures,createBattleVisualWarmup} from '../src/runtime/battle-visual-warmup.mjs';
const texture=()=>({isTexture:true,image:{width:16,height:16}});
test('the four boss warmups compile shaders, upload unique textures and release the gate',async()=>{
 const t=texture(),env=texture(),calls=[];
 const scene={environment:env,traverse(fn){fn({material:[{map:t,normalMap:t},{roughnessMap:env}]});}};
 const renderer={compileAsync:async()=>{calls.push('compile');},initTexture:t=>calls.push(t)};
 const w=createBattleVisualWarmup({renderer,scene,camera:{},assets:[Promise.resolve(true)],chunkSize:1,yieldFrame:async()=>{}});
 assert.equal(w.ready,false);
 await Promise.all([w.start(),w.start()]);
 assert.equal(w.ready,true);assert.deepEqual(calls,['compile',env,t]);
 assert.deepEqual(collectBattleTextures(scene),[env,t]);
});
test('preparation falls back safely without WebGL APIs',async()=>{
 const w=createBattleVisualWarmup({renderer:{},scene:{},camera:{}});
 await w.start();assert.equal(w.ready,true);
});
test('closing a battle while shaders compile prevents late renderer texture uploads',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r),calls=[];
 const w=createBattleVisualWarmup({renderer:{compileAsync:()=>pending,initTexture:()=>calls.push('upload')},scene:{traverse(f){f({material:{map:texture()}});}},camera:{}});
 const done=w.start();w.dispose();resolve();await done;
 assert.equal(w.ready,false);assert.deepEqual(calls,[]);
});
