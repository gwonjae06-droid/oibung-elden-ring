import * as THREE from 'three';
import {ownAnticipation,ridePose,smooth,tentacleYaw} from './gyuwon-year-choreography.mjs';
import {createGyuwonPressureCrest} from './gyuwon-pressure-crest.mjs';
import {hazardPosition} from './gyuwon-data.mjs';
import {buildGyuwonYearAttackCues} from './gyuwon-year-cues.mjs';
import {createGyuwonAnimeIllustration} from './gyuwon-anime-illustration.mjs';
import {createGyuwonGachaWheel} from './gyuwon-gacha-wheel.mjs';
import {createGyuwonSoftTentacle} from './gyuwon-soft-tentacle.mjs';
import {createGyuwonYearApocalypseFx} from './gyuwon-year-apocalypse-fx.mjs';

// Reusable scenery/props for the D-day encounter. Never owns gameplay damage.
// Existing battle hazards are the sole source of collision shapes and timing.
export function createGyuwonYearsFx(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-dday-examination-world';root.visible=false;stage.add(root);
 const attackCues=buildGyuwonYearAttackCues(root,{coarse});
 const apocalypse=createGyuwonYearApocalypseFx(root,{coarse,reduced});
 const materials=[],geometries=[],textures=[];
 function geo(g){geometries.push(g);return g;}
 function mat(color,extra={}){const m=new THREE.MeshPhysicalMaterial({
  color,roughness:.55,metalness:.1,...extra});materials.push(m);return m;}
 const memoryGold=mat(0xf0c96b,{metalness:.68,roughness:.32,emissive:0x86601f,emissiveIntensity:.38});
 const memoryCount=coarse?192:384,memoryPositions=new Float32Array(memoryCount*3),memoryGeometry=geo(new THREE.BufferGeometry());memoryGeometry.setAttribute('position',new THREE.BufferAttribute(memoryPositions,3).setUsage(THREE.DynamicDrawUsage));
 const memoryDustMaterial=new THREE.PointsMaterial({color:0xffd16c,size:coarse?.16:.12,transparent:true,opacity:.78,depthWrite:false});materials.push(memoryDustMaterial);
 const memoryDust=new THREE.Points(memoryGeometry,memoryDustMaterial);memoryDust.name='gyuwon-golden-memory-reconstruction-particles';memoryDust.frustumCulled=false;root.add(memoryDust);
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
 // Rounded, soft organic tongues of fire: no triangular polygon cones.
 const flameGeo=geo(new THREE.CapsuleGeometry(.39,1.24,coarse?4:9,coarse?9:18));
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
  const dynamic=new Map(),pool=new Map();let poolCount=0;const poolKey=h=>[h.visual,h.shape,h.r,h.width,h.length,(h.visual==='year-photocard'||h.visual==='year-merch')?h.id%6:0].join(':');const ringDummy=new THREE.Object3D();const wordTex=new Map(),wordMats=new Map();let waveId=null,waves=[],wavePool=[],wave=null,owned=null,disposed=false;
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
  c.clearRect(0,0,512,256);
  c.fillStyle='#312932';c.font='bold 68px sans-serif';
  c.textAlign='center';c.textBaseline='middle';
  if(kind==='year-history'){
   c.strokeStyle='#d2b78c';c.fillStyle='#9c7452';c.lineWidth=9;
   if(idx%2===0){ // palace roof and pillars
    c.beginPath();c.moveTo(70,110);c.lineTo(256,40);c.lineTo(442,110);c.closePath();c.stroke();
    for(let i=0;i<5;i++)c.fillRect(104+i*66,116,16,100);c.fillRect(80,218,355,12);
   }else{ // period earthenware silhouette
    c.beginPath();c.moveTo(205,40);c.lineTo(307,40);c.bezierCurveTo(280,120,420,200,302,228);
    c.lineTo(210,228);c.bezierCurveTo(92,200,232,120,205,40);c.fill();
   }
  }else c.fillText(glyphSets[kind]?.[idx%4]||'?',256,128,480);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  textures.push(tex);wordTex.set(key,tex);return tex;
 }
 function makeItem(h){
  const owned=[];const itemGeo=g=>(owned.push(g),g);
  const group=new THREE.Group();group.name='gyuwon-year-attack-'+h.visual;
  root.add(group);
  const v=h.visual||'',parts=[];
  if(v==='year-toppling-book'||v==='year-final-omr'){
   const pivot=new THREE.Group();pivot.name='gyuwon-textbook-hinge';group.add(pivot);
   if(v==='year-final-omr'){
    pivot.name='gyuwon-last-answer-omr-hinge';pivot.scale.set(1,h.length/15,1);
    const fold=new THREE.Group();fold.name='gyuwon-last-answer-paper-fold';fold.position.y=7.5;pivot.add(fold);group.userData.fold=fold;
    const outline=itemGeo(new THREE.RingGeometry(.78,1,12)),fill=itemGeo(new THREE.CircleGeometry(1,12));
    for(const [parent,count,start]of [[pivot,10,0],[fold,8,10]]){
     mesh(parent,box,paper,0,3.75,0,h.width*2,7.5,.16,'gyuwon-ivory-omr-answer-sheet');
     const bubbles=new THREE.InstancedMesh(outline,graphite,count*5*3*2),answers=new THREE.InstancedMesh(fill,hot,count*3*2),dummy=new THREE.Object3D();
     bubbles.name='gyuwon-omr-answer-bubble-grid';answers.name='gyuwon-omr-failed-answer-records';let index=0,answer=0;
     for(let row=start;row<start+count;row++)for(let block=-1;block<=1;block++)for(const side of [-1,1])for(let col=0;col<5;col++){
      const x=block*4.5+(col-2)*.52,y=1.1+row*.69-(parent===fold?7.5:0);
      dummy.position.set(x,y,side*.115);dummy.rotation.set(0,side<0?Math.PI:0,0);dummy.scale.set(.17,.17,1);dummy.updateMatrix();bubbles.setMatrixAt(index++,dummy.matrix);
      if(col===row%5){dummy.scale.set(.14,.14,.03);dummy.updateMatrix();answers.setMatrixAt(answer++,dummy.matrix);}
     }
     parent.add(bubbles,answers);
    }
   }else{
    mesh(pivot,box,paper,0,7.5,0,h.width*2,15,.55,'gyuwon-giant-standing-textbook');
    for(const side of [-1,1])mesh(pivot,box,hot,0,7.5,side*.31,h.width*2+.12,15.1,.10,'gyuwon-textbook-hardback-cover');
    for(let i=0;i<5;i++)mesh(pivot,box,graphite,0,11-i*1.2,.38,h.width*1.4,.12,.03,'gyuwon-textbook-cover-lettering');
   }
   group.userData.hinge=pivot;
  }else if(v==='sword'){
   const pivot=new THREE.Group();pivot.name='gyuwon-memory-sword-hinge';pivot.scale.set(h.width,h.length/43,1);group.add(pivot);
   const shape=new THREE.Shape();shape.moveTo(-1,0);shape.lineTo(1,0);shape.lineTo(1,38);shape.lineTo(0,43);shape.lineTo(-1,38);shape.closePath();
   const blade=itemGeo(new THREE.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelSize:.1,bevelThickness:.12,bevelSegments:2,steps:1}));
   mesh(pivot,blade,memoryGold,0,0,-.2,1,1,1,'gyuwon-memory-forged-spatial-blade');
   mesh(pivot,box,memoryGold,0,0,0,6,.6,.8,'gyuwon-memory-sword-crossguard');
   mesh(pivot,cylinder,graphite,0,-2,0,.45,4,.45,'gyuwon-memory-sword-grip');
   group.userData.hinge=pivot;
  }else if(v==='dice'){
   mesh(group,box,memoryGold,0,0,0,3.4,3.4,3.4,'gyuwon-memory-tumbling-die');
   for(const side of [-1,1])for(let i=0;i<5;i++)mesh(group,sphere,graphite,side*1.72,(i%2-.5)*1.2,(Math.floor(i/2)-1)*.9,.10,.30,.30,'gyuwon-dice-recessed-pip');
  }else if(v==='year-radial-sludge'){
   const body=itemGeo(new THREE.BoxGeometry(h.width*2,3,h.depth*2,coarse?8:16,6,4));
   const pos=body.attributes.position;
   for(let i=0;i<pos.count;i++)pos.setZ(i,pos.getZ(i)+Math.sin(pos.getY(i)*1.4)*.35);
   body.computeVertexNormals();mesh(group,body,slime,0,1.5,0,1,1,1,'gyuwon-rolling-garbage-wave');
  }else if(v==='year-workbook'||v==='year-bookfall'||v==='year-merch'){
   parts.push(mesh(group,box,paper,0,0,0,
     v==='year-bookfall'?h.r*1.45:1.35,.26,v==='year-bookfall'?h.r*1.52:1.75));
   mesh(group,box,hot,0,.15,0,1.05,.03,1.47);
   if(v==='year-merch'){
    const art=mesh(group,itemGeo(new THREE.PlaneGeometry(1.25,1.45)),
     animeMaterials[h.id%6],0,.24,.94,1,1,1,'gyuwon-anime-2d-merch-portrait');
    art.rotation.x=-Math.PI/2;
   }
  }else if(v==='year-gacha-prize'){
   mesh(group,sphere,neon,0,.62,0,h.r*.70,h.r*.94,h.r*.70,
    'gyuwon-gacha-falling-prize-capsule');
   mesh(group,box,steel,0,1,0,1.0,.25,1.0,'gyuwon-gacha-capsule-impact-core');
   }else if(v==='year-open-workbook'){
   const covers=[];for(const side of [-1,1]){const pivot=new THREE.Group();group.add(pivot);mesh(pivot,box,paper,side*.7,.12,0,1.4,.14,1.8,'gyuwon-open-workbook-pages');mesh(pivot,box,hot,side*.7,0,0,1.5,.08,1.9,'gyuwon-open-workbook-cover');pivot.userData.side=side;covers.push(pivot);}group.userData.covers=covers;
   const crest=createGyuwonPressureCrest(paper,{coarse});group.add(crest.mesh);group.userData.crest=crest;
  }else if(v==='year-stream-pulse'){
   const crest=createGyuwonPressureCrest(neon,{coarse});group.add(crest.mesh);
   group.userData.crest=crest;
  }else if(v==='year-pencil'||v==='year-arrow'){
   mesh(group,cylinder,v==='year-arrow'?hot:graphite,0,0,0,.09,2.1,.09).rotation.z=Math.PI*.45;
   mesh(group,sphere,steel,0,-1.05,0,.18,.23,.18);
  }else if(v==='year-sludge'||v==='year-ink'){
   const diameter=2*(h.r+.28);
   mesh(group,sphere,slime,0,.25,0,diameter,1.55,diameter,
    'gyuwon-contorted-3d-sewage-mass');
   if(v==='year-sludge'){
    const bag=mesh(group,sphere,graphite,.55,.70,.22,1.45,1.65,1.1,'gyuwon-tied-trash-bag');
    mesh(group,box,graphite,.55,1.65,.22,.32,.28,.24,'gyuwon-trash-bag-tied-neck');
    const apple=mesh(group,sphere,paper,-.65,.45,.45,.47,.86,.47,'gyuwon-discarded-apple-core');
    for(const y of [.1,.8])mesh(group,sphere,hot,-.65,y,.45,.73,.26,.73,'gyuwon-apple-peel');
    const fish=new THREE.Group();fish.name='gyuwon-discarded-fish-skeleton';group.add(fish);fish.position.set(.2,.45,-.8);
    mesh(fish,box,paper,0,0,0,1.8,.09,.09,'gyuwon-fish-spine');
    for(let i=0;i<5;i++)for(const side of [-1,1]){
     const rib=mesh(fish,box,paper,-.6+i*.25,0,side*.21,.06,.06,.52,'gyuwon-fish-rib');rib.rotation.y=side*.45;
    }
    mesh(fish,sphere,paper,.92,0,0,.34,.29,.32,'gyuwon-fish-skull');
   }
   const spill=mesh(group,ring,slime,0,-.46,0,
    h.r+.18,h.r+.18,h.r+.18,'gyuwon-sewage-ground-spreading-spill');
   spill.rotation.x=Math.PI/2;
  }else if(v==='year-bullet'){
   // The muzzle-aligned tracer lives in gyuwon-year-cues.mjs, not here.
  }else if(v==='year-photocard'){
   mesh(group,box,paper,0,0,0,1.65,2.15,.075,'gyuwon-anime-photocard-cardstock');
   const art=mesh(group,itemGeo(new THREE.PlaneGeometry(1.46,1.95)),
    animeMaterials[h.id%6],0,0,.046,1,1,1,'gyuwon-anime-photocard-2d-illustration');

   mesh(group,box,neon,0,-.89,.075,1.2,.09,.035);
  }else if(glyphSets[v]&&v!=='year-social'){
   const tex=wordTexture(v,h.id%4);
   const key=v+(h.id%4);
   if(!wordMats.has(key)){const m=tex?new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide}):paper;
    wordMats.set(key,m);if(m!==paper)materials.push(m);}

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
  }else if(v==='year-audience'){
   for(let i=0;i<3;i++){
    const person=new THREE.Group();person.name='gyuwon-rushing-circus-spectator';person.position.set((i-1)*.8,0,-i*.65);group.add(person);
    mesh(person,cylinder,graphite,0,1.1,0,.62,1.2,.62,'gyuwon-spectator-coat');
    mesh(person,sphere,wax,0,1.95,0,.56,.65,.55,'gyuwon-spectator-head');
    for(const side of [-1,1]){
     mesh(person,box,graphite,side*.19,.30,side*.22,.25,.7,.28,'gyuwon-spectator-running-leg');
     mesh(person,box,graphite,side*.42,1.2,side*.22,.20,.8,.22,'gyuwon-spectator-swinging-arm');
    }
   }
  }else if(v==='year-circus'){
   mesh(group,sphere,hot,0,0,0,h.r*2,h.r*2,h.r*2);
   }else if(v==='year-fire'||v==='year-social'){
   const crest=createGyuwonPressureCrest(v==='year-fire'?hot:purple,{coarse});
   group.add(crest.mesh);group.userData.crest=crest;
  }
  return {group,v,parts,owned};
 }
 const WAVE_LIMIT=34;
 function clearWave(){for(const w of wavePool){w.mesh.visible=w.crest.visible=false;}waves=[];waveId=null;}
 function makeWave(h){
  clearWave();waveId=h.id;const gap=Math.max(.1,h.opening-.55);
  for(const [index,[lo,hi]]of [[-WAVE_LIMIT,Math.max(-WAVE_LIMIT,h.gap-gap)],[Math.min(WAVE_LIMIT,h.gap+gap),WAVE_LIMIT]].entries()){
   if(hi-lo<.2)continue;
   let w=wavePool[index];
   if(!w){const geometry=geo(new THREE.BoxGeometry(1,7,1,coarse?8:20,4,2));
    const m=mesh(root,geometry,wavewater,0,3.55,0,1,1,1,'gyuwon-dday-wave-body'),crest=mesh(root,box,paper,0,6.75,0,1,.29,.48,'gyuwon-3d-water-physical-crest');
    w={mesh:m,geometry,base:geometry.attributes.position.array.slice(),crest};wavePool[index]=w;
   }
   w.mesh.visible=w.crest.visible=true;w.mesh.material=h.visual==='year-sludge-wave'?slime:wavewater;w.crest.material=h.visual==='year-sludge-wave'?froth:paper;
   w.mesh.position.x=w.crest.position.x=(lo+hi)/2;w.mesh.scale.set(hi-lo,1,(h.depth+.55)*2);w.crest.scale.x=hi-lo;w.sideWidth=hi-lo;waves.push(w);
  }
 }
 const cues=new THREE.Group();cues.name='gyuwon-exam-wave-passages';root.add(cues);
 const cueL=mesh(cues,box,paper,0,.08,0,.24,.16,60),cueR=mesh(cues,box,paper,0,.08,0,.24,.16,60);
 const score=new THREE.Group();score.name='gyuwon-score-energy';root.add(score);
 const scoreRing=mesh(score,ring,neon,0,.2,0,3.5,.1,3.5);scoreRing.rotation.x=Math.PI/2;
 function destroyItem(item){item.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});
  item.group.userData.crest?.dispose();
  for(const geometry of item.owned)geometry.dispose();
  item.group.removeFromParent();
 }
 function retireItem(item){const key=item.poolKey;if(poolCount<48){if(!pool.has(key))pool.set(key,[]);if(pool.get(key).length<4){item.group.visible=false;pool.get(key).push(item);poolCount++;return;}}destroyItem(item);}
 function acquireItem(h){const key=poolKey(h),items=pool.get(key);let item;if(items?.length){item=items.pop();poolCount--;item.group.visible=true;item.group.scale.set(1,1,1);item.group.rotation.set(0,0,0);}else item=makeItem(h);item.poolKey=key;return item;}
 function removeDynamic(){
  for(const obj of dynamic.values())retireItem(obj);
  dynamic.clear();
 }
 function update(g){
  if(disposed)return;
  const e=g?.gyuwon?.years,b=g?.boss,s=g?.gyuwon;
  if(owned!==g){owned=g;clearWave();removeDynamic();bookPiles.clear();piles.length=0;piled.clear();activePileYear=0;}
  if(!e||g.status!=='playing'){root.visible=false;clearWave();removeDynamic();return;}
  root.visible=true;apocalypse.update(g);
  if(activePileYear!==e.year){activePileYear=e.year;bookPiles.clear();piles.length=0;piled.clear();}
  exam.visible=e.mode==='exam';exam.position.set(b.x,0,b.z);exam.rotation.y=b.yaw;
  const mounted=ridePose(e);
  motorcycle.visible=!!mounted&&mounted.ride==='bike';scooter.visible=!!mounted&&mounted.ride==='scooter';
  gacha.update(g);
  bodyslime.visible=false;
  flameAura.visible=false;
  flameAura.position.set(b.x,0,b.z);
  dollRoot.visible=e.mode==='combat'&&(e.year===6||e.cast==='nightmare365'&&e.castT>=6.5&&e.castT<8);
  streamSet.visible=e.mode==='combat'&&(e.year===7||e.cast==='nightmare365'&&e.castT>=7.8&&e.castT<9.5);
  if(streamSet.visible){
   streamSet.position.set(b.x,0,b.z);streamSet.rotation.y=b.yaw;
   const liveEnergy=e.cast==='donation'?1:.3;
   light.scale.setScalar(1+liveEnergy*.12*Math.sin(g.time*6));
  }
  tentacleRoot.visible=e.mode==='combat'&&(e.year===8||e.cast==='nightmare365'&&e.castT>=9.2&&e.castT<11.2);
  motorcycle.position.set(b.x,mounted?.y||0,b.z);motorcycle.rotation.y=b.yaw;
  scooter.position.set(b.x,mounted?.y||0,b.z);scooter.rotation.y=b.yaw;
  bodyslime.position.set(b.x,0,b.z);
  if(flameAura.visible)for(let i=0;i<auraFlames.length;i++){
   const flame=auraFlames[i],a=i*Math.PI/4;
   flame.position.set(Math.sin(a)*.95,1.4+Math.sin(g.time*6+i)*.34,Math.cos(a)*.95);
   flame.scale.y=.7+.45*Math.sin(g.time*7+i);
  }
  if(bodyslime.visible)for(let i=0;i<gameParts.length;i++){
   gameParts[i].scale.y=.5+.3*Math.sin(g.time*4+i);
  }
  if(dollRoot.visible)mobiles.forEach((fig,i)=>{
    const a=i*Math.PI/3,ward=e.cast==='ultimateShrine'?e.wards?.[i]:null;
    const cx=ward?.x??Math.sin(a)*14,cz=ward?.z??Math.cos(a)*14;
    const h=s.hazards.find(x=>x.visual==='year-figure'&&Math.hypot(x.x-cx,x.z-cz)<.1);
    fig.position.set(cx,0,cz);
    const impactDust=fig.userData.impactDust;
    impactDust.visible=false;
    if(h){
     const ready=ownAnticipation(h);
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
    const h=s.hazards.find(x=>x.armIndex===i)||
     (e.cast==='octoInk'?s.hazards[i]:null);
    const a=h?tentacleYaw(h):i*Math.PI/4;
    const warn=h?.warn||1.2;
    const ready=h?ownAnticipation(h)*(h.age<=h.warn+h.life*.7?1:1-smooth((h.age-h.warn-h.life*.7)/(h.life*.3))):0;
    const attacking=h?.visual==='year-tentacle';
    const reach=attacking?4.2+(h.length-4.2)*ready:
     e.cast==='octoInk'?11:4.7+Math.sin(g.time*1.8+i)*.4;
    const path=tentacles[i].pose({
     x:b.x,z:b.z,yaw:a,ready,time:g.time,attacking,reach
    }).curve;
    for(let j=0;j<stages;j++)for(const q of [.32,.68]){
     const t=(j+q)/stages;
     path.getPoint(t,suctionDummy.position).addScaledVector(suctionNormal,
      (.64*Math.pow(1-t,.82)+.04)*.71);
     suctionDummy.quaternion.copy(cupRotation);
     suctionDummy.scale.setScalar(Math.max(.15,(.64*(1-t)+.04)*.64));
     suctionDummy.updateMatrix();suction.setMatrixAt(cup++,suctionDummy.matrix);
    }
   }
   suction.instanceMatrix.needsUpdate=true;
  }
    const waveHazard=s.hazards.find(h=>h.shape==='wave'&&(h.visual==='year-sludge-wave'||h.visual==='year-water-wave'));
  if(waveHazard?.id!==waveId){if(waveHazard)makeWave(waveHazard);else clearWave();}
  // Only the actual split in the wave marks the safe passage; no artificial guide.
   cues.visible=false;
  if(waveHazard){
   const visible=!(waveHazard.signature&&waveHazard.warn-waveHazard.age>1.55);
   for(const w of waves){w.mesh.visible=w.crest.visible=visible;}
   const half=waveHazard.opening-.55;
   cueL.position.x=waveHazard.gap-half;cueR.position.x=waveHazard.gap+half;
   // Timing and gap edges are read from the live authoritative hazard.
   const z=waveHazard.z+Math.max(0,waveHazard.age-waveHazard.warn)*waveHazard.speed;
   for(const [index,w]of waves.entries()){
    const lo=index===0?-WAVE_LIMIT:waveHazard.gap+half,hi=index===0?waveHazard.gap-half:WAVE_LIMIT;w.sideWidth=hi-lo;w.mesh.scale.x=w.crest.scale.x=w.sideWidth;w.mesh.position.x=w.crest.position.x=(lo+hi)/2;
    w.mesh.position.z=z;w.crest.position.z=z+(waveHazard.depth+.55)*.82;
    w.crest.position.y=6.65+.15*Math.sin(g.time*3.5+w.sideWidth);
    const attr=w.geometry.attributes.position,arr=w.base;
    if(!reduced)for(let i=0;i<attr.count;i++){
     const j=i*3;
     attr.setY(i,arr[j+1]+Math.sin(arr[j]*w.sideWidth*.32+g.time*2.8+arr[j+1]*.7)*.42);
     // Never displace the crest Z outside its authoritative collision depth.
    }
    attr.needsUpdate=true;if(!reduced)w.geometry.computeVertexNormals();
   }
  }
  score.visible=false;score.position.set(b.x,0,b.z);
  if(score.visible){
   const t=e.gradeT;
   score.scale.setScalar(1+t*2.3);scoreRing.material.color.setHex(
    e.grade==='great'?0xf1c75a:e.grade==='normal'?0x9bd4c9:0xad2836);
  }
  memoryDust.visible=e.year>=9&&e.mode==='combat';
  if(memoryDust.visible){const attr=memoryGeometry.attributes.position,hazards=s.hazards.filter(h=>h.warn-h.age<1.55);
   for(let i=0;i<memoryCount;i++){const h=hazards[i%hazards.length],a=i*2.399963+g.time*.3;
    if(h){const p=hazardPosition(h);let x=p.x+Math.sin(a)*(h.r||1.5),z=p.z+Math.cos(a)*(h.r||1.5),y=.5+(i%11)*.24;
     if(h.shape==='lane'||h.shape==='topple'){const d=((i*17%97)/96-.5)*h.length;x=p.x+Math.sin(h.yaw)*d;z=p.z+Math.cos(h.yaw)*d;}
     if(h.shape==='wave'){x=(i/memoryCount-.5)*68;z=h.z+Math.max(0,h.age-h.warn)*h.speed;y=.6+(i%23)*.25;if(Math.abs(x-h.gap)<h.opening)x=h.gap+h.opening+1;}
     attr.setXYZ(i,x,y+Math.sin(a)*.2,z);
    }else{const r=28+(i%7);attr.setXYZ(i,Math.sin(a)*r,.5+(i%21)*.3,Math.cos(a)*r);}
   }attr.needsUpdate=true;
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
    v==='year-tentacle'||v==='year-stream'||v==='year-smoke')continue;
   live.add(h.id);let item=dynamic.get(h.id);
   if(!item){item=acquireItem(h);dynamic.set(h.id,item);}
   const p=hazardPosition(h),rise=1-ownAnticipation(h);
   const ready=ownAnticipation(h,v==='year-final-omr'?3:1.05);

    item.group.visible=h.warn-h.age<=(v==='year-final-omr'?3:1.55);
   item.group.position.set(p.x,1.45,p.z);
   if(v==='year-toppling-book'||v==='year-final-omr'){
    item.group.position.set(h.x-Math.sin(h.yaw)*h.length/2,0,h.z-Math.cos(h.yaw)*h.length/2);
    item.group.rotation.set(0,h.yaw,0);
    // Entire book contacts its floor footprint exactly when damage starts.
    item.group.userData.hinge.rotation.x=Math.PI/2*smooth(ready);
    if(item.group.userData.fold)item.group.userData.fold.rotation.x=-Math.sin(Math.PI*ready)*.62;
   }
   if(v==='sword'){
    item.group.position.set(h.x-Math.sin(h.yaw)*h.length/2,0,h.z-Math.cos(h.yaw)*h.length/2);
    item.group.rotation.set(0,h.yaw,0);item.group.userData.hinge.rotation.x=Math.PI/2*smooth(ready);
   }
   if(v==='dice'){item.group.position.y=1.7+14*rise;if(h.stageRedirect&&h.age<h.warn){item.group.position.x=h.dropFromX+(h.x-h.dropFromX)*smooth(ready);item.group.position.z=h.dropFromZ+(h.z-h.dropFromZ)*smooth(ready);item.group.rotation.z=(1-ready)*.8;}}
   if(v==='year-radial-sludge'){item.group.position.y=0;item.group.rotation.set(0,h.yaw,0);item.group.scale.y=(h.waveHeight||3)/3;}

   if(v==='year-bookfall'||v==='year-merch')item.group.position.y=.45+17*rise;
   if(h.sentenceIndex!==undefined&&h.age<h.warn){const q=ownAnticipation(h,1.9);item.group.position.set(h.x+(h.sentenceIndex-1.5)*2*(1-smooth(q)),1.2+2.4*Math.sin(q*Math.PI),h.z+2*Math.sin(q*Math.PI));item.group.rotation.z=(1-q)*.8;}
   if(v==='year-photocard')item.group.scale.z=.7+.3*Math.sin(h.age*10);
  if(v==='year-gacha-prize')item.group.position.y=.62+12*rise;
  if(v==='year-stream-pulse')item.group.position.y=.66;
  if(v==='year-gacha-prize'||v==='year-stream-pulse'){
   const w=ownAnticipation(h);
   item.group.scale.setScalar(.82+.18*w);
  }
   if(v==='year-photocard')item.group.position.y=2.3;
   if(v==='year-sludge'||v==='year-ink'){
   const progress=ownAnticipation(h),lob=v==='year-sludge'&&e.cast?.startsWith('sewage');
   item.group.position.y=.52+(lob?Math.sin(Math.PI*progress)*4:0);
   if(lob){
    item.group.position.x=e.from.x+(p.x-e.from.x)*smooth(progress);
    item.group.position.z=e.from.z+(p.z-e.from.z)*smooth(progress);
    item.group.scale.setScalar(.30+.70*smooth(progress));
   }
   const puddle=item.group.getObjectByName('gyuwon-sewage-ground-spreading-spill');
   if(puddle){
    const w=h.age>=h.warn?1:ownAnticipation(h);
    puddle.scale.setScalar((h.r+.18)*(.55+.45*w));
   }
  }
   if(h.puddle){item.group.position.y=.025;item.group.scale.y=.10;}
   if(v==='year-fire')item.group.position.y=1.1;
   if(v==='year-circus')item.group.position.y=h.r;
   if(v==='year-audience'){
    item.group.position.y=0;item.group.rotation.y=Math.atan2(h.vx,h.vz);
    item.group.traverse(o=>{
     if(o.name==='gyuwon-spectator-running-leg')o.rotation.x=Math.sin(h.age*13+Math.sign(o.position.x)*Math.PI/2)*.6;
     if(o.name==='gyuwon-spectator-swinging-arm')o.rotation.x=-Math.sin(h.age*13+Math.sign(o.position.x)*Math.PI/2)*.65;
    });
   }
   if(v==='year-figure')item.group.visible=false;
    if(glyphSets[v]&&h.shape==='circle'){
    item.group.position.y=v==='year-korean'?.7+9*rise:v==='year-english'?1.8+8*rise:1.2;
    item.group.scale.set(v==='year-english'?.55:1.18,v==='year-english'?2.8:1.18,1.18);
   }
   if(item.group.userData.covers)for(const cover of item.group.userData.covers)cover.rotation.z=cover.userData.side*Math.PI*.46*(1-ready);
   if(item.group.userData.crest){
    item.group.position.y=0;item.group.rotation.set(0,0,0);
    item.group.userData.crest.update(p.r,h.width||1,g.time,v==='year-fire',ownAnticipation(h));
   }
   if(v.startsWith('year-')&&!['year-bookfall','year-toppling-book','year-radial-sludge','year-audience'].includes(v)&&!item.group.userData.crest&&!item.group.userData.hinge)item.group.rotation.y=h.yaw??g.time*.14;
   if(!item.group.userData.crest&&!item.group.userData.hinge)item.group.rotation.z=.09*Math.sin(g.time*3+h.id);
  }
  for(const [id,item]of dynamic)if(!live.has(id)){retireItem(item);dynamic.delete(id);}
  attackCues.update(g);
 }
 function clear(){clearWave();removeDynamic();attackCues.clear();bookPiles.clear();piles.length=0;piled.clear();root.visible=false;}
 function dispose(){if(disposed)return;disposed=true;clear();root.removeFromParent();
  for(const items of pool.values())for(const item of items)destroyItem(item);pool.clear();poolCount=0;attackCues.dispose();apocalypse.dispose();gacha.dispose();tentacles.forEach(t=>t.dispose());
  for(const m of new Set(materials))m.dispose();
  for(const g of new Set(geometries))g.dispose();
  for(const t of textures)t.dispose();
 }
 return {root,update,clear,dispose,ready:Promise.all(animeTextures.map(t=>t.userData.ready||Promise.resolve(true))),stats:()=>({yearProps:dynamic.size,pooledProps:poolCount,waves:waves.length,tentacles:8,animeStandees:6,gachaSectors:gacha.stats().sectors,apocalypse:apocalypse.stats(),stackedBooks:piles.length,physicalCues:attackCues.stats().active})};
}

