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
 const actors=new Map(),standby=[];let disposed=false,prepared=false;
 const bulletGeo=new THREE.SphereGeometry(.44,coarse?12:24,coarse?9:18);
 const bulletMat=new THREE.MeshPhysicalMaterial({color:0x681d2a,roughness:.36,metalness:.24,clearcoat:.45});
 const stripeGeo=new THREE.TorusGeometry(.445,.048,6,coarse?16:32);
 const stripeMat=new THREE.MeshStandardMaterial({color:0xeccba3,roughness:.55,metalness:.18});
 const smooth=u=>{const k=Math.min(1,Math.max(0,u));return k*k*(3-2*k);};
 function build(m){
  let actor=null;
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
   try{actor=createOriginalClownActor({coarse:true});}
   catch(e){console.warn('Original mini ringmaster rig unavailable',e);}
  }
  // If the legacy factory is unavailable, preserve the WHOLE old circus
  // silhouette (head, coat, articulated arms, gloves, legs, balance ball)
  // instead of showing an anonymous ball and a tiny featureless face.
  if(!actor){
   const group=new THREE.Group();group.name='original-vintage-clown-complete-fallback';
   const red=new THREE.MeshStandardMaterial({color:0x8c213b,roughness:.87});
   const white=new THREE.MeshStandardMaterial({color:0xe1cdb3,roughness:.83});
   const dark=new THREE.MeshStandardMaterial({color:0x1a121f,roughness:.74});
   const gold=new THREE.MeshStandardMaterial({color:0xc39c52,metalness:.48,roughness:.53});
   const ball=new THREE.Mesh(new THREE.SphereGeometry(2.6,coarse?16:24,coarse?12:18),
    new THREE.MeshStandardMaterial({color:0x9b394d,roughness:.74}));
   ball.position.y=2.6;ball.name='original-circus-balance-ball';group.add(ball);
   const makePart=(geo,mat,name,x,y,z)=>{
    const obj=new THREE.Mesh(geo,mat);obj.name=name;obj.position.set(x,y,z);group.add(obj);return obj;
   };
   const torso=makePart(new THREE.CylinderGeometry(.68,.82,2,12),red,
    'vintage-original-full-velvet-torso',0,6.7,0);
   makePart(new THREE.ConeGeometry(1.15,1.65,14,1,true),red,
    'vintage-original-ringmaster-tailcoat',0,5.35,0);
   for(const side of[-1,1]){
    const sleeve=makePart(new THREE.CylinderGeometry(.26,.21,1.6,10),
     side<0?white:red,'vintage-original-full-arm-'+side,side*1.06,6.53,.2);
    sleeve.rotation.z=side*.27;
    makePart(new THREE.SphereGeometry(.33,10,8),white,
     'vintage-original-white-gloved-hand-'+side,side*1.3,5.65,.45);
    makePart(new THREE.CylinderGeometry(.22,.18,1.35,10),dark,
     'vintage-original-two-legs-'+side,side*.51,5.14,0);
    makePart(new THREE.SphereGeometry(.34,10,8),dark,
     'vintage-original-circus-shoe-'+side,side*.51,4.53,.38).scale.set(1,.48,1.55);
   }
   const oldHead=createClownHead();
   oldHead.group.name='vintage-original-sculpted-clown-head';
   oldHead.group.position.set(0,9.0,.38);group.add(oldHead.group);
   const hat=makePart(new THREE.CylinderGeometry(.67,.69,.92,14),dark,
    'vintage-ringmaster-tall-hat',0,10.1,.23);
   makePart(new THREE.CylinderGeometry(.96,.98,.12,16),gold,
    'vintage-ringmaster-wooden-hat-brim',0,9.58,.20);
   actor={root:group,update(){},head:{ready:oldHead.ready,dispose:()=>oldHead.dispose()}};
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
  actor.root.visible=false;
  return {actor,projectile,bullets,id:m.id,ready:actor.head?.ready||Promise.resolve(false),
   accumulated:0,proxy:null,proxyBoss:{},proxyClown:{}};
 }
 // Prebuild and rasterize both complete old rigs plus both projectile rigs
 // before the first combat frame; visible props are reused, never recreated
 // during the expensive second-act transformation.
 function prewarm(){
  if(prepared)return Promise.allSettled(standby.map(x=>x.ready));
  prepared=true;
  for(let i=0;i<LEGACY_ECHO_CONFIG.max;i++)standby.push(build({id:-1-i}));
  return Promise.allSettled(standby.flatMap(x=>[x.ready,x.projectile?.ready]));
 }
 function prepareGpuWarmup(){
  prewarm();
  for(const x of standby){
   x.actor.root.visible=true;x.actor.root.position.set(0,0,0);
   x.actor.root.scale.setScalar(LEGACY_ECHO_CONFIG.scale);
  }
 }
 function finishGpuWarmup(){for(const x of standby)x.actor.root.visible=false;}
 function make(m){const x=standby.pop()||build(m);x.id=m.id;x.accumulated=0;return x;}
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
   const proxy=x.proxy||(x.proxy={...g,boss:x.proxyBoss,clown:x.proxyClown});
   // Stable proxy identity prevents the vintage gait/spring system from
   // resetting itself EVERY frame, which caused near-static/half-loaded minis.
   proxy.time=g.time;proxy.player=g.player;proxy.status=g.status;
   Object.assign(x.proxyBoss,{x:m.x,z:m.z,yaw:m.yaw,phase:1,state:'clown',
    hp:m.life,maxHp:m.maxHp,t:0});
   Object.assign(x.proxyClown,{...g.clown,state:a?'pattern':'idle',name:pattern,
    pt:elapsed,horrorStage:1,vis,odo:m.step,bombs:[],flash:m.flash});
   x.accumulated+=Math.max(0,dt);
   const actorRoot=x.actor.root;
   if(x.accumulated>=1/30||!x.initialized){
    x.actor.update(proxy,x.accumulated);
    // The retired original was a BALANCE-BALL clown. Modern stage physics
    // lowers the torso to the ground, which puts his little entire body
    // INSIDE the ball so players saw only the rolling sphere. Raise the
    // complete articulated vintage suit back onto the physical ball top.
    if(x.actor.body){
     const float=.075*Math.sin(clock*2.3+m.id);
     x.actor.body.position.y=5.2+float;
     x.actor.body.rotation.z=.045*Math.sin(clock*1.6+m.id);
    }
    x.initialized=true;x.accumulated=0;
   }else actorRoot.position.set(m.x,0,m.z);
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
     p.group.scale.setScalar(.43);
     p.setMorph?.({inflate:1+(.65*w),jaw:.15*w,wobble:.12},clock);
    }
   }
   for(let i=0;i<x.bullets.length;i++){
    const shot=a?.kind==='juggle'?a.shots?.[i]:a?.kind==='headBomb'&&i===0?a.shots?.[0]:null,obj=x.bullets[i];
    obj.visible=!m.down&&Boolean(shot)&&elapsed<shot.wind+.24;
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
   x.actor.root.visible=false;x.projectile&&(x.projectile.group.visible=false);
   for(const shot of x.bullets)shot.visible=false;
   actors.delete(id);standby.push(x);
  }
 }
 function clear(){
  for(const [id,x] of actors){
   x.actor.root.visible=false;
   if(x.projectile)x.projectile.group.visible=false;
   for(const shot of x.bullets)shot.visible=false;
   actors.delete(id);standby.push(x);
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;clear();
  for(const x of standby){
   root.remove(x.actor.root);disposeScene(x.actor.root);x.actor.head?.dispose?.();
   if(x.projectile){root.remove(x.projectile.group);x.projectile.dispose?.();}
   for(const shot of x.bullets)root.remove(shot);
  }
  standby.length=0;root.parent?.remove(root);
  bulletGeo.dispose();bulletMat.dispose();stripeGeo.dispose();stripeMat.dispose();
 }
 return {root,update,clear,prewarm,prepareGpuWarmup,finishGpuWarmup,dispose,
  stats:()=>({miniMidbosses:actors.size,originalRigs:actors.size,
   pooledOriginals:standby.length,projectileRigs:[...actors.values()].filter(x=>x.bullets.length===2).length,
   mountedVintageBodies:[...actors.values()].filter(x=>!x.actor.body||x.actor.body.position.y>=5.0).length})};
}
