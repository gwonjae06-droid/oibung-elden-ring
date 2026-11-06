import * as THREE from 'three';
import {createGyuwonActor} from './gyuwon-actor.mjs';
import {createGyuwonSpectacle} from './gyuwon-spectacle.mjs';
import {createGyuwonPhilosophyFx} from './gyuwon-philosophy-fx.mjs';
import {hazardPosition} from './gyuwon-data.mjs';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';

export function buildGyuwonView(scene,{reduced=false,coarse=false}={}){
 const stage=new THREE.Group();stage.name='gyuwon-study-room';scene.add(stage);
 const materials=new Map(),boxGeo=new THREE.BoxGeometry(1,1,1);
 function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.8}));return materials.get(color);}
 function box(parent,x,y,z,w,h,d,color){const m=new THREE.Mesh(boxGeo,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 // A continuous floor and fading repetitions make the arena feel unbounded.
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),mat(0x354252));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;stage.add(floor);
 const skyGeo=new THREE.SphereGeometry(700,32,20),colors=[];
 const horizon=new THREE.Color(0x111b28),zenith=new THREE.Color(0x020711);
 for(let i=0;i<skyGeo.attributes.position.count;i++){const y=skyGeo.attributes.position.getY(i)/700,c=horizon.clone().lerp(zenith,Math.min(1,Math.max(0,y)*2));colors.push(c.r,c.g,c.b);}
 skyGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const sky=new THREE.Mesh(skyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));sky.name='gyuwon-open-sky';stage.add(sky);
 const grid=new THREE.GridHelper(1200,120,0x71889d,0x71889d);grid.position.y=.005;grid.material.transparent=true;grid.material.opacity=.12;stage.add(grid);
 const edge=new THREE.Mesh(new THREE.RingGeometry(R.radius-.06,R.radius+.06,96),new THREE.MeshBasicMaterial({color:0x9bb6ca,transparent:true,opacity:.45,side:THREE.DoubleSide}));edge.rotation.x=-Math.PI/2;edge.position.y=.025;stage.add(edge);
 // One instance per repeated desk part keeps distant furniture inexpensive.
 const positions=[],span=coarse?180:240,pitch=coarse?18:12;for(let x=-span;x<=span;x+=pitch)for(let z=-span;z<=span;z+=pitch)if(Math.hypot(x,z)>R.radius+12)positions.push([x,z]);
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
 function repeatedPart(dx,y,dz,w,h,d,color){const mesh=new THREE.InstancedMesh(boxGeo,mat(color),positions.length);mesh.name='gyuwon-endless-desks';positions.forEach(([x,z],i)=>{position.set(x+dx,y,z+dz);scale.set(w,h,d);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=false;stage.add(mesh);}
 repeatedPart(0,1.6,0,2.5,.18,2,0x8d877e);repeatedPart(0,.8,0,.2,1.6,.2,0x68798b);
 repeatedPart(0,1.76,0,1.1,.1,.8,0xc5d0d7);repeatedPart(0,.7,1.6,1.6,.16,1.4,0x586575);
 // Sparse stars are above the horizon, leaving the floor warnings uncluttered.
 const stars=[];for(let i=0;i<360;i++){const yaw=i*2.3999632297,y=.08+((i*73)%353)/353*.85,r=Math.sqrt(1-y*y);stars.push(Math.sin(yaw)*r*500,y*500,Math.cos(yaw)*r*500);}
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));const starfield=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x9db2cb,size:.55,transparent:true,opacity:.55,fog:false,depthWrite:false}));stage.add(starfield);
 const actor=createGyuwonActor(stage,{coarse}),root=actor.root,spectacle=createGyuwonSpectacle(stage,{coarse}),philosophy=createGyuwonPhilosophyFx(stage,{coarse,reduced});
 const ghosts=[-1,1].map(side=>{const rig=root.clone(true);rig.name='gyuwon-contradiction';rig.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.22;o.material.depthWrite=false;}});stage.add(rig);return {rig,side};});
 const warnings=new THREE.Group();stage.add(warnings);const meshes=new Map();
 const circleGeo=new THREE.CircleGeometry(1,48),laneGeo=new THREE.PlaneGeometry(1,1);
 let deathElapsed=0;
 function clear(){deathElapsed=0;spectacle.clear();philosophy.reset();for(const m of meshes.values()){warnings.remove(m);m.material.dispose();if(m.geometry!==circleGeo&&m.geometry!==laneGeo)m.geometry.dispose();}meshes.clear();}
 function update(g,dt=0){
  const b=g.boss,s=g.gyuwon,won=g.status==='won';if(won)deathElapsed+=dt;actor.update(g,deathElapsed,dt);
  const white=b.phase>=2&&(b.phase===3||s.space==='white')||won;
  const voidSpace=b.phase>=2||won;
  sky.visible=grid.visible=starfield.visible=!voidSpace;edge.visible=!won;
  edge.material.color.setHex(b.phase===3?0x92734d:b.phase===2?(white?0x7a697a:0x8c839a):0x9bb6ca);
  edge.material.opacity=b.phase===3?.25:b.phase===2?.20:.45;
  for(const o of stage.children)if(o.name==='gyuwon-endless-desks')o.visible=!voidSpace;
  scene.background.setHex(white?0xffffff:voidSpace?0x010105:0x111b28);
  scene.fog.color.copy(scene.background);
  // A continuous, non-colliding floor makes metaphysical spaces legible.
  floor.visible=!won;floor.material.color.setHex(voidSpace?(white?0xe9e7e4:0x090810):0x354252);
  warnings.visible=!won;
  spectacle.update(g,dt,deathElapsed);philosophy.update(g,dt);
  for(const {rig,side}of ghosts){rig.visible=!won&&s.pattern==='contradiction'&&b.state==='pattern';rig.position.set(b.x+side*6,0,b.z+3);rig.rotation.y=root.rotation.y;rig.getObjectByName('gyuwon-head').visible=b.phase===1;}
  const live=new Set();for(const h of s.hazards){live.add(h.id);let m=meshes.get(h.id);
   if(!m){const geometry=h.shape==='ring'?new THREE.RingGeometry(Math.max(.01,h.r-h.width),h.r+h.width,64):h.shape==='cone'?new THREE.CircleGeometry(h.r,40,-Math.PI/2-h.arc,h.arc*2):h.shape==='wave'?new THREE.PlaneGeometry(h.opening*2,42):h.shape==='lane'?laneGeo:circleGeo;m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xcce8f8,roughness:.64,metalness:.08,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.06;warnings.add(m);meshes.set(h.id,m);}
   const hp=hazardPosition(h);m.visible=h.shape!=='wave';m.position.set(hp.x,.06,hp.z);m.rotation.z=['lane','cone'].includes(h.shape)?h.yaw:0;if(h.shape==='wave')m.position.set(h.gap,.06,0);
   if(h.shape==='lane')m.scale.set(h.width*2,h.length,1);else if(h.shape==='circle')m.scale.set(h.r,h.r,1);else if(h.shape==='ring'){const pos=m.geometry.attributes.position;for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getY(i),pos.getX(i)),r=hp.r+(i<65?-h.width:h.width);pos.setXYZ(i,Math.cos(a)*r,Math.sin(a)*r,0);}pos.needsUpdate=true;}
   const active=h.age>=h.warn;m.material.color.setHex(h.shape==='wave'?0x41bba1:active?0xff6c67:b.phase===3?0xc48c22:s.pattern==='repeat'?0xe8c273:white?0x24334a:0xcce8f8);m.material.opacity=active?.85:.18+.35*Math.min(1,h.age/Math.max(.01,h.warn));
  }
  for(const[id,m]of meshes)if(!live.has(id)){warnings.remove(m);m.material.dispose();if(m.geometry!==circleGeo&&m.geometry!==laneGeo)m.geometry.dispose();meshes.delete(id);}
 }
 return {root,update,clear,event(){},shake(){},occlude(){},quality:'adaptive',stats:()=>({warnings:meshes.size,stageFX:spectacle.stats(),philosophy:philosophy.stats()}),dispose(){clear();philosophy.dispose();spectacle.dispose();circleGeo.dispose();laneGeo.dispose();}};
}
