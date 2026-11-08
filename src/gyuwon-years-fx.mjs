import * as THREE from 'three';
import {hazardPosition} from './gyuwon-data.mjs';
import {buildGyuwonYearAttackCues} from './gyuwon-year-cues.mjs';
import {createGyuwonAnimeIllustration} from './gyuwon-anime-illustration.mjs';
import {createGyuwonGachaWheel} from './gyuwon-gacha-wheel.mjs';
import {createGyuwonSoftTentacle} from './gyuwon-soft-tentacle.mjs';

// Reusable scenery/props for the D-day encounter. Never owns gameplay damage.
// Existing battle hazards are the sole source of collision shapes and timing.
export function createGyuwonYearsFx(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-dday-examination-world';root.visible=false;stage.add(root);
 const attackCues=buildGyuwonYearAttackCues(root,{coarse});
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
 const froth=mat(0x9aab91,{roughness:.30,metalness:.12,clearcoat:.9});
 const wax=mat(0xf0c4ba,{roughness:.28,clearcoat:.65});
 const dollOutfits=[0xc78ba9,0x87a5bc,0xc4b187,0x9b82bc,0x87aa9e,0xc6a38b]
  .map(color=>mat(color,{roughness:.3,clearcoat:.65}));
 const animeTextures=Array.from({length:6},(_,i)=>createGyuwonAnimeIllustration(i));
 textures.push(...animeTextures);
 const animeMaterials=animeTextures.map(texture=>{
  const m=new THREE.MeshBasicMaterial({map:texture,transparent:true,
   side:THREE.DoubleSide,depthWrite:false});
  materials.push(m);return m;
 });
 const glyphPlane=geo(new THREE.PlaneGeometry(3.6,1.8));
 const glyphBacking=geo(new THREE.BoxGeometry(3.55,1.76,.16));
 const box=geo(new THREE.BoxGeometry(1,1,1)),cylinder=geo(new THREE.CylinderGeometry(.5,.5,1,coarse?10:18)),
  sphere=geo(new THREE.SphereGeometry(.5,coarse?10:18,coarse?8:12)),
  ring=geo(new THREE.TorusGeometry(1,.09,6,coarse?18:36));
 const items=new Map(),mobiles=[],gameParts=[];
 function mesh(parent,shape,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,name=''){
  const a=new THREE.Mesh(shape,material);a.position.set(x,y,z);a.scale.set(sx,sy,sz);
  a.castShadow=false;a.receiveShadow=false;a.name=name;parent.add(a);return a;
 }
 const exam=new THREE.Group();exam.name='gyuwon-suneung-desk';root.add(exam);
 const examMarks=new THREE.Group();examMarks.name='gyuwon-omr-actual-answer-sheet';exam.add(examMarks);
 for(let row=0;row<8;row++)for(let col=0;col<3;col++)
  mesh(examMarks,sphere,graphite,-.32+col*.29,1.478,-.42+row*.125,.072,.018,.05,'gyuwon-omr-shaded-ink');
 mesh(exam,box,steel,0,1.3,0,2.65,.18,1.8);
 for(const sign of [-1,1]){
  mesh(exam,box,steel,sign*1.06,.65,sign*.55,.18,1.3,.18);
 }
 mesh(exam,box,graphite,0,.7,1.05,1.7,.21,.25);
 const chair=mesh(exam,box,steel,0,.62,1.13,1.55,.17,1.15);
 mesh(exam,box,steel,0,1.18,1.63,1.55,1.05,.16);
 mesh(exam,box,paper,0,1.43,-.1,1.2,.037,.88);
 mesh(exam,box,wax,-1.05,1.43,-.46,.38,.09,.18);
 mesh(exam,box,paper,.96,1.43,.14,.45,.065,.66);
 mesh(exam,box,graphite,1.0,1.48,.36,.39,.018,.14);
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
 mesh(motorcycle,box,steel,0,1.03,-1.15,.95,.52,.62);
 mesh(motorcycle,cylinder,steel,0,1.04,-1.93,.18,1.1,.18).rotation.x=Math.PI/2;
 mesh(motorcycle,sphere,hot,0,1.64,1.47,.38,.29,.15);
 mesh(motorcycle,box,graphite,0,1.82,.94,1.25,.08,.12);
 for(const side of [-1,1]){
  mesh(motorcycle,box,steel,side*.72,.82,-.56,.68,.13,.12);
  mesh(motorcycle,box,rubber,side*.78,.73,-.61,.36,.11,.35);
 }
 wheel(scooter,-1.1,.35);wheel(scooter,1.1,.35);
 mesh(scooter,box,steel,0,.49,0,.37,.13,2.25);
 mesh(scooter,cylinder,steel,0,1.4,.85,.044,2.1,.044);
 mesh(scooter,box,rubber,0,2.45,.85,1.1,.09,.13);
 mesh(scooter,sphere,wax,0,1.35,1.08,.27,.19,.22);
 mesh(scooter,box,graphite,0,.56,0,.31,.06,1.85);
 for(const side of [-1,1])mesh(scooter,cylinder,steel,side*.55,2.44,.85,.12,.28,.12);
 // Cigarette, rifle and bow are now attached to the actor's wrist joints.
 const streamSet=new THREE.Group();streamSet.name='gyuwon-seven-year-broadcast-studio';root.add(streamSet);
 const ringLight=geo(new THREE.TorusGeometry(.9,.075,coarse?10:16,coarse?28:54));
 const cameraLens=geo(new THREE.CylinderGeometry(.21,.26,.35,coarse?12:24));
 const broadcast=mesh(streamSet,cylinder,steel,-3.3,1.35,-3.6,.055,2.7,.055,'gyuwon-stream-mic-stand');
 const light=mesh(streamSet,ringLight,neon,3.2,3.2,-4.0,1,1,1,'gyuwon-broadcast-ring-light');
 const lens=mesh(streamSet,cameraLens,graphite,3.2,3.05,-3.7,1,1,1,'gyuwon-broadcast-camera-lens');
 lens.rotation.x=Math.PI/2;
 mesh(streamSet,box,graphite,-3.3,2.55,-3.25,.62,.28,.57,'gyuwon-stream-live-microphone');
 const speakerL=mesh(streamSet,box,graphite,-4.7,.91,-3.1,1.35,1.7,1.06,'gyuwon-stream-left-speaker');
 const speakerR=mesh(streamSet,box,graphite,4.7,.91,-3.1,1.35,1.7,1.06,'gyuwon-stream-right-speaker');
 for(const speaker of [speakerL,speakerR]){
  mesh(speaker,cylinder,steel,0,-.12,.52,.38,.085,.38,'gyuwon-studio-bass-cone').rotation.x=Math.PI/2;
 }
 const gacha=createGyuwonGachaWheel(root,{coarse});
 const bodyslime=new THREE.Group();bodyslime.name='gyuwon-slime-aura';root.add(bodyslime);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;const m=mesh(bodyslime,sphere,slime,Math.sin(a)*1.4,.28,Math.cos(a)*1.4,1,.5,.72);
  gameParts.push(m);
 }
 const flameAura=new THREE.Group();flameAura.name='gyuwon-third-year-burning-student';root.add(flameAura);
 const flameGeo=geo(new THREE.ConeGeometry(.65,2.1,coarse?8:13));
 const auraFlames=Array.from({length:8},(_,i)=>{
  const flame=mesh(flameAura,flameGeo,hot,0,1.4,0);
  flame.userData.index=i;return flame;
 });
 const bookPiles=new THREE.Group();bookPiles.name='gyuwon-bookfall-stacks';root.add(bookPiles);
 const piles=[],piled=new Set();let activePileYear=0;
 const dollRoot=new THREE.Group();dollRoot.name='gyuwon-figurines-and-photocards';root.add(dollRoot);
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,fig=new THREE.Group();
  fig.position.set(Math.sin(a)*14,0,Math.cos(a)*14);
  fig.userData.index=i;fig.name='gyuwon-anime-2d-display-stand';dollRoot.add(fig);mobiles.push(fig);
  const dust=mesh(fig,ring,froth,0,.13,0,3.18,3.18,3.18,'gyuwon-figurine-ground-impact');
  dust.rotation.x=Math.PI/2;dust.visible=false;fig.userData.impactDust=dust;
  mesh(fig,cylinder,steel,0,.16,0,1.18,.26,1.18,'gyuwon-anime-collector-display-base');
  const art=new THREE.Sprite(new THREE.SpriteMaterial({
   map:animeTextures[i],transparent:true,depthWrite:false}));
  materials.push(art.material);art.name='gyuwon-2d-anime-girl-illustration';
  art.position.set(0,2.52,0);art.scale.set(2.55,3.86,1);fig.add(art);
  for(let j=0;j<7;j++)
   mesh(fig,sphere,j%2?neon:purple,
    Math.sin(j*2.399963)*1.48,.62+(j%4)*1.04,.28,
    .12,.12,.12,'gyuwon-anime-collection-bright-star');
  mesh(fig,box,neon,0,.38,.16,1.9,.12,.1,'gyuwon-anime-display-sign');
  fig.scale.setScalar(coarse?.85:1);
 }
 const tentacleRoot=new THREE.Group();tentacleRoot.name='gyuwon-eight-octopus-arms';root.add(tentacleRoot);
 const tentacles=[],stages=coarse?4:7;
 for(let arm=0;arm<8;arm++)
  tentacles.push(createGyuwonSoftTentacle(tentacleRoot,slime,{coarse,index:arm}));
 const suctionGeom=geo(new THREE.CylinderGeometry(.205,.23,.075,coarse?7:12));
 const suction=new THREE.InstancedMesh(suctionGeom,purple,8*stages*2);
 suction.name='gyuwon-eight-arm-suction-cups';suction.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 suction.frustumCulled=false;tentacleRoot.add(suction);
 const suctionDummy=new THREE.Object3D(),suctionNormal=new THREE.Vector3(0,-1,0);
 const cupRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI);
  const dynamic=new Map();const ringDummy=new THREE.Object3D();const wordTex=new Map(),wordMats=new Map();let waveId=null,waves=[],wave=null,owned=null,disposed=false;
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
   parts.push(mesh(group,box,paper,0,0,0,
     v==='year-bookfall'?h.r*1.45:1.35,.26,v==='year-bookfall'?h.r*1.52:1.75));
   mesh(group,box,hot,0,.15,0,1.05,.03,1.47);
   if(v==='year-merch'){
    const art=mesh(group,new THREE.PlaneGeometry(1.25,1.45),
     animeMaterials[h.id%6],0,.24,.94,1,1,1,'gyuwon-anime-2d-merch-portrait');
    geometries.push(art.geometry);art.rotation.x=-Math.PI/2;
   }
  }else if(v==='year-gacha-prize'){
   mesh(group,sphere,neon,0,.62,0,h.r*.70,h.r*.94,h.r*.70,
    'gyuwon-gacha-falling-prize-capsule');
   mesh(group,box,steel,0,1,0,1.0,.25,1.0,'gyuwon-gacha-capsule-impact-core');
   for(let i=0;i<7;i++){
    const theta=i*2.399963;
    mesh(group,sphere,i%2?neon:purple,
     Math.sin(theta)*h.r*.65,.18+i%3*.4,Math.cos(theta)*h.r*.65,
     .25,.24,.25,'gyuwon-gacha-falling-sparks');
   }
  }else if(v==='year-stream-pulse'){
   const beat=mesh(group,ring,neon,0,-.58,0,h.r,h.r,h.r,
    'gyuwon-broadcast-bass-wave-physical-ring');beat.rotation.x=Math.PI/2;
   for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    mesh(group,sphere,i%2?hot:purple,
     Math.sin(a)*h.r*.56,.12,Math.cos(a)*h.r*.56,
     .3,.30,.3,'gyuwon-stream-vibration-particles');
   }
  }else if(v==='year-pencil'||v==='year-arrow'){
   mesh(group,cylinder,v==='year-arrow'?hot:graphite,0,0,0,.09,2.1,.09).rotation.z=Math.PI*.45;
   mesh(group,sphere,steel,0,-1.05,0,.18,.23,.18);
  }else if(v==='year-sludge'||v==='year-ink'){
   const diameter=2*(h.r+.28);
   mesh(group,sphere,slime,0,.25,0,diameter,1.55,diameter,
    'gyuwon-contorted-3d-sewage-mass');
   for(let i=0;i<11;i++){
    const a=i*2.399963,r=h.r*(.34+.56*((i*7)%5)/5);
    const blob=mesh(group,sphere,i%4?slime:froth,
     Math.cos(a)*r,.07+((i%3)*.17),Math.sin(a)*r,
     .48+(i%3)*.33,.26+(i%4)*.17,.48+(i%3)*.33,
     'gyuwon-sewage-physical-scattered-waste');
    blob.rotation.set(i*.7,i*.2,i*.4);
   }
   const spill=mesh(group,ring,slime,0,-.46,0,
    h.r+.18,h.r+.18,h.r+.18,'gyuwon-sewage-ground-spreading-spill');
   spill.rotation.x=Math.PI/2;
  }else if(v==='year-bullet'){
   // The muzzle-aligned tracer lives in gyuwon-year-cues.mjs, not here.
  }else if(v==='year-photocard'){
   mesh(group,box,paper,0,0,0,1.65,2.15,.075,'gyuwon-anime-photocard-cardstock');
   const art=mesh(group,new THREE.PlaneGeometry(1.46,1.95),
    animeMaterials[h.id%6],0,0,.046,1,1,1,'gyuwon-anime-photocard-2d-illustration');
   geometries.push(art.geometry);
   mesh(group,box,neon,0,-.89,.075,1.2,.09,.035);
  }else if(glyphSets[v]&&v!=='year-social'){
   const tex=wordTexture(v,h.id%4);
   const key=v+(h.id%4);
   if(!wordMats.has(key)){const m=tex?new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}):paper;
    wordMats.set(key,m);if(m!==paper)materials.push(m);}
   mesh(group,glyphBacking,paper,0,0,-.082,1,1,1,'gyuwon-3d-letter-block');
   parts.push(mesh(group,glyphPlane,wordMats.get(key),0,0,.006,1,1,1,'gyuwon-letter-ink-face'));
   if(h.shape==='lane'){
    // Exam writing occupies the complete warning/hit lane, not just one
    // card floating at its midpoint.
    mesh(group,box,paper,0,-.55,0,(h.width+.28)*2,.13,h.length,'gyuwon-3d-ink-line-body');
    for(let i=-3;i<=3;i++){
     if(i===0)continue;
     const glyph=mesh(group,glyphPlane,wordMats.get(key),0,.05,
      i*h.length/8,1,1,1,'gyuwon-repeated-exam-glyph');
     glyph.scale.x=Math.min(1,(h.width+.28)*2/3.6);
    }
   }
  }else if(v==='year-figure'){
   // Figurine attack bodies are handled by the actual posed models.
  }else if(v==='year-circus'){
   mesh(group,sphere,hot,0,0,0,h.r*2,h.r*2,h.r*2);
   }else if(v==='year-fire'||v==='year-social'){
   // A single instanced physical crest expands at the collision radius.
   // At max radius, every angular segment overlaps (no invisible hit gaps).
   const count=coarse?54:80;
   const inst=new THREE.InstancedMesh(sphere,v==='year-fire'?hot:purple,count);
   inst.name='gyuwon-live-ring-crests';inst.frustumCulled=false;
   inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(inst);
   group.userData.ringCreasts=inst;
   if(v==='year-social'){
    const key='year-social'+h.id%4,tex=wordTexture('year-social',h.id%4);
    if(!wordMats.has(key)){
     const ink=tex?new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}):paper;
     if(ink!==paper)materials.push(ink);wordMats.set(key,ink);
    }
    mesh(group,glyphBacking,paper,0,.45,-.06,1,1,1,'gyuwon-social-law-object');
    mesh(group,glyphPlane,wordMats.get(key),0,.45,.03,1,1,1,'gyuwon-social-symbol-face');
   }
  }
  return {group,v,parts};
 }
 const WAVE_LIMIT=34;
 function clearWave(){
  for(const w of waves){w.mesh.removeFromParent();w.crest.removeFromParent();w.geometry.dispose();}
  waves=[];waveId=null;
 }
 function makeWave(h){
  clearWave();waveId=h.id;
  const gap=Math.max(0.1,h.opening-.55);
  for(const [lo,hi] of [[-WAVE_LIMIT,Math.max(-WAVE_LIMIT,h.gap-gap)],
   [Math.min(WAVE_LIMIT,h.gap+gap),WAVE_LIMIT]]){
   if(hi-lo<.2)continue;
   const geometry=new THREE.BoxGeometry(hi-lo,7,(h.depth+.55)*2,coarse?8:20,4,2);
   const m=mesh(root,geometry,h.visual==='year-sludge-wave'?slime:wavewater,
    (lo+hi)/2,3.55,0,1,1,1,'gyuwon-dday-wave-body');
   const crest=mesh(root,box,h.visual==='year-sludge-wave'?froth:paper,
     (lo+hi)/2,6.75,0,hi-lo,.29,.48,'gyuwon-3d-water-physical-crest');
    waves.push({mesh:m,geometry,base:geometry.attributes.position.array.slice(),crest,sideWidth:hi-lo});
  }
 }
 const cues=new THREE.Group();cues.name='gyuwon-exam-wave-passages';root.add(cues);
 const cueL=mesh(cues,box,paper,0,.08,0,.24,.16,60),cueR=mesh(cues,box,paper,0,.08,0,.24,.16,60);
 const score=new THREE.Group();score.name='gyuwon-score-energy';root.add(score);
 const scoreRing=mesh(score,ring,neon,0,.2,0,3.5,.1,3.5);scoreRing.rotation.x=Math.PI/2;
 function removeDynamic(){
  for(const obj of dynamic.values()){obj.group.userData.ringCreasts?.dispose?.();obj.group.removeFromParent();}
  dynamic.clear();
 }
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,b=g?.boss,s=g?.gyuwon;
  if(owned!==g){owned=g;clearWave();removeDynamic();bookPiles.clear();piles.length=0;piled.clear();activePileYear=0;}
  if(!e||g.status!=='playing'){root.visible=false;clearWave();removeDynamic();return;}
  root.visible=true;
  if(activePileYear!==e.year){activePileYear=e.year;bookPiles.clear();piles.length=0;piled.clear();}
  exam.visible=e.mode==='exam';exam.position.set(b.x,0,b.z);exam.rotation.y=b.yaw;
  motorcycle.visible=e.mode==='combat'&&e.cast==='bike';
  scooter.visible=e.mode==='combat'&&e.cast==='scooter';
  cigarette.visible=e.mode==='combat'&&e.cast==='smoke';
  weapon.visible=e.mode==='combat'&&e.year===4;
  bodyslime.visible=e.mode==='combat'&&e.year===5;
  flameAura.visible=e.mode==='combat'&&e.year===3;
  flameAura.position.set(b.x,0,b.z);
  dollRoot.visible=e.mode==='combat'&&e.year===6;
  streamSet.visible=e.mode==='combat'&&e.year===7;
  if(streamSet.visible){
   streamSet.position.set(b.x,0,b.z);streamSet.rotation.y=b.yaw;
   const liveEnergy=e.cast==='donation'?1:.3;
   light.scale.setScalar(1+liveEnergy*.12*Math.sin(g.time*6));
  }
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
  if(flameAura.visible)for(let i=0;i<auraFlames.length;i++){
   const flame=auraFlames[i],a=i*Math.PI/4;
   flame.position.set(Math.sin(a)*.95,1.4+Math.sin(g.time*6+i)*.34,Math.cos(a)*.95);
   flame.scale.y=.7+.45*Math.sin(g.time*7+i);
  }
  if(bodyslime.visible)for(let i=0;i<gameParts.length;i++){
   gameParts[i].scale.y=.5+.3*Math.sin(g.time*4+i);
  }
  if(dollRoot.visible)mobiles.forEach((fig,i)=>{
    const a=i*Math.PI/3,h=s.hazards.find(x=>x.visual==='year-figure'&&Math.abs(x.x-Math.sin(a)*14)<.1&&Math.abs(x.z-Math.cos(a)*14)<.1);
    fig.position.set(Math.sin(a)*14,0,Math.cos(a)*14);
    const impactDust=fig.userData.impactDust;
    impactDust.visible=!!h&&h.age>=h.warn&&h.age<=h.warn+h.life;
    if(h){
     const ready=Math.min(1,h.age/Math.max(.1,h.warn));
     // The model itself falls and contacts the identical center as the hit.
     fig.position.y=6*(1-ready)+(h.age>=h.warn?-.15*Math.sin(Math.min(1,(h.age-h.warn)/.35)*Math.PI):0);
     fig.rotation.y=i*.3+(1-ready)*.75;
     impactDust.scale.setScalar(h.r+.28);
    }else{
     fig.position.y=.14*Math.sin(g.time*2.5+i);fig.rotation.y=g.time*.30+i*.20;
    }
   });
  if(tentacleRoot.visible){
   let cup=0;
   for(let i=0;i<8;i++){
    const h=s.hazards.find(x=>x.armIndex===i)||(e.cast==='octoInk'?s.hazards[i]:null);
    const a=h?.yaw??i*Math.PI/4;
    const warn=h?.warn||1.2;
    const ready=h?Math.max(0,Math.min(1,h.age/warn)):0;
    const attacking=h?.visual==='year-tentacle';
    const reach=attacking?4.2+10.55*ready:e.cast==='octoInk'?11:4.7+Math.sin(g.time*1.8+i)*.4;
    armStart.set(b.x,2.45,b.z);
    for(let j=0;j<stages;j++){
     const t=(j+1)/stages,m=(j+.5)/stages;
     const sway=Math.sin(g.time*2.3+i*.8+j*.40)*.45*(1-ready);
     const distance=reach*t;
     // A real raised-arm anticipation descends to an arm's-length impact.
     const y=attacking?
      .38+(1-t)*2.1+(1-ready)*2.7*Math.sin(Math.PI*t):
      2.25+Math.sin(Math.PI*t)*1.45-Math.max(0,t-.75)*1.5;
     armEnd.set(b.x+Math.sin(a)*distance+Math.cos(a)*sway*t,y,
      b.z+Math.cos(a)*distance-Math.sin(a)*sway*t);
     armSegment.copy(armEnd).sub(armStart);
     armDirection.copy(armSegment).normalize();
     const part=tentacles[i][j],width=.58*(1-j/stages*.74);
     part.position.copy(armStart).addScaledVector(armSegment,.5);
     part.quaternion.setFromUnitVectors(armUp,armDirection);
     part.scale.set(width,Math.max(.02,armSegment.length()),width);
     for(const q of [.32,.68]){
      suctionDummy.position.copy(armStart).addScaledVector(armSegment,q).addScaledVector(armNormal,width*.70);
      suctionDummy.quaternion.copy(cupRotation);
      suctionDummy.scale.setScalar(Math.max(.22,width*.72));
      suctionDummy.updateMatrix();suction.setMatrixAt(cup++,suctionDummy.matrix);
     }
     armStart.copy(armEnd);
    }
   }
   suction.instanceMatrix.needsUpdate=true;
  }
  const waveHazard=s.hazards.find(h=>h.shape==='wave'&&(h.visual==='year-sludge-wave'||h.visual==='year-water-wave'));
  if(waveHazard?.id!==waveId){if(waveHazard)makeWave(waveHazard);else clearWave();}
  // Only the actual split in the wave marks the safe passage; no artificial guide.
   cues.visible=false;
  if(waveHazard){
   const half=waveHazard.opening-.55;
   cueL.position.x=waveHazard.gap-half;cueR.position.x=waveHazard.gap+half;
   // Timing and gap edges are read from the live authoritative hazard.
   const z=waveHazard.z+Math.max(0,waveHazard.age-waveHazard.warn)*waveHazard.speed;
   for(const w of waves){
    w.mesh.position.z=z;w.crest.position.z=z+(waveHazard.depth+.55)*.82;
    w.crest.position.y=6.65+.15*Math.sin(g.time*3.5+w.sideWidth);
    const attr=w.geometry.attributes.position,arr=w.base;
    if(!reduced)for(let i=0;i<attr.count;i++){
     const j=i*3;
     attr.setY(i,arr[j+1]+Math.sin(arr[j]*.32+g.time*2.8+arr[j+1]*.7)*.42);
     // Never displace the crest Z outside its authoritative collision depth.
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
   if(e.year===3&&v==='year-bookfall'&&h.age>=h.warn&&!piled.has(h.id)){
    piled.add(h.id);
    const stack=piles.filter(m=>Math.hypot(m.position.x-h.x,m.position.z-h.z)<2).length;
    const book=mesh(bookPiles,box,paper,h.x,.16+stack*.3,h.z,1.43,.28,1.82);
    book.rotation.y=(h.id%7)*.14;piles.push(book);
    if(piles.length>26)bookPiles.remove(piles.shift());
   }
   if(v==='year-sludge-wave'||v==='year-water-wave'||v==='year-vehicle'||v==='year-bullet'||
    v==='sword'||v==='dice'||v==='year-tentacle'||v==='year-stream'||v==='year-smoke')continue;
   live.add(h.id);let item=dynamic.get(h.id);
   if(!item){item=makeItem(h);dynamic.set(h.id,item);}
   const p=hazardPosition(h),rise=Math.max(0,1-h.age/Math.max(.1,h.warn));
   item.group.position.set(p.x,1.45,p.z);
   if(v==='year-bookfall'||v==='year-merch')item.group.position.y=.45+17*rise;
   if(v==='year-photocard')item.group.position.y=2.3;
   if(v==='year-sludge'||v==='year-ink')item.group.position.y=1.05;
   if(v==='year-fire')item.group.position.y=1.1;
   if(v==='year-circus')item.group.position.y=h.r;
   if(v==='year-figure')item.group.visible=false;
    if(glyphSets[v]&&h.shape==='circle')item.group.scale.setScalar(1.18);
    if(v==='year-fire'||v==='year-social'){
     const inst=item.group.userData.ringCreasts,center=hazardPosition(h),num=inst.count;
     const dummy=ringDummy;
     for(let i=0;i<num;i++){
      const a=i*Math.PI*2/num;
      dummy.position.set(Math.sin(a)*center.r,0,Math.cos(a)*center.r);
      dummy.scale.setScalar(1.5);
      dummy.rotation.set(0,g.time*3+i*.3,0);dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix);
     }
     inst.instanceMatrix.needsUpdate=true;
    }
   if(v.startsWith('year-')&&v!=='year-bookfall')item.group.rotation.y=h.yaw||g.time*.14;
   item.group.rotation.z=.09*Math.sin(g.time*3+h.id);
  }
  for(const [id,item]of dynamic)if(!live.has(id)){item.group.userData.ringCreasts?.dispose?.();item.group.removeFromParent();dynamic.delete(id);}
  attackCues.update(g);
 }
 function clear(){clearWave();removeDynamic();attackCues.clear();bookPiles.clear();piles.length=0;piled.clear();root.visible=false;}
 function dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();
  attackCues.dispose();for(const m of new Set(materials))m.dispose();
  for(const g of new Set(geometries))g.dispose();
  for(const t of textures)t.dispose();
 }
 return {root,update,clear,dispose,stats:()=>({yearProps:dynamic.size,waves:waves.length,tentacles:8,stackedBooks:piles.length,physicalCues:attackCues.stats().active})};
}
