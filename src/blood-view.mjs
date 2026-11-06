import {sampleBloodWalk} from './blood-footwork.mjs';
import {createCameraVisibility} from './camera-visibility.mjs';
import * as THREE from 'three';
import {createBloodHead} from './blood-head.mjs';
import {createBloodRegalia} from './blood-regalia.mjs';
import {BLOOD_RULES as R} from './blood-data.mjs';
import {bloodQuality,createBloodFluid} from './blood-fluid.mjs';
import {createBloodParticles} from './blood-particles.mjs';
import {createBloodSurfaceFlow} from './blood-surface-flow.mjs';
import {createBloodSpellFx} from './blood-spell-fx.mjs';
import {createGrandBloodRites} from './blood-grand-rites.mjs';
import {createBloodSiphonFx} from './blood-siphon-fx.mjs';
import {createBloodWings} from './blood-wings.mjs';
import {createBloodMotionDirector} from './blood-attack-motion.mjs';
import {createCathedralFx} from './blood-cathedral-fx.mjs';
import {createWhiteCathedral} from './blood-white-cathedral.mjs';
import {bloodTransformation} from './blood-transformation.mjs';
import {bloodStage} from './blood-stage.mjs';
import {collectSceneResources} from './runtime/scene-resources.mjs';
import {createPlayerProjectileView} from './player-projectile-view.mjs';

