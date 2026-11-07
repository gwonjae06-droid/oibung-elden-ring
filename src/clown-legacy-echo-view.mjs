import * as THREE from 'three';
import {createClownActor as createOriginalClownActor} from './clown-actor.mjs';
import {createClownHead} from './clown-head.mjs';
import {LEGACY_ECHO_CONFIG} from './clown-legacy-echo.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

// The actual PRE-REBUILD balloon-clown rig from src/clown-actor.mjs, now
// downscaled into a targetable mini-midboss. Its world root is entirely
// decorative: all HP, collision and attack timing live in clown-troupe.
export function createLegacyEchoView(scene,{coarse=false,onActorCreated=null}={}){
 const root=new THREE.Group();root.name='original-seulwoo-mini-midbosses';root.userData.decorativeOnly=true;
 scene.add(root);
 const actors=new Map();let disposed=false;
 const bulletGeo=new THREE.SphereGeometry(.44,coarse?12:24,coarse?9:18);
 const bulletMat=new THREE.MeshPhysicalMaterial({color:0x681d2a,roughness:.36,metalness:.24,clearcoat:.45});
 const stripeGeo=new THREE.TorusGeometry(.445,.048,6,coarse?16:32);
 const stripeMat=new THREE.MeshStandardMaterial({color:0xeccba3,roughness:.55,metalness:.18});
 const smooth=u=>{const k=Math.min(1,Math.max(0,u));return k*k*(3-2*k);};
 function make(m){
  let actor=null;
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
   try{actor=createOriginalClownActor({coarse:true});}
   catch(e){console.warn('Original mini ringmaster rig unavailable',e);}
  }
  // Headless Node test and device failure fallback. Live browsers always use
  // the real original actor, including his photograph, limbs and circus ball.
  if(!actor){
   const group=new THREE.Group();group.name='original-balloon-clown-headless-fallback';
   const ball=new THREE.Mesh(new THREE.SphereGeometry(.68,12,10),
    new THREE.MeshStandardMaterial({color:0x923449,roughness:.7}));
   ball.position.y=.72;ball.name='original-circus-balance-ball';group.add(ball);
   const face=new THREE.Mesh(new THREE.SphereGeometry(.25,12,10),
    new THREE.MeshStandardMaterial({color:0xd8c6b3,roughness:.75}));
   face.name='old-seulwoo-head-fallback';face.position.y=2.0;group.add(face);
   actor={root:group,update(){},head:{dispose(){}}};
  }
  actor.root.name='mini-original-ball-riding-seulwoo';root.add(actor.root);
  actor.root.userData.decorativeOnly=true;
  let projectile=null;
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
   try{
    projectile=createClownHead({projectile:true});
    projectile.group.name='mini-original-face-bomb-projectile';
    projectile.group.visible=false;root.add(projectile.group);
   }catch(e){console.warn('Mini original head projectile unavailable',e);}
  }
  const bullets=[];
  for(let i=0;i<2;i++){
   const bullet=new THREE.Group();bullet.name='mini-original-clown-physical-juggling-projectile';
   bullet.add(new THREE.Mesh(bulletGeo,bulletMat));
   const stripe=new THREE.Mesh(stripeGeo,stripeMat);stripe.rotation.x=Math.PI/2;bullet.add(stripe);
   bullet.visible=false;root.add(bullet);bullets.push(bullet);
  }
  if(onActorCreated)onActorCreated(actor.root);
  return {actor,projectile,bullets,id:m.id,ready:actor.head?.ready||Promise.resolve(false)};
 }
 function update(g,dt=1/60){
  if(disposed)return;
  const seen=new Set(),troupe=g?.clown?.troupe,clock=g?.clown?.time||0;
  for(const m of troupe?.members||[]){
   if(!m.legacy)continue;seen.add(m.id);
   let x=actors.get(m.id);if(!x){x=make(m);actors.set(m.id,x);}
   const a=m.legacyAttack,elapsed=a?Math.max(0,clock-a.start):0;
   const pattern=a?({headBomb:'laughBomb',clap:'clap',roll:'dash',juggle:'juggle'}[a.kind]):'idle';
   const vis={pose:a?.kind==='headBomb'?'inflate':'idle',
    k:a?.kind==='headBomb'?smooth(elapsed/1):0,
    crouch:a?.kind==='roll'?.40:0,glove:a?.kind==='clap'?.95:0,
    neck:0,juggle:a?.kind==='juggle'?1:0,jump:0,shake:0,tilt:0,stomp:0};
   const proxy={...g,boss:{x:m.x,z:m.z,yaw:m.yaw,phase:1,state:'clown',
     hp:m.life,maxHp:m.maxHp,t:0},
    clown:{...g.clown,state:a?'pattern':'idle',name:pattern,pt:elapsed,
     horrorStage:1,vis,odo:m.step,bombs:[],flash:m.flash}};
   x.actor.update(proxy,dt);
   const actorRoot=x.actor.root;
   // src/clown-actor owns its animated world position; this is a scale
   // applied AFTER it has updated, without changing its internal joint IK.
   const emerge=smooth(m.age/.85),death=m.down?1-smooth(m.death/1.15):1;
   actorRoot.scale.setScalar(Math.max(.001,LEGACY_ECHO_CONFIG.scale*emerge*death));
   actorRoot.rotation.y=m.yaw;
   actorRoot.visible=!m.down||m.death<1.15;
   if(x.projectile){
    const p=x.projectile;
    p.group.visible=!m.down&&Boolean(a?.kind==='headBomb')&&elapsed<a.wind+.12;
    if(p.group.visible){
     const w=smooth((elapsed-.28)/Math.max(.12,a.wind-.28));
     p.group.position.set(a.from.x+(a.aim.x-a.from.x)*w,
       1.4+Math.sin(w*Math.PI)*2.5,a.from.z+(a.aim.z-a.from.z)*w);
     p.group.scale.setScalar(.33);
     p.setMorph?.({inflate:1+(.65*w),jaw:.15*w,wobble:.12},clock);
    }
   }
   for(let i=0;i<x.bullets.length;i++){
    const shot=a?.kind==='juggle'?a.shots?.[i]:null,obj=x.bullets[i];
    obj.visible=!m.down&&Boolean(shot)&&elapsed<shot.wind;
    if(!obj.visible)continue;
    const travel=smooth((elapsed-.12)/Math.max(.2,shot.wind-.12));
    obj.position.set(a.from.x+(shot.x-a.from.x)*travel,
     1.45+Math.sin(travel*Math.PI)*(2.5+i*.65),
     a.from.z+(shot.z-a.from.z)*travel);
    obj.rotation.set(clock*(i?1.6:1.1),clock*(i?1.2:-1.1),0);
    obj.scale.setScalar(.75+.35*travel);
   }
  }
  for(const [id,x] of actors)if(!seen.has(id)){
   root.remove(x.actor.root);disposeScene(x.actor.root);
   x.actor.head?.dispose?.();
   if(x.projectile){root.remove(x.projectile.group);x.projectile.dispose?.();}
   for(const shot of x.bullets)root.remove(shot);
   actors.delete(id);
  }
 }
 function clear(){
  for(const [id,x] of actors){
   root.remove(x.actor.root);disposeScene(x.actor.root);x.actor.head?.dispose?.();
   if(x.projectile){root.remove(x.projectile.group);x.projectile.dispose?.();}
   for(const shot of x.bullets)root.remove(shot);
   actors.delete(id);
  }
 }
 function dispose(){if(disposed)return;disposed=true;clear();root.parent?.remove(root);bulletGeo.dispose();bulletMat.dispose();stripeGeo.dispose();stripeMat.dispose();}
 return {root,update,clear,dispose,stats:()=>({miniMidbosses:actors.size,originalRigs:actors.size})};
}
