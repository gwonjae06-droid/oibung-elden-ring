import * as THREE from 'three';
import {gyuwonWorldBreak,GYUWON_NIGHTMARE_BEATS} from './gyuwon-year-signatures.mjs';

// Scenery is deliberately outside the collision arena. Only the ordinary
// gyuwon.hazards deal damage, including the final relay.
export function createGyuwonYearApocalypseFx(stage,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-progressive-broken-school';stage.add(root);
 const geos=[],mats=[],objects=[];
 const geo=g=>(geos.push(g),g);
 const mat=(color,extras={})=>{const m=new THREE.MeshStandardMaterial({
  color,roughness:.78,metalness:.09,...extras});mats.push(m);return m;};
 const wall=mat(0x536174,{side:THREE.DoubleSide}),desk=mat(0x6b554b);
 const windowMat=mat(0x97afc2,{transparent:true,opacity:.34,depthWrite:false,
  side:THREE.DoubleSide,emissive:0x213c53,emissiveIntensity:.17});
 const crack=mat(0x32202b,{emissive:0x572f3a,emissiveIntensity:.3});
 const ghostMat=mat(0x798baf,{transparent:true,opacity:.34,depthWrite:false,
  emissive:0x4c527c,emissiveIntensity:.55});
 const red=mat(0x7d2736,{emissive:0x6c1524,emissiveIntensity:.43});
 const gold=mat(0xc99b61,{emissive:0x725026,emissiveIntensity:.4});
 const report=mat(0xf0e7d5,{side:THREE.DoubleSide,roughness:.95});
 const dark=mat(0x1c2634);
 const box=geo(new THREE.BoxGeometry(1,1,1)),
  ball=geo(new THREE.SphereGeometry(1,coarse?8:14,coarse?6:10)),
  ring=geo(new THREE.TorusGeometry(1,.09,coarse?6:9,coarse?20:36));
 function mesh(parent,g,m,x,y,z,sx,sy,sz,name){
  const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.name=name;parent.add(o);objects.push(o);return o;
 }
 // 360-degree school corridor: walls and windows are fractured architecture,
 // not flat UI hitbox panels or triangles. Geometry is reused by instancing.
 const world=new THREE.Group();world.name='gyuwon-collapsing-school-corridor';root.add(world);
 const wallCount=coarse?20:32,wallPieces=new THREE.InstancedMesh(box,wall,wallCount);
 wallPieces.name='gyuwon-crumbling-wall-sections';wallPieces.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 wallPieces.frustumCulled=false;world.add(wallPieces);
 const windowCount=coarse?10:18,windows=new THREE.InstancedMesh(box,windowMat,windowCount);
 windows.name='gyuwon-shattered-classroom-windows';windows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 windows.frustumCulled=false;world.add(windows);
 const rubbleCount=coarse?22:48,rubble=new THREE.InstancedMesh(box,desk,rubbleCount);
 rubble.name='gyuwon-floating-classroom-debris';rubble.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 rubble.frustumCulled=false;world.add(rubble);
 const splits=new THREE.Group();splits.name='gyuwon-physical-cracked-walls';world.add(splits);
 for(let i=0;i<(coarse?18:30);i++){
  const a=i*2.399963,r=36+(i%5)*3.8;
  const c=mesh(splits,box,crack,Math.sin(a)*r,1.3+(i%6)*.78,Math.cos(a)*r,
   .065,2+(i%3)*1.2,.09,'gyuwon-building-zigzag-crack');
  c.rotation.set(i*.13,a,i%2?.38:-.41);
 }
 const scoreScene=new THREE.Group();scoreScene.name='gyuwon-grade-transformation-cutscene';
 root.add(scoreScene);
 const paper=mesh(scoreScene,box,report,0,2.6,0,1.25,1.55,.09,'gyuwon-grade-physical-report-card');
 const stamp=mesh(scoreScene,ring,red,0,2.65,.09,.43,.43,1,'gyuwon-grade-stamped-report');
 const tearL=mesh(scoreScene,box,report,-.65,1.35,0,.75,.8,.06,'gyuwon-grade-torn-paper-left');
 const tearR=mesh(scoreScene,box,report,.65,1.35,0,.75,.8,.06,'gyuwon-grade-torn-paper-right');
 const gradeWave=mesh(scoreScene,ring,gold,0,.055,0,1,1,1,'gyuwon-grade-floor-impact');
 gradeWave.rotation.x=Math.PI/2;
 const pages=[];
 for(let i=0;i<18;i++)pages.push(mesh(scoreScene,box,i%4?report:red,0,0,0,
  .38,.56,.035,'gyuwon-result-flying-exam-sheet'));
 const wardRoot=new THREE.Group();wardRoot.name='gyuwon-sixth-year-breakable-shrine-wards';root.add(wardRoot);
 const wards=[];
 for(let i=0;i<6;i++){
  const o=new THREE.Group();o.name='gyuwon-physical-ward-'+i;wardRoot.add(o);wards.push(o);
  mesh(o,box,dark,0,.65,0,1.4,1.15,.6,'gyuwon-ward-collapsible-plinth');
 }
 const nightmareRoot=new THREE.Group();nightmareRoot.name='gyuwon-365-day-nightmare-ghost-relay';
 root.add(nightmareRoot);
 const afterimages=[];
 for(let i=0;i<10;i++){
  const group=new THREE.Group();group.name='gyuwon-past-self-'+(i+1);nightmareRoot.add(group);
  const colour=i<3?0x5a7089:i<6?0x6e608d:i<8?0x98738c:0x9c7651;
  const clothing=mat(colour,{transparent:true,opacity:.67,depthWrite:false,
   emissive:colour,emissiveIntensity:.27});
  mesh(group,ball,ghostMat,0,2.2,0,.38,.46,.36,'gyuwon-memory-human-head');
  mesh(group,box,clothing,0,1.25,0,.85,1.25,.43,'gyuwon-memory-school-uniform');
  for(const side of [-1,1]){
   const arm=mesh(group,box,clothing,side*.59,1.37,0,.27,1.12,.28,'gyuwon-memory-hanging-arm');
   arm.rotation.z=side*.19;
   mesh(group,box,clothing,side*.23,.35,0,.29,.8,.33,'gyuwon-memory-leg');
  }
  // Recognizable remnants distinguish each historical self during its beat.
  if(i===0||i===1){for(const side of [-1,1])mesh(group,ring,gold,side*.55,.5,.2,.38,.38,.38,'gyuwon-ghost-vehicle-wheel');mesh(group,box,gold,.4,1,.25,.1,1.2,.1,'gyuwon-ghost-handlebar-stem');}
  if(i===2)for(let j=0;j<3;j++)mesh(group,box,report,.6,1+j*.17,.1,.65,.14,.48,'gyuwon-ghost-textbook');
  if(i===3){mesh(group,box,dark,.42,1.8,.7,.15,.17,1.5,'gyuwon-ghost-rifle');mesh(group,box,gold,.42,1.7,.1,.3,.3,.45,'gyuwon-ghost-rifle-stock');}
  if(i===4)mesh(group,ball,dark,.65,1.0,.15,.4,.55,.4,'gyuwon-ghost-trash-bag');
  if(i===5){mesh(group,box,report,.65,1.5,.1,.65,.95,.08,'gyuwon-ghost-collectible-card');mesh(group,ball,gold,.65,1.6,.18,.18,.3,.05,'gyuwon-ghost-collectible-portrait');}
  if(i===6){mesh(group,box,dark,.7,.8,.1,.7,1.3,.55,'gyuwon-ghost-speaker');for(const y of [.5,1.1])mesh(group,ring,gold,.7,y,.4,.23,.23,.23,'gyuwon-ghost-speaker-cone');}
  if(i===7)for(const side of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.3,0),new THREE.Vector3(side*.8,1.6,.1),new THREE.Vector3(side*1.1,.3,.8)]);mesh(group,geo(new THREE.TubeGeometry(curve,12,.1,6,false)),ghostMat,0,0,0,1,1,1,'gyuwon-ghost-octopus-arm');}
  if(i===8)mesh(group,box,gold,.65,2.2,.2,.22,3.5,.12,'gyuwon-ghost-memory-sword');
  if(i===9){mesh(group,box,report,.7,1.5,.1,.6,.6,.6,'gyuwon-ghost-paradox-die');mesh(group,ring,gold,-.7,1.6,.1,.35,.35,.35,'gyuwon-ghost-paradox-mask');}
  afterimages.push(group);
 }
 const finale=mesh(nightmareRoot,ring,red,0,.18,0,5,5,5,
  'gyuwon-nightmare-final-circular-shockwave');finale.rotation.x=Math.PI/2;
 const coverRoot=new THREE.Group();coverRoot.name='gyuwon-fourth-year-destructible-cover';root.add(coverRoot);
 const coverPieces=[];for(let i=0;i<5;i++){
  const group=new THREE.Group();coverRoot.add(group);const slab=mesh(group,box,wall,0,1.4,0,3.4,2.8,1.4,'gyuwon-rifle-physical-cover');
  const shards=[];for(let j=0;j<6;j++)shards.push(mesh(group,box,desk,(j%3-1)*.8,.5,0,.7,.7,.9,'gyuwon-rifle-cover-fragment'));
  const sparks=mesh(group,ball,gold,0,1.9,1,.3,.3,.3,'gyuwon-barrage-barrier-sparks');
  const dust=mesh(group,ring,ghostMat,0,.12,0,.2,.2,.2,'gyuwon-barrage-barrier-collapse-dust');
  dust.rotation.x=Math.PI/2;
  coverPieces.push({group,slab,shards,sparks,dust});
 }
 const dummy=new THREE.Object3D();
 let owner=null,disposed=false,breakLevel=0;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
 const tint=new THREE.Color(),worldTint=new THREE.Color(0x36455d);
 function update(g){
  if(disposed)return;
  if(owner!==g){owner=g;breakLevel=0;}
  const e=g?.gyuwon?.years,b=g?.boss;
  if(!e||g.status!=='playing'){root.visible=false;return;}
  root.visible=true;
  const t=g.time,aim=Math.atan2(g.player.x-b.x,g.player.z-b.z);
  const worldStrength=gyuwonWorldBreak((e.examCount||0)+1,e.failures);
  e.worldBreak=worldStrength;
  breakLevel+=(worldStrength-breakLevel)*Math.min(1,.06);
  // These buildings are outside radius 32 and never alter actual navigation.
  world.visible=worldStrength>.045&&!e.worldSeed;
  if(world.visible){
   wall.color.copy(tint.setHex(0x687585).lerp(worldTint,breakLevel*.67));
   const level=breakLevel;
   for(let i=0;i<wallCount;i++){
    const a=i*2*Math.PI/wallCount,r=41+(i%3)*3.7,phi=Math.sin(i*21.17);
    dummy.position.set(Math.sin(a)*r,5.25+(i%4)*1.1+Math.sin(t*.7+i)*level*.35,
     Math.cos(a)*r);
    dummy.rotation.set(level*Math.sin(i*2.2)*.19,a+Math.PI/2,
     level*(phi*.45+Math.sin(t*.4+i)*.12));
    dummy.scale.set(4.7,8+((i*7)%5)*1.4, .9+((i%4)*.16));
    dummy.updateMatrix();wallPieces.setMatrixAt(i,dummy.matrix);
   }
   wallPieces.instanceMatrix.needsUpdate=true;
   for(let i=0;i<windowCount;i++){
    const a=(i+.4)*2*Math.PI/windowCount,r=40.4+(i%3)*3.6;
    dummy.position.set(Math.sin(a)*r,6.1+(i%3)*2.3+Math.sin(t*1.4+i)*level*.5,
     Math.cos(a)*r);
    dummy.rotation.set(level*Math.sin(i)*.13,a+Math.PI/2,level*(i%2?-.56:.43));
    dummy.scale.set(2.2,3.6,.09);dummy.updateMatrix();windows.setMatrixAt(i,dummy.matrix);
   }
   windows.instanceMatrix.needsUpdate=true;
   for(let i=0;i<rubbleCount;i++){
    const a=i*2.399963,r=35+(i%10)*1.62,orbit=level*Math.sin(t*(.12+i%3*.05)+i);
    dummy.position.set(Math.sin(a+orbit*.02)*r,
     level*(2+((i*13)%8)*1.1)+Math.sin(t*1.3+i)*level*.65,
     Math.cos(a+orbit*.02)*r);
    dummy.rotation.set(level*(t*.32+i*.42),a,level*(i*.56+t*.17));
    const scale=.7+(i%5)*.43;dummy.scale.set(scale,.22+(i%3)*.14,
     1.7+(i%4)*.64);dummy.updateMatrix();rubble.setMatrixAt(i,dummy.matrix);
   }
   rubble.instanceMatrix.needsUpdate=true;
   splits.visible=worldStrength>.2;
  }
  coverRoot.visible=e.cast==='ultimateMarksman';
  coverPieces.forEach(({group,slab,shards,sparks,dust},i)=>{
   const c=e.cover?.[i];group.visible=!!c;if(!c)return;
   group.position.set(c.x,0,c.z);group.rotation.y=b.yaw;
   const strength=clamp(c.hp/c.maxHp),hitAge=t-(c.hitAt??-1000);
   const collapse=c.brokenAt===null?-1:t-c.brokenAt;
   slab.visible=c.hp>0;slab.scale.y=2.8*(.72+.28*strength);
   slab.rotation.z=(1-strength)*.10*Math.sin(t*13+i);
   sparks.visible=hitAge>=0&&hitAge<.22;
   sparks.scale.setScalar(sparks.visible?.3+(1-hitAge/.22)*.6:.01);
   dust.visible=collapse>=0&&collapse<2.1;
   dust.scale.setScalar(dust.visible?1+collapse*4:.01);
   for(let j=0;j<shards.length;j++){
    const shard=shards[j],u=collapse<0?1-strength:Math.min(2,collapse*1.3);
    shard.visible=strength<1;
    shard.position.set((j%3-1)*(.8+u*.8),Math.max(.15,.5+u*.8-u*u*.4),Math.floor(j/3)*1.3-.6+u*.2);
    shard.rotation.set(u*(j+1)*.5,u*(j+2)*.3,u*(j%3-1));
   }
  });
  const grade=e.mode==='result',gt=e.gradeT||0,choice=e.grade;
  scoreScene.visible=grade;
  if(grade){
   scoreScene.position.set(b.x,0,b.z);
   scoreScene.rotation.y=aim;
   const up=smooth(gt/.8),tear=smooth((gt-1.35)/.85),explode=smooth((gt-2.4)/.8);
   paper.visible=tear<.95;paper.position.set(0,2.3+up*.3,0);
   paper.rotation.set(-.28+up*.3,Math.sin(t*1.9)*.06,Math.sin(gt*3)*.06);
   const gradeColour=choice==='great'?gold:choice==='failure'?red:ghostMat;
   stamp.material=gradeColour;stamp.visible=gt>.75&&tear<.97;
   stamp.scale.setScalar(.43+(1-tear)*up*.42);
   for(const [index,piece]of [tearL,tearR].entries()){
    piece.visible=tear>.12;
    const side=index?1:-1;
    piece.position.set(side*(.3+tear*1.25),2.32-tear*1.06,tear*.12);
    piece.rotation.z=side*tear*.9;
   }
   gradeWave.material=gradeColour;
   gradeWave.scale.setScalar(.2+3.5*smooth((gt-1.5)/1.4));
   gradeWave.visible=false;gradeWave.position.y=.05;
   for(let i=0;i<pages.length;i++){
    const sheet=pages[i],a=i*2.399963;
    sheet.visible=gt>1.1;
    sheet.position.set(Math.sin(a)*(1.1+explode*(2+i%3)),
     1.2+((i*7)%6)*.27+Math.sin(t*2+i)*.4,
     Math.cos(a)*(1.1+explode*(2+i%3)));
    sheet.rotation.set(t*.2+i,t*.11+i*.4,t*.3+i*.2);
   }
  }
  wardRoot.visible=e.year===6&&e.mode==='combat'&&e.wards?.some(w=>w.hp>0);
  if(wardRoot.visible)wards.forEach((o,i)=>{
   const w=e.wards[i];o.visible=!!w&&w.hp>0;
   if(o.visible){
    o.position.set(w.x,0,w.z);o.rotation.y=0;
    o.scale.set(1,Math.max(.25,w.hp/w.maxHp),1);
   }
  });
  const active=e.mode==='combat'&&!!e.cast&&
   (e.cast.startsWith('ultimate')||e.cast==='nightmare365');
  const nightmare=active&&e.cast==='nightmare365';
  nightmareRoot.visible=nightmare;
  if(nightmare){
   const progress=e.castT||0,marks=[1.28,2.60,3.90,5.20,6.50,7.8,9.1,10.4,11.8,13.1];
   nightmareRoot.position.set(b.x,0,b.z);
   afterimages.forEach((o,i)=>{
    const q=(progress-marks[i]+.9);
    const rise=smooth(q/.52),leave=1-smooth((q-1.08)/.62);
    o.visible=rise>0&&leave>0;
    const radius=9.4-i*.34,angle=i*2.399963;
    o.position.set(Math.sin(angle)*radius,(1-rise)*-2.4+Math.sin(t*2+i)*.15,
     Math.cos(angle)*radius);
    o.rotation.y=angle+Math.PI;
    o.scale.setScalar((.74+i*.025)*rise*leave);o.rotation.x=i<2?-.35:Math.sin(Math.min(1,Math.max(0,q/.9))*Math.PI)*-.22;for(const limb of o.children)if(limb.name==='gyuwon-memory-hanging-arm')limb.rotation.x=-Math.sin(Math.min(1,Math.max(0,q/.9))*Math.PI)*(i===3?1.1:1.8);

   });
   finale.visible=false;
   if(finale.visible)finale.scale.setScalar(3.2+Math.max(0,progress-15.1)*9);
  }
 }
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();
  for(const m of mats)m.dispose();for(const g of geos)g.dispose();
  wallPieces.dispose();windows.dispose();rubble.dispose();}
 return {root,update,dispose,stats:()=>({corruption:breakLevel,
  brokenWalls:wallCount,fracturedWindows:windowCount,ghosts:afterimages.length})};
}

