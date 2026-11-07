import * as THREE from 'three';
import {kwonFractureFront,kwonThirdTransition} from './kwon-third-phase.mjs';

// Bounded, pooled scene geometry: every physical front uses the combat data
// for its exact location, delay, length and width. No tutorial ring/decal is
// drawn, and no renderer object is permitted to resolve a gameplay hit.
const SEGMENTS=15,POOLS=8;
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
export function createKwonThirdPhaseView(scene,{coarse=false}={}){
 const root=new THREE.Group();root.name='kwon-king-sky-and-stone-fractures';scene.add(root);
 const crackGeo=new THREE.BoxGeometry(1,.16,1);
 const stoneGeo=new THREE.DodecahedronGeometry(.58,coarse?0:1);
 const crackMat=new THREE.MeshStandardMaterial({color:0x181017,roughness:.99,metalness:.05,
  emissive:0x250b14,emissiveIntensity:.32});
 const stoneMat=new THREE.MeshStandardMaterial({color:0x636875,roughness:.88,metalness:.10,
  emissive:0x170b12,emissiveIntensity:.11});
 const skyGeo=new THREE.BufferGeometry();
 // An irregular slit has real depth, paired rocky lips, and runs vertically
 // through the sky; it is not a flat HUD danger rectangle.
 const verts=[],uv=[],indices=[];
 for(let row=0;row<=11;row++){
  const t=row/11,y=t*37,drift=Math.sin(t*12.2)*.20+Math.sin(t*27.1)*.09;
  for(const side of [-1,1]){
   verts.push(drift+side*(.08+.20*Math.sin(t*Math.PI)),y,side*.10);
   uv.push(side===-1?0:1,t);
  }
  if(row<11){const k=row*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 skyGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 skyGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 skyGeo.setIndex(indices);skyGeo.computeVertexNormals();
 const lipGeo=new THREE.BoxGeometry(.11,1,.16);
 const dummy=new THREE.Object3D(),pool=[];
 for(let i=0;i<POOLS;i++){
  const group=new THREE.Group();group.visible=false;root.add(group);
  const cracks=new THREE.InstancedMesh(crackGeo,crackMat,SEGMENTS);
  const rock=new THREE.InstancedMesh(stoneGeo,stoneMat,SEGMENTS*2);
  cracks.frustumCulled=rock.frustumCulled=false;
  cracks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rock.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(cracks,rock);
  const voidMat=new THREE.MeshStandardMaterial({color:0x100d18,emissive:0x371321,
   emissiveIntensity:.35,roughness:.7,transparent:true,opacity:.56,
   depthWrite:false,side:THREE.DoubleSide});
  const edgeMat=new THREE.MeshStandardMaterial({color:0x8f8198,emissive:0x4e2334,
   emissiveIntensity:.8,metalness:.48,roughness:.24,transparent:true,
   opacity:.50,depthWrite:false});
  const sky=new THREE.Mesh(skyGeo,voidMat);
  sky.name='kwon-torn-sky';sky.visible=false;group.add(sky);
  const left=new THREE.Mesh(lipGeo,edgeMat),right=new THREE.Mesh(lipGeo,edgeMat);
  for(const lip of [left,right]){lip.position.y=18.5;lip.scale.set(1,37,1);sky.add(lip);}
  left.position.x=-.26;right.position.x=.26;
  pool.push({id:null,group,cracks,rock,sky,voidMat,edgeMat});
 }
 // The moon is a sculpted PBR body split by the SAME travelling sword front.
 // It never adds a hitbox and is built once, not every animation frame.
 const moon=new THREE.Group();moon.name='kwon-split-falling-moon';moon.userData.decorativeOnly=true;root.add(moon);
 const moonLeftGeo=new THREE.SphereGeometry(8,coarse?20:40,coarse?12:26,0,Math.PI,0,Math.PI);
 const moonRightGeo=new THREE.SphereGeometry(8,coarse?20:40,coarse?12:26,Math.PI,Math.PI,0,Math.PI);
 const moonStone=new THREE.MeshStandardMaterial({color:0xaba69a,roughness:.98,metalness:.015,emissive:0x3b3536,emissiveIntensity:.18,side:THREE.DoubleSide});
 const lunarA=new THREE.Mesh(moonLeftGeo,moonStone),lunarB=new THREE.Mesh(moonRightGeo,moonStone);
 lunarA.name='kwon-moon-left-hemisphere';lunarB.name='kwon-moon-right-hemisphere';moon.add(lunarA,lunarB);
 const lunarDust=new THREE.MeshStandardMaterial({color:0x675d57,roughness:.98});
 const chipGeo=new THREE.DodecahedronGeometry(.64,coarse?0:1),lunarChips=[];
 for(let i=0;i<12;i++){const chip=new THREE.Mesh(chipGeo,lunarDust);chip.scale.set(.45+(i%3)*.18,.4+(i%4)*.2,.48);moon.add(chip);lunarChips.push(chip);}
 const transition=new THREE.Group();transition.name='kwon-sword-possession-sky-wound';
 const omenMat=new THREE.MeshStandardMaterial({color:0x231927,emissive:0x8f3c54,
  emissiveIntensity:.65,transparent:true,opacity:0,depthWrite:false,
  side:THREE.DoubleSide});
 const omen=new THREE.Mesh(skyGeo,omenMat);transition.add(omen);root.add(transition);
 // The possessed sword creates a short, physical-looking tear through the
 // owner during the non-damaging transformation.
 const severGroup=new THREE.Group();severGroup.name='kwon-blade-severs-master';transition.add(severGroup);
 const severGeo=new THREE.BufferGeometry(),cutVerts=[];
 for(let i=0;i<=18;i++){const u=i/18,x=-2.7+5.4*u,y=2.45+u*.7+Math.sin(u*19)*.08;
  cutVerts.push(x,y,-.28,x,y+.035+Math.sin(u*17)*.08,.14);}
 const cutIndices=[];for(let i=0;i<18;i++){const j=i*2;cutIndices.push(j,j+1,j+2,j+1,j+3,j+2);}
 severGeo.setAttribute('position',new THREE.Float32BufferAttribute(cutVerts,3));
 severGeo.setIndex(cutIndices);severGeo.computeVertexNormals();
 const severMat=new THREE.MeshPhysicalMaterial({color:0x241b25,roughness:.38,
  metalness:.28,emissive:0x763a43,emissiveIntensity:.36,
  side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});
 const sever=new THREE.Mesh(severGeo,severMat);sever.name='kwon-betrayal-wound-rift';severGroup.add(sever);
 const shards=[];
 for(let i=0;i<12;i++){const chip=new THREE.Mesh(chipGeo,stoneMat);
  chip.name='kwon-severed-stone-fragment';chip.scale.setScalar(.23+(i%4)*.11);
  severGroup.add(chip);shards.push(chip);}
 transition.visible=false;
 let lastGame=null,disposed=false;
 function reset(){
  for(const o of pool){o.id=null;o.group.visible=false;o.sky.visible=false;}
  transition.visible=false;
 }
 const setMatrix=(inst,i,x,y,z,sx,sy,sz,rz=0)=>{
  dummy.position.set(x,y,z);dummy.rotation.set(0,0,rz);dummy.scale.set(sx,sy,sz);
  dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);
 };
 function drawFracture(o,q){
  const front=kwonFractureFront(q),step=q.length/SEGMENTS;
  o.id=q.id;o.group.visible=true;
  o.group.position.set(q.x,0,q.z);o.group.rotation.y=q.yaw;
  const end=q.delay+q.length/q.speed,fade=clamp(1-(q.age-end)/1.35);
  for(let i=0;i<SEGMENTS;i++){
   const z=(i+.5)*step,opened=front>=z-step*.45;
   const x=Math.sin(i*2.37+q.id*.31)*.22;
   if(opened){
    setMatrix(o.cracks,i,x,.065,z,.42,.22,step*1.06,Math.sin(i*3.1)*.10);
    for(const side of [-1,1]){
     const j=i*2+(side===-1?0:1);
     const jitter=Math.sin(i*2.11+side*1.8+q.id)*.18;
     const grow=clamp((front-z+step*.55)/.62);
     setMatrix(o.rock,j,side*(q.width+.23)+x+jitter,.12+grow*.20,z,
      .42+grow*.32,.45+grow*.28,.66+grow*.24,side*.18);
    }
   }else{
    setMatrix(o.cracks,i,0,-30,0,.0001,.0001,.0001);
    for(const j of [i*2,i*2+1])setMatrix(o.rock,j,0,-30,0,.0001,.0001,.0001);
   }
  }
  o.cracks.instanceMatrix.needsUpdate=true;o.rock.instanceMatrix.needsUpdate=true;
  // Sky slit travels above the advancing stone seam, staying aligned with
  // the *actual* damaging front rather than targeting the player by fiat.
  o.sky.visible=front>.25&&fade>0;
  o.sky.position.set(0,.15,Math.min(front,q.length));
  o.sky.scale.setScalar(q.pattern==='heavenSplit'?1.28:1);
  o.voidMat.opacity=.57*fade;o.edgeMat.opacity=.47*fade;
 }
 function update(g){
  if(disposed)return;
  if(lastGame!==g){reset();lastGame=g;}
  const b=g?.boss||{},active=b.phase===3;
  const rifts=active&&Array.isArray(g?.kwonFractures)?g.kwonFractures:[];
  const current=new Set(rifts.map(q=>q.id));
  for(const o of pool)if(!current.has(o.id)){o.id=null;o.group.visible=false;}
  for(const q of rifts){
   let o=pool.find(o=>o.id===q.id)||pool.find(o=>o.id===null);
   if(!o)continue;
   drawFracture(o,q);
  }
  moon.visible=active;
  if(active){
   const q=rifts.find(a=>a.pattern==='heavenSplit'||a.pattern==='skyRend');
   const open=q?clamp(kwonFractureFront(q)/Math.max(1,q.length)):0;
   const falling=q?clamp((q.age-q.delay-q.length/q.speed)/1.35):0;
   const transitionScars=b.state==='transition'?kwonThirdTransition(b.t).skyScar:0;
   const split=Math.max(open,transitionScars*.18);
   moon.position.set(b.x+Math.sin((b.yaw||0)+1.08)*43,51-18*falling*falling,
    b.z+Math.cos((b.yaw||0)+1.08)*43);
   moon.rotation.y=(b.yaw||0)+.7;
   lunarA.position.x=-split*2.6;lunarB.position.x=split*2.6;
   lunarA.rotation.z=-split*.15;lunarB.rotation.z=split*.15;
   for(let i=0;i<lunarChips.length;i++){const c=lunarChips[i],a=i*Math.PI*2/12;
    c.position.set(Math.sin(a)*(1.9+split*4.5),Math.cos(a*1.7)*2.6-split*split*(i%3+1)*.45,Math.cos(a)*.7);
    c.visible=split>.05;
   }
  }
  const cinematic=active&&b.state==='transition';
  transition.visible=cinematic;
  if(cinematic){
   const t=kwonThirdTransition(b.t);
   transition.position.set(b.x,0,b.z);
   transition.rotation.y=b.yaw;
   omen.position.set(0,.2,4.8);
   omenMat.opacity=t.skyScar*.74;
   omen.scale.set(1+.3*t.skyScar,.65+.35*t.skyScar,1);
   severGroup.visible=b.t>1.77&&b.t<3.18;
   if(severGroup.visible){
    const force=t.betrayalSwing*1.5+t.impact*.5;
    severMat.opacity=Math.max(0,Math.min(.85,force));
    sever.scale.set(1+.14*force,1+.12*force,1);
    for(let i=0;i<shards.length;i++){
     const a=i*2.399963,flight=Math.max(0,b.t-2.05),r=.4+flight*(1+i%3)*1.8;
     shards[i].position.set(Math.sin(a)*r,2.25+Math.cos(a)*.55+
      Math.sin(flight*Math.PI)*1.1-flight*flight*3,Math.cos(a)*r*.6);
     shards[i].rotation.set(flight*(i+3),flight*(i+1),0);shards[i].visible=flight>0;
    }
   }
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;reset();scene.remove(root);
  for(const o of pool){o.voidMat.dispose();o.edgeMat.dispose();}
  for(const g of [crackGeo,stoneGeo,skyGeo,lipGeo,moonLeftGeo,moonRightGeo,chipGeo,severGeo])g.dispose();
  for(const m of [crackMat,stoneMat,omenMat,moonStone,lunarDust,severMat])m.dispose();
 }
 return {root,update,reset,dispose,stats:()=>({pool:POOLS,crackInstances:POOLS*SEGMENTS,
  live:pool.filter(o=>o.id!==null).length,moonPieces:14})};
}
