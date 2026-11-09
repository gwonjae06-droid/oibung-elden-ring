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
 const soldier=new THREE.LatheGeometry([[0,0],[.35,0],[.38,.12],[.18,.18],[.24,.6],[.32,.85],[.16,1],[.22,1.07],[.25,1.3],[.18,1.5],[0,1.52]].map(p=>new THREE.Vector2(...p)),coarse?16:32);
 const boards=new THREE.Group();root.add(boards);
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
 let disposed=false,ensemble=[];
 function setEnsemble(roles){ensemble=Array.isArray(roles)?roles:[];}
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
  const opening=year===5&&!m.finishing&&t<8;
  for(let i=0;i<2;i++){const side=i===0?-1:1,fabric=openingCurtains[i];fabric.visible=opening;
   const draw=THREE.MathUtils.smoothstep(t,2.15,5.7);fabric.position.x=side*(6+13*draw);fabric.scale.x=1.03-.38*draw;
   fabric.rotation.y=side*.2*draw;}
  lintel.visible=edgeLamps[0].visible=edgeLamps[1].visible=opening;
  for(let i=0;i<cues.length;i++){const o=cues[i];o.visible=false;o.geometry=i%9===0?torus:i%3===0?box:ball;}
  // Reuse the 5수 guest cast instead of loading another set of 3D actors.
  if(kind==='finale'){
   const alive=!m.finishing&&t>=37.92,entrance=THREE.MathUtils.smoothstep(t,37.92,48);
   ensemble.forEach((role,i)=>{
    if(role.parent!==root)root.add(role);
    role.visible=alive;
    const x=-12+i*8,from=i%2?-24:24;
    role.position.set(from+(x-from)*entrance,
      .18+Math.sin(t*1.7+i)*.12*(alive?1:0),-9+Math.sin(i*2.4)*2);
    role.rotation.y=Math.sin(t*.31+i)*.36;
    role.rotation.z=Math.sin(t*1.35+i*.9)*.06;
    if(t>=124)role.rotation.z+=Math.sin(t*3+i)*.075;
   });
  }
  const beatPhase=t*1.7;
  for(let i=0;i<spotlights.length;i++){
   const o=spotlights[i];
   o.visible=true;
   o.material.opacity=m.finishing?.035:opening?.06+Math.sin(beatPhase+i*1.2)*.015:.12+Math.sin(beatPhase+i*1.2)*.035;
   o.position.x=Math.sin(i*Math.PI/4+t*.13)*(kind==='finale'?14:10);
   o.position.z=Math.cos(i*Math.PI/4+t*.13)*9;
  }
  stageRing.visible=kind==='rhythm'||kind==='finale';
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
  }else if(kind==='rhythm'||kind==='finale'){
   for(let i=0;i<4;i++)showAt(i,{x:-9+i*5.5,y:.05,z:0,
    sx:1.5,sy:1.5,sz:1.5,color:(i+color)%7,flat:true});
   if(m.note){
    const key=m.note.key,scale=Math.max(.6,Math.min(4,m.note.time*3));
    showAt(11,{x:-9+m.note.index*5.5,y:.15,z:0,
     sx:scale,sy:scale,sz:scale,color:key==='roll'?2:key==='skill'?0:5,flat:true});
   }
   if(kind==='finale'){
    const memory=Math.min(5,m.finaleStep||0);
    for(let j=0;j<7;j++){const a=j*Math.PI*2/7+t*.28;showAt(42+j,{x:Math.sin(a)*14,y:1.5+Math.sin(t*1.7+j)*1.1,z:Math.cos(a)*9,sx:memory===2?2.1:.9,sy:memory===2?1.7:.9,sz:.9,color:(j+memory)%7});}
    for(let j=0;j<6;j++){const a=t*(memory===5?2.5:.6)+j*Math.PI/3;showAt(52+j,{x:Math.sin(a)*(6+memory),y:8+Math.cos(a*2)*2,z:-9+Math.cos(a)*2,sx:memory===4?1.4:.55,sy:.55,sz:.55,color:(memory+j+2)%7});}
   }
   if(kind==='finale'){
    for(let i=0;i<Math.min(12,m.finaleHazards?.length||0);i++){
     const h=m.finaleHazards[i],q=Math.min(1,h.age/h.wind),after=h.age>h.wind;
     const star=h.kind==='star',banner=h.kind==='banner';
     // Soft shadow is positioned at the exact contact center.
     showAt(77+i,{x:h.x,y:.03,z:h.z,sx:h.radius||2.3,sy:1,sz:h.radius||2.3,
      color:star?9:banner?2:6,flat:true});
     cues[77+i].material=soft;cues[77+i].material.opacity=.17+.16*Math.sin(Math.min(1,q)*Math.PI/2);
     // Airborne source approaches the marked contact point while the music plays.
     showAt(60+i,{x:h.fxX??h.x,y:star?8.8*(1-q)+.6:banner?1.5:1.0,
      z:h.fxZ??h.z,sx:star?1.0+q*1.1:1.3,sy:star?1.0+q*1.1:2.5,sz:star?1.0+q*1.1:1.3,
      color:star?9:banner?0:2,rotate:t*.2});
     cues[60+i].geometry=star?ball:banner?soldier:torus;
     if(after)cues[60+i].scale.multiplyScalar(Math.max(.06,1-(h.age-h.wind)/.9));
    }
   }
   if(kind==='finale'&&t>=124&&t<176.5){
    for(let i=0;i<5;i++){
     const a=i*Math.PI*2/5+t*.25;
     showAt(72+i,{x:Math.sin(a)*16,y:8.5+Math.sin(t+i)*.7,z:-8+Math.cos(a)*7,
      sx:.42,sy:1.6,sz:.42,color:(i+6)%7});
    }
   }
   if(kind==='finale')for(let i=0;i<5;i++){
    const a=t*.7+i*1.26;
    showAt(30+i,{x:Math.sin(a)*9,y:4+Math.sin(a)*1.4,z:Math.cos(a)*8,
     sx:.85,sy:.85,sz:.85,color:(i+color)%7});
   }
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
  for(const geo of [box,ball,torus,plane,soldier,curtainGeo])geo.dispose();oak.dispose();drape.dispose();
  for(const mat of materials)mat.dispose();
  soft.dispose();for(const s of spotlights)s.material.dispose();
 }
 return {root,update,dispose,setEnsemble};
}
