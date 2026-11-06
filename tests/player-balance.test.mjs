import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayerBalance} from '../src/player-balance.mjs';
import {samplePlayerMotion} from '../src/player-motion-data.mjs';
const game=()=>({weapon:'sword',time:0,player:{action:null},boss:{state:'idle'}});
const numericPose=p=>Object.entries(p).filter(([,v])=>typeof v==='number').every(([,v])=>Number.isFinite(v));
test('weight transfer follows a running gait without modifying game state',()=>{
 const controller=createPlayerBalance(),g=game(),snapshot=JSON.stringify(g);
 let shifted=0;
 for(let i=0;i<110;i++){g.time=i/60;const pose=samplePlayerMotion(g,i*.15,6,{time:g.time});
  const x=pose.strideX;controller.apply(pose,{dt:1/60,clock:g.time,phase:i*.15,speed:6,moveX:.4});
  shifted=Math.max(shifted,Math.abs(pose.strideX-x));
  assert.ok(numericPose(pose));
 }
 assert.ok(shifted>.01);assert.equal(JSON.stringify(g),snapshot.replace('"time":0',`"time":${g.time}`));
 assert.ok(controller.springCount<=6);
});
test('landing compresses knees and decays within one second',()=>{
 const bal=createPlayerBalance();const g=game();
 g.player.action={kind:'roll',t:.2,total:.5};
 const air=samplePlayerMotion(g,.5,5);bal.apply(air,{dt:.016,clock:1,speed:5,action:g.player.action});
 g.player.action=null;
 const first=samplePlayerMotion(g,.8,0),base=first.kneeL;
 bal.apply(first,{dt:.016,clock:1.016,speed:0});
 assert.ok(first.kneeL>base+.04);
 let last=first.kneeL-base;
 for(let i=1;i<=80;i++){const p=samplePlayerMotion(g,.8,0);
  bal.apply(p,{dt:.016,clock:1.016+i*.016,speed:0});
  last=p.kneeL-base;
 }
 assert.ok(last<.001);
});
test('pause, reset and clock rewind do not accumulate secondary motion',()=>{
 const bal=createPlayerBalance();const g=game();
 let p=samplePlayerMotion(g,0,6);bal.apply(p,{dt:.016,clock:1,speed:6,moveX:1});
 const before=bal.springCount;assert.ok(before>0);
 bal.apply(samplePlayerMotion(g,0,6),{dt:0,clock:1,speed:6});
 assert.equal(bal.springCount,before);
 bal.apply(samplePlayerMotion(g,0,0),{dt:.016,clock:0,speed:0});
 assert.ok(bal.springCount<=6);
 bal.reset();assert.equal(bal.landing,0);assert.equal(bal.springCount,0);
});
