import * as THREE from 'three';

// Pooled, physically lit fragments connect a hit to the attacked body.
// The underlying hit is still decided solely by each boss combat engine.
const COLORS=Object.freeze({kwon:0xb4bdc6,clown:0xd9a981,dice:0xe1ba72,blood:0x9d293c,gyuwon:0xacbdd1});
const EVENTS=new Set(['boss-hit','player-hit','dice-impact','dice-giant-head-impact',
 'dice-giant-neck-impact','dice-giant-hand-destroyed','clown-blast','clown-bounce','blood-hit','blood-impact']);
const fract=x=>x-Math.floor(x);
const seed=(a,b)=>fract(Math.sin(a*127.13+b*39.71)*43758.545);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createCinematicImpactFx(scene,{profile='kwon',coarse=false,reduced=false}={}){
 if(!COLORS[profile])throw new RangeError('Unknown boss for contact FX');
 const count=coarse?24:72,geometry=new THREE.DodecahedronGeometry(1,0);
 const material=new THREE.MeshStandardMaterial({color:0xffffff,metalness:profile==='blood'?.05:.38,
  roughness:profile==='blood'?.34:.55,emissive:profile==='blood'?0x240408:0x17110b,emissiveIntensity:.22,
  transparent:false,depthWrite:true});
 const mesh=new THREE.InstancedMesh(geometry,material,count);
 mesh.name='cinematic-physical-impact-fragments';mesh.frustumCulled=false;mesh.visible=false;
 mesh.castShadow=mesh.receiveShadow=false;scene.add(mesh);
 const origin=new THREE.Color(COLORS[profile]),tint=new THREE.Color(),dummy=new THREE.Object3D();
 // Inactive instance transforms must never appear as giant origin fragments.
 dummy.scale.setScalar(0);dummy.updateMatrix();
 for(let i=0;i<count;i++)mesh.setMatrixAt(i,dummy.matrix);
 mesh.instanceMatrix.needsUpdate=true;
 const particles=Array.from({length:count},()=>({alive:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,
  size:0,life:0,total:0,spin:0}));
 let next=0,emitIndex=0,disposed=false,liveCount=0;
 function reset(){
  for(const p of particles)p.alive=false;
  mesh.visible=false;liveCount=0;
 }
 function event(e,game){
  if(disposed||!e||!EVENTS.has(e.type))return;
  const t=e.type,bossHit=t==='boss-hit',playerHit=t==='player-hit';
  const p=playerHit?game?.player:bossHit?game?.boss:null;
  const x=Number.isFinite(e.x)?e.x:p?.x??0;
  const z=Number.isFinite(e.z)?e.z:p?.z??0;
  const y=Number.isFinite(e.y)?e.y:playerHit?1.4:t.includes('giant')?8:bossHit?2.6:.9;
  const strong=t==='dice-giant-head-impact'||t==='dice-giant-neck-impact'||t==='clown-blast';
  const pieces=coarse?(strong?8:4):reduced?(strong?10:5):(strong?18:9);
  for(let i=0;i<pieces;i++){
   const idx=next++%count,particle=particles[idx],n=++emitIndex,
     angle=seed(n,1)*Math.PI*2,distance=1+seed(n,2)*.75;
   particle.alive=true;particle.x=x;particle.y=y;particle.z=z;
   particle.vx=Math.cos(angle)*distance*(strong?7:3.7);
   particle.vz=Math.sin(angle)*distance*(strong?7:3.7);
   particle.vy=3+seed(n,3)*(strong?6:3.2);
   particle.size=(.045+seed(n,4)*.105)*(strong?1.35:1);
   particle.life=particle.total=reduced?.3:.35+seed(n,5)*.35;
   particle.spin=seed(n,6)*Math.PI*2;
   tint.copy(origin).lerp(new THREE.Color(0xffe9d3),seed(n,7)*.48);
   mesh.setColorAt(idx,tint);
  }
  mesh.instanceColor.needsUpdate=true;mesh.visible=true;
 }
 function update(dt=0){
  if(disposed||!mesh.visible)return;
  const h=clamp(Number.isFinite(dt)?dt:0,0,.05);
  liveCount=0;
  for(let i=0;i<count;i++){
   const p=particles[i];
   if(!p.alive){dummy.scale.setScalar(0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);continue;}
   p.life-=h;
   if(p.life<=0||p.y<-.35){p.alive=false;dummy.scale.setScalar(0);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);continue;}
   const k=clamp(p.life/p.total);
   p.x+=p.vx*h;p.z+=p.vz*h;p.y+=p.vy*h;p.vy-=17*h;
   dummy.position.set(p.x,p.y,p.z);
   dummy.rotation.set(p.spin+k*3,p.spin*.6+k*2,p.spin*.25);
   dummy.scale.setScalar(p.size*Math.sqrt(k));dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);liveCount++;
  }
  mesh.instanceMatrix.needsUpdate=true;mesh.visible=liveCount>0;
 }
 function dispose(){
  if(disposed)return;disposed=true;mesh.parent?.remove(mesh);
  geometry.dispose();material.dispose();
 }
 return {mesh,event,update,reset,dispose,stats:()=>({profile,poolSize:count,active:liveCount,physicsCollisions:0})};
}
