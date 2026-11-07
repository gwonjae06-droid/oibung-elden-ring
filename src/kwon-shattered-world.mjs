import * as THREE from 'three';
import {kwonFractureFront,kwonThirdTransition} from './kwon-third-phase.mjs';
// The actual arena is replaced by TWO extruded irregular stone landmasses.
// Pooled 3D fragments and ruined background arches move with those halves.
// Gameplay threats continue to come only from the separately telegraphed fronts.
const clamp=x=>Math.min(1,Math.max(0,x));
function stoneHalf(side,coarse){
 const R=26,shape=new THREE.Shape(),samples=coarse?22:50;
 if(side<0){
  shape.moveTo(-.14,R);
  for(let i=0;i<=samples;i++){const a=Math.PI/2+i*Math.PI/samples;shape.lineTo(R*Math.cos(a),R*Math.sin(a));}
  for(let i=0;i<=22;i++){const z=-R+i*2*R/22;shape.lineTo(-.28-Math.sin(i*1.77)*.26,z);}
 }else{
  shape.moveTo(.14,-R);
  for(let i=0;i<=samples;i++){const a=-Math.PI/2+i*Math.PI/samples;shape.lineTo(R*Math.cos(a),R*Math.sin(a));}
  for(let i=0;i<=22;i++){const z=R-i*2*R/22;shape.lineTo(.28+Math.sin(i*1.77)*.26,z);}
 }
 shape.closePath();
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:1.5,steps:1,bevelEnabled:false,curveSegments:1});
 geometry.rotateX(-Math.PI/2);
 return geometry;
}
export function createKwonShatteredWorld(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-physically-separated-world';root.visible=false;scene.add(root);
 const stone=new THREE.MeshStandardMaterial({color:0x555a60,roughness:.95,metalness:.05,flatShading:true});
 const wall=new THREE.MeshStandardMaterial({color:0x77717a,roughness:.93,flatShading:true});
 const cliff=new THREE.MeshStandardMaterial({color:0x26212d,roughness:1,side:THREE.DoubleSide});
 const abyss=new THREE.MeshBasicMaterial({color:0x07060c,side:THREE.DoubleSide});
 const crackShine=new THREE.MeshStandardMaterial({color:0x684553,emissive:0x8a425f,emissiveIntensity:.34,roughness:.45});
 const geos=[],groups=[],tiles=[];
 const baseBox=new THREE.BoxGeometry(1,1,1),chipGeo=new THREE.DodecahedronGeometry(.65,coarse?0:1);
 geos.push(baseBox,chipGeo);
 for(const side of [-1,1]){
  const island=new THREE.Group();island.name=side<0?'kwon-real-left-continent':'kwon-real-right-continent';
  root.add(island);groups.push(island);
  const topGeo=stoneHalf(side,coarse);geos.push(topGeo);
  const top=new THREE.Mesh(topGeo,[stone,cliff]);top.name='kwon-extruded-world-stone-half';top.position.y=-1.40;
  top.receiveShadow=true;island.add(top);
  // High, heavy cliff walls visibly expose the gap's real 3D thickness.
  for(let i=0;i<10;i++){
   const z=-22+i*4.9,x=side*(.45+Math.sin(i*2.4)*.22);
   const slab=new THREE.Mesh(baseBox,cliff);slab.name='kwon-chasm-vertical-cliff';
   slab.position.set(x,-.96,z);slab.scale.set(.53,1.3+Math.sin(i*3)*.2,5.1);
   slab.rotation.y=side*(i%2?.06:-.07);island.add(slab);
  }
  // Distant walls also move as coherent broken architecture, not a screen filter.
  const backdrop=new THREE.Group();backdrop.name='kwon-ruined-background-'+(side<0?'left':'right');
  backdrop.position.set(side*23,0,-38);island.add(backdrop);
  const make=(name,x,y,z,sx,sy,sz,mat=wall)=>{
   const v=new THREE.Mesh(baseBox,mat);v.name=name;v.position.set(x,y,z);v.scale.set(sx,sy,sz);backdrop.add(v);return v;
  };
  make('kwon-background-torn-wall',side*3,8,0,10,15,2.7);
  make('kwon-background-arch-stump',side*-1.8,12,0,2.6,25,3);
  make('kwon-background-shattered-lintel',side*-2,22,0,9,1.9,3).rotation.z=side*.18;
  for(let i=0;i<9;i++){const j=i*2.399963;
   const c=make('kwon-background-falling-buttress',side*3+Math.sin(j)*5,14+Math.sin(i*1.7)*3,
    Math.cos(j)*2.2,.95+i%3,.8,1.5,stone);
   c.rotation.z=i*.33;
  }
 }
 const darkness=new THREE.Mesh(new THREE.PlaneGeometry(63,63).rotateX(-Math.PI/2),abyss);
 darkness.name='kwon-visible-abyss-below-fractured-floor';darkness.position.y=-3.8;root.add(darkness);
 geos.push(darkness.geometry);
 // Small 3D slabs are pooled in two instanced groups; no per-frame allocations.
 const pieceCount=coarse?38:82;
 const instanced=new THREE.InstancedMesh(chipGeo,stone,pieceCount);
 instanced.name='kwon-shattered-ground-instanced-stone-chunks';instanced.frustumCulled=false;root.add(instanced);
 const glowMesh=new THREE.InstancedMesh(baseBox,crackShine,coarse?9:17);
 glowMesh.name='kwon-visible-chasm-emissive-seams';glowMesh.frustumCulled=false;root.add(glowMesh);
 const dummy=new THREE.Object3D();
 let opened=0,lastGame=null,phase=0,lastTick=-1,disposed=false;
 const matrix=(mesh,i,x,y,z,sx,sy,sz,ry=0)=>{
  dummy.position.set(x,y,z);dummy.rotation.set(0,ry,Math.sin(i*2.1)*.12);
  dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 };
 function populate(t){
  for(let i=0;i<pieceCount;i++){
   const side=i%2?-1:1,j=Math.floor(i/2),a=j*2.399963;
   const z=Math.sin(a)*21,x=side*(.95+(j%8)*2.1);
   const burst=Math.pow(t,1.35),raise=burst*(.12+(i%6)*.13);
   matrix(instanced,i,x+side*(t*.35+(j%4)*.21*burst),
    -.09+raise,z+Math.cos(a)*.4*burst,
    .45+(j%4)*.38,.18+(j%5)*.15,.7+(j%4)*.34,a);
  }
  instanced.instanceMatrix.needsUpdate=true;
  for(let i=0;i<glowMesh.count;i++){
   const z=-22+i*2.8;
   matrix(glowMesh,i,0,-1.1,z,.07+t*.23,.12,2.4,0);
  }
  glowMesh.instanceMatrix.needsUpdate=true;
 }
 populate(0);
 function reset(){opened=0;root.visible=false;lastGame=null;lastTick=-1;for(const island of groups){island.position.set(0,0,0);island.rotation.z=0;}}
 function update(g,dt=0){
  if(disposed)return;
  if(lastGame!==g){reset();lastGame=g;}
  const boss=g?.boss;
  if(boss?.phase!==3){root.visible=false;return;}
  root.visible=true;
  const rifts=g?.kwonFractures||[];
  const progress=rifts.reduce((n,q)=>Math.max(n,kwonFractureFront(q)/Math.max(1,q.length)),0);
  const betray=boss.state==='transition'?kwonThirdTransition(boss.t).skyScar:0;
  // Retain one permanent geological seam after the king's first sundering.
  const target=.20+Math.max(progress,opened*.38,betray*.58,(g.kwonMoon?.triggered? .72:0))*.95;
  opened+= (Math.min(1.6,target)-opened)*(1-Math.exp(-Math.max(0,dt)*2.9));
  const distance=opened*1.65;
  for(let i=0;i<2;i++){
   const side=i===0?-1:1;
   groups[i].position.set(side*distance,0,side*.36*opened);
   groups[i].rotation.z=side*(reduced?.009:Math.sin((g.time||0)*1.35)*.013)*opened;
  }
  // Keep the horizon stable; only the stone geometry moves, never the camera/world orientation.
  root.rotation.y=0;
  const stamp=Math.floor((g.time||0)*18);
  if(stamp!==lastTick){populate(opened);lastTick=stamp;}
 }
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const v of geos)v.dispose();for(const v of [stone,wall,cliff,abyss,crackShine])v.dispose();}
 return {root,update,reset,dispose,stats:()=>({pieces:pieceCount,drawCalls:2+2*10+2*12+2,collisionSources:0,opened})};
}
