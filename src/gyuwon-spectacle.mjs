import {disposeScene} from './runtime/scene-resources.mjs';
import * as THREE from 'three';
import {hazardPosition} from './gyuwon-data.mjs';
import {createGyuwonMemoryWave} from './gyuwon-memory-wave.mjs';
export function createGyuwonSpectacle(stage,{coarse=false}={}){
 const root=new THREE.Group();stage.add(root);const groups=new Map(),attacks=new Map();
 const gold=new THREE.MeshPhysicalMaterial({color:0xdca339,metalness:.66,roughness:.32,clearcoat:.38,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false});
 const dust=new THREE.PointsMaterial({color:0xffcf65,size:coarse?.32:.2,transparent:true,opacity:.9,depthWrite:false});
 function solid(parent,geo,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,gold);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);const p=new THREE.Points(geo,dust);p.position.copy(m.position);p.scale.copy(m.scale);parent.add(p);return m;}
 const cube=new THREE.BoxGeometry(1,1,1,4,4,4),sphere=new THREE.SphereGeometry(1,20,14),cylinder=new THREE.CylinderGeometry(1,1,1,16,3),ring=new THREE.TorusGeometry(1,.035,6,80);
 // Cheap individual spotlights are disposed on expiry; only the expensive tsunami is pooled.
 const bladeOutline=new THREE.Shape();
 bladeOutline.moveTo(-2.7,0);bladeOutline.lineTo(2.7,0);
 bladeOutline.lineTo(3.2,130);bladeOutline.lineTo(2.5,151);
 bladeOutline.lineTo(0,172);bladeOutline.lineTo(-2.5,151);
 bladeOutline.lineTo(-3.2,130);bladeOutline.closePath();
 const bladeGeometry=new THREE.ExtrudeGeometry(bladeOutline,{
  depth:1.25,steps:1,bevelEnabled:true,bevelSize:.3,bevelThickness:.25,bevelSegments:2
 });
 const swordMetal=new THREE.MeshStandardMaterial({color:0xd5b9a5,metalness:.77,
  roughness:.34,emissive:0x49212a,emissiveIntensity:.43});
 const wavePool=createGyuwonMemoryWave({coarse});root.add(wavePool.group);
 const warmupBlade=new THREE.Mesh(bladeGeometry,swordMetal);
 warmupBlade.name='gyuwon-memory-prewarmed-blade';
 warmupBlade.visible=false;root.add(warmupBlade);
 const warmupOrb=new THREE.Mesh(sphere,gold);
 warmupOrb.name='gyuwon-memory-prewarmed-orb';
 warmupOrb.visible=false;root.add(warmupOrb);
 for(const name of ['sword','circus','gamble','tsunami','chalk']){const g=new THREE.Group();g.name='gold-memory-'+name;root.add(g);groups.set(name,g);

 }
 const blackboard=document.createElement('canvas');blackboard.width=blackboard.height=1024;const ctx=blackboard.getContext('2d');ctx.fillStyle='#09211c';ctx.fillRect(0,0,1024,1024);ctx.strokeStyle='#d8b75e';ctx.lineWidth=3;ctx.font='48px serif';
 for(let i=0;i<9;i++){ctx.fillStyle='#d8b75e';ctx.fillText(['∑ x² + y² = ∞','∫ f(x) dx = ?','∀x ∃y : x ≠ y','lim n → ∞'][i%4],30,80+i*110);ctx.strokeRect(720,30+i*110,60,60);ctx.beginPath();ctx.moveTo(830,30+i*110);ctx.lineTo(900,90+i*110);ctx.moveTo(900,30+i*110);ctx.lineTo(830,90+i*110);ctx.stroke();}
 const tex=new THREE.CanvasTexture(blackboard),chalk=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({map:tex}));chalk.rotation.x=-Math.PI/2;chalk.position.y=.016;groups.get('chalk').add(chalk);
 for(const group of groups.values())group.traverse(o=>{if(o.material&&(o.material===gold||o.material===dust)){o.material=o.material.clone();o.userData.baseOpacity=o.material.opacity;}});
 let writingShader=null;chalk.material.onBeforeCompile=shader=>{shader.uniforms.writing={value:1};shader.fragmentShader='uniform float writing;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n if(vMapUv.x > writing) diffuseColor.rgb=vec3(0.035,0.12,0.09);');writingShader=shader;};
 const roll=new THREE.Group();groups.get('gamble').add(roll);
 const roulette=solid(roll,ring,0,.15,0,21,21,21);roulette.rotation.x=Math.PI/2;
 // A single instanced radial ring, not 24 meshes, carries the roulette stakes.
 const spokeCount=24,spoke=new THREE.InstancedMesh(cube,gold,spokeCount);
 const spokeDummy=new THREE.Object3D();
 for(let i=0;i<spokeCount;i++){
  const a=i*Math.PI*2/spokeCount;
  spokeDummy.position.set(Math.sin(a)*11,.20,Math.cos(a)*11);
  spokeDummy.rotation.set(0,a,0);spokeDummy.scale.set(.13,.14,19);
  spokeDummy.updateMatrix();spoke.setMatrixAt(i,spokeDummy.matrix);
 }
 spoke.instanceMatrix.needsUpdate=true;roll.add(spoke);
 const circusMemory=groups.get('circus');
 // Two folded, torn velvet wings frame the remembered troupe instead of
 // opaque rectangular curtain blocks. Shared geometry is static across casts.
 const velvet=new THREE.MeshStandardMaterial({color:0x3d1424,roughness:.97,metalness:0,
  side:THREE.DoubleSide,transparent:true,opacity:.91,depthWrite:false});
 const clothGeometries=[];
 for(const side of [-1,1]){
  const clothGeo=new THREE.PlaneGeometry(16,27,coarse?12:28,coarse?8:24);
  const pos=clothGeo.getAttribute('position');
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),y=pos.getY(i);
   pos.setZ(i,Math.sin((x+8)*1.65)*.6+Math.sin(y*.28+x*.53)*.18);
   if(y< -11.5)pos.setY(i,y-Math.sin(x*.82+side)*(.8+(-11.5-y)*.14));
  }
  clothGeo.computeVertexNormals();clothGeometries.push(clothGeo);
  const curtain=new THREE.Mesh(clothGeo,velvet);
  curtain.name='gyuwon-recalled-circus-velvet';
  curtain.position.set(side*21,13.7,-19);
  curtain.rotation.y=side*.24;circusMemory.add(curtain);
 }

 const streamGeo=new THREE.BufferGeometry(),stream=[];for(let i=0;i<(coarse?900:2400);i++){const a=i*2.39996,r=25+(i%113);stream.push(Math.sin(a)*r,(i%97)*.8,Math.cos(a)*r);}streamGeo.setAttribute('position',new THREE.Float32BufferAttribute(stream,3));const streamPoints=new THREE.Points(streamGeo,dust);root.add(streamPoints);
 function make(h){const g=h.visual==='wave'?wavePool.group:new THREE.Group();root.add(g);
  if(h.visual==='sword'){
   const blade=new THREE.Mesh(bladeGeometry,swordMetal);blade.name='gyuwon-memory-forged-sword';
   g.add(blade);
   solid(g,cube,0,7,0,30,3,3);
   solid(g,cylinder,0,-7,0,1.6,24,1.6);
   solid(g,sphere,0,-19,0,3.1,3.1,3.1);
  }
  if(h.visual==='ball')solid(g,sphere,0,0,0,h.r,h.r,h.r);
  if(h.visual==='dice'){solid(g,cube,0,0,0,7,7,7);for(let i=0;i<5;i++)solid(g,sphere,(i%2-.5)*3,0,3.6,.4,.4,.2);}
  if(h.visual==='spotlight'){const m=solid(g,new THREE.ConeGeometry(1,55,20,1,true),0,27,0,h.r,1,h.r);m.rotation.z=Math.PI;}
  if(h.visual==='crowd')for(let i=0;i<5;i++){solid(g,cylinder,(i%2-.5)*2,1.5,-i*1.4,.5,3,.5);solid(g,sphere,(i%2-.5)*2,3.4,-i*1.4,.7,.7,.7);}
  if(h.visual==='wave'){
   // Geometry, surface shader, edge foam and its real opening were created
   // during startup. Repeated memory casts move a pooled group only.
   wavePool.update(h,0);wavePool.group.visible=true;
  }
  attacks.set(h.id,g);return g;
 }
 const sharedGeometries=new Set([cube,sphere,cylinder,ring,bladeGeometry,...clothGeometries]),
  sharedMaterials=new Set([gold,dust,swordMetal,velvet]);
 function releaseAttack(id,group){
  if(group===wavePool.group){
   group.visible=false;group.position.set(0,0,0);attacks.delete(id);return;
  }
  group.removeFromParent();
  const geometries=new Set(),materials=new Set();
  group.traverse(o=>{
   if(o.geometry&&!sharedGeometries.has(o.geometry))geometries.add(o.geometry);
   if(o.material)for(const mat of Array.isArray(o.material)?o.material:[o.material])
    if(!sharedMaterials.has(mat))materials.add(mat);
  });
  for(const geo of geometries)geo.dispose();
  for(const mat of materials)mat.dispose();
  attacks.delete(id);
 }
 function clear(){
  for(const [id,group] of attacks)releaseAttack(id,group);
 }
 return {update(g,dt,death){const s=g.gyuwon,b=g.boss,won=g.status==='won';root.visible=b.phase===3||won;for(const[name,v]of groups){v.visible=!won&&name===s.stageMemory;if(v.visible){const build=Math.min(1,Math.max(.08,s.stageTime)/.35);v.position.y=(1-build)*-5;v.traverse(o=>{if(o.userData.baseOpacity!==undefined)o.material.opacity=o.userData.baseOpacity*build;});}};if(writingShader)writingShader.uniforms.writing.value=Math.min(1,Math.max(.05,s.t/3));roll.rotation.y=g.time*.6;streamPoints.rotation.y=g.time*.04;streamPoints.position.y=won?death*10:0;streamPoints.visible=b.phase===3||won;
  const live=new Set();for(const h of s.hazards){if(!h.visual)continue;live.add(h.id);const v=attacks.get(h.id)||make(h),p=hazardPosition(h),active=h.age>=h.warn;v.visible=b.phase===3;
   v.position.set(p.x,0,p.z);v.rotation.y=h.yaw||0;
   if(h.visual==='sword'){v.position.set(h.x,0,h.z);v.rotation.set(0,h.yaw||0,Math.max(0,1-h.age/h.warn)*-.9);}
   if(h.visual==='ball'){v.position.y=h.r;v.rotation.x=-g.time*3;}
   if(h.visual==='dice'){v.position.y=active?3.5:3.5+Math.max(0,1-h.age/h.warn)*100;v.rotation.set(g.time,g.time*.7,0);}
   if(h.visual==='wave'){
    wavePool.update(h,g.time);
    v.position.set(h.gap||0,0,h.z+Math.max(0,h.age-h.warn)*h.speed);
   }
  }
  // Expired hazards must release geometry immediately, even while another
  // patterned strike is still active. Otherwise each pattern grows GPU memory.
  for(const[id,v]of attacks)if(!live.has(id))releaseAttack(id,v);
 },clear,
  prewarm(renderer,camera,scene){
   if(!renderer?.compile||!scene)return;
   const oldWave=wavePool.group.visible,oldRoot=root.visible,
    oldBlade=warmupBlade.visible,oldOrb=warmupOrb.visible,
    oldGroups=[...groups.values()].map(group=>[group,group.visible]);
   const canRender=typeof renderer.setRenderTarget==='function'&&
    typeof renderer.getRenderTarget==='function'&&typeof renderer.render==='function';
   const prior=canRender?renderer.getRenderTarget():null;
   const buffer=canRender?new THREE.WebGLRenderTarget(16,16):null;
   try{
    root.visible=true;
    for(const [id,group]of groups){
     for(const candidate of groups.values())candidate.visible=candidate===group;
     wavePool.group.visible=id==='tsunami';
     warmupBlade.visible=id==='sword';
     warmupOrb.visible=id==='circus'||id==='gamble';
     renderer.compile(scene,camera);
     if(buffer){renderer.setRenderTarget(buffer);renderer.render(scene,camera);}
    }
   }finally{
    if(buffer){renderer.setRenderTarget(prior);buffer.dispose();}
    for(const [group,visible]of oldGroups)group.visible=visible;
    root.visible=oldRoot;wavePool.group.visible=oldWave;
    warmupBlade.visible=oldBlade;warmupOrb.visible=oldOrb;
   }
  },
  stats:()=>({liveAttackGroups:attacks.size,waveVertices:wavePool.stats().vertices,
   waveGeometryBuilds:1}),
  dispose(){
   clear();root.remove(wavePool.group);wavePool.dispose();
   disposeScene(root,{extras:[...sharedGeometries,...sharedMaterials]});
   root.removeFromParent();
  }};
}
