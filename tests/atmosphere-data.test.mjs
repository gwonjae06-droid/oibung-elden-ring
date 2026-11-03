import test from 'node:test';
import assert from 'node:assert/strict';
import {AMBIENT_LIMIT,AMBIENT_RADIUS,atmosphereMood,createAmbientField,stepAmbientField} from '../src/atmosphere-data.mjs';
const seeded=(seed=7)=>{let s=seed;return ()=>{s=s*16807%2147483647;return s/2147483647;};};
test('field size is capped and deterministic for a seeded random',()=>{
 const a=createAmbientField({count:9999,random:seeded(3)}),b=createAmbientField({count:9999,random:seeded(3)});
 assert.equal(a.particles.length,AMBIENT_LIMIT);
 assert.deepEqual(a.particles,b.particles);
 assert.equal(createAmbientField({count:-4}).particles.length,0);
 assert.equal(createAmbientField({count:NaN}).particles.length,0);
});
test('particles stay finite, near the arena, and recycle after rising',()=>{
 const f=createAmbientField({count:80,random:seeded(11)}),mood=atmosphereMood({boss:{phase:2}});
 for(let i=0;i<1200;i++){
  stepAmbientField(f,.05,i*.05,mood);
  for(const p of f.particles){
   for(const k of ['x','y','z','alpha','tint'])assert.ok(Number.isFinite(p[k]),k);
   assert.ok(p.y>=0&&p.y<=9.01,'y '+p.y);
   assert.ok(Math.hypot(p.x,p.z)<=AMBIENT_RADIUS+2.5);
   assert.ok(p.alpha>=0&&p.alpha<=1);
  }
 }
});
test('paused or invalid frames leave the field untouched',()=>{
 const f=createAmbientField({count:20,random:seeded(5)}),before=JSON.stringify(f.particles);
 for(const dt of [0,-1,NaN,Infinity])stepAmbientField(f,dt,1);
 assert.equal(JSON.stringify(f.particles),before);
});
test('moods follow boss phase and arena type',()=>{
 const one=atmosphereMood({boss:{phase:1}}),two=atmosphereMood({boss:{phase:2}}),circus=atmosphereMood({boss:{phase:1},clown:{}});
 assert.equal(one.kind,'ruins');
 assert.equal(circus.kind,'circus');
 assert.ok(two.rise*two.speed>one.rise*one.speed);
 assert.ok(two.alpha>one.alpha);
 assert.notDeepEqual(circus.a,one.a);
 assert.equal(atmosphereMood(null).phase,1);
 for(const m of [one,two,circus])for(const c of [...m.a,...m.b])assert.ok(c>=0&&c<=1);
});
test('a later phase raises particles faster',()=>{
 const make=()=>createAmbientField({count:1,random:()=>.5}),a=make(),b=make();
 stepAmbientField(a,.05,0,atmosphereMood({boss:{phase:1}}));
 stepAmbientField(b,.05,0,atmosphereMood({boss:{phase:2}}));
 assert.ok(b.particles[0].y>a.particles[0].y);
});
