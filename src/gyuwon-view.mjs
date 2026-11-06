import * as THREE from 'three';
import {GYUWON_RULES as R} from './gyuwon-data.mjs';

export function buildGyuwonView(scene,{reduced=false}={}){
 const stage=new THREE.Group();stage.name='gyuwon-study-room';scene.add(stage);
 const materials=new Map(),boxGeo=new THREE.BoxGeometry(1,1,1);
 function mat(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.8}));return materials.get(color);}
 function box(parent,x,y,z,w,h,d,color){const m=new THREE.Mesh(boxGeo,mat(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 box(stage,0,-.2,0,49,.4,49,0x354252);
 // Keep the circular combat boundary visible and furniture outside it.
 const edge=new THREE.Mesh(new THREE.RingGeometry(R.radius-.1,R.radius+.1,96),new THREE.MeshBasicMaterial({color:0x9bb6ca,side:THREE.DoubleSide}));edge.rotation.x=-Math.PI/2;edge.position.y=.025;stage.add(edge);
 box(stage,0,5,-25,50,10,.5,0x263d43);box(stage,0,5,-24.65,16,5,.2,0x102b27);
 for(let i=-3;i<=3;i++){box(stage,i*6,8,-24.35,2.5,.07,.04,0xb8d5c9);box(stage,i*6,7,-24.35,.08,1.2,.04,0xb8d5c9);}
 for(let side of [-1,1])for(let i=-3;i<=3;i++){
  const x=side*24,z=i*6;
  box(stage,x,1.6,z,2.5,.25,2,0x9b8265);box(stage,x,.8,z,.25,1.6,.25,0x74838c);
  box(stage,x,1.85,z,1.1,.12,.8,0xd8dddb);box(stage,x,.7,z+1.6,1.6,.2,1.4,0x586575);
 }
 const bars=[];for(let i=-2;i<=2;i++){const m=box(stage,i*9,10,-5,5,.12,.45,0xd9edfa);m.material=new THREE.MeshBasicMaterial({color:0xd9edfa});bars.push(m);}
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
  for(const light of bars)light.visible=b.phase===1||transition&&s.t<1;
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
