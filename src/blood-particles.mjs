import * as THREE from 'three';
import {BLOOD_FLOW,advanceBloodDrop,bloodContactFraction,mixBloodPuddle,advanceBloodPuddle} from './blood-flow-dynamics.mjs';
import {sweepBloodWall,deflectBloodAtWall,coalesceBloodBeads} from './blood-contact-dynamics.mjs';

// All droplets run on a slowed clock so blood reads as heavy and viscous rather than splashing instantly.
const SLOW=.62,PUDDLE_LIFE=BLOOD_FLOW.puddleLife,TAU=Math.PI*2;
const clamp01=v=>Math.max(0,Math.min(1,v));
const ease=u=>1-Math.pow(1-clamp01(u),2);

export function createBloodParticles(parent,fluid,quality,{reduced=false}={}){
 const drops=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.drops),pools=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.puddles);
 const ringCount=quality.ripples||12,ringGeo=new THREE.RingGeometry(.94,1,48),ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 const rings=new THREE.InstancedMesh(ringGeo,ringMat,ringCount),tint=new THREE.Color();
 drops.frustumCulled=pools.frustumCulled=rings.frustumCulled=false;rings.renderOrder=3;
 drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pools.instanceMatrix.setUsage(THREE.DynamicDrawUsage);rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 rings.setColorAt(0,tint.setRGB(0,0,0));parent.add(drops,pools,rings);
 const particles=Array.from({length:quality.drops},()=>({life:0,total:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,g:1,drag:BLOOD_FLOW.drag,quiet:false,emitter:-1,mergePulse:0,wallCool:0}));
 const puddles=Array.from({length:quality.puddles},()=>({life:0,total:1,x:0,z:0,vx:0,vz:0,r:0,cur:0,vr:0,seed:0}));
 const ripples=Array.from({length:ringCount},()=>({life:0,total:1,delay:0,x:0,z:0,r0:0,r1:1,power:1}));
 const dummy=new THREE.Object3D(),dropAxis=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 let cursor=0,poolCursor=0,ringCursor=0,seed=73,burstSerial=0,mergeOffset=0,wallSink=null;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function puddle(x,z,r=.45,impulse=null){
  let p=puddles.find(p=>p.life>0&&Math.hypot(p.x-x,p.z-z)<p.r+r);
  // Surface area and incoming momentum blend when separate drops meet.
  if(p){
   mixBloodPuddle(p,x,z,r,impulse);
  }else{
   p=puddles[poolCursor++%puddles.length];
   Object.assign(p,{x,z,vx:(impulse?.x||0)*.18,vz:(impulse?.z||0)*.18,r,cur:r*.18,vr:.45+Math.min(1,Math.hypot(impulse?.x||0,impulse?.z||0))*.5,seed:random()*TAU});
  }
  p.life=p.total=PUDDLE_LIFE;
 }
 function ripple(x,z,{from=.3,to=3,duration=1.6,delay=0,power=1}={}){
  const q=ripples[ringCursor++%ripples.length];Object.assign(q,{x,z,r0:from,r1:to,life:duration,total:duration,delay,power});
 }
 function burst(x,y,z,{count=16,power=6,direction,lift=1,gravity=1,quiet=false}={}){
  const emitter=++burstSerial;
  for(let i=0;i<Math.min(count,particles.length);i++){
   const p=particles[cursor++%particles.length],a=random()*TAU,speed=power*(.3+random()*.7);
   Object.assign(p,{x,y,z,vx:Math.sin(a)*speed+(direction?.x||0),vz:Math.cos(a)*speed+(direction?.z||0),
    vy:(2+random()*power*.8)*lift,size:.06+random()*.13,life:1.1+random()*.8,
    g:gravity,drag:BLOOD_FLOW.drag+random()*.22,quiet,emitter,mergePulse:0,wallCool:0});
   p.total=p.life;
  }
 }
 // Blood welling up from the floor while a pattern is still charging; it never leaves a puddle behind.
 function rise(x,z,{r=2,count=2}={}){
  const emitter=++burstSerial;
  for(let i=0;i<Math.min(count,particles.length);i++){const p=particles[cursor++%particles.length],a=random()*TAU,d=Math.sqrt(random())*r;Object.assign(p,{x:x+Math.sin(a)*d,y:.1,z:z+Math.cos(a)*d,vx:0,vz:0,vy:1.2+random()*1.4,size:.05+random()*.08,life:1+random()*.5,g:.28,drag:1.4,quiet:true,emitter,mergePulse:0,wallCool:0});p.total=p.life;}
 }
 function update(dt,time,{pull=null,still=false,retract=null}={}){
  let n=0,k=0,m=0;
  for(const p of particles){
   if(p.life<=0)continue;const h=still?dt*.09:dt*SLOW;
   p.life-=h;if(p.life<=0)continue;
   const prevY=p.y,prevX=p.x,prevZ=p.z;
   advanceBloodDrop(p,h);
   p.mergePulse=Math.max(0,(p.mergePulse||0)-h*3.4);
   p.wallCool=Math.max(0,(p.wallCool||0)-h);
   const groundFraction=bloodContactFraction(prevY,p.y);
   const hit=!p.quiet&&p.wallCool===0?sweepBloodWall({x:prevX,y:prevY,z:prevZ,size:p.size},p):null;
   if(hit&&hit.t<=groundFraction){
    deflectBloodAtWall(p,hit);
    p.wallCool=.22;
    if(wallSink)wallSink(hit,quality.low?2:4);
   }else if(p.y<BLOOD_FLOW.ground){
    const x=prevX+(p.x-prevX)*groundFraction,z=prevZ+(p.z-prevZ)*groundFraction;
    p.life=0;
    if(!p.quiet){
     puddle(x,z,p.size*2.7,{x:p.vx,z:p.vz});
     if(random()<.35)ripple(x,z,{from:.1,to:p.size*9+.4,duration:1.1,power:.55});
    }
    continue;
   }
  }
  // Constant bounded local pairing avoids quadratic all-pairs interactions.
  // Group only sibling droplets after they have visibly separated from the
  // emitter; the larger merged beads conserve approximate mass and momentum.
  if(dt>0){
   coalesceBloodBeads(particles,{limit:quality.low?3:7,offset:mergeOffset});
   mergeOffset=(mergeOffset+17)%particles.length;
  }
  for(const p of particles){
   if(p.life<=0)continue;
   const fade=Math.min(1,p.life/.3),pulse=p.mergePulse||0,
    stretch=Math.min(2.7,1+Math.abs(p.vy)*.09+pulse*.35),
    width=p.size*fade*(1+pulse*.21);
   dummy.position.set(p.x,p.y,p.z);
   dropAxis.set(p.vx,p.vy,p.vz);
   if(dropAxis.lengthSq()>1e-6)dummy.quaternion.setFromUnitVectors(up,dropAxis.normalize());
   else dummy.quaternion.identity();
   dummy.scale.set(width*(1+pulse*.2),p.size*fade*stretch,width*(1-pulse*.12));
   dummy.updateMatrix();drops.setMatrixAt(n++,dummy.matrix);
  }
  for(const p of puddles){
   if(p.life<=0)continue;p.life-=dt;if(p.life<=0)continue;
   // Damped radial expansion provides liquid mass/surface tension; friction
   // preserves a small amount of incoming horizontal momentum.
   advanceBloodPuddle(p,dt,{pull,retract});
   if(retract&&Math.hypot(retract.x-p.x,retract.z-p.z)<1.2){p.life=0;continue;}
   const fade=Math.min(1,p.life/1.6),size=p.cur*fade,stretch=Math.min(.4,Math.hypot(p.vx,p.vz)*.14);
   if(size<.02)continue;
   dummy.position.set(p.x,.025,p.z);dummy.rotation.set(0,Math.atan2(p.vx,p.vz),0);
   dummy.scale.set(size*(1-.16*stretch),.03*fade+.004,size*(1+.68*stretch));dummy.updateMatrix();pools.setMatrixAt(k++,dummy.matrix);
  }
  for(const q of ripples){
   if(q.life<=0)continue;if(q.delay>0){q.delay-=dt;continue;}
   q.life-=dt;if(q.life<=0)continue;
   const u=1-q.life/q.total,radius=q.r0+(q.r1-q.r0)*ease(u),glow=Math.sin(Math.PI*clamp01(u))*q.power;
   dummy.position.set(q.x,.06,q.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(Math.max(.05,radius));dummy.updateMatrix();
   rings.setMatrixAt(m,dummy.matrix);rings.setColorAt(m,tint.setRGB(.8*glow,.08*glow,.16*glow));m++;
  }
  drops.count=n;pools.count=k;rings.count=m;
  drops.instanceMatrix.needsUpdate=pools.instanceMatrix.needsUpdate=rings.instanceMatrix.needsUpdate=true;if(rings.instanceColor)rings.instanceColor.needsUpdate=true;
 }
 function clear(){for(const p of particles)p.life=0;for(const p of puddles)p.life=0;for(const q of ripples)q.life=0;drops.count=pools.count=rings.count=0;}
 function setWallSplashListener(fn){wallSink=typeof fn==='function'?fn:null;}
 clear();return {burst,rise,puddle,ripple,update,clear,setWallSplashListener,
  dispose(){clear();wallSink=null;drops.dispose();pools.dispose();rings.dispose();ringGeo.dispose();ringMat.dispose();},
  get active(){return particles.filter(p=>p.life>0).length;},get puddles(){return puddles.filter(p=>p.life>0).length;},get ripples(){return ripples.filter(q=>q.life>0).length;},
  get stats(){return {beads:particles.filter(p=>p.life>0&&p.size>.2).length,particleCapacity:quality.drops};}
 };
}
