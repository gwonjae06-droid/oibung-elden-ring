import * as THREE from 'three';

// Small fixed-size visual rivulets on boss armor and hard cathedral surfaces.
// Torso-local channels inherit every rigged bow and turn; wall trails remain
// world-space. They never introduce a collision mesh or damage volume.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const UP=new THREE.Vector3(0,1,0);

export function bloodTorsoRivulet(lane,u){
 const t=clamp(u),side=lane%2===0?-1:1,offset=.13+(lane%5)*.11,
  sideFlow=Math.sin(t*7+lane*1.73)*.035,
  x=side*offset*(.82+.18*Math.sin(Math.PI*t))+sideFlow,
  y=4.13-3.38*t,
  z=.55+.18*Math.sin(Math.PI*t)+.37*t+.02*Math.sin(t*9+lane);
 return [x,y,z];
}
export function bloodWallRivulet(origin,age,seed=0){
 const t=clamp(age),side=seed%2?1:-1;
 return [
  origin.x+side*Math.sin(t*4+seed)*.045,
  Math.max(.11,origin.y-(.3+2.4*t*t)),
  origin.z+Math.cos(t*3+seed)*.036
 ];
}
export function createBloodSurfaceFlow(bossTorso,worldParent,fluid,{coarse=false,reduced=false}={}){
 const bossCount=coarse?10:22,wallCount=coarse?8:18;
 const bossMesh=new THREE.InstancedMesh(fluid.sphere,fluid.material,bossCount),
  wallMesh=new THREE.InstancedMesh(fluid.sphere,fluid.material,wallCount);
 bossMesh.name='blood-rivuletted-boss-surface';
 wallMesh.name='blood-rivuletted-cathedral-surface';
 bossMesh.count=wallMesh.count=0;
 bossMesh.frustumCulled=wallMesh.frustumCulled=false;
 bossMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 wallMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 bossTorso.add(bossMesh);worldParent.add(wallMesh);
 const boss=Array.from({length:bossCount},()=>({life:0,duration:1,age:0,lane:0,radius:0})),
  walls=Array.from({length:wallCount},()=>({life:0,duration:1,age:0,origin:{x:0,y:0,z:0},seed:0,nx:0,nz:0}));
 const dummy=new THREE.Object3D(),tangent=new THREE.Vector3(),start=new THREE.Vector3(),end=new THREE.Vector3(),
  sideOffset=new THREE.Vector3();let bi=0,wi=0,disposed=false;
 function streakBoss(count=3){
  if(disposed)return;
  const n=Math.min(bossCount,Math.max(0,count));
  for(let i=0;i<n;i++){
   const a=boss[bi%bossCount],lane=bi++;
   Object.assign(a,{life:1,duration:1.2+(lane%5)*.18,age:0,lane,radius:.055+(lane%3)*.017});
  }
 }
 function splashWall(hit,count=3){
  if(disposed||!hit||![hit.x,hit.y,hit.z,hit.nx,hit.nz].every(Number.isFinite))return;
  const n=Math.min(wallCount,Math.max(0,count));
  for(let i=0;i<n;i++){
   const index=wi++,r=walls[index%wallCount];
   const spread=((i%3)-1)*.13,normalLength=Math.hypot(hit.nx,hit.nz)||1;
   Object.assign(r,{
    life:1,age:0,duration:1.05+(index%4)*.22,seed:index,
    origin:{x:hit.x+spread*hit.nz+hit.nx/normalLength*.055,
      y:Math.max(.14,hit.y+(index%5)*.1),z:hit.z-spread*hit.nx+hit.nz/normalLength*.055},
    nx:hit.nx/normalLength,nz:hit.nz/normalLength
   });
  }
 }
 function update(dt){
  if(disposed)return;
  const h=clamp(dt,0,.05);let n=0,k=0;
  for(const r of boss){
   if(r.life<=0)continue;
   r.age=Math.min(r.duration,r.age+h);
   const u=r.age/r.duration;
   if(u>=1){r.life=0;continue;}
   const p=bloodTorsoRivulet(r.lane,u),next=bloodTorsoRivulet(r.lane,Math.min(1,u+.012));
   start.set(...p);end.set(...next);
   tangent.subVectors(end,start).normalize();
   dummy.position.copy(start);dummy.quaternion.setFromUnitVectors(UP,tangent);
   const size=r.radius*(.8+.22*Math.sin(Math.PI*u));
   dummy.scale.set(size,size*(1.4+u*.9),size*.78);
   dummy.updateMatrix();bossMesh.setMatrixAt(n++,dummy.matrix);
  }
  for(const r of walls){
   if(r.life<=0)continue;
   r.age=Math.min(r.duration,r.age+h);
   const u=r.age/r.duration;
   if(u>=1){r.life=0;continue;}
   const p=bloodWallRivulet(r.origin,u,r.seed),
    next=bloodWallRivulet(r.origin,Math.min(1,u+.012),r.seed);
   start.set(...p);end.set(...next);
   tangent.subVectors(end,start).normalize();
   dummy.position.copy(start);
   dummy.quaternion.setFromUnitVectors(UP,tangent);
   const radius=.055+.016*(r.seed%3);
   dummy.scale.set(radius,radius*(1.55+u*.72),radius*.62);
   dummy.updateMatrix();wallMesh.setMatrixAt(k++,dummy.matrix);
  }
  bossMesh.count=n;wallMesh.count=k;
  bossMesh.instanceMatrix.needsUpdate=wallMesh.instanceMatrix.needsUpdate=true;
 }
 function clear(){for(const r of boss)r.life=0;for(const r of walls)r.life=0;bossMesh.count=wallMesh.count=0;}
 function dispose(){if(disposed)return;disposed=true;clear();bossTorso.remove(bossMesh);worldParent.remove(wallMesh);bossMesh.dispose();wallMesh.dispose();}
 return {streakBoss,splashWall,update,clear,dispose,
   stats:()=>({boss:bossMesh.count,wall:wallMesh.count,bossCap:bossCount,wallCap:wallCount,collidable:false})};
}