export function buildBloodView(scene,{coarse=false,reduced=false}={}){
 const quality=bloodQuality({coarse}),fluid=createBloodFluid(quality);
 const mesh=(geo,mat,x=0,y=0,z=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 // White limestone nave and sacred altar are entirely outside the damage arena.
 const architecture=createWhiteCathedral(scene,{coarse,reduced,radius:R.radius});
 let focusGame=null;const visibility=createCameraVisibility(scene,{roots:()=>[architecture.root,...scene.children.filter(o=>o.name.startsWith('boss-atmosphere-'))],targets:()=>focusGame?[{x:focusGame.player.x,y:1.4,z:focusGame.player.z},{x:focusGame.boss.x,y:4+focusGame.blood.elevation,z:focusGame.boss.z,radius:5}]:[]});
 const heart=new THREE.Group();scene.add(heart);heart.position.set(0,34,-38);
 for(const side of [-1,1])mesh(fluid.sphere,fluid.material,side,0,0,heart).scale.set(1.6,1.9,1.5);
 const tip=mesh(fluid.sphere,fluid.material,0,-1.5,0,heart);tip.scale.set(1.8,2,1.3);
 const fxRoot=new THREE.Group();scene.add(fxRoot);
 const particles=createBloodParticles(fxRoot,fluid,quality,{reduced}),spells=createBloodSpellFx(fxRoot,fluid,particles,{reduced,coarse}),cathedral=createCathedralFx(fxRoot,fluid,quality,{reduced});
 const grandRites=createGrandBloodRites(fxRoot,fluid,{coarse,reduced});
 const siphonFx=createBloodSiphonFx(fxRoot,{coarse,reduced});
 const root=new THREE.Group();scene.add(root);
 const actor=new THREE.Group();root.add(actor);
 const regalia=createBloodRegalia(actor,{coarse,reduced});
 const surfaceFlow=createBloodSurfaceFlow(regalia.torso,fxRoot,fluid,{coarse,reduced});
 particles.setWallSplashListener(surfaceFlow.splashWall);
 // Keep the sculpted head at its original local rest coordinate but parent it
 // beneath the real chest/neck pivot, so bowing cannot detach the throat.
 const portrait=createBloodHead({coarse,reduced}),head=portrait.group;head.position.set(0,4.6,0);regalia.torso.add(head);
 const core=mesh(fluid.sphere,fluid.material,0,4.7,0,actor);core.visible=false;
 const halo=mesh(new THREE.TorusGeometry(1.65,.045,6,56),fluid.material,0,4.7,-.2,actor);
 const wings=createBloodWings(regalia.torso,fluid,quality,{reduced});
 const motionDirector=createBloodMotionDirector();
 const birthWave=mesh(new THREE.TorusGeometry(1,.06,5,64),new THREE.MeshBasicMaterial({color:0xf04e65,transparent:true,opacity:.3,depthWrite:false}),0,.35,0,fxRoot);birthWave.rotation.x=Math.PI/2;birthWave.visible=false;
 const projectiles=createPlayerProjectileView(THREE,scene);
 let disposed=false,deathTime=0,lastHp=R.hp,lastBirth=0,shake=0,visualTime=0,dripTime=0,cast=0,energy=0,hitRoll=0,rivuletTime=0,lastWallSurge=-Infinity;
 // Spells, rising blood and the cathedral environment replace precise red danger decals.
 function update(g,dt){
  if(disposed)return;focusGame=g;const s=g.blood,b=g.boss,c=bloodTransformation(g),stage=bloodStage(g),motion=motionDirector.update(g,dt),dead=g.status==='won';visualTime+=dt;if(dead)deathTime+=dt;const fade=dead?Math.max(.01,1-deathTime/2.8):1;
  // The surface swell follows the readable stage: calm while charging, strongest at onset, slack while returning.
  const energyGoal=(({ready:.45,start:1.5,run:1,done:.5,return:.25})[stage.id]??0)+(s.siphon?.active?0.7:0);energy+=(energyGoal-energy)*(1-Math.exp(-dt*3));fluid.update(g.time,energy);
  root.position.set(b.x,s.elevation,b.z);root.rotation.y=b.yaw;root.scale.setScalar(fade*1.25);
  // Choreography is tied to the actual spell clock, never an independent visual timer.
  const walk=s.walk&&['recovery','maneuver'].includes(b.state)?sampleBloodWalk(s.walk):null;
  actor.position.y=(s.elevation>.45&&!reduced?Math.sin(g.time*1.8)*.035:0)+motion.body.bob+(walk?.moving?walk.bob:0);
  actor.rotation.y=motion.body.twist*.25;
  // Arms: raise while preparing, snap at the start, hold while running, lower when done, and ease back slowly while returning.
  const castGoal=({ready:.25+.5*stage.progress,start:1.05,run:.9,done:.5,return:.5*(1-stage.progress)})[stage.id]??0;
  cast+=(castGoal-cast)*(1-Math.exp(-dt*(({ready:5,start:18,run:6,done:4,return:2.2})[stage.id]||4)));
  actor.rotation.x=motion.body.lean-cast*.025+(walk?.moving ? .035 : 0);
  regalia.update(g,c,dt,cast,{...motion,walk});portrait.update(g,c,dt,{cast,pose:motion});
  // Thin streaks remain attached to the actual animated torso and shoulders.
  // The normal blood spell and hurtbox positions remain in world space.
  rivuletTime+=Math.max(0,dt);
  if(!dead&&rivuletTime>.52&&(b.phase===2||b.state==='pattern')){
   rivuletTime=0;surfaceFlow.streakBoss(reduced?1:3);
  }
  head.visible=c.dissolve<.8;head.scale.setScalar(Math.max(.01,1-c.dissolve));core.visible=c.dissolve>0;core.scale.setScalar(Math.max(.001,c.dissolve)*(1+(reduced?0:Math.sin(g.time*5)*.07)));
  halo.visible=c.dissolve>.5;halo.scale.setScalar(Math.max(.01,c.wings));halo.rotation.z=reduced?0:g.time*.35;
  wings.update(g,c,dt,motion);
  const env=cathedral.update(g,c,dt);architecture.update(g,c,env);
  heart.visible=b.phase===2||c.active;
  heart.scale.setScalar((1+env.pulse*.065+c.bell*.17)*Math.max(.1,fade));
  scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=1.2*env.light+.38;if(o.isDirectionalLight&&o.name!=='cinematic-boss-silhouette-fill')o.intensity=1.45*env.light+.35;});
  if(c.active&&c.t>=1.8&&lastBirth<1.8)particles.burst(b.x,4+s.elevation,b.z,{count:20,power:4});
  if(c.active&&c.t>=2.6&&lastBirth<2.6)particles.burst(b.x,4+s.elevation,b.z,{count:quality.low?28:64,power:10});
  lastBirth=c.active?c.t:0;dripTime+=dt;if(c.wings>.9&&dripTime>.2&&!dead){dripTime=0;const a=b.yaw;for(const side of [-1,1])particles.burst(b.x+Math.cos(a)*side*5.8,5+s.elevation,b.z-Math.sin(a)*side*5.8,{count:reduced?1:2,power:.5});}
  birthWave.visible=c.active&&c.wave>0&&c.wave<1;birthWave.position.set(b.x,.35,b.z);birthWave.scale.setScalar(.1+c.wave*28);birthWave.material.opacity=(1-c.wave)*.28;
  if(b.hp<lastHp&&dt>0){particles.burst(b.x,3+s.elevation,b.z,{count:8,power:4});surfaceFlow.streakBoss(reduced?3:6);hitRoll=reduced?0:.055;}
  else hitRoll*=Math.exp(-dt*13);
  actor.rotation.z=motion.body.roll+hitRoll;lastHp=b.hp;
  regalia.plantFeet(g,fade*1.25);
  // The blood spell scene reads the same hazards as damage calculations; no floor hitbox meshes.
  spells.update(g,dt);grandRites.update(g,dt);siphonFx.update(g,dt);particles.update(dt,visualTime,{pull:c.active||s.siphon?.active||['tide','reverseFlow','heartFeast'].includes(s.pattern)&&b.state==='pattern'?b:null,still:c.active&&c.t<2.6,retract:stage.id==='return'?{x:b.x,z:b.z}:null});
  surfaceFlow.update(dt);
  projectiles.update(g);
  shake*=Math.exp(-dt*14);
 }
 function occlude(camera,g){focusGame=g;}
 function clear(){projectiles.clear();spells.clear();grandRites.clear();siphonFx.clear();surfaceFlow.clear();wings.clear();motionDirector.reset();regalia.resetPose();deathTime=lastBirth=shake=cast=energy=hitRoll=rivuletTime=0;lastWallSurge=-Infinity;lastHp=R.hp;portrait.clear();actor.rotation.set(0,0,0);}
 return {update,root,occlude,clear,quality,stats:()=>({drops:particles.active,puddles:particles.puddles,hazards:spells.active,bloodSea:architecture.stats().bloodSea,siphon:siphonFx.stats()}),
  event(e,g){if(e.type==='blood-impact'){
   shake=Math.max(shake,({burst:.16,dive:.25,tide:.18,pursuit:.12,lances:.14,cross:.14,judgement:.2,ritual:.2,reverseFlow:.12,wingGenesis:.16,heartFeast:.22})[g.blood.pattern]||.025);
   // Heavy phase-two blood waves throw a small secondary spray out toward
   // nearby cathedral columns. Each actual droplet still has to collide with
   // the column geometry before a wall stain can appear.
   if(g.boss.phase===2&&!reduced&&
    ['wave','tide','judgement','ritual','eclipse','fountain'].includes(g.blood.pattern)&&
    (g.time||0)-lastWallSurge>.85){
    lastWallSurge=g.time||0;
    const side=g.player.x>=0?1:-1,
     bays=[-35,-21,-7,7,21,35],z=bays.reduce((best,q)=>Math.abs(q-g.boss.z)<Math.abs(best-g.boss.z)?q:best,bays[0]);
    particles.burst(side*32.4,4.2,z,{count:5,power:7,lift:.15,gravity:.6,direction:{x:side*9,z:0}});
   }
  }if(e.type==='hurt')particles.burst(g.player.x,1,g.player.z,{count:12,power:4});if(e.type==='blood-siphon-heal'){particles.burst(g.boss.x,4+g.blood.elevation,g.boss.z,{count:reduced?14:36,power:3.4,lift:.4});particles.ripple(g.boss.x,g.boss.z,{from:3.5,to:.45,duration:1,power:1});}},
  shake(camera){if(!reduced&&shake>0){camera.position.y+=Math.sin(visualTime*71)*shake;camera.position.x+=Math.sin(visualTime*53)*shake*.35;}},
  dispose(){if(disposed)return;disposed=true;visibility.dispose();clear();projectiles.dispose();portrait.dispose();wings.dispose();particles.dispose();surfaceFlow.dispose();grandRites.dispose();siphonFx.dispose();cathedral.dispose();architecture.dispose();const bound=collectSceneResources(scene);for(const resource of fluid.resources)if(!bound.has(resource))resource.dispose();}};
}
