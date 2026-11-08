import * as THREE from 'three';

// Instanced/cached primitive stagecraft. One rig for Gyuwon and one for the
// player stay in the scene for every genre. Every moving prop here reads the
// SAME simulation positions used by the collision/damage module.
export function createGyuwonMusicalStage(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='gyuwon-white-musical-performance';scene.add(root);
 const box=new THREE.BoxGeometry(1,1,1);
 const ball=new THREE.SphereGeometry(1,coarse?10:18,coarse?8:12);
 const torus=new THREE.TorusGeometry(1,.105,coarse?6:10,coarse?18:28);
 const plane=new THREE.CircleGeometry(1,coarse?20:40);
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
 let disposed=false;
 function showAt(i,{x=0,y=1,z=0,sx=1,sy=1,sz=1,color=0,rotate=0,flat=false}={}){
  const o=cues[i];if(!o)return;
  o.visible=true;o.material=materials[Math.abs(color)%materials.length];
  o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.rotation.set(flat?-Math.PI/2:0,rotate,0);
 }
 function update(g){
  if(disposed)return;
  const m=g?.gyuwon?.years?.musical;
  root.visible=!!m&&g.status==='playing';
  if(!root.visible)return;
  const year=m.year,kind=m.kind,color=Math.max(0,year-5),t=m.time;
  for(const o of cues)o.visible=false;
  const beatPhase=t*1.7;
  for(let i=0;i<spotlights.length;i++){
   const o=spotlights[i];
   o.visible=true;
   o.material.opacity=m.finishing?.035:.12+Math.sin(beatPhase+i*1.2)*.035;
   o.position.x=Math.sin(i*Math.PI/4+t*.13)*(kind==='finale'?14:10);
   o.position.z=Math.cos(i*Math.PI/4+t*.13)*9;
  }
  stageRing.visible=kind==='rhythm'||kind==='finale';
  if(stageRing.visible){
   stageRing.position.set(g.boss.x,2.2+(Math.sin(t*3)*.2),g.boss.z);
   const pulse=1+Math.sin(t*(kind==='finale'?7:5))*.08;
   stageRing.scale.set(3.1*pulse,3.1*pulse,3.1*pulse);
  }
  left.visible=right.visible=kind==='army';
  if(kind==='turn'){
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3+t*.08;
    showAt(i,{x:Math.sin(a)*11,y:.08,z:Math.cos(a)*11,
     sx:2.4,sy:.065,sz:2.4,color,flat:true});
   }
   if(m.turn==='boss')showAt(7,{x:g.boss.x-2.5,y:1,z:0,
    sx:2.3,sy:3,sz:1,color:4});
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
    if(u.role==='skill')showAt((i+78)%cues.length,{x:u.x,y:1.8,z:u.team*.28,
      sx:.2,sy:.85,sz:.2,color:6});
   }
  }else if(kind==='rhythm'||kind==='finale'){
   for(let i=0;i<4;i++)showAt(i,{x:-9+i*5.5,y:.05,z:0,
    sx:1.5,sy:1.5,sz:1.5,color:(i+color)%7,flat:true});
   if(m.note){
    const key=m.note.key,scale=Math.max(.6,Math.min(4,m.note.time*3));
    showAt(11,{x:-9+m.note.index*5.5,y:.15,z:0,
     sx:scale,sy:scale,sz:scale,color:key==='roll'?2:key==='skill'?0:5,flat:true});
   }
   if(kind==='finale')for(let i=0;i<5;i++){
    const a=t*.7+i*1.26;
    showAt(30+i,{x:Math.sin(a)*9,y:4+Math.sin(a)*1.4,z:Math.cos(a)*8,
     sx:.85,sy:.85,sz:.85,color:(i+color)%7});
   }
  }else if(kind==='fighter'){
   if(m.fightAttack&&m.fightWind>0){
    // Readable physical attack cone at the location the boss will strike.
    showAt(5,{x:g.boss.x-2.1,y:.08,z:0,
     sx:3.5,sy:.06,sz:3.4,color:4,flat:true});
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
    showAt(70,{x:p.x,y:.09,z:p.z,
     sx:1.65,sy:1.65,sz:1.65,color:4,flat:true});
   }
  }
  if(m.finishing){
   for(const o of cues)o.visible=false;
   stageRing.visible=false;left.visible=false;right.visible=false;
   for(const o of spotlights)o.visible=false;
   showAt(0,{x:g.boss.x,y:.015,z:g.boss.z,
    sx:4,sy:4,sz:4,color:6,flat:true});
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;root.removeFromParent();
  for(const geo of [box,ball,torus,plane])geo.dispose();
  for(const mat of materials)mat.dispose();
  soft.dispose();for(const s of spotlights)s.material.dispose();
 }
 return {root,update,dispose};
}
