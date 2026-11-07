import {createGyuwonRecallMaps} from './gyuwon-recall-maps.mjs';
import * as THREE from 'three';
import {createGyuwonActor} from './gyuwon-actor.mjs';
import {createGyuwonSpectacle} from './gyuwon-spectacle.mjs';
import {createGyuwonPhilosophyFx} from './gyuwon-philosophy-fx.mjs';
import {createGyuwonHazardFx} from './gyuwon-hazard-vfx.mjs';
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
 const recall=createGyuwonRecallMaps(scene,{coarse,reduced});
 // All attack warnings are 3D material fractures bound to authoritative collision footprints.
 const hazardFx=createGyuwonHazardFx(stage,{coarse});
 let deathElapsed=0;
 function clear(){deathElapsed=0;spectacle.clear();recall.clear();philosophy.reset();hazardFx.clear();}
 function update(g,dt=0){
  const b=g.boss,s=g.gyuwon,won=g.status==='won';if(won)deathElapsed+=dt;actor.update(g,deathElapsed,dt);
  const white=b.phase>=2&&(b.phase===3||s.space==='white')||won;
  const voidSpace=b.phase>=2||won;
  sky.visible=grid.visible=starfield.visible=!voidSpace;edge.visible=!won;
  edge.material.color.setHex(b.phase===3?0x92734d:b.phase===2?(white?0x7a697a:0x8c839a):0x9bb6ca);
  edge.material.opacity=b.phase===3?.25:b.phase===2?.20:.45;
  for(const o of stage.children)if(o.name==='gyuwon-endless-desks')o.visible=!voidSpace;
  scene.background.setHex(white?0xffffff:voidSpace?0x010105:0x111b28);
  scene.fog.color.copy(scene.background);scene.fog.density=g.gyuwon.hazards.some(h=>h.shape==='wave')?.0035:.009;
  // A continuous, non-colliding floor makes metaphysical spaces legible.
  floor.visible=!won&&!(b.phase===3&&['sword','circus','gamble','tsunami'].includes(s.stageMemory));floor.material.color.setHex(voidSpace?(white?0xe9e7e4:0x090810):0x354252);
  spectacle.update(g,dt,deathElapsed);recall.update(g,dt);philosophy.update(g,dt);
  for(const {rig,side}of ghosts){rig.visible=!won&&s.pattern==='contradiction'&&b.state==='pattern';rig.position.set(b.x+side*6,0,b.z+3);rig.rotation.y=root.rotation.y;rig.getObjectByName('gyuwon-head').visible=b.phase===1;}
  hazardFx.update(g);
 }
 return {root,update,clear,prewarm:(renderer,camera)=>recall.prewarm(renderer,camera),event(){},shake(){},occlude(){},quality:'adaptive',stats:()=>({warnings:hazardFx.stats().liveHazards,hazardFx:hazardFx.stats(),recall:recall.stats(),stageFX:spectacle.stats(),philosophy:philosophy.stats()}),dispose(){clear();hazardFx.dispose();recall.dispose();philosophy.dispose();spectacle.dispose();}};
}
