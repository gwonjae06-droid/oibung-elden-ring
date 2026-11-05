import * as THREE from 'three';

// All droplets run on a slowed clock so blood reads as heavy and viscous rather than splashing instantly.
const SLOW=.62,GRAVITY=9,DRAG=1.05,PUDDLE_LIFE=6,PUDDLE_SPREAD=1.35,TAU=Math.PI*2;
const clamp01=v=>Math.max(0,Math.min(1,v));
const ease=u=>1-Math.pow(1-clamp01(u),2);

export function createBloodParticles(parent,fluid,quality,{reduced=false}={}){
 const drops=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.drops),pools=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.puddles);
 const ringCount=quality.ripples||12,ringGeo=new THREE.RingGeometry(.94,1,48),ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 const rings=new THREE.InstancedMesh(ringGeo,ringMat,ringCount),tint=new THREE.Color();
 drops.frustumCulled=pools.frustumCulled=rings.frustumCulled=false;rings.renderOrder=3;
 drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pools.instanceMatrix.setUsage(THREE.DynamicDrawUsage);rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 rings.setColorAt(0,tint.setRGB(0,0,0));parent.add(drops,pools,rings);
 const particles=Array.from({length:quality.drops},()=>({life:0,total:1,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,g:1,quiet:false}));
 const puddles=Array.from({length:quality.puddles},()=>({life:0,total:1,x:0,z:0,vx:0,vz:0,r:0,cur:0,seed:0}));
 const ripples=Array.from({length:ringCount},()=>({life:0,total:1,delay:0,x:0,z:0,r0:0,r1:1,power:1}));
 const dummy=new THREE.Object3D();let cursor=0,poolCursor=0,ringCursor=0,seed=73;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function puddle(x,z,r=.45,impulse=null){
  let p=puddles.find(p=>p.life>0&&Math.hypot(p.x-x,p.z-z)<p.r+r);
  // Surface area and incoming momentum blend when separate drops meet.
  if(p){
   const old=p.r*p.r,added=r*r,total=old+added;
   p.x=(p.x*old+x*added)/total;p.z=(p.z*old+z*added)/total;
   p.vx=(p.vx*old+(impulse?.x||0)*added*.18)/total;
   p.vz=(p.vz*old+(impulse?.z||0)*added*.18)/total;
   p.r=Math.min(2.4,Math.sqrt(total));
  }else{
   p=puddles[poolCursor++%puddles.length];
   Object.assign(p,{x,z,vx:(impulse?.x||0)*.18,vz:(impulse?.z||0)*.18,r,cur:r*.18,seed:random()*TAU});
  }
  p.life=p.total=PUDDLE_LIFE;
 }
 function ripple(x,z,{from=.3,to=3,duration=1.6,delay=0,power=1}={}){
  const q=ripples[ringCursor++%ripples.length];Object.assign(q,{x,z,r0:from,r1:to,life:duration,total:duration,delay,power});
 }
 function burst(x,y,z,{count=16,power=6,direction,lift=1,gravity=1,quiet=false}={}){
  for(let i=0;i<Math.min(count,particles.length);i++){const p=particles[cursor++%particles.length],a=random()*TAU,speed=power*(.3+random()*.7);Object.assign(p,{x,y,z,vx:Math.sin(a)*speed+(direction?.x||0),vz:Math.cos(a)*speed+(direction?.z||0),vy:(2+random()*power*.8)*lift,size:.06+random()*.13,life:1.1+random()*.8,g:gravity,quiet});p.total=p.life;}
 }
 // Blood welling up from the floor while a pattern is still charging; it never leaves a puddle behind.
 function rise(x,z,{r=2,count=2}={}){
  for(let i=0;i<Math.min(count,particles.length);i++){const p=particles[cursor++%particles.length],a=random()*TAU,d=Math.sqrt(random())*r;Object.assign(p,{x:x+Math.sin(a)*d,y:.1,z:z+Math.cos(a)*d,vx:0,vz:0,vy:1.2+random()*1.4,size:.05+random()*.08,life:1+random()*.5,g:.28,quiet:true});p.total=p.life;}
 }
 function update(dt,time,{pull=null,still=false,retract=null}={}){
  let n=0,k=0,m=0;
  for(const p of particles){
   if(p.life<=0)continue;const h=still?dt*.09:dt*SLOW;
   p.life-=h;if(p.life<=0)continue;
   p.vy-=h*GRAVITY*p.g;const drag=Math.exp(-h*DRAG);p.vx*=drag;p.vz*=drag;p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;
   if(p.y<.08){p.life=0;if(!p.quiet){puddle(p.x,p.z,p.size*2.7,{x:p.vx,z:p.vz});if(random()<.35)ripple(p.x,p.z,{from:.1,to:p.size*9+.4,duration:1.1,power:.55});}continue;}
   const f=Math.min(1,p.life/.3),stretch=Math.min(2.4,1+Math.abs(p.vy)*.09);
   dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.size*f,p.size*f*stretch,p.size*f);dummy.rotation.set(0,0,-p.vx*.03);dummy.updateMatrix();drops.setMatrixAt(n++,dummy.matrix);
  }
  for(const p of puddles){
   if(p.life<=0)continue;p.life-=dt;if(p.life<=0)continue;
   p.cur+=(p.r-p.cur)*(1-Math.exp(-dt*PUDDLE_SPREAD));
   // Viscous ground flow: impact momentum fades through friction; siphons
   // accelerate pools smoothly instead of teleporting them.
   const attractor=retract||pull;
   if(attractor){
    const dx=attractor.x-p.x,dz=attractor.z-p.z,d=Math.hypot(dx,dz)||1;
    if(retract&&d<1.2){p.life=0;continue;}
    const acceleration=retract?18:4.4;
    p.vx+=dx/d*acceleration*dt;p.vz+=dz/d*acceleration*dt;
   }
   const friction=Math.exp(-dt*(retract?2.6:4.8));
   p.vx*=friction;p.vz*=friction;
   const cap=retract?3.8:pull?1.25:.85,velocity=Math.hypot(p.vx,p.vz);
   if(velocity>cap){p.vx*=cap/velocity;p.vz*=cap/velocity;}
   p.x+=p.vx*dt;p.z+=p.vz*dt;
   if(retract){p.r*=Math.exp(-dt*.55);p.cur=Math.min(p.cur,p.r);}
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
 clear();return {burst,rise,puddle,ripple,update,clear,dispose(){clear();drops.dispose();pools.dispose();rings.dispose();ringGeo.dispose();ringMat.dispose();},get active(){return particles.filter(p=>p.life>0).length;},get puddles(){return puddles.filter(p=>p.life>0).length;},get ripples(){return ripples.filter(q=>q.life>0).length;}};
}
