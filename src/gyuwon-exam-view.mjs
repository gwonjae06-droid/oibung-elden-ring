import * as THREE from 'three';

// Diegetic 3D props for the six examinations. Collision and timings are read
// exclusively from gyuwon-combat hazards; these meshes never deal damage.
export function createGyuwonExamView(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-six-exam-world';stage.add(root);
 const surfaces=[],materials=[];
 const mat=(color,options={})=>{
  const m=new THREE.MeshPhysicalMaterial({color,roughness:.49,metalness:.12,...options});
  materials.push(m);return m;
 };
 const ink=mat(0x293140),paperMat=mat(0xd9d2c2,{roughness:.85,side:THREE.DoubleSide});
 const red=mat(0x893b36,{emissive:0x32110d,emissiveIntensity:.5});
 const metal=mat(0x636b73,{roughness:.32,metalness:.74});
 const glass=mat(0xb2a1bc,{roughness:.22,metalness:.2,clearcoat:.7});
 const sludge=mat(0x242822,{roughness:.31,metalness:.21,emissive:0x0d1512,emissiveIntensity:.14,transparent:true,opacity:.94,side:THREE.DoubleSide});
 const feet=mat(0x4a424f,{roughness:.57});
 function add(parent,geo,material,x=0,y=0,z=0){
  const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);
  m.castShadow=false;m.receiveShadow=false;parent.add(m);surfaces.push(m);
  return m;
 }
 const sheets=new THREE.Group();sheets.name='gyuwon-exam-papers';root.add(sheets);
 for(let i=0;i<7;i++){
  const p=add(sheets,new THREE.PlaneGeometry(1.55,2.1),paperMat,Math.sin(i*2.4)*2,2+i*.25,Math.cos(i*2.4)*1.6);
  p.rotation.set(-.55,i*.43,i*.06);
  const stroke=add(sheets,new THREE.BoxGeometry(.92,.018,.01),red,p.position.x,p.position.y+.17,p.position.z+.024);
  stroke.rotation.y=p.rotation.y;
 }
 const options=new THREE.Group();options.name='gyuwon-three-answer-stands';root.add(options);
 const optionPads=[];
 for(let i=0;i<3;i++){
  const stand=new THREE.Group();options.add(stand);
  const base=add(stand,new THREE.CylinderGeometry(1.1,1.24,.19,coarse?16:32),metal,0,.14,0);
  const sigil=add(stand,new THREE.TorusGeometry(.84,.08,8,coarse?16:32),i===0?red:i===1?glass:metal,0,.28,0);
  sigil.rotation.x=Math.PI/2;
  const cone=add(stand,new THREE.OctahedronGeometry(.34,coarse?0:1),paperMat,0,.69,0);
  optionPads.push({stand,base,sigil,cone});
 }
 const rifles=new THREE.Group();rifles.name='gyuwon-four-spectral-rifles';root.add(rifles);
 const guns=[];
 for(let i=0;i<4;i++){
  const gun=new THREE.Group();rifles.add(gun);
  add(gun,new THREE.BoxGeometry(.46,.34,1.35),metal,0,1.62,.16);
  add(gun,new THREE.CylinderGeometry(.13,.13,1.7,coarse?10:18),metal,0,1.67,1.23).rotation.x=Math.PI/2;
  add(gun,new THREE.BoxGeometry(.24,.5,.4),ink,0,1.25,-.38);
  const beam=add(gun,new THREE.BoxGeometry(.045,.05,23),red,0,1.67,12.6);
  beam.material=red;guns.push({gun,beam});
 }
 const bulletGeo=new THREE.SphereGeometry(.32,coarse?8:16,coarse?6:12);
 const bullets=Array.from({length:4},()=>add(root,bulletGeo,red));
 const dolls=new THREE.Group();dolls.name='gyuwon-six-figurines';root.add(dolls);
 const figures=[];
 const dollColors=[0x947e9d,0x6d8498,0xc4a26b,0xa2727e,0x778d83,0x9f9386];
 for(let i=0;i<6;i++){
  const group=new THREE.Group();dolls.add(group);
  const dress=mat(dollColors[i],{roughness:.28,clearcoat:.65});
  add(group,new THREE.CylinderGeometry(1.15,1.27,.3,coarse?16:28),metal,0,.15,0);
  add(group,new THREE.ConeGeometry(.76,1.35,coarse?16:28),dress,0,1.47,0);
  add(group,new THREE.SphereGeometry(.43,coarse?10:20,coarse?8:16),glass,0,2.56,0);
  const hair=add(group,new THREE.SphereGeometry(.49,coarse?10:20,coarse?8:16),ink,0,2.84,-.12);
  hair.scale.set(1,.6,1.08);
  for(const side of [-1,1]){
   add(group,new THREE.CylinderGeometry(.11,.1,.77,coarse?8:12),glass,side*.6,1.97,0).rotation.z=side*.37;
   add(group,new THREE.CylinderGeometry(.12,.16,.75,coarse?8:12),feet,side*.26,.55,0);
   add(group,new THREE.SphereGeometry(.12,8,6),red,side*.15,2.61,.4);
  }
  group.scale.setScalar(coarse?.78:.88);
  figures.push(group);
 }
 const sewage=new THREE.Group();sewage.name='gyuwon-exam-sewage-wave';root.add(sewage);
 let waveId=null,wavePieces=[],owner=null,disposed=false;
 function clearWave(){
  for(const p of wavePieces){sewage.remove(p.mesh);p.mesh.geometry.dispose();}
  wavePieces=[];waveId=null;
 }
 function buildWave(h){
  clearWave();waveId=h.id;
  const safe=h.opening-.55; // EXACTLY the same safe half-width as hazardContains.
  const intervals=[[-RANGE,h.gap-safe],[h.gap+safe,RANGE]];
  for(const [a,b] of intervals){
   const left=Math.max(-RANGE,a),right=Math.min(RANGE,b),width=right-left;
   if(width<=.1)continue;
   const geo=new THREE.BoxGeometry(width,5.4,h.depth*2,coarse?10:24,4,2);
   const mesh=add(sewage,geo,sludge,(left+right)/2,2.8,0);
   const original=geo.attributes.position.array.slice();
   wavePieces.push({mesh,original,geo});
  }
 }
 const RANGE=35;
 function update(g){
  if(disposed)return;
  if(owner!==g){owner=g;clearWave();}
  const s=g?.gyuwon,b=g?.boss,playing=g?.status==='playing';
  const active=!!(playing&&b?.state==='pattern'&&s?.pattern?.startsWith('exam-'));
  root.visible=active;
  if(!active){clearWave();return;}
  const stageId=s.exam.active,t=s.t||0,clock=g.time;
  sheets.visible=stageId<=2;
  sheets.position.set(b.x,0,b.z);
  sheets.rotation.y=Math.sin(clock*.28)*.22;
  for(let i=0;i<sheets.children.length;i++){
   const m=sheets.children[i];m.position.y+=(Math.sin(clock*1.8+i*.9)*.002);
  }
  options.visible=stageId===2&&t<3.6;
  if(options.visible){
   const origin=s.exam.choiceOrigin;
   for(let i=0;i<3;i++){
    const pad=optionPads[i];
    pad.stand.position.set(Math.max(-27,Math.min(27,origin.x+(i-1)*5)),0,Math.max(-27,Math.min(27,origin.z)));
    pad.stand.visible=!s.exam.choiceLocked||s.exam.choice===i;
    pad.cone.rotation.y=clock*.8+i;
   }
  }
  rifles.visible=stageId===3;
  bullets.forEach(o=>o.visible=false);
  if(rifles.visible){
   for(let i=0;i<4;i++){
    const shot=s.hazards.find(h=>h.gun===i),data=guns[i];
    data.gun.visible=!!shot;
    if(!shot)continue;
    data.gun.position.set(shot.x,0,shot.z);data.gun.rotation.y=shot.yaw;
    data.beam.visible=shot.age<shot.warn;
    data.beam.scale.z=.5+.5*Math.min(1,shot.age/Math.max(.1,shot.warn));
    if(shot.age>=shot.warn&&shot.age<shot.warn+shot.life){
     const ball=bullets[i];ball.visible=true;
     ball.position.set(shot.x+shot.vx*(shot.age-shot.warn),1.68,shot.z+shot.vz*(shot.age-shot.warn));
     ball.scale.set(1,1,1.6);
    }
   }
  }
  const wave=stageId===4?s.hazards.find(h=>h.shape==='wave'&&h.visual==='exam-sewage'):null;
  if(wave&&wave.id!==waveId)buildWave(wave);
  sewage.visible=!!wave;
  if(wave){
   const front=wave.z+Math.max(0,wave.age-wave.warn)*wave.speed;
   for(const entry of wavePieces){
    entry.mesh.position.z=front;const attr=entry.geo.attributes.position,a=entry.original;
    for(let k=0;k<attr.count;k++){
     const j=k*3,x=a[j]+entry.mesh.position.x,y=a[j+1];
     attr.setY(k,y+.20*Math.sin(x*.38+clock*2.6+y*.85));
     attr.setZ(k,a[j+2]+.22*Math.sin(x*.31+clock*2.8+y*.7));
    }
    attr.needsUpdate=true;entry.geo.computeVertexNormals();
   }
  }else if(wavePieces.length)clearWave();
  dolls.visible=stageId===5;
  if(dolls.visible)figures.forEach((fig,i)=>{
   const angle=i*Math.PI/3;
   fig.position.set(Math.sin(angle)*15,Math.max(0,Math.sin((t-1.6-i*.48)*Math.PI*1.6))*.6,Math.cos(angle)*15);
   fig.rotation.y=clock*.24+i*.3;
  });
 }
 function dispose(){
  if(disposed)return;disposed=true;clearWave();stage.remove(root);
  const geometries=new Set(surfaces.map(m=>m.geometry));
  for(const geo of geometries)geo.dispose();
  for(const material of new Set(materials))material.dispose();
 }
 return {update,clear:clearWave,dispose,stats:()=>({wavePieces:wavePieces.length,figures:figures.length})};
}
