import test from 'node:test';
import assert from 'node:assert/strict';
import {legPlan,legFootWorld,gait,walkPose,capeSway,weaponAngle,ellipsoidPoint,ringAt,onSphere,LEG_ROOT_Y} from '../src/model-data.mjs';
test('the spider has eight legs, four per side, mirrored left and right',()=>{
  const legs=legPlan();
  assert.equal(legs.length,8);
  assert.equal(legs.filter(l=>l.side<0).length,4);assert.equal(legs.filter(l=>l.side>0).length,4);
  for(const l of legs.filter(l=>l.side<0)){
    const m=legs.find(o=>o.side>0&&o.k===l.k);
    assert.ok(Math.abs(l.root[0]+m.root[0])<1e-12);assert.ok(Math.abs(l.yaw+m.yaw)<1e-12);
    l.points.forEach((p,i)=>{assert.ok(Math.abs(p[0]+m.points[i][0])<1e-12);assert.equal(p[1],m.points[i][1]);assert.equal(p[2],m.points[i][2]);});
  }
});
test('every leg has three bones that connect and every foot stands on the ground',()=>{
  for(const l of legPlan()){
    assert.equal(l.points.length,4);
    assert.deepEqual(l.points[0],[0,0,0]);
    const foot=legFootWorld(l);
    assert.ok(Math.abs(foot[1])<1e-9,'foot height '+foot[1]);
    assert.equal(l.root[1],LEG_ROOT_Y);
    for(let i=1;i<4;i++){
      const a=l.points[i-1],b=l.points[i];
      assert.ok(Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])>1,'bone '+i+' too short');
    }
    assert.ok(l.points[1][1]>0&&l.points[2][1]<l.points[1][1],'the knee must rise above the root, then the leg comes down');
  }
});
test('feet are spread out around the body and reach a sensible distance',()=>{
  const feet=legPlan().map(legFootWorld);
  for(const f of feet){const r=Math.hypot(f[0],f[2]);assert.ok(r>3&&r<7,'foot radius '+r);}
  for(let i=0;i<feet.length;i++)for(let j=i+1;j<feet.length;j++){
    assert.ok(Math.hypot(feet[i][0]-feet[j][0],feet[i][2]-feet[j][2])>.8,'feet '+i+' and '+j+' overlap');
  }
});
test('legs move in an alternating gait: neighbours are in antiphase, speed adds stride',()=>{
  const legs=legPlan();
  const a=legs.find(l=>l.side<0&&l.k===0),b=legs.find(l=>l.side>0&&l.k===0);
  for(const ph of [0,.7,1.9,3.1]){
    const ga=gait(a,ph,6),gb=gait(b,ph,6);
    assert.ok(Math.abs(ga.yaw+gb.yaw)<1e-9,'left and right front legs must swing opposite');
  }
  const amp=s=>Math.max(...[0,.5,1,1.5,2,2.5,3].map(p=>Math.abs(gait(a,p,s).yaw)));
  assert.ok(amp(10)>amp(0)*2.5,'running should stride much wider than standing');
  for(let p=0;p<7;p+=.3)for(const l of legs){const g=gait(l,p,8);assert.ok(g.lift>=0&&Number.isFinite(g.yaw));}
});
test('walking swings opposite arm and leg, and stands still at zero speed',()=>{
  const w=walkPose(1.1,5);
  assert.equal(w.legL,-w.legR);assert.equal(w.armL,-w.armR);assert.ok(w.legL*w.armL<0,'arm opposes the same-side leg');
  const idle=walkPose(1.1,0);
  assert.equal(idle.legL,0);assert.equal(idle.bob,0);
  assert.ok(Math.abs(walkPose(1.1,50).legL)<=.7+1e-9,'swing is capped');
});
test('the cape trails further back the faster the player moves and every segment lags more',()=>{
  assert.ok(capeSway(0,0,8)<capeSway(0,0,0));
  assert.ok(capeSway(2,0,0)<capeSway(0,0,0));
  for(let t=0;t<10;t+=.5)for(let i=0;i<3;i++)assert.ok(Number.isFinite(capeSway(i,t,3)));
});
test('the weapon swing raises first, then strikes, then returns to rest',()=>{
  const a={wind:.2,active:.15,total:.7};
  assert.ok(Math.abs(weaponAngle({...a,t:0}))<1e-12);
  assert.ok(weaponAngle({...a,t:.2})<-1.4,'fully raised at the end of wind-up');
  assert.ok(weaponAngle({...a,t:.35})>1.3,'struck by the end of the active frames');
  assert.ok(Math.abs(weaponAngle({...a,t:.7}))<1e-9,'back to rest');
});
test('points computed on the spider abdomen really lie on its surface, above its centre',()=>{
  const c=[0,2.1,-1.5],r=[2.1,1.785,2.625];
  for(const [x,z] of [[0,-0.2],[0,-3.0],[.9,-2.8],[-1.2,-1.4],[.6,-3.7]]){
    const e=ellipsoidPoint(c,r,x,z);
    assert.ok(e.inside,'('+x+','+z+') outside');
    const q=((e.point[0]-c[0])/r[0])**2+((e.point[1]-c[1])/r[1])**2+((e.point[2]-c[2])/r[2])**2;
    assert.ok(Math.abs(q-1)<1e-9,'not on surface: '+q);
    assert.ok(e.point[1]>=c[1]);
    assert.ok(Math.abs(Math.hypot(...e.normal)-1)<1e-9&&e.normal[1]>0);
  }
  assert.equal(ellipsoidPoint(c,r,5,0).inside,false);
});
test('abdomen bands wrap the body: widest in the middle, closing to nothing at both ends',()=>{
  const c=[0,2.1,-1.5],r=[2.1,1.785,2.625];
  const mid=ringAt(c,r,c[2]);
  assert.ok(Math.abs(mid.rx-r[0])<1e-9&&Math.abs(mid.ry-r[1])<1e-9);
  assert.ok(ringAt(c,r,-3.0).rx<mid.rx&&ringAt(c,r,0).rx<mid.rx);
  assert.ok(Math.abs(ringAt(c,r,c[2]+r[2]).rx)<1e-9);
  const q=ringAt(c,r,-3.0);assert.ok(Math.abs(q.ry/q.rx-r[1]/r[0])<1e-9,'bands keep the body proportions');
});
test('head eyes sit exactly on the head sphere',()=>{
  const c=[0,2.75,1.75];
  for(const d of [[.7,.65,.2],[-.7,.65,.2],[.35,.93,-.05]]){
    const p=onSphere(c,1.12,d);
    assert.ok(Math.abs(Math.hypot(p[0]-c[0],p[1]-c[1],p[2]-c[2])-1.12)<1e-9);
  }
});
