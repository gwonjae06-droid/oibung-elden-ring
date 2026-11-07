import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clownLegTarget,createClownGait} from '../src/clown-gait.mjs';
import {createKwonTorsoMotion} from '../src/kwon-torso-rig.mjs';
import {createGiantElbowFollow} from '../src/giant-arm-inertia.mjs';
import {createSpringBank,springStep} from '../src/secondary-physics.mjs';

const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('Clown shoes plant before they lift and the IK knee connects two equal leg bones',()=>{
 for(const side of [-1,1]){
  const stance=clownLegTarget(side,.2,1),swing=clownLegTarget(side,.8,1);
  assert.equal(stance.planted,true);assert.equal(stance.lift,0);
  assert.equal(swing.planted,false);assert.ok(swing.lift>.1);
  assert.ok(Math.abs(dist(stance.hip,stance.knee)-dist(stance.knee,stance.foot))<1e-8);
  assert.ok(Math.abs(dist(swing.hip,swing.knee)-dist(swing.knee,swing.foot))<1e-8);
  for(const value of [stance,swing])for(const p of [value.hip,value.knee,value.foot])assert.ok(p.every(Number.isFinite));
 }
 const left=clownLegTarget(-1,.2,0),right=clownLegTarget(1,.2,0);
 assert.ok(Math.abs(left.foot[0]+right.foot[0])<1e-8);
});
test('Clown movement weight follows actual travelled distance and pauses safely',()=>{
 const g={clown:{odo:0,vis:{},state:'pattern',name:'dash'}},model=createClownGait();
 let pose=model.update(g,1/60);assert.equal(pose.activity,0);
 g.clown.odo=1;
 for(let i=0;i<25;i++){g.clown.odo+=.08;pose=model.update(g,1/60);}
 assert.ok(pose.activity>.2);
 assert.ok(pose.legs.some(x=>Math.abs(x.foot[2]-.25)>.03));
 const pause=structuredClone(pose);assert.deepEqual(model.update(g,0),pause);
 const replacement={clown:{odo:0,vis:{},state:'idle',name:null}};
 assert.equal(model.update(replacement,1/60).activity,0);
 model.reset();assert.equal(model.update(g,1/60).activity,0);
});
test('Kwon shoulder mass follows the turning torso smoothly, without changing sword/hit state',()=>{
 const motion=createKwonTorsoMotion(),boss={state:'windup',pattern:'sweep',phase:1,t:0,wait:0,x:0,z:0,yaw:0,stun:0};
 motion.update(boss,{lean:0,sway:0},0);
 for(let i=1;i<=25;i++){
  boss.t=i/60;boss.yaw+=.04;
  const p=motion.update(boss,{lean:.15,sway:.08},1/60);
  assert.ok(Math.abs(p.chestRoll)<.052);
  assert.ok(Math.abs(p.waistPitch+p.chestPitch-.15)<1e-8);
 }
 const p=motion.update(boss,{lean:.15,sway:.08},0);
 assert.ok(Math.abs(p.chestRoll)>.001);
 assert.deepEqual(motion.update(boss,{lean:.15,sway:.08},1/60),p,'unchanged game tick cannot animate further');
});
test('Giant elbow lags toward a new attack target without displacing the real palm',()=>{
 const f=createGiantElbowFollow(11);
 assert.deepEqual(f.step([0,0,0],0),{x:0,y:0,z:0});
 const start=f.step([14,0,-8],1/60);
 assert.ok(start.x>0&&start.x<14);
 let last=start;
 for(let i=0;i<55;i++)last=f.step([14,0,-8],1/60);
 assert.ok(last.x>13.8);
 assert.deepEqual(f.step([14,0,-8],0),last);
 f.reset();assert.deepEqual(f.step([4,2,1],1/60),{x:4,y:2,z:1});
 assert.throws(()=>f.step([Infinity,0,0],.01),TypeError);
});
test('Giant elbow follow is stable at 30 and 120 fps',()=>{
 const run=n=>{const f=createGiantElbowFollow(11);f.step([0,0,0],0);let p;for(let i=0;i<n;i++)p=f.step([10,-3,4],1/n);return p;};
 const a=run(30),b=run(120);
 for(const k of ['x','y','z'])assert.ok(Math.abs(a[k]-b[k])<1e-9);
});
test('Blood cape and loose drapes have delayed physical motion using shared spring bank',()=>{
 const bank=createSpringBank();
 assert.equal(bank.step('cape',0,0,8),0);
 const first=bank.step('cape',.6,1/60,8);
 assert.ok(first>0&&first<.6);
 let later=first;
 for(let i=0;i<85;i++)later=bank.step('cape',.6,1/60,8);
 assert.ok(later>first&&later<.6);
 assert.equal(bank.step('cape',0,0),later);
 bank.reset();assert.equal(bank.step('cape',.2,1/60),.2);
});
test('Cloth spring follows the same motion at 30fps and 120fps',()=>{
 const run=n=>{let x=0,v=0;for(let i=0;i<n;i++){const r=springStep(x,v,.4,1/n,9);x=r.position;v=r.velocity;}return x;};
 assert.ok(Math.abs(run(30)-run(120))<1e-9);
});
test('New motion modules are mounted on real boss visuals, not combat hitbox or timer sources',()=>{
 for(const [path,pattern]of [
  ['clown-actor',/gait\.update\(g,dt,\{/],
  ['dice-giant-view',/elbowFollow\[i\]\.step/],
  ['blood-wings',/elbowCurl.*wristCurl/s],
  ['blood-regalia',/createSpringBank/],
  ['kwon-torso-rig',/chest\.rotation\.set\(p\.chestPitch,p\.chestYaw,p\.chestRoll\)/]
 ]){
  const src=readFileSync(new URL('../src/'+path+'.mjs',import.meta.url),'utf8');
  assert.match(src,pattern,path);
 }
});
