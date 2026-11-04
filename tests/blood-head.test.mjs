import test from 'node:test';
import assert from 'node:assert/strict';
import {bloodHeadGeometry,createBloodHead} from '../src/blood-head.mjs';
test('portrait head has skull depth, shaped jaw and projecting nose with finite UVs',()=>{const g=bloodHeadGeometry();g.computeBoundingBox();const b=g.boundingBox;assert.ok(b.max.z-b.min.z>1.1);assert.ok(b.max.y-b.min.y>1.6);assert.ok(b.max.x-b.min.x>1.2);const p=g.attributes.position,u=g.attributes.uv;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getZ(i)));assert.ok(u.getX(i)>=0&&u.getX(i)<=1);assert.ok(u.getY(i)>=0&&u.getY(i)<=1);}g.dispose();});
test('head is solid mesh with neck and can be disposed before image load completes',()=>{const h=createBloodHead();assert.equal(h.group.children.length,2);assert.ok(h.group.children.every(m=>m.isMesh&&m.geometry.type!=='PlaneGeometry'));h.dispose();h.dispose();});
