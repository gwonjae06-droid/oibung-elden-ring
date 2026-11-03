import test from 'node:test';
import assert from 'node:assert/strict';
import {PATTERNS,SEQUENCES,PHASE_ONE,createGame,beginSequence,step,patternConfig} from '../src/combat.mjs';
import {bossMotion,MOTION_STYLE} from '../src/boss-motion-data.mjs';

const small=m=>Math.abs(m.lean)<1e-9&&Math.abs(m.sink)<1e-9&&Math.abs(m.sway)<1e-9;

test('every first-boss pattern has a wind-up pose and a strike pose',()=>{
 for(const k of Object.keys(PATTERNS)){const s=MOTION_STYLE[k];assert.ok(Array.isArray(s)&&s.length===2,k);}
});

test('no motion for missing, dead, cutscene or unknown states',()=>{
 assert.ok(small(bossMotion(null)));
 for(const state of ['dead','transition'])assert.ok(small(bossMotion({state,pattern:'sweep',phase:1,t:.3,stun:0})));
 assert.ok(small(bossMotion({state:'idle',pattern:'sweep',phase:1,t:.3,stun:0})));
 assert.ok(small(bossMotion({state:'windup',pattern:'nope',phase:1,t:.3,stun:0})));
});

function run(phase,map){
 const seen=new Map();
 for(const k of Object.keys(map)){
  const g=createGame();g.boss.phase=phase;g.player.x=g.player.z=18;g.player.invuln=1e6;beginSequence(g,k);
  for(let i=0;i<9000;i++){
   step(g,1/240);const m=bossMotion(g.boss);
   for(const v of Object.values(m))assert.ok(Number.isFinite(v));
   assert.ok(Math.abs(m.lean)<=.35&&m.sink>=-.8&&m.sink<=.5&&Math.abs(m.sway)<=.2);
   seen.set(g.boss.pattern,Math.max(seen.get(g.boss.pattern)||0,Math.abs(m.lean)+Math.abs(m.sink)+Math.abs(m.sway)));
   if(g.boss.state==='idle'&&i>10)break;
  }
 }
 return seen;
}

test('motions stay bounded and visible across every sequence in both phases',()=>{
 for(const [phase,map] of [[1,PHASE_ONE],[2,SEQUENCES]]){
  const seen=run(phase,map);
  assert.ok(seen.size>=5);
  for(const [k,v] of seen)assert.ok(v>.05,phase+':'+k);
 }
});

test('wind-up and strike poses differ, and recovery settles back to neutral',()=>{
 for(const k of Object.keys(PATTERNS)){
  const base={pattern:k,phase:1,stun:0,queue:[],recovery:1},cfg=patternConfig({pattern:k,phase:1});
  assert.ok(small(bossMotion({...base,state:'windup',t:0})),k);
  const w=bossMotion({...base,state:'windup',t:cfg.wind}),a=bossMotion({...base,state:'active',t:cfg.active});
  assert.ok(Math.abs(w.lean-a.lean)+Math.abs(w.sink-a.sink)+Math.abs(w.sway-a.sway)>.03,k);
  assert.ok(small(bossMotion({...base,state:'recovery',t:1})),k);
  const held=bossMotion({...base,state:'recovery',t:.3,queue:['sweep']});
  assert.ok(Math.abs(held.lean-a.lean)<1e-9,k);
 }
});

test('phase two exaggerates the pose and stagger or stun makes the body shake',()=>{
 const b={state:'active',pattern:'slam',phase:1,t:.1,stun:0,queue:[],recovery:1},one=bossMotion(b),two=bossMotion({...b,phase:2});
 assert.ok(Math.abs(two.lean)>Math.abs(one.lean));
 const stagger=bossMotion({state:'stagger',t:.5,phase:1,stun:0});
 assert.ok(stagger.lean<0&&stagger.sink<0);
 assert.ok([.011,.013,.017,.021].some(t=>Math.abs(bossMotion({state:'stagger',t,phase:1,stun:0}).sway)>.01));
 assert.ok([.011,.013,.017,.021].some(t=>Math.abs(bossMotion({state:'idle',t,phase:1,stun:1}).sway)>.01));
});
