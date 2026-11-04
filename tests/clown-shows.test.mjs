import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOWN_SHOWS,runClownShow} from '../src/clown-shows.mjs';
function fixture(){
 const g={boss:{x:0,z:0,phase:2},player:{x:0,z:18}},c={f:{},vis:{},yaw:0},calls=[];
 const api={once(c,k,fn){return c.f[k]??(c.f[k]=fn()??true);},fitLen:()=>18,head(){},emit(){},zone(g,v){calls.push(['zone',v]);},cone(g,...v){calls.push(['cone',v]);},bomb(g,v){calls.push(['bomb',v]);},dashPart(g,c,a,t,start,key){if(t>=start&&!c.f[key]){c.f[key]={x:g.player.x,z:g.player.z};calls.push(['dash',key,{...c.f[key]}]);}}};
 return {g,c,calls,api};
}
function advance(f,name,from,to){for(let t=from;t<to-1e-8;){const n=Math.min(to,t+.01);runClownShow(name,f.g,f.c,t,n,f.api);t=n;}}
test('return head uses two fixed opposite paths and delayed explosion',()=>{
 const f=fixture();advance(f,'headReturn',0,1.5);f.g.player.x=15;advance(f,'headReturn',1.5,4.8);
 const bombs=f.calls.filter(v=>v[0]==='bomb').map(v=>v[1]);assert.equal(bombs.length,2);assert.equal(bombs[0].z,18);assert.equal(bombs[1].from.z,18);assert.equal(bombs[1].z,0);
 const blast=f.calls.find(v=>v[0]==='zone'&&v[1].blast)[1];assert.equal(blast.warn,1.5);assert.equal(blast.x,0);
});
test('offbeat clap separates final retarget from earlier claps',()=>{
 const f=fixture();advance(f,'offbeatClap',0,1.9);f.g.player={x:18,z:0};advance(f,'offbeatClap',1.9,6.5);
 const cones=f.calls.filter(v=>v[0]==='cone').map(v=>v[1]);assert.equal(cones.length,4);assert.equal(cones[0][0],0);assert.ok(Math.abs(cones[3][0]-Math.PI/2)<1e-8);assert.ok(cones.every(v=>v[1]>=.8));
});
test('runaway takes a fresh second target and ends separation bypass',()=>{
 const f=fixture();advance(f,'runaway',0,1.8);f.g.player.x=12;advance(f,'runaway',1.8,5.8);
 const d=f.calls.filter(v=>v[0]==='dash');assert.equal(d.length,2);assert.equal(d[0][2].x,0);assert.equal(d[1][2].x,12);assert.equal(f.c.noSeparate,false);
});
test('all shows reserve recovery and reject unknown keys',()=>{
 for(const s of Object.values(CLOWN_SHOWS))assert.ok(s.recover>=1.3&&s.dur>s.recover);
 const f=fixture();assert.throws(()=>runClownShow('unknown',f.g,f.c,0,.01,f.api));
});
