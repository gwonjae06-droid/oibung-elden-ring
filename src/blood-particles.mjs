import * as THREE from 'three';

export function createBloodParticles(parent,fluid,quality){
 const drops=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.drops),pools=new THREE.InstancedMesh(fluid.sphere,fluid.material,quality.puddles);
 drops.frustumCulled=pools.frustumCulled=false;drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pools.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(drops,pools);
 const particles=Array.from({length:quality.drops},()=>({life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,size:0,total:1})),puddles=Array.from({length:quality.puddles},()=>({life:0,x:0,z:0,r:0,total:1}));
 const dummy=new THREE.Object3D();let cursor=0,poolCursor=0,seed=73;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function puddle(x,z,r=.45){
  let p=puddles.find(p=>p.life>0&&Math.hypot(p.x-x,p.z-z)<p.r+r);
  if(p){p.x=(p.x+x)*.5;p.z=(p.z+z)*.5;p.r=Math.min(2.2,Math.sqrt(p.r*p.r+r*r));}
  else {p=puddles[poolCursor++%puddles.length];Object.assign(p,{x,z,r});}p.life=p.total=3.8;
 }
 function burst(x,y,z,{count=16,power=6,direction}={}){
  for(let i=0;i<Math.min(count,particles.length);i++){const p=particles[cursor++%particles.length],a=random()*Math.PI*2,speed=power*(.3+random()*.7);Object.assign(p,{x,y,z,vx:Math.sin(a)*speed+(direction?.x||0),vz:Math.cos(a)*speed+(direction?.z||0),vy:2+random()*power*.8,size:.06+random()*.13,life:1+random()*.7});p.total=p.life;}
 }
 function update(dt,time,{pull=null,still=false}={}){
  let n=0,k=0;for(const p of particles){if(p.life<=0)continue;const h=still?dt*.09:dt;p.life-=h;p.vy-=h*15;p.vx*=Math.exp(-h*.75);p.vz*=Math.exp(-h*.75);p.x+=p.vx*h;p.y+=p.vy*h;p.z+=p.vz*h;
   if(p.y<.08){p.life=0;puddle(p.x,p.z,p.size*2.7);continue;}
   dummy.position.set(p.x,p.y,p.z);const f=Math.min(1,p.life/.25),stretch=Math.min(3,1+Math.abs(p.vy)*.1);dummy.scale.set(p.size*f,p.size*f*stretch,p.size*f);dummy.rotation.set(0,0,-p.vx*.03);dummy.updateMatrix();drops.setMatrixAt(n++,dummy.matrix);
  }
  for(const p of puddles){if(p.life<=0)continue;p.life-=dt;const f=Math.min(1,p.life/.8),age=p.total-p.life;if(pull){const dx=pull.x-p.x,dz=pull.z-p.z,d=Math.hypot(dx,dz)||1;p.x+=dx/d*dt*.6;p.z+=dz/d*dt*.6;}dummy.position.set(p.x,.025,p.z);dummy.rotation.set(0,Math.sin(time+age),0);const ripple=1+Math.sin(time*4+age)*.04;dummy.scale.set(p.r*f*ripple,.025*f,p.r*f/ripple);dummy.updateMatrix();pools.setMatrixAt(k++,dummy.matrix);}
  drops.count=n;pools.count=k;drops.instanceMatrix.needsUpdate=pools.instanceMatrix.needsUpdate=true;
 }
 function clear(){for(const p of particles)p.life=0;for(const p of puddles)p.life=0;drops.count=pools.count=0;}
 clear();return {burst,puddle,update,clear,dispose(){clear();drops.dispose();pools.dispose();},get active(){return particles.filter(p=>p.life>0).length;},get puddles(){return puddles.filter(p=>p.life>0).length;}};
}
