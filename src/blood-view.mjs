import * as THREE from 'three';
import {BLOOD_RULES as R,hazardPosition} from './blood-data.mjs';
import {bloodQuality,createBloodFluid} from './blood-fluid.mjs';
import {createBloodParticles} from './blood-particles.mjs';
import {createBloodSpellFx} from './blood-spell-fx.mjs';
import {createBloodWings} from './blood-wings.mjs';
import {createCathedralFx} from './blood-cathedral-fx.mjs';
import {bloodTransformation,smooth} from './blood-transformation.mjs';

export function buildBloodView(scene,{coarse=false,reduced=false}={}){
 const quality=bloodQuality({coarse}),fluid=createBloodFluid(quality);
 const stone=new THREE.MeshStandardMaterial({color:0x24202b,roughness:.88});
 const gold=new THREE.MeshStandardMaterial({color:0xb18b4c,metalness:.65,roughness:.42});
 const cloth=new THREE.MeshStandardMaterial({color:0x290e1d,roughness:.83});
 const glass=new THREE.MeshBasicMaterial({color:0xe94764,transparent:true,opacity:.5,side:THREE.DoubleSide});
 const scenery=[],windows=[],falls=[],lights=[];
 const mesh=(geo,mat,x=0,y=0,z=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);if(parent===scene&&y>2)scenery.push(m);return m;};
 const floor=mesh(new THREE.CylinderGeometry(R.radius,R.radius,1,64),stone,0,-.55,0);floor.receiveShadow=true;
 const border=mesh(new THREE.TorusGeometry(R.radius,.25,8,96),gold,0,.05);border.rotation.x=Math.PI/2;
 const canal=mesh(new THREE.RingGeometry(28.5,32,64),fluid.material,0,-.1);canal.rotation.x=-Math.PI/2;
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=Math.sin(a)*33,z=Math.cos(a)*33;
  mesh(new THREE.CylinderGeometry(.7,1,23,8),stone,x,11,z);
  mesh(new THREE.CylinderGeometry(1.2,1.2,.5,8),gold,x,.3,z);
  const arch=mesh(new THREE.TorusGeometry(8,.32,5,24,Math.PI),stone,x,20,z);arch.rotation.y=a;
  if(i%2===0){const w=mesh(new THREE.CircleGeometry(4,8),glass,x*.99,15,z*.99);w.rotation.y=a;windows.push(w);
   const frame=mesh(new THREE.TorusGeometry(4,.15,5,32),gold,x*.99,15,z*.99);frame.rotation.y=a;
   for(let j=-1;j<=1;j++){const bar=mesh(new THREE.BoxGeometry(.1,7,.12),gold,x*.99+j*Math.cos(a),15,z*.99-j*Math.sin(a));bar.rotation.y=a;}
  }
  const flow=mesh(new THREE.PlaneGeometry(.6,16,2,12),fluid.material,x*1.03,8,z*1.03);flow.rotation.y=a;falls.push(flow);
  if(!coarse&&!quality.low&&i%3===0){const light=new THREE.PointLight(0xff704d,16,22,2);light.position.set(x*.83,3,z*.83);scene.add(light);lights.push(light);}
  mesh(new THREE.CylinderGeometry(.15,.3,2,6),gold,x*.86,1,z*.86);
 }
 const heart=new THREE.Group();scene.add(heart);heart.position.set(0,21,-13);
 for(const side of [-1,1])mesh(fluid.sphere,fluid.material,side,0,0,heart).scale.set(1.6,1.9,1.5);
 const tip=mesh(fluid.sphere,fluid.material,0,-1.5,0,heart);tip.scale.set(1.8,2,1.3);
 mesh(new THREE.CylinderGeometry(.08,.08,13,6),gold,0,28,-13);
 mesh(new THREE.BoxGeometry(10,2,4),stone,0,1,-32);
 const fxRoot=new THREE.Group();scene.add(fxRoot);
 const particles=createBloodParticles(fxRoot,fluid,quality),spells=createBloodSpellFx(fxRoot,fluid,particles,{reduced}),cathedral=createCathedralFx(fxRoot,fluid,quality,{reduced});
 const root=new THREE.Group();scene.add(root);
 const actor=new THREE.Group();root.add(actor);
 const points=[];for(let i=0;i<=20;i++){const t=i/20;points.push(new THREE.Vector2(.55+Math.pow(1-t,1.2)*.9,t*3.6));}
 const body=mesh(new THREE.LatheGeometry(points,quality.segments),cloth,0,.12,0,actor);
 const folds=[];
 for(let i=0;i<10;i++){const a=i*Math.PI/5,strip=mesh(new THREE.CylinderGeometry(.12,.25,3.5,5,7),i%3===0?fluid.material:cloth,Math.sin(a)*.88,1.85,Math.cos(a)*.88,actor);strip.rotation.set(Math.cos(a)*.13,0,-Math.sin(a)*.13);folds.push(strip);}
 mesh(new THREE.TorusGeometry(1.05,.08,6,24),gold,0,3.4,0,actor).rotation.x=Math.PI/2;
 const head=mesh(new THREE.SphereGeometry(.65,16,12),stone,0,4.6,0,actor);
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
 const hazards=new Map(),shots=new Map(),shotGeo=new THREE.SphereGeometry(.15,6,6),shotMat=new THREE.MeshBasicMaterial({color:0xffdd95});
 let deathTime=0,lastHp=R.hp,lastBirth=0,shake=0,visualTime=0;
 function releaseWarning(m){for(const edge of m.children){edge.geometry.dispose();edge.material.dispose();}scene.remove(m);m.geometry.dispose();m.material.dispose();}
 function warning(h,g){
  let m=hazards.get(h.id);if(!m){
   const geo=h.shape==='lane'?new THREE.PlaneGeometry(1,1):h.shape==='cone'?new THREE.CircleGeometry(1,48,-Math.PI/2-h.arc,h.arc*2):h.shape==='ring'?new THREE.RingGeometry(.94,1,64):new THREE.CircleGeometry(1,48);
   m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffd6bd,side:THREE.DoubleSide,transparent:true,opacity:.35,depthWrite:false}));m.rotation.x=-Math.PI/2;m.userData.hazardId=h.id;m.renderOrder=4;hazards.set(h.id,m);scene.add(m);
   // Radial lines and a pale outline make danger legible independently of red hue.
   const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0xffe3be,transparent:true,opacity:.85,depthWrite:false}));edge.position.z=.018;edge.renderOrder=5;m.add(edge);
  }
  const c=hazardPosition(h),active=h.age>=h.warn;
  m.position.set(c.x,.09+(h.id%4)*.008,c.z);m.material.color.setHex(active?0xdc1a48:0xffd6bd);m.material.opacity=active?.56:reduced?.26:.16+.23*h.age/h.warn;
  if(h.shape==='lane'){
   let length=h.length;m.rotation.z=h.yaw;if(!active){const travel=Math.hypot(h.vx||0,h.vz||0)*h.life;length+=travel;m.position.x+=Math.sin(h.yaw)*travel/2;m.position.z+=Math.cos(h.yaw)*travel/2;}m.scale.set(h.width*2,length,1);
  }else if(h.shape==='ring'){
   const inner=Math.max(0,c.r-h.width),outer=c.r+h.width,attr=m.geometry.attributes.position;
   for(let i=0;i<attr.count;i++){const a=(i%65)/64*Math.PI*2,r=i<65?inner:outer;attr.setXYZ(i,Math.cos(a)*r,Math.sin(a)*r,0);}attr.needsUpdate=true;m.geometry.computeBoundingSphere();m.scale.set(1,1,1);
   // The outline must follow the expanding authoritative radius, too.
   const edge=m.children[0];edge.visible=false;
  }else {m.scale.set(c.r,c.r,1);if(h.shape==='cone')m.rotation.z=h.yaw;}
 }
 function update(g,dt){
  const s=g.blood,b=g.boss,c=bloodTransformation(g),dead=g.status==='won';visualTime+=dt;if(dead)deathTime+=dt;const fade=dead?Math.max(.01,1-deathTime/2.8):1;
  fluid.update(g.time,b.state==='pattern'?1:0);
  root.position.set(b.x,s.elevation,b.z);root.rotation.y=b.yaw;root.scale.setScalar(fade);
  actor.position.y=reduced?0:Math.sin(g.time*1.8)*.06;body.rotation.z=reduced?0:Math.sin(g.time*1.7)*.025;
  folds.forEach((f,i)=>{f.rotation.z=-Math.sin(i*Math.PI/5)*.13+(reduced?0:Math.sin(g.time*2-i*.6)*.025);});
  for(const {arm,side}of arms){const cast=b.state==='pattern'?Math.sin(Math.min(1,s.t/.8)*Math.PI/2):0;arm.rotation.x=-cast*.9;arm.rotation.z=side*(.18+cast*.32);}
  head.visible=c.dissolve<.8;head.scale.setScalar(Math.max(.01,1-c.dissolve));core.visible=c.dissolve>0;core.scale.setScalar(Math.max(.001,c.dissolve)*(1+(reduced?0:Math.sin(g.time*5)*.07)));
  halo.visible=c.dissolve>.5;halo.scale.setScalar(Math.max(.01,c.wings));halo.rotation.z=reduced?0:g.time*.35;
  veins.forEach((v,i)=>{v.visible=c.veins>0;v.scale.setScalar(Math.max(.01,c.veins));v.rotation.z=reduced?0:g.time*.2+i;});wings.update(g,c,dt);
  const env=cathedral.update(g,c);heart.scale.setScalar((1+env.pulse*.065+c.bell*.17)*Math.max(.1,fade));glass.opacity=(b.phase===2?.8:.42)*(1-c.darkness*.85)*fade;
  lights.forEach((l,i)=>{l.intensity=16*env.light*(reduced?1:1+Math.sin(g.time*7+i)*.05);});
  scene.traverse(o=>{if(o.isHemisphereLight)o.intensity=.95*env.light+.18;if(o.isDirectionalLight)o.intensity=1.3*env.light+.25;});
  falls.forEach((f,i)=>{f.scale.y=dead?fade:1+(reduced?0:Math.sin(g.time*2+i)*.05);f.scale.x=b.phase===2?1.7:1;});
  if(c.active&&c.t>=1.8&&lastBirth<1.8)particles.burst(b.x,4+s.elevation,b.z,{count:20,power:4});
  if(c.active&&c.t>=2.6&&lastBirth<2.6)particles.burst(b.x,4+s.elevation,b.z,{count:quality.low?28:64,power:10});
  lastBirth=c.active?c.t:0;
  birthWave.visible=c.active&&c.wave>0&&c.wave<1;birthWave.position.set(b.x,.35,b.z);birthWave.scale.setScalar(.1+c.wave*28);birthWave.material.opacity=(1-c.wave)*.28;
  if(b.hp<lastHp&&dt>0){particles.burst(b.x,3+s.elevation,b.z,{count:8,power:4});actor.rotation.z=reduced?0:.055;}else actor.rotation.z*=Math.exp(-dt*13);lastHp=b.hp;
  const seen=new Set();for(const h of s.hazards){seen.add(h.id);warning(h,g);}for(const[id,m]of hazards)if(!seen.has(id)){releaseWarning(m);hazards.delete(id);}
  spells.update(g);particles.update(dt,visualTime,{pull:c.active||s.pattern==='tide'&&b.state==='pattern'?b:null,still:c.active});
  const live=new Set();for(const q of g.projectiles){live.add(q.id);let m=shots.get(q.id);if(!m){m=new THREE.Mesh(shotGeo,shotMat);shots.set(q.id,m);scene.add(m);}m.position.set(q.x,1.3+s.elevation,q.z);}for(const[id,m]of shots)if(!live.has(id)){scene.remove(m);shots.delete(id);}
  shake*=Math.exp(-dt*14);
 }
 const ray=new THREE.Raycaster(),from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3();
 function occlude(camera,g){for(const m of scenery)m.visible=true;scene.updateMatrixWorld(true);from.copy(camera.position);for(const point of [{x:g.player.x,y:1,z:g.player.z},{x:g.boss.x,y:3+g.blood.elevation,z:g.boss.z}]){to.set(point.x,point.y,point.z);const distance=from.distanceTo(to);direction.subVectors(to,from).normalize();ray.set(from,direction);ray.far=Math.max(0,distance-1);for(const hit of ray.intersectObjects(scenery,false))hit.object.visible=false;}}
 function clear(){for(const m of hazards.values())releaseWarning(m);hazards.clear();for(const m of shots.values())scene.remove(m);shots.clear();spells.clear();deathTime=lastBirth=shake=0;lastHp=R.hp;}
 return {update,root,occlude,clear,quality,stats:()=>({drops:particles.active,puddles:particles.puddles,hazards:spells.active}),
  event(e,g){if(e.type==='blood-impact')shake=Math.max(shake,({burst:.16,dive:.25,tide:.18,pursuit:.12})[g.blood.pattern]||.025);if(e.type==='hurt')particles.burst(g.player.x,1,g.player.z,{count:12,power:4});},
  shake(camera){if(!reduced&&shake>0){camera.position.y+=Math.sin(visualTime*71)*shake;camera.position.x+=Math.sin(visualTime*53)*shake*.35;}},
  dispose(){clear();shotGeo.dispose();shotMat.dispose();}};
}
