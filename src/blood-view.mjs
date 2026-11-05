import {createCameraVisibility} from './camera-visibility.mjs';
import * as THREE from 'three';
import {createBloodHead} from './blood-head.mjs';
import {createBloodRegalia} from './blood-regalia.mjs';
import {BLOOD_RULES as R} from './blood-data.mjs';
import {bloodQuality,createBloodFluid} from './blood-fluid.mjs';
import {createBloodParticles} from './blood-particles.mjs';
import {createBloodSpellFx} from './blood-spell-fx.mjs';
import {createBloodWings} from './blood-wings.mjs';
import {createBloodMotionDirector} from './blood-attack-motion.mjs';
import {createCathedralFx} from './blood-cathedral-fx.mjs';
import {createWhiteCathedral} from './blood-white-cathedral.mjs';
import {bloodTransformation} from './blood-transformation.mjs';
import {bloodStage} from './blood-stage.mjs';
import {collectSceneResources} from './runtime/scene-resources.mjs';

export function buildBloodView(scene,{coarse=false,reduced=false}={}){
 const quality=bloodQuality({coarse}),fluid=createBloodFluid(quality);

 const mesh=(geo,mat,x=0,y=0,z=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
 // White limestone nave and sacred altar are entirely outside the damage arena.
 const architecture=createWhiteCathedral(scene,{coarse,reduced,radius:R.radius});
 let focusGame=null;const visibility=createCameraVisibility(scene,{roots:[architecture.root],targets:()=>focusGame?[{x:focusGame.player.x,y:1.4,z:focusGame.player.z},{x:focusGame.boss.x,y:4+focusGame.blood.elevation,z:focusGame.boss.z}]:[]});
 const heart=new THREE.Group();scene.add(heart);heart.position.set(0,34,-38);
 for(const side of [-1,1])mesh(fluid.sphere,fluid.material,side,0,0,heart).scale.set(1.6,1.9,1.5);
 const tip=mesh(fluid.sphere,fluid.material,0,-1.5,0,heart);tip.scale.set(1.8,2,1.3);
 const fxRoot=new THREE.Group();scene.add(fxRoot);
 const particles=createBloodParticles(fxRoot,fluid,quality,{reduced}),spells=createBloodSpellFx(fxRoot,fluid,particles,{reduced}),cathedral=createCathedralFx(fxRoot,fluid,quality,{reduced});
 const root=new THREE.Group();scene.add(root);
 const actor=new THREE.Group();root.add(actor);
 const regalia=createBloodRegalia(actor,{coarse,reduced});
 const portrait=createBloodHead({coarse,reduced}),head=portrait.group;head.position.set(0,4.6,0);actor.add(head);
 const core=mesh(fluid.sphere,fluid.material,0,4.7,0,actor);core.visible=false;
 const halo=mesh(new THREE.TorusGeometry(1.65,.045,6,56),fluid.material,0,4.7,-.2,actor);
 const wings=createBloodWings(actor,fluid,quality,{reduced});
 const motionDirector=createBloodMotionDirector();
 const birthWave=mesh(new THREE.TorusGeometry(1,.06,5,64),new THREE.MeshBasicMaterial({color:0xf04e65,transparent:true,opacity:.3,depthWrite:false}),0,.35,0,fxRoot);birthWave.rotation.x=Math.PI/2;birthWave.visible=false;
 const shots=new Map(),shotGeo=new THREE.SphereGeometry(.15,6,6),shotMat=new THREE.MeshBasicMaterial({color:0xffdd95});
 let disposed=false,deathTime=0,lastHp=R.hp,lastBirth=0,shake=0,visualTime=0,dripTime=0,cast=0,energy=0,hitRoll=0;
 // Spells, rising blood and the cathedral environment replace precise red danger decals.
 function update(g,dt){
  if(disposed)return;focusGame=g;const s=g.blood,b=g.boss,c=bloodTransformation(g),stage=bloodStage(g),motion=motionDirector.update(g,dt),dead=g.status==='won';visualTime+=dt;if(dead)deathTime+=dt;const fade=dead?Math.max(.01,1-deathTime/2.8):1;
  // The surface swell follows the readable stage: calm while charging, strongest at onset, slack while returning.
  const energyGoal=({ready:.45,start:1.5,run:1,done:.5,return:.25})[stage.id]??0;energy+=(energyGoal-energy)*(1-Math.exp(-dt*3));fluid.update(g.time,energy);
  root.position.set(b.x,s.elevation,b.z);root.rotation.y=b.yaw;root.scale.setScalar(fade*1.25);
  // Choreography is tied to the actual spell clock, never an independent visual timer.
  actor.position.y=(reduced?0:Math.sin(g.time*1.8)*.06)+motion.body.bob;
  actor.rotation.y=motion.body.twist*.25;
  // Arms: raise while preparing, snap at the start, hold while running, lower when done, and ease back slowly while returning.
  const castGoal=({ready:.25+.5*stage.progress,start:1.05,run:.9,done:.5,return:.5*(1-stage.progress)})[stage.id]??0;
  cast+=(castGoal-cast)*(1-Math.exp(-dt*(({ready:5,start:18,run:6,done:4,return:2.2})[stage.id]||4)));
  actor.rotation.x=motion.body.lean-cast*.025;
  regalia.update(g,c,dt,cast,motion);portrait.update(g,c,dt,{cast,pose:motion});
  head.visible=c.dissolve<.8;head.scale.setScalar(Math.max(.01,1-c.dissolve));core.visible=c.dissolve>0;core.scale.setScalar(Math.max(.001,c.dissolve)*(1+(reduced?0:Math.sin(g.time*5)*.07)));
  halo.visible=c.dissolve>.5;halo.scale.setScalar(Math.max(.01,c.wings));halo.rotation.z=reduced?0:g.time*.35;
  wings.update(g,c,dt,motion);
  const env=cathedral.update(g,c,dt);architecture.update(g,c,env);
  heart.visible=b.phase===2||c.active;
  heart.scale.setScalar((1+env.pulse*.065+c.bell*.17)*Math.max(.1,fade));
  scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=1.2*env.light+.38;if(o.isDirectionalLight)o.intensity=1.45*env.light+.35;});

  if(c.active&&c.t>=1.8&&lastBirth<1.8)particles.burst(b.x,4+s.elevation,b.z,{count:20,power:4});
  if(c.active&&c.t>=2.6&&lastBirth<2.6)particles.burst(b.x,4+s.elevation,b.z,{count:quality.low?28:64,power:10});
  lastBirth=c.active?c.t:0;dripTime+=dt;if(c.wings>.9&&dripTime>.2&&!dead){dripTime=0;const a=b.yaw;for(const side of [-1,1])particles.burst(b.x+Math.cos(a)*side*5.8,5+s.elevation,b.z-Math.sin(a)*side*5.8,{count:reduced?1:2,power:.5});}
  birthWave.visible=c.active&&c.wave>0&&c.wave<1;birthWave.position.set(b.x,.35,b.z);birthWave.scale.setScalar(.1+c.wave*28);birthWave.material.opacity=(1-c.wave)*.28;
  if(b.hp<lastHp&&dt>0){particles.burst(b.x,3+s.elevation,b.z,{count:8,power:4});hitRoll=reduced?0:.055;}
  else hitRoll*=Math.exp(-dt*13);
  actor.rotation.z=motion.body.roll+hitRoll;lastHp=b.hp;
  // The blood spell scene reads the same hazards as damage calculations; no floor hitbox meshes.
  spells.update(g,dt);particles.update(dt,visualTime,{pull:c.active||s.pattern==='tide'&&b.state==='pattern'?b:null,still:c.active&&c.t<2.6,retract:stage.id==='return'?{x:b.x,z:b.z}:null});
  const live=new Set();for(const q of g.projectiles){live.add(q.id);let m=shots.get(q.id);if(!m){m=new THREE.Mesh(shotGeo,shotMat);shots.set(q.id,m);scene.add(m);}m.position.set(q.x,1.3+s.elevation,q.z);}for(const[id,m]of shots)if(!live.has(id)){scene.remove(m);shots.delete(id);}
  shake*=Math.exp(-dt*14);
 }
 function occlude(camera,g){focusGame=g;}
 function clear(){for(const m of shots.values())scene.remove(m);shots.clear();spells.clear();wings.clear();motionDirector.reset();deathTime=lastBirth=shake=cast=energy=hitRoll=0;lastHp=R.hp;portrait.clear();actor.rotation.set(0,0,0);}
 return {update,root,occlude,clear,quality,stats:()=>({drops:particles.active,puddles:particles.puddles,hazards:spells.active}),
  event(e,g){if(e.type==='blood-impact')shake=Math.max(shake,({burst:.16,dive:.25,tide:.18,pursuit:.12,lances:.14,cross:.14,judgement:.2,ritual:.2})[g.blood.pattern]||.025);if(e.type==='hurt')particles.burst(g.player.x,1,g.player.z,{count:12,power:4});},
  shake(camera){if(!reduced&&shake>0){camera.position.y+=Math.sin(visualTime*71)*shake;camera.position.x+=Math.sin(visualTime*53)*shake*.35;}},
  dispose(){if(disposed)return;disposed=true;visibility.dispose();clear();portrait.dispose();wings.dispose();particles.dispose();cathedral.dispose();architecture.dispose();const bound=collectSceneResources(scene);for(const resource of fluid.resources)if(!bound.has(resource))resource.dispose();shotGeo.dispose();shotMat.dispose();}};
}
