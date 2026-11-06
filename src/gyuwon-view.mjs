import * as THREE from 'three';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';

export function buildGyuwonView(scene,{reduced=false}={}){
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
 const positions=[];for(let x=-240;x<=240;x+=12)for(let z=-240;z<=240;z+=12)if(Math.hypot(x,z)>34)positions.push([x,z]);
 const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),position=new THREE.Vector3();
 function repeatedPart(dx,y,dz,w,h,d,color){const mesh=new THREE.InstancedMesh(boxGeo,mat(color),positions.length);mesh.name='gyuwon-endless-desks';positions.forEach(([x,z],i)=>{position.set(x+dx,y,z+dz);scale.set(w,h,d);matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);});mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=false;stage.add(mesh);}
 repeatedPart(0,1.6,0,2.5,.18,2,0x8d877e);repeatedPart(0,.8,0,.2,1.6,.2,0x68798b);
 repeatedPart(0,1.76,0,1.1,.1,.8,0xc5d0d7);repeatedPart(0,.7,1.6,1.6,.16,1.4,0x586575);
 // Sparse stars are above the horizon, leaving the floor warnings uncluttered.
 const stars=[];for(let i=0;i<360;i++){const yaw=i*2.3999632297,y=.08+((i*73)%353)/353*.85,r=Math.sqrt(1-y*y);stars.push(Math.sin(yaw)*r*500,y*500,Math.cos(yaw)*r*500);}
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));const starfield=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x9db2cb,size:.55,transparent:true,opacity:.55,fog:false,depthWrite:false}));stage.add(starfield);
 const root=new THREE.Group();root.name='gyuwon-student';stage.add(root);
 box(root,0,1.8,0,1.5,1.7,.8,0xd5d9dd);box(root,-.95,1.65,0,.35,1.6,.4,0xc8d0d6);box(root,.95,1.65,0,.35,1.6,.4,0xc8d0d6);
 box(root,-.42,.6,0,.5,1.2,.55,0x242c39);box(root,.42,.6,0,.5,1.2,.55,0x242c39);
 const head=new THREE.Group();head.position.y=3.2;root.add(head);box(head,0,0,0,1,1.1,.9,0xbfa98f);box(head,0,.48,0,1.08,.35,1,0x1b2029);
 box(head,-.22,.02,.46,.15,.07,.03,0x1b2029);box(head,.22,.02,.46,.15,.07,.03,0x1b2029);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(.7,.035,6,48),new THREE.MeshBasicMaterial({color:0xe0ce99}));halo.position.y=3.4;root.add(halo);
 const warnings=new THREE.Group();stage.add(warnings);const meshes=new Map();
 const circleGeo=new THREE.CircleGeometry(1,48),laneGeo=new THREE.PlaneGeometry(1,1);
 let deathElapsed=0;
 function clear(){deathElapsed=0;for(const m of meshes.values()){warnings.remove(m);m.material.dispose();}meshes.clear();}
 function update(g,dt=0){
  const b=g.boss,s=g.gyuwon;root.position.set(b.x,0,b.z);root.rotation.y=Math.atan2(g.player.x-b.x,g.player.z-b.z);
  const transition=b.state==='transition',erase=b.phase===1?1:transition?Math.max(.001,1-s.t/R.transition):.001;
  head.scale.setScalar(erase);head.visible=erase>.01;halo.visible=b.phase===2;halo.rotation.z=reduced?0:g.time*.3;
  root.scale.y=g.status==='won'?Math.max(.08,1-(deathElapsed+=dt)):1;
  starfield.material.opacity=b.phase===1?.35:.7;
  const live=new Set();for(const h of s.hazards){live.add(h.id);let m=meshes.get(h.id);
   if(!m){m=new THREE.Mesh(h.shape==='lane'?laneGeo:circleGeo,new THREE.MeshBasicMaterial({color:0xcce8f8,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.06;warnings.add(m);meshes.set(h.id,m);}
   m.position.set(h.x,.06,h.z);m.rotation.z=h.shape==='lane'?-h.yaw:0;
   if(h.shape==='lane')m.scale.set(h.width*2,h.length,1);else m.scale.set(h.r,h.r,1);
   const active=h.age>=h.warn;m.material.color.setHex(active?0xff6c67:s.pattern==='repeat'?0xe8c273:0xcce8f8);m.material.opacity=active?.85:.18+.35*Math.min(1,h.age/h.warn);
  }
  for(const[id,m]of meshes)if(!live.has(id)){warnings.remove(m);m.material.dispose();meshes.delete(id);}
 }
 return {root,update,clear,event(){},shake(){},occlude(){},quality:'prototype',stats:()=>({warnings:meshes.size}),dispose(){clear();circleGeo.dispose();laneGeo.dispose();}};
}
