import * as THREE from 'three';
import {createBloodHead} from './blood-head.mjs';
import {BLOOD_RULES as R} from './blood-data.mjs';
import {bloodQuality,createBloodFluid} from './blood-fluid.mjs';
import {createBloodParticles} from './blood-particles.mjs';
import {createBloodSpellFx} from './blood-spell-fx.mjs';
import {createBloodWings} from './blood-wings.mjs';
import {createCathedralFx} from './blood-cathedral-fx.mjs';
import {bloodTransformation,smooth} from './blood-transformation.mjs';
import {bloodStage} from './blood-stage.mjs';
import {collectSceneResources} from './runtime/scene-resources.mjs';

export function buildBloodView(scene,{coarse=false,reduced=false}={}){
 const quality=bloodQuality({coarse}),fluid=createBloodFluid(quality);
 const stone=new THREE.MeshStandardMaterial({color:0xeeeae1,roughness:.64}),marble=new THREE.MeshStandardMaterial({color:0xdcdcd5,roughness:.48}),basalt=new THREE.MeshStandardMaterial({color:0x24202b,roughness:.88});
 const gold=new THREE.MeshStandardMaterial({color:0xc0a56b,metalness:.58,roughness:.4});
 const cloth=new THREE.MeshStandardMaterial({color:0x290e1d,roughness:.83});
 const glass=new THREE.MeshBasicMaterial({color:0xc5dfed,transparent:true,opacity:.62,side:THREE.DoubleSide});
 const scenery=[],windows=[],falls=[],lights=[];
 const mesh=(geo,mat,x=0,y=0,z=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);if(parent===scene&&y>2)scenery.push(m);return m;};
 const floor=mesh(new THREE.CylinderGeometry(R.radius,R.radius,1,64),marble,0,-.55,0);floor.receiveShadow=true;
 // Fine marble joints and restrained gilded inlays stay below combat warnings.
 const joints=[];for(let x=-24;x<=24;x+=4){const span=Math.sqrt(R.radius*R.radius-x*x);joints.push(x,-.035,-span,x,-.035,span,-span,-.035,x,span,-.035,x);}
 const jointGeo=new THREE.BufferGeometry();jointGeo.setAttribute('position',new THREE.Float32BufferAttribute(joints,3));scene.add(new THREE.LineSegments(jointGeo,new THREE.LineBasicMaterial({color:0xaaa99e,transparent:true,opacity:.38})));
 for(const r of [5,13,23]){const inlay=mesh(new THREE.RingGeometry(r-.035,r+.035,96),gold,0,-.025);inlay.rotation.x=-Math.PI/2;}
 const border=mesh(new THREE.TorusGeometry(R.radius,.25,8,96),gold,0,.05);border.rotation.x=Math.PI/2;
 const canal=mesh(new THREE.RingGeometry(28.5,32,64),fluid.material,0,-.1);canal.rotation.x=-Math.PI/2;
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=Math.sin(a)*33,z=Math.cos(a)*33;
  const wall=mesh(new THREE.CylinderGeometry(34.7,34.7,27,8,1,true,a+.035,Math.PI/6-.07),stone,0,13.5,0);wall.material.side=THREE.DoubleSide;
  const cornice=mesh(new THREE.TorusGeometry(33.8,.22,5,8,Math.PI/6-.07),gold,0,23.5,0);cornice.rotation.set(Math.PI/2,0,-a-.035);
  mesh(new THREE.CylinderGeometry(.7,1,23,8),stone,x,11,z);
  mesh(new THREE.CylinderGeometry(1.2,1.2,.5,8),gold,x,.3,z);
  const arch=mesh(new THREE.TorusGeometry(8,.32,5,24,Math.PI),stone,x,20,z);arch.rotation.y=a;
  if(i%2===0){const w=mesh(new THREE.CircleGeometry(4,8),glass,x*.99,15,z*.99);w.rotation.y=a;windows.push(w);
   const frame=mesh(new THREE.TorusGeometry(4,.15,5,32),gold,x*.99,15,z*.99);frame.rotation.y=a;
   for(let j=-1;j<=1;j++){const bar=mesh(new THREE.BoxGeometry(.1,7,.12),gold,x*.99+j*Math.cos(a),15,z*.99-j*Math.sin(a));bar.rotation.y=a;}
  }
  const flow=mesh(new THREE.PlaneGeometry(.6,16,2,12),fluid.material,x*1.03,8,z*1.03);flow.rotation.y=a;falls.push(flow);
  if(!coarse&&!quality.low&&i%3===0){const light=new THREE.PointLight(0xffd4a0,16,22,2);light.position.set(x*.83,3,z*.83);scene.add(light);lights.push(light);}
  mesh(new THREE.CylinderGeometry(.15,.3,2,6),gold,x*.86,1,z*.86);
 }
 const heart=new THREE.Group();scene.add(heart);heart.position.set(0,21,-13);
 for(const side of [-1,1])mesh(fluid.sphere,fluid.material,side,0,0,heart).scale.set(1.6,1.9,1.5);
 const tip=mesh(fluid.sphere,fluid.material,0,-1.5,0,heart);tip.scale.set(1.8,2,1.3);
 mesh(new THREE.CylinderGeometry(.08,.08,13,6),gold,0,28,-13);
 mesh(new THREE.BoxGeometry(10,2,4),stone,0,1,-32);
 const fxRoot=new THREE.Group();scene.add(fxRoot);
 const particles=createBloodParticles(fxRoot,fluid,quality,{reduced}),spells=createBloodSpellFx(fxRoot,fluid,particles,{reduced}),cathedral=createCathedralFx(fxRoot,fluid,quality,{reduced});
 const root=new THREE.Group();scene.add(root);
 const actor=new THREE.Group();root.add(actor);
 const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push(new THREE.Vector2(.55+Math.pow(1-t,1.2)*.9,t*3.6));}
 const body=mesh(new THREE.LatheGeometry(points,quality.segments),cloth,0,.12,0,actor);
 const folds=[];
 for(let i=0;i<10;i++){const a=i*Math.PI/5,strip=mesh(new THREE.CylinderGeometry(.12,.25,3.5,5,7),i%3===0?fluid.material:cloth,Math.sin(a)*.88,1.85,Math.cos(a)*.88,actor);strip.rotation.set(Math.cos(a)*.13,0,-Math.sin(a)*.13);folds.push(strip);}
 mesh(new THREE.TorusGeometry(1.05,.08,6,24),gold,0,3.4,0,actor).rotation.x=Math.PI/2;
 const portrait=createBloodHead(),head=portrait.group;head.position.set(0,4.6,0);actor.add(head);
 const core=mesh(fluid.sphere,fluid.material,0,4.7,0,actor);core.visible=false;
 const crown=mesh(new THREE.TorusGeometry(.88,.06,6,32),gold,0,5.2,0,actor);crown.rotation.x=Math.PI/2;
 const arms=[];for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*1.05,3.2,0);actor.add(arm);
  mesh(new THREE.SphereGeometry(.5,10,8),gold,0,0,0,arm).scale.set(1.1,.55,1);
  mesh(new THREE.CylinderGeometry(.2,.35,1.7,8),cloth,side*.2,-.8,0,arm);
  mesh(fluid.sphere,fluid.material,side*.3,-1.7,0,arm).scale.setScalar(.24);arms.push({arm,side});
 }
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(new THREE.ConeGeometry(.12,.65,5),gold,Math.sin(a)*.8,5.5,Math.cos(a)*.8,actor);}
 const halo=mesh(new THREE.TorusGeometry(1.65,.045,6,56),fluid.material,0,4.7,-.2,actor);
 const wings=createBloodWings(actor,fluid,quality,{reduced});
 const veins=[];for(let i=0;i<5;i++){const v=mesh(new THREE.TorusGeometry(.7+i*.09,.022,4,24,Math.PI*1.4),fluid.material,0,2.2+i*.4,0,actor);v.rotation.y=i*1.8;veins.push(v);}
 const birthWave=mesh(new THREE.TorusGeometry(1,.06,5,64),new THREE.MeshBasicMaterial({color:0xf04e65,transparent:true,opacity:.3,depthWrite:false}),0,.35,0,fxRoot);birthWave.rotation.x=Math.PI/2;birthWave.visible=false;
 const shots=new Map(),shotGeo=new THREE.SphereGeometry(.15,6,6),shotMat=new THREE.MeshBasicMaterial({color:0xffdd95});
 let disposed=false,deathTime=0,lastHp=R.hp,lastBirth=0,shake=0,visualTime=0,dripTime=0,cast=0,energy=0;
 // Spells, rising blood and the cathedral environment replace precise red danger decals.
 function update(g,dt){
  if(disposed)return;const s=g.blood,b=g.boss,c=bloodTransformation(g),stage=bloodStage(g),dead=g.status==='won';visualTime+=dt;if(dead)deathTime+=dt;const fade=dead?Math.max(.01,1-deathTime/2.8):1;
  // The surface swell follows the readable stage: calm while charging, strongest at onset, slack while returning.
  const energyGoal=({ready:.45,start:1.5,run:1,done:.5,return:.25})[stage.id]??0;energy+=(energyGoal-energy)*(1-Math.exp(-dt*3));fluid.update(g.time,energy);
  root.position.set(b.x,s.elevation,b.z);root.rotation.y=b.yaw;root.scale.setScalar(fade);
  actor.position.y=reduced?0:Math.sin(g.time*1.8)*.06;body.rotation.z=reduced?0:Math.sin(g.time*1.7)*.025;
  folds.forEach((f,i)=>{f.rotation.z=-Math.sin(i*Math.PI/5)*.13+(reduced?0:Math.sin(g.time*2-i*.6)*.025);});
  // Arms: raise while preparing, snap at the start, hold while running, lower when done, and ease back slowly while returning.
  const castGoal=({ready:.25+.5*stage.progress,start:1.05,run:.9,done:.5,return:.5*(1-stage.progress)})[stage.id]??0;
  cast+=(castGoal-cast)*(1-Math.exp(-dt*(({ready:5,start:18,run:6,done:4,return:2.2})[stage.id]||4)));actor.rotation.x=reduced?0:-cast*.05;
  for(const {arm,side}of arms){arm.rotation.x=-cast*.9;arm.rotation.z=side*(.18+cast*.32);}
  head.visible=c.dissolve<.8;head.scale.setScalar(Math.max(.01,1-c.dissolve));core.visible=c.dissolve>0;core.scale.setScalar(Math.max(.001,c.dissolve)*(1+(reduced?0:Math.sin(g.time*5)*.07)));
  halo.visible=c.dissolve>.5;halo.scale.setScalar(Math.max(.01,c.wings));halo.rotation.z=reduced?0:g.time*.35;
  veins.forEach((v,i)=>{v.visible=c.veins>0;v.scale.setScalar(Math.max(.01,c.veins));v.rotation.z=reduced?0:g.time*.2+i;});wings.update(g,c,dt);
  const env=cathedral.update(g,c,dt);heart.scale.setScalar((1+env.pulse*.065+c.bell*.17)*Math.max(.1,fade));glass.color.setHex(b.phase===2?0xe98b99:0xc5dfed);glass.opacity=(b.phase===2?.68:.62)*(1-c.darkness*.7)*fade;
  lights.forEach((l,i)=>{l.intensity=16*env.light*(reduced?1:1+Math.sin(g.time*7+i)*.05);});
  scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=1.2*env.light+.38;if(o.isDirectionalLight)o.intensity=1.45*env.light+.35;});
  falls.forEach((f,i)=>{f.scale.y=dead?fade:1+(reduced?0:Math.sin(g.time*2+i)*.05);f.scale.x=b.phase===2?1.7:1;});
  if(c.active&&c.t>=1.8&&lastBirth<1.8)particles.burst(b.x,4+s.elevation,b.z,{count:20,power:4});
  if(c.active&&c.t>=2.6&&lastBirth<2.6)particles.burst(b.x,4+s.elevation,b.z,{count:quality.low?28:64,power:10});
  lastBirth=c.active?c.t:0;dripTime+=dt;if(c.wings>.9&&dripTime>.2&&!dead){dripTime=0;const a=b.yaw;for(const side of [-1,1])particles.burst(b.x+Math.cos(a)*side*5.8,5+s.elevation,b.z-Math.sin(a)*side*5.8,{count:reduced?1:2,power:.5});}
  birthWave.visible=c.active&&c.wave>0&&c.wave<1;birthWave.position.set(b.x,.35,b.z);birthWave.scale.setScalar(.1+c.wave*28);birthWave.material.opacity=(1-c.wave)*.28;
  if(b.hp<lastHp&&dt>0){particles.burst(b.x,3+s.elevation,b.z,{count:8,power:4});actor.rotation.z=reduced?0:.055;}else actor.rotation.z*=Math.exp(-dt*13);lastHp=b.hp;
  // The blood spell scene reads the same hazards as damage calculations; no floor hitbox meshes.
  spells.update(g,dt);particles.update(dt,visualTime,{pull:c.active||s.pattern==='tide'&&b.state==='pattern'?b:null,still:c.active&&c.t<2.6,retract:stage.id==='return'?{x:b.x,z:b.z}:null});
  const live=new Set();for(const q of g.projectiles){live.add(q.id);let m=shots.get(q.id);if(!m){m=new THREE.Mesh(shotGeo,shotMat);shots.set(q.id,m);scene.add(m);}m.position.set(q.x,1.3+s.elevation,q.z);}for(const[id,m]of shots)if(!live.has(id)){scene.remove(m);shots.delete(id);}
  shake*=Math.exp(-dt*14);
 }
 const ray=new THREE.Raycaster(),from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3();
 function occlude(camera,g){for(const m of scenery)m.visible=true;scene.updateMatrixWorld(true);from.copy(camera.position);for(const point of [{x:g.player.x,y:1,z:g.player.z},{x:g.boss.x,y:3+g.blood.elevation,z:g.boss.z}]){to.set(point.x,point.y,point.z);const distance=from.distanceTo(to);direction.subVectors(to,from).normalize();ray.set(from,direction);ray.far=Math.max(0,distance-1);for(const hit of ray.intersectObjects(scenery,false))hit.object.visible=false;}}
 function clear(){for(const m of shots.values())scene.remove(m);shots.clear();spells.clear();deathTime=lastBirth=shake=cast=energy=0;lastHp=R.hp;}
 return {update,root,occlude,clear,quality,stats:()=>({drops:particles.active,puddles:particles.puddles,hazards:spells.active}),
  event(e,g){if(e.type==='blood-impact')shake=Math.max(shake,({burst:.16,dive:.25,tide:.18,pursuit:.12})[g.blood.pattern]||.025);if(e.type==='hurt')particles.burst(g.player.x,1,g.player.z,{count:12,power:4});},
  shake(camera){if(!reduced&&shake>0){camera.position.y+=Math.sin(visualTime*71)*shake;camera.position.x+=Math.sin(visualTime*53)*shake*.35;}},
  dispose(){if(disposed)return;disposed=true;clear();portrait.dispose();particles.dispose();cathedral.dispose();const bound=collectSceneResources(scene);for(const resource of fluid.resources)if(!bound.has(resource))resource.dispose();shotGeo.dispose();shotMat.dispose();}};
}
