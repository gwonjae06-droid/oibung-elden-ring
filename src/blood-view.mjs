import * as THREE from 'three';
import {BLOOD_RULES as R,BLOOD_PATTERNS,hazardPosition} from './blood-data.mjs';
export function buildBloodView(scene,{coarse=false,reduced=false}={}){
 const stone=new THREE.MeshStandardMaterial({color:0x25222b,roughness:.88}),gold=new THREE.MeshStandardMaterial({color:0xb18b4c,metalness:.65,roughness:.4}),red=new THREE.MeshStandardMaterial({color:0x830b2d,emissive:0x450318,roughness:.27,metalness:.3}),glass=new THREE.MeshBasicMaterial({color:0xe64a68,transparent:true,opacity:.55,side:THREE.DoubleSide});
 const scenery=[];
 const mesh=(geo,mat,x=0,y=0,z=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);if(parent===scene&&y>2)scenery.push(m);return m;};
 const floor=mesh(new THREE.CylinderGeometry(R.radius,R.radius,1,64),stone,0,-.55,0);floor.receiveShadow=true;
 const ring=mesh(new THREE.TorusGeometry(R.radius,.25,8,96),gold,0,.1,0);ring.rotation.x=Math.PI/2;
 const canal=mesh(new THREE.RingGeometry(28.5,32,64),red,0,-.15,0);canal.rotation.x=-Math.PI/2;
 const windows=[],falls=[];for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=Math.sin(a)*33,z=Math.cos(a)*33;
  mesh(new THREE.CylinderGeometry(.7,1,23,8),stone,x,11,z);mesh(new THREE.CylinderGeometry(1.2,1.2,.5,8),gold,x,.3,z);
  const arch=mesh(new THREE.TorusGeometry(8,.32,5,16,Math.PI),stone,x,20,z);arch.rotation.y=a;
  if(i%2===0){const w=mesh(new THREE.CircleGeometry(4,8),glass,x*.99,15,z*.99);w.rotation.y=a;windows.push(w);const tracery=mesh(new THREE.TorusGeometry(4,.15,4,24),gold,x*.99,15,z*.99);tracery.rotation.y=a;}
  const flow=mesh(new THREE.PlaneGeometry(.8,16),red,x*1.03,8,z*1.03);flow.rotation.y=a;falls.push(flow);
  if(!coarse&&i%3===0){const light=new THREE.PointLight(0xffb45c,22,18,2);light.position.set(x*.83,3,z*.83);scene.add(light);}
  mesh(new THREE.CylinderGeometry(.15,.3,2,6),gold,x*.86,1,z*.86);mesh(new THREE.SphereGeometry(.2,6,6),new THREE.MeshBasicMaterial({color:0xffd387}),x*.86,2.2,z*.86);
 }
 // The hanging relic and altar remain outside the collision-free circular floor.
 const heart=new THREE.Group();scene.add(heart);heart.position.set(0,21,-13);
 for(const side of[-1,1])mesh(new THREE.SphereGeometry(1.8,12,10),red,side,0,0,heart);
 const point=mesh(new THREE.ConeGeometry(2.6,4,12),red,0,-2,0,heart);point.rotation.z=Math.PI;
 mesh(new THREE.CylinderGeometry(.08,.08,13,6),gold,0,28,-13);
 mesh(new THREE.BoxGeometry(10,2,4),stone,0,1,-32);
 const root=new THREE.Group();scene.add(root);const body=mesh(new THREE.ConeGeometry(1.35,4.2,10),red,0,2.1,0,root);
 mesh(new THREE.TorusGeometry(1.2,.1,5,20),gold,0,3.4,0,root).rotation.x=Math.PI/2;
 const head=mesh(new THREE.SphereGeometry(.65,12,10),stone,0,4.6,0,root);
 const core=mesh(new THREE.SphereGeometry(1.05,16,12),new THREE.MeshStandardMaterial({color:0xff4564,emissive:0xff163b,emissiveIntensity:1.4}),0,4.7,0,root);core.visible=false;
 const crown=mesh(new THREE.TorusGeometry(.9,.06,5,24),gold,0,5.2,0,root);crown.rotation.x=Math.PI/2;
 for(const side of[-1,1]){const shoulder=mesh(new THREE.SphereGeometry(.5,8,6),gold,side*1.05,3.25,0,root);shoulder.scale.set(1.2,.6,1);const arm=mesh(new THREE.CylinderGeometry(.2,.3,1.7,8),stone,side*1.25,2.4,0,root);arm.rotation.z=side*.25;mesh(new THREE.SphereGeometry(.27,8,6),red,side*1.45,1.6,0,root);}
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;mesh(new THREE.ConeGeometry(.12,.65,5),gold,Math.sin(a)*.8,5.5,Math.cos(a)*.8,root);}
 const halo=mesh(new THREE.TorusGeometry(1.65,.035,4,40),gold,0,4.7,0,root);
 const wings=[];for(const side of[-1,1]){const pivot=new THREE.Group();root.add(pivot);pivot.position.set(side*.8,3.2,-.4);const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(side*2,5,side*5,6,side*8,3);shape.lineTo(side*6,.3);shape.lineTo(side*4,1);shape.lineTo(side*2,-.7);shape.lineTo(0,0);const wing=mesh(new THREE.ShapeGeometry(shape,10),new THREE.MeshStandardMaterial({color:0x9f1037,emissive:0x350019,side:THREE.DoubleSide,transparent:true,opacity:.85}),0,0,0,pivot);wings.push(pivot);}
 const eclipse=mesh(new THREE.SphereGeometry(4,20,16),red,0,12,0);eclipse.visible=false;
 const rain=new THREE.InstancedMesh(new THREE.SphereGeometry(.1,4,4),red,coarse?16:32);scene.add(rain);rain.visible=false;const drop=new THREE.Object3D();
 const hazards=new Map(),shots=new Map(),shotGeo=new THREE.SphereGeometry(.15,6,6),shotMat=new THREE.MeshBasicMaterial({color:0xffdd95});
 const release=m=>{if(m.userData.effect)release(m.userData.effect);scene.remove(m);m.geometry.dispose();m.material.dispose();};
 function update(g,dt){
  const s=g.blood,b=g.boss,dead=g.status==='won';if(dead)s.deathTime+=dt;const fade=dead?Math.max(0,1-s.deathTime/2.8):1;
  const transform=b.state==='transition'?Math.min(1,s.t/3):b.phase===2?1:0;
  root.position.set(b.x,s.elevation,b.z);root.rotation.y=b.yaw;root.scale.setScalar(dead?Math.max(.05,fade):1);body.rotation.z=reduced?0:Math.sin(g.time*2)*.035;
  head.visible=transform<.45;core.visible=transform>=.45;core.scale.setScalar(1+(reduced?0:Math.sin(g.time*6)*.08));
  halo.visible=b.phase===2;halo.rotation.y=reduced?0:g.time*.6;eclipse.visible=!dead&&b.state==='pattern'&&s.pattern==='eclipse';eclipse.scale.setScalar(Math.min(1,s.t/1.6));
  rain.visible=dead&&fade>0;if(rain.visible){for(let i=0;i<rain.count;i++){const a=i*2.4,r=3+i%8*2;drop.position.set(b.x+Math.sin(a)*r,Math.max(0,12-(s.deathTime*8+i%5)),b.z+Math.cos(a)*r);drop.scale.set(.8,2*fade,.8);drop.updateMatrix();rain.setMatrixAt(i,drop.matrix);}rain.instanceMatrix.needsUpdate=true;}
  wings.forEach((w,i)=>{w.visible=transform>.25;w.scale.setScalar(transform*fade);w.rotation.y=(i?1:-1)*(reduced?.2:.2+Math.sin(g.time*4)*.16);});
  heart.scale.setScalar((1+(reduced?0:Math.sin(g.time*4)*.06))*Math.max(.1,fade));red.emissiveIntensity=fade*(b.phase===2?1.5:.7);glass.opacity=.55*(1-transform*.7)*fade;
  windows.forEach((w,i)=>{w.position.y=15-(b.phase===2?transform*(i%3)*1.2:0);});falls.forEach(w=>w.scale.y=dead?fade:1+(reduced?0:Math.sin(g.time*2)*.05));
  const seen=new Set();for(const h of s.hazards){seen.add(h.id);let m=hazards.get(h.id);if(!m){const geo=h.shape==='lane'?new THREE.PlaneGeometry(1,1):h.shape==='cone'?new THREE.CircleGeometry(1,32,-Math.PI/2-h.arc,h.arc*2):h.shape==='ring'?new THREE.RingGeometry(.94,1,64):new THREE.CircleGeometry(1,32);m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xffa6b5,side:THREE.DoubleSide,transparent:true,opacity:.35,depthWrite:false}));m.rotation.x=-Math.PI/2;m.userData.hazardId=h.id;hazards.set(h.id,m);scene.add(m);}
   const c=hazardPosition(h),active=h.age>=h.warn;m.position.set(c.x,.06+(h.id%4)*.008,c.z);m.material.color.setHex(active?0xe51449:0xffced5);m.material.opacity=active?.72:reduced?.3:.18+.22*(h.age/h.warn);
   if(h.shape==='lane'){let length=h.length;m.rotation.z=h.yaw;if(!active){const travel=Math.hypot(h.vx||0,h.vz||0)*h.life;length+=travel;m.position.x+=Math.sin(h.yaw)*travel/2;m.position.z+=Math.cos(h.yaw)*travel/2;}m.scale.set(h.width*2,length,1);}
   else if(h.shape==='ring'){const inner=Math.max(0,c.r-h.width),outer=c.r+h.width,attr=m.geometry.attributes.position;for(let i=0;i<attr.count;i++){const a=(i%65)/64*Math.PI*2,r=i<65?inner:outer;attr.setXYZ(i,Math.cos(a)*r,Math.sin(a)*r,0);}attr.needsUpdate=true;m.geometry.computeBoundingSphere();m.scale.set(1,1,1);}
   else{m.scale.set(c.r,c.r,1);if(h.shape==='cone')m.rotation.z=h.yaw;}
   if(active&&h.shape!=='ring'&&h.shape!=='cone'){
    let effect=m.userData.effect;if(!effect){const fountain=['fountain','rain','chain'].includes(s.pattern),geo=h.shape==='lane'?new THREE.BoxGeometry(h.width*2,2.5,h.length):fountain?new THREE.CylinderGeometry(c.r*.55,c.r,12,10):new THREE.SphereGeometry(c.r,12,10);effect=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x960d39,emissive:0x6d0526,transparent:true,opacity:.65,roughness:.24,metalness:.3,depthWrite:false}));effect.userData.fountain=fountain;m.userData.effect=effect;scene.add(effect);}
    effect.position.set(c.x,effect.userData.fountain?5.5:h.shape==='lane'?1.3:c.r*.6,c.z);effect.rotation.y=h.yaw||0;effect.scale.y=reduced?1:.8+Math.sin(h.age*13)*.2;
   }
  }for(const[id,m]of hazards)if(!seen.has(id)){release(m);hazards.delete(id);}
  const live=new Set();for(const q of g.projectiles){live.add(q.id);let m=shots.get(q.id);if(!m){m=new THREE.Mesh(shotGeo,shotMat);shots.set(q.id,m);scene.add(m);}m.position.set(q.x,1.3+s.elevation,q.z);}for(const[id,m]of shots)if(!live.has(id)){scene.remove(m);shots.delete(id);}
 }
 const ray=new THREE.Raycaster(),from=new THREE.Vector3(),to=new THREE.Vector3(),direction=new THREE.Vector3();
 function occlude(camera,g){for(const m of scenery)m.visible=true;scene.updateMatrixWorld(true);from.copy(camera.position);for(const point of[{x:g.player.x,y:1,z:g.player.z},{x:g.boss.x,y:3+g.blood.elevation,z:g.boss.z}]){to.set(point.x,point.y,point.z);const distance=from.distanceTo(to);direction.subVectors(to,from).normalize();ray.set(from,direction);ray.far=Math.max(0,distance-1);for(const hit of ray.intersectObjects(scenery,false))hit.object.visible=false;}}
 return {update,root,occlude,dispose(){for(const m of hazards.values())release(m);hazards.clear();for(const m of shots.values())scene.remove(m);shots.clear();shotGeo.dispose();shotMat.dispose();}};
}
