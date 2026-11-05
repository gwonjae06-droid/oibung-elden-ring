import test from 'node:test';
import assert from 'node:assert/strict';
import {createClownCameraRig} from '../src/clown-camera-rig.mjs';
// API doubles test state ownership, not WebGL or full quaternion composition.
class Q{constructor(angle=0){this.angle=angle;}clone(){return new Q(this.angle);}equals(q){return this.angle===q.angle;}copy(q){this.angle=q.angle;return this;}}
const camera=(fov=58)=>({fov,quaternion:new Q(),rotateZ(v){this.quaternion.angle+=v;},updateProjectionMatrix(){},updateMatrixWorld(){}});
const game=()=>({status:'playing',boss:{state:'clown'},clown:{state:'pattern',name:'laughBomb',showKey:'headReturn',stageKey:'photo',pt:.5}});
test('3D rig applies roll and FOV without mutating combat state',()=>{const g=game(),before=structuredClone(g),c=camera(),r=createClownCameraRig();r.observe(g);assert.equal(r.apply(c),true);assert.ok(c.fov<58);assert.ok(Math.abs(c.quaternion.angle-4*Math.PI/180)<1e-8);assert.deepEqual(g,before);});
test('repeated application does not accumulate zoom or roll',()=>{const r=createClownCameraRig(),g=game(),c=camera();r.observe(g);r.apply(c);const f=c.fov,a=c.quaternion.angle;for(let i=0;i<10;i++)r.apply(c);assert.equal(c.fov,f);assert.equal(c.quaternion.angle,a);});
test('fresh engine camera orientation is preserved as the new base',()=>{const r=createClownCameraRig(),g=game(),c=camera();r.observe(g);r.apply(c);c.quaternion.angle=.2;r.apply(c);g.clown.pt=1.2;r.apply(c);assert.ok(Math.abs(c.quaternion.angle-.2)<1e-8);});
test('show completion restores FOV and orientation',()=>{const r=createClownCameraRig(),g=game(),c=camera();r.observe(g);r.apply(c);g.clown.pt=1.2;r.apply(c);assert.equal(c.fov,58);assert.equal(c.quaternion.angle,0);});
test('reset restores camera and clears game ownership',()=>{const r=createClownCameraRig(),c=camera();r.observe(game());r.apply(c);r.reset();assert.equal(c.fov,58);assert.equal(c.quaternion.angle,0);assert.equal(r.apply(c),false);});
test('external FOV changes survive restore',()=>{const r=createClownCameraRig(),g=game(),c=camera();r.observe(g);r.apply(c);c.fov=70;r.apply(c);g.status='lost';r.apply(c);assert.equal(c.fov,70);});
test('switching cameras restores previous camera',()=>{const r=createClownCameraRig(),a=camera(),b=camera(70);r.observe(game());r.apply(a);r.apply(b);assert.equal(a.fov,58);assert.equal(a.quaternion.angle,0);r.dispose();assert.equal(b.fov,70);});
test('unsupported camera objects fail safely',()=>{const r=createClownCameraRig();r.observe(game());assert.equal(r.apply({position:{x:0,y:0,z:0}}),false);});
test('invalid FOV values are rejected unchanged',()=>{for(const v of [0,-10,180,200,NaN,Infinity]){const r=createClownCameraRig(),c=camera(v);r.observe(game());assert.equal(r.apply(c),false);assert.ok(Object.is(c.fov,v));assert.equal(c.quaternion.angle,0);}});
test('quaternion methods must be functions',()=>{for(const key of ['clone','copy','equals']){const r=createClownCameraRig(),c=camera();c.quaternion[key]=true;r.observe(game());assert.equal(r.apply(c),false);}});
test('projection and matrix methods are required',()=>{for(const key of ['updateProjectionMatrix','updateMatrixWorld']){const r=createClownCameraRig(),c=camera();delete c[key];r.observe(game());assert.equal(r.apply(c),false);}});
test('rotateZ must be callable',()=>{const r=createClownCameraRig(),c=camera();c.rotateZ=1;r.observe(game());assert.equal(r.apply(c),false);});
test('rejecting a replacement restores the active previous camera',()=>{const r=createClownCameraRig(),a=camera();r.observe(game());r.apply(a);assert.equal(r.apply(camera(180)),false);assert.equal(a.fov,58);assert.equal(a.quaternion.angle,0);});
test('cleanup tolerates invalidated owner methods',()=>{const r=createClownCameraRig(),c=camera();r.observe(game());r.apply(c);delete c.quaternion.equals;delete c.updateProjectionMatrix;assert.doesNotThrow(()=>r.reset());assert.doesNotThrow(()=>r.reset());});
