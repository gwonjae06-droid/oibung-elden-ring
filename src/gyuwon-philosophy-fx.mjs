import * as THREE from 'three';

// Phase-two metaphysics is architecture and animated sculpture rather than
// unreadable red UI circles. Every piece stays outside the authoritative
// collision system; all movement and damage still come from gyuwon-combat.
export const PHILOSOPHY_FORMS=Object.freeze(['verdict','mirror','axiom','paradox','erasure','counterproof']);
export function createGyuwonPhilosophyFx(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-two-worlds-metaphysical-court';scene.add(root);
 const gold=new THREE.MeshPhysicalMaterial({color:0xbba079,metalness:.55,roughness:.34,
  clearcoat:.32,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false});
 const shadow=new THREE.MeshPhysicalMaterial({color:0x6e6787,metalness:.62,roughness:.26,
  clearcoat:.48,transparent:true,opacity:.46,side:THREE.DoubleSide,depthWrite:false});
 const stone=new THREE.MeshStandardMaterial({color:0xc4b7ae,roughness:.82});
 const groups=new Map(),weights=new Map();
 const mesh=(parent,geo,material,pos=[0,0,0],scale=[1,1,1])=>{
  const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);
  m.castShadow=false;m.receiveShadow=false;parent.add(m);return m;
 };
 const pillarGeo=new THREE.CylinderGeometry(.85,1.3,18,coarse?8:18),
  hoopGeo=new THREE.TorusGeometry(1,.07,coarse?5:9,coarse?28:64);
 const pillars=new THREE.InstancedMesh(pillarGeo,stone,10),dummy=new THREE.Object3D();
 pillars.name='gyuwon-twelve-judges-silent-colonnade';
 for(let i=0;i<10;i++){
  const a=i*Math.PI/5;dummy.position.set(Math.sin(a)*37,7,Math.cos(a)*37);
  dummy.rotation.y=a;dummy.scale.set(1,1+(i%2)*.12,1);dummy.updateMatrix();
  pillars.setMatrixAt(i,dummy.matrix);
 }
 pillars.instanceMatrix.needsUpdate=true;pillars.frustumCulled=false;root.add(pillars);
 for(const name of PHILOSOPHY_FORMS){
  const g=new THREE.Group();g.name='gyuwon-philosophy-'+name;root.add(g);groups.set(name,g);weights.set(name,0);
  if(name==='verdict'){
   for(const side of [-1,1]){
    mesh(g,new THREE.CylinderGeometry(4.1,4.1,.35,coarse?20:48),gold,[side*6,7,0]);
    mesh(g,new THREE.CylinderGeometry(.08,.11,14,8),shadow,[side*6,14,0]);
   }
   mesh(g,hoopGeo,gold,[0,17,0],[12,12,2]);
  }else if(name==='mirror'){
   for(const side of [-1,1]){
    const pane=mesh(g,new THREE.BoxGeometry(.42,12,6),side<0?gold:shadow,[side*7,7,0]);
    pane.rotation.y=side*.27;
    mesh(g,hoopGeo,gold,[side*7,7,0],[3.4,6.5,1]);
   }
  }else if(name==='axiom'){
   for(let i=0;i<4;i++){
    const hoop=mesh(g,hoopGeo,i%2?shadow:gold,[0,9,0],[5+i*2.2,5+i*2.2,1]);
    hoop.rotation.y=i*.67;hoop.rotation.x=i*.48;
   }
  }else if(name==='paradox'){
   const geo=new THREE.TorusKnotGeometry(2.2,.22,coarse?56:112,coarse?7:12);
   mesh(g,geo,gold,[-4,8,0],[1.25,1.25,1.25]);
   mesh(g,geo,shadow,[4,8,0],[1.25,1.25,1.25]);
  }else if(name==='counterproof'){
   // Interleaved slanted judgment mirrors remain visual-only.
   for(const side of [-1,1]){
    const frame=mesh(g,new THREE.BoxGeometry(.30,13,7),side<0?shadow:gold,
     [side*5,8,0]);
    frame.rotation.z=side*.48;frame.rotation.y=side*.35;
   }
   for(let i=0;i<3;i++){
    const hoop=mesh(g,hoopGeo,i%2?shadow:gold,[0,6+i*2.5,0],[2.8+i*1.25,2.8+i*1.25,1]);
    hoop.rotation.x=i*.41;hoop.rotation.y=i*.65;
   }
  }else if(name==='erasure'){
   const geo=new THREE.BoxGeometry(2.3,4.3,.12);
   for(let i=0;i<9;i++){
    const a=i*Math.PI*2/9;
    const slab=mesh(g,geo,i%2?shadow:gold,
     [Math.sin(a)*7,5+(i%3)*2,Math.cos(a)*7]);
    slab.rotation.y=a;slab.rotation.z=(i-4)*.055;
   }
  }
 }
 let lastTime=0;
 function reset(){
  lastTime=0;root.visible=false;
  for(const [name,g] of groups){weights.set(name,0);g.visible=false;}
 }
 function update(game,dt=0){
  const b=game?.boss||{},s=game?.gyuwon||{},active=b.phase===2&&game.status==='playing';
  const h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  root.visible=active;if(!active)return;
  const white=s.space!=='dark',accent=white?0xbca37e:0x80729e;
  gold.color.lerp(new THREE.Color(accent),1-Math.exp(-2*h));
  shadow.color.lerp(new THREE.Color(white?0x807f91:0xb4a7cf),1-Math.exp(-2*h));
  pillars.rotation.y=0; // Instanced architecture never changes the playable collision ring.
  const t=Number.isFinite(game.time)?game.time:lastTime;lastTime=t;
  root.rotation.y=reduced?0:Math.sin(t*.16)*.07;
  for(const [name,g] of groups){
   const want=s.pattern===name&&b.state==='pattern'?1:0;
   const weight=weights.get(name)+(want-weights.get(name))*(1-Math.exp(-h*(want?7:4.5)));
   weights.set(name,weight);g.visible=weight>.012;
   g.scale.setScalar(Math.max(.001,weight));
   if(!g.visible)continue;
   g.rotation.y=(reduced?0:t*(name==='paradox'?.36:.12))*(white?1:-1);
   g.position.y=(reduced?0:Math.sin(t*1.5)*.26)+(1-weight)*-3;
   if(name==='mirror')g.rotation.z=Math.sin(t*1.1)*.13*weight;
   if(name==='erasure')g.rotation.x=Math.sin(t*.7)*.20*weight;
  }
 }
 function dispose(){
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 function stats(){return {forms:PHILOSOPHY_FORMS.length,architecturalPillars:pillars.count,
  activePattern:root.visible?[...weights].sort((a,b)=>b[1]-a[1]).find(([,weight])=>weight>.012)?.[0]||null:null,
  decorativeOnly:true};}
 reset();return {root,update,reset,dispose,stats};
}
