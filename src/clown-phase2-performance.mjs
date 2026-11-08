import * as THREE from 'three';
import {clownPhase2Beat,CLOWN_PHASE2_CUES} from './clown-phase2-score.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

// The main ringmaster's non-skippable act-two ascent, without camera spin,
// on-screen pattern names, extra boss clones, phantom attacks or new damage.
export function createClownPhase2Performance(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='the-directors-second-act-coronation';
 root.userData.decorativeOnly=true;root.visible=false;scene.add(root);
 const ivory=new THREE.MeshStandardMaterial({color:0xdac7a9,roughness:.82,metalness:.07}),
  gold=new THREE.MeshStandardMaterial({color:0xc7a777,metalness:.55,roughness:.4,
   transparent:true,opacity:.82}),
  velvet=new THREE.MeshPhysicalMaterial({color:0x641d34,roughness:.91,
   side:THREE.DoubleSide,transparent:true,opacity:.38,depthWrite:false}),
  black=new THREE.MeshStandardMaterial({color:0x1c131c,roughness:.86}),
  wine=new THREE.MeshBasicMaterial({color:0xc33e55,transparent:true,opacity:.73,
   blending:THREE.AdditiveBlending,depthWrite:false}),
  fadeMat=new THREE.MeshBasicMaterial({color:0x963953,transparent:true,opacity:.48,
   side:THREE.DoubleSide,depthWrite:false});
 const masks=[],curtains=[];
 const headGeo=new THREE.SphereGeometry(1,coarse?9:16,coarse?7:12),
  goldGeo=new THREE.TorusGeometry(1,.035,6,coarse?36:64);
 for(let i=0;i<8;i++){
  const m=new THREE.Group();m.name='unmasked-chorus-offers-its-face';root.add(m);
  const face=new THREE.Mesh(headGeo,ivory);face.scale.set(.37,.49,.19);m.add(face);
  for(const s of [-1,1]){
   const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),black);
   eye.position.set(s*.16,.12,.19);m.add(eye);
  }
  masks.push(m);
 }
 for(const side of [-1,1]){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.6,7.3,8,10),velvet);
  mesh.name='giant-velvet-curtains-bow-with-ringmaster';
  root.add(mesh);curtains.push({mesh,side});
 }
 const halo=new THREE.Group();halo.name='floating-crown-of-the-director';root.add(halo);
 for(let i=0;i<3;i++){
  const ring=new THREE.Mesh(goldGeo,i===1?wine:gold);
  ring.name='director-crown-iron-concentric-arc';
  ring.scale.setScalar(2.55+i*.48);ring.position.y=i*.22;
  ring.rotation.x=Math.PI/2+i*.11;halo.add(ring);
 }
 for(let i=0;i<12;i++){
  const needle=new THREE.Mesh(new THREE.ConeGeometry(.045,.63,5),gold);
  const a=i*Math.PI/6;needle.position.set(Math.sin(a)*3.1,.12,Math.cos(a)*3.1);
  needle.rotation.z=Math.sin(a)*.35;halo.add(needle);
 }
 const stageHalo=new THREE.Mesh(new THREE.RingGeometry(3.2,3.33,64),fadeMat);
 stageHalo.name='coronation-stage-floor-reflection';stageHalo.rotation.x=-Math.PI/2;
 stageHalo.position.y=.075;root.add(stageHalo);
 const strands=11,wireBuffer=new Float32Array(strands*6);
 const wireGeo=new THREE.BufferGeometry();wireGeo.setAttribute('position',new THREE.BufferAttribute(wireBuffer,3));
 const wireMat=new THREE.LineBasicMaterial({color:0xd9b9a7,transparent:true,opacity:.38,depthWrite:false});
 const wires=new THREE.LineSegments(wireGeo,wireMat);
 wires.name='director-pulls-the-entire-circus-by-real-threads';root.add(wires);
 const light=new THREE.SpotLight(0xffafc0,coarse?48:78,28,Math.PI/5,.58,2);
 light.name='director-only-crowning-spotlight';light.castShadow=false;light.position.set(3,11,4);
 const target=new THREE.Object3D();target.position.set(0,3.7,0);root.add(light,target);light.target=target;
 const shade=new THREE.Mesh(new THREE.CylinderGeometry(.75,4.3,8,32,1,true),
  new THREE.MeshBasicMaterial({color:0x9a304e,transparent:true,opacity:.055,
   depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
 shade.name='non-colliding-crowning-light-volume';
 shade.position.set(1.5,5.6,2);shade.rotation.z=-.19;root.add(shade);
 let previousGame=null,previousTime=-1,cuesDone=new Set(),disposed=false;
 function reset(){previousGame=null;previousTime=-1;cuesDone.clear();root.visible=false;}
 function update(game,dt=0){
  if(disposed)return;
  const b=clownPhase2Beat(game);root.visible=b.active;
  if(!b.active){previousTime=-1;return;}
  const time=b.t;
  if(previousGame!==game||previousTime>time){cuesDone.clear();previousGame=game;}
  for(const cue of CLOWN_PHASE2_CUES)if(time>=cue.at&&!cuesDone.has(cue.type)){
   cuesDone.add(cue.type);
   game.events?.push?.({type:cue.type,x:game.boss.x,z:game.boss.z});
  }
  previousTime=time;
  root.position.set(game.boss.x,0,game.boss.z);
  // The mask chorus offers its faces to the main director. When his own
  // mouth tears into a smile, they recoil like shattered porcelain.
  for(let i=0;i<masks.length;i++){
   const m=masks[i],a=(i+.2)*Math.PI*2/masks.length;
   const r=(8.5-(6.9*b.bind))+(6.3*b.fracture);
   m.position.set(Math.sin(a)*r,3.15+Math.sin(a*3+time*2)*.26+
    1.30*b.command,Math.cos(a)*r);
   m.rotation.y=a+Math.PI+time*.16;
   m.rotation.z=(i%2?1:-1)*(.16*b.bind+1.1*b.fracture);
   m.scale.setScalar(Math.max(.001,b.alive*(.7+.35*b.fracture)));
   m.visible=b.alive>.01;
  }
  for(const {mesh,side}of curtains){
   const aperture=7.6-4.3*b.silk+4.7*b.command;
   mesh.position.set(side*aperture,4,-2.0);
   mesh.rotation.y=side*(.15+.6*b.silk);
   mesh.rotation.z=side*Math.sin(time*1.65)*.045*(reduced?.2:1);
   mesh.scale.y=1+.18*b.bind;
   mesh.material.opacity=.14+.32*b.silk;
  }
  halo.position.set(0,6.7+.55*b.command,0);
  halo.rotation.set(b.bind*.36,time*.38,b.command*.24);
  halo.scale.setScalar(.4+(.6*b.bind+.34*b.command)*b.alive);
  halo.visible=b.alive>.01;
  for(let i=0;i<strands;i++){
   const a=i*Math.PI*2/strands,idx=i*6;
   const x=Math.sin(a),z=Math.cos(a),radius=11.0+Math.sin(i*1.9)*.7;
   wireBuffer[idx]=x*radius;wireBuffer[idx+1]=9.7;wireBuffer[idx+2]=z*radius;
   const pull=1-b.bind*.83;
   wireBuffer[idx+3]=x*(.9+pull*4.3);
   wireBuffer[idx+4]=3.15+b.bind*(2.05+Math.sin(time*3+i)*.25);
   wireBuffer[idx+5]=z*(.9+pull*4.3);
  }
  wireGeo.attributes.position.needsUpdate=true;
  wireMat.opacity=b.alive*(.12+.65*b.bind)*(1-.55*b.command);
  light.intensity=(coarse?42:70)*b.alive*(.8+.5*b.fracture);
  light.color.setHex(b.command?0xffe2c7:0xff94b7);
  stageHalo.material.opacity=.24*b.silk+.33*b.fracture;
  stageHalo.scale.setScalar(1+.12*Math.sin(time*3)*b.bind);
  shade.material.opacity=(reduced?.023:.055)*b.alive;
 }
 let warmed=false;
 function prewarm(renderer,camera){
  if(warmed||!renderer?.compile||!camera)return false;
  // Build/call shader programs while the loading overlay is present, never
  // during the expensive unskippable phase-two coronation.
  const visible=root.visible;root.visible=true;
  try{renderer.compile(scene,camera);warmed=true;return true;}
  finally{root.visible=visible;}
 }
 function dispose(){if(disposed)return;disposed=true;reset();root.parent?.remove(root);disposeScene(root);}
 return {root,update,reset,prewarm,dispose,
  prepareGpuWarmup:()=>{root.visible=true;},
  finishGpuWarmup:()=>{root.visible=false;},
  stats:()=>({active:root.visible,prewarmed:warmed,maskCount:masks.length,strings:strands})};
}
