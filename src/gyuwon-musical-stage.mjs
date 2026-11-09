import * as THREE from 'three';
import {gyuwonFiveToSixExit} from './gyuwon-runner-director.mjs';
import {createGyuwonCinematicProps} from './gyuwon-cinematic-3d-props.mjs';

// Instanced/cached primitive stagecraft. One rig for Gyuwon and one for the
// player stay in the scene for every genre. Every moving prop here reads the
// SAME simulation positions used by the collision/damage module.
export function createGyuwonMusicalStage(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-white-musical-performance';scene.add(root);
 const box=new THREE.BoxGeometry(1,1,1);
 const ball=new THREE.SphereGeometry(1,coarse?10:18,coarse?8:12);
 const torus=new THREE.TorusGeometry(1,.105,coarse?6:10,coarse?18:28);
 const plane=new THREE.CircleGeometry(1,coarse?20:40);
 const soldier=new THREE.LatheGeometry([[0,0],[.35,0],[.38,.12],[.18,.18],[.24,.6],[.32,.85],[.16,1],[.22,1.07],[.25,1.3],[.18,1.5],[0,1.52]].map(p=>new THREE.Vector2(...p)),coarse?16:32);
 const boards=new THREE.Group();root.add(boards);
 const cinematic=createGyuwonCinematicProps(root,{coarse});
 const oak=new THREE.MeshStandardMaterial({color:0x66503b,roughness:.72,metalness:.03});
 for(let i=0;i<24;i++){const plank=new THREE.Mesh(box,oak);plank.position.set((i-11.5)*1.8,-.15,0);plank.scale.set(1.78,.22,28);plank.receiveShadow=true;boards.add(plank);}
 const drape=new THREE.MeshStandardMaterial({color:0x471d28,roughness:1,side:THREE.DoubleSide});
 const curtainGeo=new THREE.PlaneGeometry(12,15,coarse?24:64,8),pos=curtainGeo.attributes.position;
 for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*3.2)*.35);curtainGeo.computeVertexNormals();
 for(const side of [-1,1]){const fabric=new THREE.Mesh(curtainGeo,drape);fabric.position.set(side*24,7,-10);root.add(fabric);}
 // Mechanical house curtains sit between the audience and the actors.
 const openingCurtains=[-1,1].map(side=>{const m=new THREE.Mesh(curtainGeo,drape);m.name=side<0?'house-curtain-left':'house-curtain-right';m.position.set(side*6,7.2,13);m.scale.set(1.03,1.07,1);root.add(m);return m;});
 const lintel=new THREE.Mesh(box,drape);lintel.position.set(0,14.2,13);lintel.scale.set(34,2.1,.85);root.add(lintel);
 const edgeLamps=[-1,1].map(side=>{const m=new THREE.Mesh(box,oak);m.position.set(side*22,6.6,13);m.scale.set(.85,13,.85);root.add(m);return m;});
 const materials=[
  0xf4d18a,0xe87eb4,0x69acd6,0xa18eea,0xe86a67,0x73bfa0,0xe4c583,
  0x2c354a,0xffffff,0xffb66e,0x88c5f1,0xe1a1ea
 ].map(c=>new THREE.MeshStandardMaterial({color:c,metalness:.08,roughness:.57,
  emissive:c,emissiveIntensity:.13}));
 const soft=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,
  opacity:.28,depthWrite:false,side:THREE.DoubleSide});
 const spotlights=Array.from({length:8},(_,i)=>{
  const m=new THREE.Mesh(plane,soft.clone());m.rotation.x=-Math.PI/2;
  m.position.set(Math.sin(i*Math.PI/4)*12,.025,Math.cos(i*Math.PI/4)*12);
  m.scale.set(2.3,2.3,2.3);m.material.color.setHex(materials[i%7].color.getHex());
  root.add(m);return m;
 });
 const left=new THREE.Mesh(box,materials[2]),right=new THREE.Mesh(box,materials[4]);
 for(const [m,x] of [[left,-20],[right,20]]){m.position.set(x,1,0);m.scale.set(2.9,2.1,3);root.add(m);}
 const cues=Array.from({length:92},(_,i)=>{
  const m=new THREE.Mesh(i%9===0?torus:i%3===0?box:ball,materials[i%7]);
  m.visible=false;root.add(m);return m;
 });
 const stageRing=new THREE.Mesh(torus,materials[6]);stageRing.rotation.x=Math.PI/2;
 stageRing.position.y=2.3;stageRing.scale.setScalar(4);root.add(stageRing);
 // The last 20 seconds of Act V expose a real walkway made from stage
 // planks, while the proscenium opens toward Act VI's painted horizon.
 const roadMaterial=new THREE.MeshStandardMaterial({color:0xd2a86a,emissive:0x795130,emissiveIntensity:.35,roughness:.63,side:THREE.DoubleSide});
 const road=Array.from({length:20},(_,i)=>{
  const plank=new THREE.Mesh(box,roadMaterial);
  plank.position.set(0,.18,-16+i*1.7);plank.scale.set(4.8,.12,1.66);
  plank.visible=false;root.add(plank);return plank;
 });
 const horizon=new THREE.Mesh(new THREE.TorusGeometry(1,.09,12,64),materials[6]);
 horizon.position.set(0,6.2,-18);horizon.scale.set(8.8,5.9,1);horizon.visible=false;root.add(horizon);
 const horizonLight=new THREE.Mesh(new THREE.PlaneGeometry(17,12),new THREE.MeshBasicMaterial({color:0xffe9b5,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide}));
 horizonLight.position.set(0,6.2,-19);horizonLight.visible=false;root.add(horizonLight);
 let disposed=false;
 function showAt(i,{x=0,y=1,z=0,sx=1,sy=1,sz=1,color=0,rotate=0,flat=false}={}){
  const o=cues[i];if(!o)return;
  o.visible=true;o.material=materials[Math.abs(color)%materials.length];
  o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.rotation.set(flat?-Math.PI/2:0,rotate,0);if(flat){o.geometry=plane;o.scale.set(sx,sz,1);}
 }
 function update(g){
  if(disposed)return;
  const m=g?.gyuwon?.years?.musical;
  root.visible=!!m&&g.status==='playing';
  if(!root.visible)return;
  const year=m.year,kind=m.kind,color=Math.max(0,year-5),t=m.time;
  const exitPath=year===5&&!m.finishing?gyuwonFiveToSixExit(t,m.clock?.duration||180):0;
  const opening=year===5&&!m.finishing&&t<8;
  for(let i=0;i<2;i++){const side=i===0?-1:1,fabric=openingCurtains[i];fabric.visible=opening||exitPath>0;
   const draw=opening?THREE.MathUtils.smoothstep(t,2.15,5.7):exitPath;
   fabric.position.x=side*(6+13*draw);fabric.scale.x=1.03-.38*draw;
   fabric.rotation.y=side*.2*draw;}
  lintel.visible=edgeLamps[0].visible=edgeLamps[1].visible=opening||exitPath>0;
  horizon.visible=horizonLight.visible=exitPath>.001;
  if(horizon.visible){
   horizon.scale.set(8.8+exitPath*2,5.9+exitPath*1.6,1);
   horizonLight.material.opacity=.08+exitPath*.46;
  }
  road.forEach((plank,i)=>{
   // The floor opens from behind Gyuwon toward the knight.
   const reveal=THREE.MathUtils.smoothstep(exitPath,Math.max(0,i*.028),.33+i*.028);
   plank.visible=reveal>.001;plank.scale.x=Math.max(.001,4.8*reveal);
   plank.position.y=.19+.05*Math.sin(t*1.2+i*.24)*exitPath;
  });
  for(let i=0;i<cues.length;i++){const o=cues[i];o.visible=false;o.geometry=i%9===0?torus:i%3===0?box:ball;}
  const beatPhase=t*1.7;
  for(let i=0;i<spotlights.length;i++){
   const o=spotlights[i];
   o.visible=true;
   o.material.opacity=m.finishing?.035:opening?.06+Math.sin(beatPhase+i*1.2)*.015:.12+Math.sin(beatPhase+i*1.2)*.035;
   o.position.x=Math.sin(i*Math.PI/4+t*.13)*(kind==='finale'?14:10);
   o.position.z=Math.cos(i*Math.PI/4+t*.13)*9;
  }
  stageRing.visible=kind==='rhythm';
  if(stageRing.visible){
   stageRing.position.set(0,5.5+(Math.sin(t*3)*.12),-12);stageRing.rotation.x=0;
   const pulse=1+Math.sin(t*(kind==='finale'?7:5))*.08;
   stageRing.scale.set(3.1*pulse,3.1*pulse,3.1*pulse);
  }
  left.visible=right.visible=kind==='army';
  if(kind==='turn'){
   if(opening)for(let i=0;i<5;i++)showAt(77+i,{x:-12+i*6,y:4+Math.sin(t*1.1+i)*.6,z:-7,sx:.42,sy:.42,sz:.42,color:0});
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3+t*.08;
    showAt(i,{x:Math.sin(a)*11,y:.08,z:Math.cos(a)*11,
     sx:2.4,sy:.065,sz:2.4,color,flat:true});
   }

  }else if(kind==='runner'){
   for(let i=-1;i<=1;i++)showAt(i+2,{x:i*13,y:.015,z:0,
    sx:4,sy:.05,sz:2.8,color:9});
   for(let i=0;i<m.obstacles.length&&i<48;i++){
    const o=m.obstacles[i],overhead=o.kind==='low';
    showAt(9+i,{x:o.x,y:overhead?2.6:.9,z:0,
     sx:1.4,sy:overhead?.75:1.8,sz:2.5,color:overhead?1:4});
   }
   for(let i=0;i<10;i++){
    const x=22-(m.runnerDistance*.55+i*4)%44;
    showAt(60+i,{x,y:.1,z:5,sx:.23,sy:.12,sz:.23,color:0});
   }
  }else if(kind==='army'){
   for(let i=0;i<m.units.length&&i<75;i++){
    const u=m.units[i],c=u.team>0?2:4;
    showAt(i,{x:u.x,y:u.role==='roll'?1.1:.8,z:u.team*.28,
     sx:u.role==='roll'?.8:.65,sy:u.role==='roll'?1.1:.8,sz:.75,color:c});
    cues[i].geometry=soldier;cues[i].position.y=0;
    if(u.role==='skill')showAt((i+78)%cues.length,{x:u.x,y:1.8,z:u.team*.28,
      sx:.2,sy:.85,sz:.2,color:6});
   }
  }else if(kind==='rhythm'){
    for(let i=0;i<4;i++)showAt(i,{x:-9+i*5.5,y:.05,z:0,
     sx:1.5,sy:1.5,sz:1.5,color:(i+color)%7,flat:true});
    if(m.note){
     const key=m.note.key,scale=Math.max(.6,Math.min(4,m.note.time*3));
     showAt(11,{x:-9+m.note.index*5.5,y:.15,z:0,
      sx:scale,sy:scale,sz:scale,color:key==='roll'?2:key==='skill'?0:5,flat:true});
    }
   }else if(kind==='finale'){
    if(!m.finishing)for(let i=0;i<8;i++)showAt(i,{x:(i-3.5)*4.4,y:.08,z:-9,sx:.6,sy:.12,sz:.6,color:6,flat:true});
   }else if(kind==='fighter'){
   if(m.fightAttack&&m.fightWind>0){
    // Readable physical attack cone at the location the boss will strike.
    showAt(6,{x:g.boss.x-2.6,y:1.3,z:0,
     sx:1.4,sy:.25,sz:.35,color:4});
   }
   for(let i=0;i<7;i++)showAt(16+i,{x:i*6-18,y:.012,z:-5,
    sx:.38,sy:.04,sz:4,color:7,flat:true});
  }else if(kind==='shooter'){
   for(let i=0;i<Math.min(32,m.bullets.length);i++){
    const b=m.bullets[i];showAt(i,{x:b.x,y:1,z:b.z,
     sx:.37,sy:.37,sz:.37,color:5});
   }
   for(let i=0;i<Math.min(32,m.enemyShots.length);i++){
    const b=m.enemyShots[i];showAt(36+i,{x:b.x,y:1,z:b.z,
     sx:.55,sy:.55,sz:.55,color:4});
   }
   if(m.enemyTarget){
    const p=m.enemyTarget;
    const charge=.3+.7*Math.min(1,p.age/p.wind);
    showAt(70,{x:g.boss.x-1,y:1.6,z:g.boss.z,
     sx:charge,sy:charge,sz:charge,color:4});
   }
  }
  // Full physical set pieces are owned by a separate, pooled scene graph.
  cinematic.update(m);
  if(m.finishing){
   for(const o of cues)o.visible=false;
   stageRing.visible=false;left.visible=false;right.visible=false;
   for(const o of spotlights)o.visible=false;
   showAt(0,{x:g.boss.x,y:.015,z:g.boss.z,
    sx:4,sy:4,sz:4,color:6,flat:true});
   // The quiet ending is handled by the same physical hero-prop scene graph.
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;cinematic.dispose();root.removeFromParent();
  for(const geo of [box,ball,torus,plane,soldier,curtainGeo,horizon.geometry,horizonLight.geometry])geo.dispose();oak.dispose();drape.dispose();roadMaterial.dispose();horizonLight.material.dispose();
  for(const mat of materials)mat.dispose();
  soft.dispose();for(const s of spotlights)s.material.dispose();
 }
 return {root,update,dispose,cinematicStats:()=>cinematic.stats()};
}
