import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE_TWO_SCALE,mountPose,bombPose,headFrame} from '../src/clown-visual-data.mjs';
test('uniform mount scaling doubles the existing head mount volume',()=>{const m=mountPose(0);assert.ok(Math.abs(m.scale**3-2)<1e-12);assert.equal(m.scale,PHASE_TWO_SCALE);});
test('body rises with the new mount rather than remaining at its former height',()=>{const m=mountPose(0);assert.ok(m.y>2.6);assert.ok(m.bodyY>5.2);assert.ok(Math.abs((m.bodyY-5.2)-5.096*(m.scale-1))<1e-12);});
test('detach begins at the same position with the original scale',()=>{const a=mountPose(1.6,true);assert.equal(a.scale,1);assert.equal(a.y,11.18);assert.equal(a.bodyY,5.2);assert.equal(a.bodyHead,false);});
test('cutscene growth and height changes are continuous and land at the normal pose',()=>{let last=mountPose(1.6,true);for(let t=1.61;t<5.2;t+=.01){const m=mountPose(t,true);assert.ok(m.scale>=last.scale&&m.scale<=PHASE_TWO_SCALE);assert.ok(Math.abs(m.y-last.y)<.2);assert.ok(Math.abs(m.bodyY-last.bodyY)<.1);last=m;}const a=mountPose(5.2,true),b=mountPose(0);for(const k of ['scale','bodyY','y','z','ball'])assert.ok(Math.abs(a[k]-b[k])<1e-9,k);});
test('phase one head and phase two headless body remain distinct',()=>{const g={boss:{phase:1,state:'clown',t:0},clown:{vis:{pose:'idle',k:0}}};assert.equal(headFrame(g).mount,null);g.boss.phase=2;const f=headFrame(g);assert.equal(f.bodyHead,false);assert.equal(f.mount.scale,PHASE_TWO_SCALE);});
test('raised phase two projectiles still land at the fixed ground target',()=>{const q={kind:'head',t:0,fly:.9,warn:1.45,from:{x:1,y:9.9,z:2},x:8,z:12};assert.ok(bombPose(q,2).y>8.2);q.t=.9;const p=bombPose(q,2);assert.equal(p.x,8);assert.equal(p.z,12);assert.ok(Math.abs(p.y-2.1)<1e-9);});
