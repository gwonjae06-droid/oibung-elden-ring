import * as THREE from 'three';
import {hazardPosition} from './gyuwon-data.mjs';

// Reusable scenery/props for the D-day encounter. Never owns gameplay damage.
// Existing battle hazards are the sole source of collision shapes and timing.
export function createGyuwonYearsFx(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-dday-examination-world';root.visible=false;stage.add(root);
 const materials=[],geometries=[],textures=[];
 function geo(g){geometries.push(g);return g;}
 function mat(color,extra={}){const m=new THREE.MeshPhysicalMaterial({
  color,roughness:.55,metalness:.1,...extra});materials.push(m);return m;}
 const paper=mat(0xddd7c9,{roughness:.91,side:THREE.DoubleSide});
 const graphite=mat(0x292c34,{roughness:.69});
 const steel=mat(0x5a6573,{roughness:.31,metalness:.76});
 const rubber=mat(0x212225,{roughness:.9});
 const hot=mat(0xbd5e37,{emissive:0x632a14,emissiveIntensity:.6});
 const slime=mat(0x363d25,{roughness:.21,metalness:.14,transparent:true,opacity:.83,depthWrite:true,side:THREE.DoubleSide});
 const wavewater=mat(0x5d867d,{roughness:.22,metalness:.24,transparent:true,opacity:.73,side:THREE.DoubleSide});
 const purple=mat(0xb19eb9,{roughness:.29,clearcoat:.8});
 const neon=mat(0xe5bf61,{roughness:.34,emissive:0x5b351a,emissiveIntensity:.8});
 const glyphPlane=geo(new THREE.PlaneGeometry(3.6,1.8));
 const box=geo(new THREE.BoxGeometry(1,1,1)),cylinder=geo(new THREE.CylinderGeometry(.5,.5,1,coarse?10:18)),
  sphere=geo(new THREE.SphereGeometry(.5,coarse?10:18,coarse?8:12)),
  ring=geo(new THREE.TorusGeometry(1,.09,6,coarse?18:36));
 const items=new Map(),mobiles=[],gameParts=[];
 function mesh(parent,shape,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,name=''){
  const a=new THREE.Mesh(shape,material);a.position.set(x,y,z);a.scale.set(sx,sy,sz);
  a.castShadow=false;a.receiveShadow=false;a.name=name;parent.add(a);return a;
 }
 const exam=new THREE.Group();exam.name='gyuwon-suneung-desk';root.add(exam);
 mesh(exam,box,steel,0,1.3,0,2.65,.18,1.8);
 for(const sign of [-1,1]){
  mesh(exam,box,steel,sign*1.06,.65,sign*.55,.18,1.3,.18);
 }
 mesh(exam,box,graphite,0,.7,1.05,1.7,.21,.25);
 const chair=mesh(exam,box,steel,0,.62,1.13,1.55,.17,1.15);
 mesh(exam,box,steel,0,1.18,1.63,1.55,1.05,.16);
 mesh(exam,box,paper,0,1.43,-.1,1.2,.037,.88);
 mesh(exam,cylinder,graphite,.42,1.45,.15,.025,.63,.025).rotation.z=.63;
 const motorcycle=new THREE.Group();motorcycle.name='gyuwon-motorbike';root.add(motorcycle);
 const scooter=new THREE.Group();scooter.name='gyuwon-electric-scooter';root.add(scooter);
 function wheel(parent,z,r=.7){
  const outer=mesh(parent,cylinder,rubber,0,r,z,r,.28,r);
  outer.rotation.z=Math.PI/2;const hub=mesh(parent,cylinder,steel,0,r,z,r*.35,.32,r*.35);
  hub.rotation.z=Math.PI/2;return outer;
 }
 wheel(motorcycle,-1.35,.77);wheel(motorcycle,1.35,.77);
 mesh(motorcycle,box,steel,0,1.15,0,.72,.45,2.1);
 mesh(motorcycle,box,hot,0,1.3,-.25,.8,.4,.92);
 mesh(motorcycle,box,rubber,0,1.63,-.47,.82,.17,1.05);
 mesh(motorcycle,cylinder,steel,0,1.5,1.1,.065,1.55,.065).rotation.x=.4;
 wheel(scooter,-1.1,.35);wheel(scooter,1.1,.35);
 mesh(scooter,box,steel,0,.49,0,.37,.13,2.25);
 mesh(scooter,cylinder,steel,0,1.4,.85,.044,2.1,.044);
 mesh(scooter,box,rubber,0,2.45,.85,1.1,.09,.13);
 const cigarette=new THREE.Group();cigarette.name='gyuwon-cigarette-smoke';root.add(cigarette);
 mesh(cigarette,cylinder,paper,0,2.12,0,.08,1.0,.08).rotation.z=.84;
 const smokePuffs=Array.from({length:6},(_,i)=>mesh(cigarette,sphere,paper,0,2.35+i*.34,.3+i*.22,
   .21+i*.07,.14+i*.045,.24+i*.06));
 const weapon=new THREE.Group();weapon.name='gyuwon-snipergun-and-bow';root.add(weapon);
 mesh(weapon,box,steel,0,1.4,.25,.46,.32,2.2);
 mesh(weapon,cylinder,steel,0,1.43,1.75,.12,.12,2.15).rotation.x=Math.PI/2;
 mesh(weapon,box,rubber,0,1.1,-.4,.25,.7,.44);
 const bowCurve=geo(new THREE.TorusGeometry(.85,.08,6,coarse?16:28,Math.PI));
 const bow=mesh(weapon,bowCurve,hot,1.1,1.6,.6,1,1,1);bow.rotation.z=Math.PI/2;
 const bodyslime=new THREE.Group();bodyslime.name='gyuwon-slime-aura';root.add(bodyslime);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;const m=mesh(bodyslime,sphere,slime,Math.sin(a)*1.4,.28,Math.cos(a)*1.4,1,.5,.72);
  gameParts.push(m);
 }
 const dollRoot=new THREE.Group();dollRoot.name='gyuwon-figurines-and-photocards';root.add(dollRoot);
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3,fig=new THREE.Group();fig.position.set(Math.sin(angle)*13,0,Math.cos(angle)*13);
  dollRoot.add(fig);mobiles.push(fig);
  mesh(fig,cylinder,steel,0,.12,0,1.3,.25,1.3);
  mesh(fig,cylinder,purple,0,1.05,0,.7,1.25,.7);
  mesh(fig,sphere,paper,0,2,0,.82,.86,.75);
  const hair=mesh(fig,sphere,graphite,0,2.26,-.13,.84,.48,.8);
  for(const sign of [-1,1]){
   mesh(fig,cylinder,purple,sign*.75,1.1,0,.18,1.05,.18).rotation.z=sign*.3;
  }
 }
 const tentacleRoot=new THREE.Group();tentacleRoot.name='gyuwon-eight-octopus-arms';root.add(tentacleRoot);
 const tentacles=[];const stages=coarse?4:7;
 for(let arm=0;arm<8;arm++){
  const limbs=[];
  for(let i=0;i<stages;i++){
   const part=mesh(tentacleRoot,cylinder,slime,0,1,0,
    .55*(1-i/stages*.7),1.6,.55*(1-i/stages*.7));
   limbs.push(part);
  }tentacles.push(limbs);
 }
 const dynamic=new Map();const wordTex=new Map(),wordMats=new Map();let waveId=null,waves=[],wave=null,owned=null,disposed=false;
 const portrait=["청산별곡","관동별곡","어즈버","사미인곡"];
 const glyphSets={
  'year-korean':portrait,
  'year-math':['∑','√','π','x²'],
  'year-english':['VERDICT','ANSWER','FAIL','QUESTION'],
  'year-history':['왕조','고려','독립','연표'],
  'year-social':['⚖','₩','사회','정의'],
  'year-letters':['논리','오답','명제','불안']
 };
 function wordTexture(kind,idx){
  const key=kind+idx;
  if(wordTex.has(key))return wordTex.get(key);
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');if(!c)return null;
  c.fillStyle='#e7e1ce';c.fillRect(0,0,512,256);
  c.strokeStyle='#5c2430';c.lineWidth=8;c.strokeRect(12,12,488,232);
  c.fillStyle='#312932';c.font='bold 68px sans-serif';
  c.textAlign='center';c.textBaseline='middle';
  c.fillText(glyphSets[kind]?.[idx%4]||'?',256,128,480);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  textures.push(tex);wordTex.set(key,tex);return tex;
 }
 function makeItem(h){
  const group=new THREE.Group();group.name='gyuwon-year-attack-'+h.visual;
  root.add(group);
  const v=h.visual||'',parts=[];
  if(v==='year-workbook'||v==='year-bookfall'||v==='year-merch'){
   parts.push(mesh(group,box,paper,0,0,0,1.35,.26,1.75));
   mesh(group,box,hot,0,.15,0,1.05,.03,1.47);
  }else if(v==='year-pencil'||v==='year-arrow'){
   mesh(group,cylinder,v==='year-arrow'?hot:graphite,0,0,0,.09,2.1,.09).rotation.z=Math.PI*.45;
   mesh(group,sphere,steel,0,-1.05,0,.18,.23,.18);
  }else if(v==='year-sludge'||v==='year-ink'){
   mesh(group,sphere,slime,0,0,0,3.2,1.65,3.2);
  }else if(v==='year-bullet'){
   mesh(group,sphere,hot,0,0,0,.35,.35,1.5);
  }else if(v==='year-photocard'){
   mesh(group,box,paper,0,0,0,1.5,1.95,.075);
   mesh(group,box,purple,0,0,.045,1.18,1.55,.015);
  }else if(glyphSets[v]){
   const tex=wordTexture(v,h.id%4);
   const key=v+(h.id%4);
   if(!wordMats.has(key)){const m=tex?new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}):paper;
    wordMats.set(key,m);if(m!==paper)materials.push(m);}
   parts.push(mesh(group,glyphPlane,wordMats.get(key),0,0,0));
  }else if(v==='year-figure'){
   mesh(group,sphere,purple,0,0,0,2.1,2.1,2.1);
  }else if(v==='year-circus'){
   mesh(group,sphere,hot,0,0,0,h.r*2,h.r*2,h.r*2);
  }else if(v==='year-fire'){
   mesh(group,geo(new THREE.ConeGeometry(1.3,5,coarse?9:16)),hot,0,1.8,0);
  }
  return {group,v,parts};
 }
 const WAVE_LIMIT=34;
 function clearWave(){
  for(const w of waves){w.mesh.removeFromParent();w.geometry.dispose();}
  waves=[];waveId=null;
 }
 function makeWave(h){
  clearWave();waveId=h.id;
  const gap=Math.max(0.1,h.opening-.55);
  for(const [lo,hi] of [[-WAVE_LIMIT,Math.max(-WAVE_LIMIT,h.gap-gap)],
   [Math.min(WAVE_LIMIT,h.gap+gap),WAVE_LIMIT]]){
   if(hi-lo<.2)continue;
   const geometry=new THREE.BoxGeometry(hi-lo,7,h.depth*2,coarse?8:20,4,2);
   const m=mesh(root,geometry,h.visual==='year-sludge-wave'?slime:wavewater,
    (lo+hi)/2,3.55,0,1,1,1,'gyuwon-dday-wave-body');
   waves.push({mesh:m,geometry,base:geometry.attributes.position.array.slice()});
  }
 }
 const cues=new THREE.Group();cues.name='gyuwon-exam-wave-passages';root.add(cues);
 const cueL=mesh(cues,box,paper,0,.08,0,.24,.16,60),cueR=mesh(cues,box,paper,0,.08,0,.24,.16,60);
 const score=new THREE.Group();score.name='gyuwon-score-energy';root.add(score);
 const scoreRing=mesh(score,ring,neon,0,.2,0,3.5,.1,3.5);scoreRing.rotation.x=Math.PI/2;
 function removeDynamic(){
  for(const obj of dynamic.values())obj.group.removeFromParent();
  dynamic.clear();
 }
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,b=g?.boss,s=g?.gyuwon;
  if(owned!==g){owned=g;clearWave();removeDynamic();}
  if(!e||g.status!=='playing'){root.visible=false;clearWave();removeDynamic();return;}
  root.visible=true;
  exam.visible=e.mode==='exam';exam.position.set(b.x,0,b.z);exam.rotation.y=b.yaw;
  motorcycle.visible=e.mode==='combat'&&e.cast==='bike';
  scooter.visible=e.mode==='combat'&&e.cast==='scooter';
  cigarette.visible=e.mode==='combat'&&e.cast==='smoke';
  weapon.visible=e.mode==='combat'&&e.year===4;
  bodyslime.visible=e.mode==='combat'&&e.year===5;
  dollRoot.visible=e.mode==='combat'&&e.year===6;
  tentacleRoot.visible=e.mode==='combat'&&e.year===8;
  motorcycle.position.set(b.x,0,b.z);motorcycle.rotation.y=b.yaw;
  scooter.position.set(b.x,0,b.z);scooter.rotation.y=b.yaw;
  cigarette.position.set(b.x,0,b.z);cigarette.rotation.y=b.yaw;
  weapon.position.set(b.x,0,b.z);weapon.rotation.y=b.yaw;
  bodyslime.position.set(b.x,0,b.z);
  for(let i=0;i<smokePuffs.length;i++){
   const puff=smokePuffs[i];puff.position.y=2.2+i*.34+Math.sin(g.time*3+i)*.15;
   puff.material.opacity=1;
  }
  if(bodyslime.visible)for(let i=0;i<gameParts.length;i++){
   gameParts[i].scale.y=.5+.3*Math.sin(g.time*4+i);
  }
  if(dollRoot.visible)mobiles.forEach((fig,i)=>{fig.rotation.y=g.time*.62+i;fig.position.y=.15*Math.sin(g.time*3+i)});
  if(tentacleRoot.visible){
   const offset=new THREE.Vector3(),last=new THREE.Vector3(),tip=new THREE.Vector3(),dir=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
   for(let i=0;i<8;i++){
    const a=i*Math.PI/4;last.set(b.x,2.4,b.z);
    for(let j=0;j<stages;j++){
     const t=(j+1)/stages,sway=Math.sin(g.time*3.4+i+j*.41)*1.15;
     tip.set(b.x+Math.sin(a)*t*11+Math.cos(a)*sway*t,2.5+Math.sin(t*Math.PI)*3.4-t*1.7,
      b.z+Math.cos(a)*t*11-Math.sin(a)*sway*t);
     const part=tentacles[i][j];offset.copy(tip).sub(last);dir.copy(offset).normalize();
     part.position.copy(last).addScaledVector(offset,.5);
     part.quaternion.setFromUnitVectors(up,dir);part.scale.y=offset.length();
     last.copy(tip);
    }
   }
  }
  const waveHazard=s.hazards.find(h=>h.shape==='wave'&&(h.visual==='year-sludge-wave'||h.visual==='year-water-wave'));
  if(waveHazard?.id!==waveId){if(waveHazard)makeWave(waveHazard);else clearWave();}
  cues.visible=!!waveHazard;
  if(waveHazard){
   const half=waveHazard.opening-.55;
   cueL.position.x=waveHazard.gap-half;cueR.position.x=waveHazard.gap+half;
   cues.children.forEach(c=>{c.material.opacity=.3;});
   const z=waveHazard.z+Math.max(0,waveHazard.age-waveHazard.warn)*waveHazard.speed;
   for(const w of waves){
    w.mesh.position.z=z;
    const attr=w.geometry.attributes.position,arr=w.base;
    if(!reduced)for(let i=0;i<attr.count;i++){
     const j=i*3;
     attr.setY(i,arr[j+1]+Math.sin(arr[j]*.32+g.time*2.8+arr[j+1]*.7)*.42);
     attr.setZ(i,arr[j+2]+Math.sin(arr[j]*.29+g.time*2.5+arr[j+1])*.22);
    }
    attr.needsUpdate=true;if(!reduced)w.geometry.computeVertexNormals();
   }
  }
  score.visible=e.mode==='result';score.position.set(b.x,0,b.z);
  if(score.visible){
   const t=e.gradeT;
   score.scale.setScalar(1+t*2.3);scoreRing.material.color.setHex(
    e.grade==='great'?0xf1c75a:e.grade==='normal'?0x9bd4c9:0xad2836);
  }
  const live=new Set();
  for(const h of s.hazards){
   const v=h.visual||'';
   if(v==='year-sludge-wave'||v==='year-water-wave'||v==='year-vehicle'||
    v==='sword'||v==='dice'||v==='year-tentacle'||v==='year-stream'||v==='year-smoke')continue;
   live.add(h.id);let item=dynamic.get(h.id);
   if(!item){item=makeItem(h);dynamic.set(h.id,item);}
   const p=hazardPosition(h),rise=Math.max(0,1-h.age/Math.max(.1,h.warn));
   item.group.position.set(p.x,1.45,p.z);
   if(v==='year-bookfall'||v==='year-merch')item.group.position.y=.45+17*rise;
   if(v==='year-photocard')item.group.position.y=2.3;
   if(v==='year-sludge'||v==='year-ink')item.group.position.y=.55;
   if(v==='year-fire')item.group.position.y=1.1;
   if(v==='year-circus')item.group.position.y=h.r;
   if(v.startsWith('year-')&&v!=='year-bookfall')item.group.rotation.y=h.yaw||g.time*.14;
   item.group.rotation.z=.09*Math.sin(g.time*3+h.id);
  }
  for(const [id,item]of dynamic)if(!live.has(id)){item.group.removeFromParent();dynamic.delete(id);}
 }
 function clear(){clearWave();removeDynamic();root.visible=false;}
 function dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();
  for(const m of new Set(materials))m.dispose();
  for(const g of new Set(geometries))g.dispose();
  for(const t of textures)t.dispose();
 }
 return {root,update,clear,dispose,stats:()=>({yearProps:dynamic.size,waves:waves.length,tentacles:8})};
}
