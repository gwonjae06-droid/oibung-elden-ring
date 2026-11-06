import test from 'node:test';
import assert from 'node:assert/strict';
import {clownHeadMeshDetail,createClownHeadPool} from '../src/clown-photo-performance.mjs';
import {runStageVariant} from '../src/clown-stage-shows.mjs';

test('thrown photo head is low-poly while the main boss head retains full resolution',()=>{
 const hero=clownHeadMeshDetail(false),projectile=clownHeadMeshDetail(true);
 assert.deepEqual(hero,{width:72,height:56});
 assert.ok(projectile.width>=16&&projectile.height>=12);
 assert.ok((projectile.width+1)*(projectile.height+1)<.15*(hero.width+1)*(hero.height+1));
});
test('first shutter reuses prewarmed head geometry and face',()=>{
 let created=0,disposed=0;
 const pool=createClownHeadPool(()=>({group:{visible:false,parent:null},setMorph(){},dispose(){disposed++;},id:++created}),{prewarm:2});
 assert.equal(created,2);
 const a=pool.acquire(),b=pool.acquire();
 assert.equal(created,2);
 assert.equal(pool.stats().active,2);
 assert.equal(pool.release(a),true);
 assert.equal(pool.release(a),false);
 assert.equal(pool.acquire(),a);
 assert.equal(created,2);
 assert.equal(pool.release(b),true);
 pool.dispose();pool.dispose();
 assert.equal(disposed,2);
 assert.throws(()=>pool.acquire(),/disposed/);
});
test('additional simultaneous projectiles expand pool and reset allows complete reuse',()=>{
 let created=0,disposed=0;
 const pool=createClownHeadPool(()=>({group:{visible:false,parent:null},dispose(){disposed++;},id:++created}),{prewarm:2});
 const heads=Array.from({length:5},()=>pool.acquire());
 assert.equal(created,5);
 for(const head of heads)assert.equal(pool.release(head),true);
 assert.equal(pool.stats().active,0);
 for(let i=0;i<5;i++)pool.acquire();
 assert.equal(created,5);
 pool.dispose();
 assert.equal(disposed,5);
});
test('photo capture still fires once in phase one and twice in phase two with unchanged damage warnings',()=>{
 for(const [phase,shots]of [[1,1],[2,2]]){
  const g={boss:{phase},player:{x:4,z:12}},c={f:{},vis:{},stageCounts:{headReturn:1}},calls=[];let id=0;
  const api={once(c,k,fn){if(!Object.hasOwn(c.f,k))c.f[k]=fn()??true;},emit(g,type,v){calls.push({type,...v});},zone(g,v){const z={id:++id,...v};calls.push({type:'zone',...z});return z;},bomb(g,v){calls.push({type:'bomb',...v});},head(){}};
  for(let a=0;a<2.5-1e-8;a+=.025)runStageVariant('headReturn',g,c,a,a+.025,api);
  assert.equal(calls.filter(e=>e.type==='clown-shutter').length,shots);
  assert.equal(calls.filter(e=>e.type==='bomb').length,shots);
  assert.ok(calls.filter(e=>e.type==='zone').every(e=>e.warn===1.4&&e.damage===34&&e.major));
 }
});
