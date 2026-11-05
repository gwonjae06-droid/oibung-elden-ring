import * as THREE from 'three';
import {createCathedralBloodSea} from './blood-cathedral-sea.mjs';

// Gothic nave surrounding the existing circular combat volume. Architectural
// decoration is visual only: all solid furniture/columns are outside radius 28.
export const WHITE_CATHEDRAL_LAYOUT=Object.freeze({
 combatRadius:28, wallX:42, columnX:35.4, ceilingApex:43,
 bayZ:Object.freeze([-35,-21,-7,7,21,35]),
 altarZ:-43.5, minSolidRadius:30,
});
const {bayZ,wallX,columnX}=WHITE_CATHEDRAL_LAYOUT;
const TAU=Math.PI*2;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const mat=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const clamp01=x=>Math.max(0,Math.min(1,x));
function mesh(parent,geo,material,pos=[0,0,0],name=''){
 const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.name=name;parent.add(o);return o;
}
function rib(parent,pts,r,material,detail=24,name='cathedral-vault-rib'){
 const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>V(...p))),detail,r,7,false);
 return mesh(parent,geo,material,[0,0,0],name);
}
function batch(parent,geometry,material,placements,name){
 const m=new THREE.InstancedMesh(geometry,material,placements.length),dummy=new THREE.Object3D();
 placements.forEach((p,i)=>{
  dummy.position.set(...p.p);dummy.rotation.set(...(p.r||[0,0,0]));dummy.scale.set(...(p.s||[1,1,1]));
  dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  if(p.tint)m.setColorAt(i,new THREE.Color(p.tint));
 });
 m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
 m.name=name;m.frustumCulled=false;parent.add(m);return m;
}
function vaultedCeilingSection(root,z0,z1,side,material,coarse){
 const segments=coarse?7:14,depth=2,verts=[],indices=[];
 for(let d=0;d<=depth;d++)for(let i=0;i<=segments;i++){
  const u=i/segments,x=side*(.04+35.5*u);
  const y=42.6-17*Math.pow(u,1.42)-.4*Math.sin(Math.PI*u);
  verts.push(x,y,z0+(z1-z0)*d/depth);
 }
 for(let d=0;d<depth;d++)for(let i=0;i<segments;i++){
  const a=d*(segments+1)+i,b=a+segments+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setIndex(indices);geo.computeVertexNormals();
 return mesh(root,geo,material,[0,0,0],'cathedral-vault-panel');
}
function coloredRose(root,coarse,ivory,gold){
 const rose=new THREE.Group();rose.position.set(0,32,-46.85);rose.name='cathedral-rose-window';root.add(rose);
 const palette=[0x82b2cb,0xeabb71,0xba8fc7,0xe79b8e,0x8ebaa4,0xe9d69b];
 const clear=new THREE.MeshBasicMaterial({color:0xfff1d4,side:THREE.DoubleSide,transparent:true,opacity:.76,depthWrite:false});
 const circle=mesh(rose,new THREE.CircleGeometry(6.3,coarse?32:64),clear,[0,0,0],'cathedral-rose-white-glow');
 circle.renderOrder=1;
 const sectors=coarse?12:24;
 for(let i=0;i<sectors;i++){
  const a=i*TAU/sectors,b=(i+1)*TAU/sectors;
  const shape=new THREE.Shape(),r0=.85,r1=5.85;
  shape.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);
  shape.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);
  shape.quadraticCurveTo(Math.cos((a+b)/2)*6.7,Math.sin((a+b)/2)*6.7,Math.cos(b)*r1,Math.sin(b)*r1);
  shape.lineTo(Math.cos(b)*r0,Math.sin(b)*r0);
  shape.closePath();
  const glass=new THREE.MeshBasicMaterial({color:palette[i%palette.length],transparent:true,opacity:.88,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const w=mesh(rose,new THREE.ShapeGeometry(shape,coarse?4:8),glass,[0,0,.03],'cathedral-rose-stained-petal');w.renderOrder=2;
  rib(rose,[[Math.cos(a)*.7,Math.sin(a)*.7,.08],[Math.cos(a)*6.26,Math.sin(a)*6.26,.08]],.055,gold,8,'cathedral-rose-lead');
 }
 const frame=mesh(rose,new THREE.TorusGeometry(6.35,.25,8,coarse?40:80),ivory,[0,0,.12],'cathedral-rose-frame');
 mesh(rose,new THREE.TorusGeometry(.84,.12,7,32),gold,[0,0,.14]);
 mesh(rose,new THREE.SphereGeometry(.44,12,8),gold,[0,0,.19]);
 return rose;
}
function buildCrucifix(root,ivory,stone,gold,coarse){
 const altar=new THREE.Group();altar.position.set(0,0,-44.1);altar.name='cathedral-sanctuary';root.add(altar);
 for(let i=0;i<4;i++){
  const step=mesh(altar,new THREE.BoxGeometry(15-i*2,.32,8-i*1.1),i%2?ivory:stone,[0,i*.32,-i*.11],'cathedral-altar-step');
  step.receiveShadow=true;
 }
 mesh(altar,new THREE.BoxGeometry(7.4,2.4,2.5),stone,[0,2.3,-1.8],'cathedral-altar-table');
 mesh(altar,new THREE.BoxGeometry(7.8,.12,2.75),gold,[0,3.55,-1.8]);
 const crucifix=new THREE.Group();crucifix.position.set(0,3.5,-2.8);crucifix.name='cathedral-crucifix';altar.add(crucifix);
 mesh(crucifix,new THREE.BoxGeometry(1.05,16.5,1.06),ivory,[0,10.3,0]);
 mesh(crucifix,new THREE.BoxGeometry(12.2,.93,1.06),ivory,[0,13.25,0]);
 for(const sign of [-1,1])mesh(crucifix,new THREE.BoxGeometry(.15,1.06,1.1),gold,[sign*6.12,13.25,.02]);
 // Sculptural marble relief; stylised and clearly three-dimensional even at
 // coarse mesh settings, without claiming a scanned/photorealistic model.
 const sculpt=mat(0xf9f7ee,.75),shadow=mat(0xd5d1c9,.88);
 mesh(crucifix,new THREE.SphereGeometry(.66,coarse?10:20,coarse?8:14),sculpt,[0,13.6,.84],'cathedral-marble-sculpture-head');
 const torso=mesh(crucifix,new THREE.CapsuleGeometry(.63,3.25,5,coarse?10:16),sculpt,[0,10.7,.78],'cathedral-marble-sculpture-body');torso.rotation.z=.05;
 for(const side of [-1,1]){
  const arm=mesh(crucifix,new THREE.CapsuleGeometry(.27,4.8,4,coarse?8:12),sculpt,[side*3.13,12.9,.8],'cathedral-marble-sculpture-arm');
  arm.rotation.z=side*Math.PI/2;
  const leg=mesh(crucifix,new THREE.CapsuleGeometry(.3,3,4,coarse?8:12),sculpt,[side*.32,7.42,.72],'cathedral-marble-sculpture-leg');
  leg.rotation.z=side*.06;
 }
 const drape=mesh(crucifix,new THREE.CylinderGeometry(.8,1.03,1.4,coarse?10:18),shadow,[0,8.9,.95],'cathedral-marble-sculpture-drape');
 drape.rotation.z=-.12;
 const crown=mesh(crucifix,new THREE.TorusGeometry(.68,.055,6,coarse?18:32),gold,[0,14.17,.88]);crown.rotation.x=Math.PI/2;
 return altar;
}
function angel(root,side,z,ivory,gold,coarse){
 const a=new THREE.Group();a.name='cathedral-angel-relief';a.position.set(side*36.1,27.6,z);root.add(a);
 const body=mesh(a,new THREE.ConeGeometry(.6,2.5,coarse?8:14),ivory,[0,-1.2,0]);
 const head=mesh(a,new THREE.SphereGeometry(.36,coarse?8:14,8),ivory,[0,.42,0]);
 const halo=mesh(a,new THREE.TorusGeometry(.44,.04,6,24),gold,[0,.6,-.13]);halo.rotation.x=.24;
 for(const s of [-1,1]){
  const wing=mesh(a,new THREE.SphereGeometry(.7,coarse?8:16,coarse?6:10),ivory,[s*.77,-.18,-.3]);
  wing.scale.set(.57,1.68,.2);wing.rotation.z=s*.45;
 }
 return a;
}
function chandelier(root,z,gold,ivory,coarse){
 const fixture=new THREE.Group();fixture.position.set(0,30,z);fixture.name='cathedral-hanging-chandelier';root.add(fixture);
 rib(fixture,[[0,11,0],[0,4,0],[0,0,0]],.075,gold,12,'cathedral-chandelier-chain');
 const ring=mesh(fixture,new THREE.TorusGeometry(2.25,.16,8,coarse?24:48),gold,[0,-.8,0],'cathedral-chandelier-crown');ring.rotation.x=Math.PI/2;
 const inner=mesh(fixture,new THREE.TorusGeometry(1.42,.09,7,coarse?20:36),gold,[0,-.4,0]);inner.rotation.x=Math.PI/2;
 const rods=[],candles=[],flames=[];
 for(let i=0;i<10;i++){
  const a=i*TAU/10,x=Math.cos(a)*2.22,zp=Math.sin(a)*2.22;
  rods.push({p:[x,-.5,zp]});
  candles.push({p:[x,-.48,zp]});
  flames.push({p:[x,-.12,zp]});
 }
 batch(fixture,new THREE.CylinderGeometry(.038,.055,.8,6),gold,rods,'cathedral-chandelier-branches');
 batch(fixture,new THREE.CylinderGeometry(.13,.15,.42,8),ivory,candles,'cathedral-chandelier-candles');
 const flameMat=new THREE.MeshBasicMaterial({color:0xffefcc,toneMapped:false});
 batch(fixture,new THREE.SphereGeometry(.13,8,6),flameMat,flames,'cathedral-chandelier-lamps');
 return fixture;
}
function sunbeam(parent,side,z,material){
 const x0=side*39.4,x1=side*11;
 const pos=new Float32Array([
  x0,27.4,z-2.8,x1,.18,z-5.9,x0,27.4,z+2.8,
  x0,27.4,z+2.8,x1,.18,z-5.9,x1,.18,z+5.9,
 ]);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.computeVertexNormals();
 const o=mesh(parent,geo,material,[0,0,0],'cathedral-sunlight-shaft');
 o.renderOrder=1;return o;
}
export function createWhiteCathedral(scene,{coarse=false,reduced=false,radius=28}={}){
 const parent=new THREE.Group();parent.name='blood-white-cathedral';scene.add(parent);
 const ivory=mat(0xf2efe7,.76),limestone=mat(0xe7e3da,.91),moulding=mat(0xdcd5c9,.66),
       gold=mat(0xbba67b,.4,.46),pewWood=mat(0xc2a78c,.69),floorMat=mat(0xf2efe9,.38),
       marble=mat(0xe6e3df,.5);
 const roofMat=new THREE.MeshStandardMaterial({color:0xe9e6df,roughness:.9,side:THREE.DoubleSide});
 const glassMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85,
  depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
 const lightShaftMaterial=new THREE.MeshBasicMaterial({color:0xfff2cf,transparent:true,opacity:coarse?.035:.058,
  depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const materials=[ivory,limestone,moulding,gold,pewWood,floorMat,marble,roofMat,glassMaterial,lightShaftMaterial];
 const floor=mesh(parent,new THREE.CylinderGeometry(radius,radius,.75,coarse?48:96),marble,[0,-.4,0],'cathedral-battle-floor');floor.receiveShadow=true;
 // Deep crimson water floods the Gothic nave beyond the dry circular combat arena.
 // It is decorative only; actual movement and all damage radii are unchanged.
 const bloodSea=createCathedralBloodSea(parent,{coarse,reduced,radius});
 // Tile the playable floor without adding any raycast/collision geometry.
 const tiles=[];for(let x=-25;x<=25;x+=5)for(let z=-25;z<=25;z+=5){
  if(Math.hypot(x,z)>radius-3)continue;
  tiles.push({p:[x,.013,z],tint:(Math.floor(x/5)+Math.floor(z/5))%2?0xf3f0ea:0xe8e5e1});
 }
 const tileGeometry=new THREE.BoxGeometry(4.91,.032,4.91);
 const floorTile=batch(parent,tileGeometry,floorMat,tiles,'cathedral-marble-floor-tiles');floorTile.receiveShadow=true;
 // A pale aisle reads on camera but remains flush with the walkable floor.
 const aisle=mesh(parent,new THREE.BoxGeometry(10,.045,49),ivory,[0,.029,-.6],'cathedral-central-aisle');aisle.receiveShadow=true;
 for(const side of [-1,1]){
  const line=mesh(parent,new THREE.BoxGeometry(.055,.053,52),gold,[side*5.08,.052,-.8],'cathedral-gilded-aisle-inlay');
 }
 // The shell is a long, open Gothic nave, rather than a featureless cylinder.
 const wallParts=[],columnParts=[],baseParts=[],capitalParts=[],pewSeat=[],pewBack=[],pewLegs=[];
 for(const side of [-1,1]){
  wallParts.push({p:[side*wallX,5.25,0],s:[1,10.5,90]});
  wallParts.push({p:[side*wallX,33.6,0],s:[1,9.4,90]});
  for(const z of [-42,...bayZ,42]){
   wallParts.push({p:[side*wallX,19.3,z],s:[1.2,18,2]});
  }
  for(const z of bayZ){
   columnParts.push({p:[side*columnX,13.7,z]});
   baseParts.push({p:[side*columnX,.7,z]});
   capitalParts.push({p:[side*columnX,25.8,z]});
  }
  // Every bench is safely OUTSIDE the playable circular arena. No collisions.
  for(const z of [-29,-18,-7,4,15,26]){
   const x=side*34.35;
   pewSeat.push({p:[x,.87,z]});
   pewBack.push({p:[x,1.48,z-1.12]});
   for(const dx of [-2.8,2.8])pewLegs.push({p:[x+dx,.44,z]});
  }
 }
 batch(parent,new THREE.BoxGeometry(1,1,1),limestone,wallParts,'cathedral-side-wall-masonry');
 batch(parent,new THREE.CylinderGeometry(.93,1.14,25,coarse?10:20),ivory,columnParts,'cathedral-fluted-nave-columns');
 batch(parent,new THREE.CylinderGeometry(1.5,1.8,1.4,coarse?10:20),moulding,baseParts,'cathedral-column-plinths');
 batch(parent,new THREE.CylinderGeometry(1.57,1.05,1.6,coarse?10:20),gold,capitalParts,'cathedral-gilded-capitals');
 batch(parent,new THREE.BoxGeometry(7.2,.29,2.14),pewWood,pewSeat,'cathedral-pew-seats');
 batch(parent,new THREE.BoxGeometry(7.3,1.28,.23),pewWood,pewBack,'cathedral-pew-backs');
 batch(parent,new THREE.BoxGeometry(.36,.88,1.75),pewWood,pewLegs,'cathedral-pew-legs');
 // Vaulted roof: white stone panels and continuous ribbed Gothic arches.
 const stations=[-45,...bayZ,45];
 for(let i=0;i<stations.length-1;i++)for(const side of [-1,1])
  vaultedCeilingSection(parent,stations[i],stations[i+1],side,roofMat,coarse);
 for(const z of stations){
  for(const side of [-1,1]){
   rib(parent,[[side*35.5,25.2,z],[side*26,31.9,z],[side*14,38.8,z],[0,42.55,z]],coarse?.24:.3,ivory,coarse?14:28);
   rib(parent,[[side*35.5,25.2,z],[side*35.5,30,z-1.4],[side*35.5,33,z]],.13,gold,12,'cathedral-arch-capital-filigree');
  }
 }
 rib(parent,[[0,42.55,-45],[0,43,0],[0,42.55,45]],.22,gold,coarse?22:50,'cathedral-vault-keystone-ridge');
 for(const side of [-1,1]){
  rib(parent,[[side*16,38,-45],[side*16,38,0],[side*16,38,45]],.12,moulding,coarse?14:36,'cathedral-vault-longitudinal-rib');
 }
 // 12 high pointed lancets. One instanced batch supplies all coloured panes.
 const palette=[0x9bbeda,0xf4be6f,0xf1d89b,0xc6a3db,0x92b3a7,0xe6a5a0,0xc1e0e3];
 const glazes=[];
 for(const side of [-1,1])for(const z of bayZ){
  const x=side*(wallX-.95);
  // A real pointed arch with a sharply angled crown, not a round torus.
  rib(parent,[[x,10.7,z-4.8],[x,21,z-4.8],[x,26.1,z-2.9],[x,29.4,z]],.27,ivory,coarse?14:25,'cathedral-lancet-gothic-frame');
  rib(parent,[[x,29.4,z],[x,26.1,z+2.9],[x,21,z+4.8],[x,10.7,z+4.8]],.27,ivory,coarse?14:25,'cathedral-lancet-gothic-frame');
  for(const offset of [-2,0,2])
   rib(parent,[[x+.06,11.1,z+offset],[x+.06,20,z+offset],[x+.06,25.4-Math.abs(offset)*.6,z+offset*.8]],.065,gold,10,'cathedral-window-lead');
  for(let row=0;row<5;row++)for(let col=0;col<4;col++){
   const zPane=z+(col-1.5)*2.24,y=12.35+row*2.65;
   glazes.push({p:[x-side*.045,y,zPane],r:[0,Math.PI/2,0],tint:palette[(row*3+col+Math.abs(z))%palette.length]});
  }
 }
 const coloredWindows=batch(parent,new THREE.PlaneGeometry(2.05,2.35),glassMaterial,glazes,'cathedral-stained-glass-panes');
 coloredWindows.renderOrder=2;
 // Front and rear clerestories; monumental luminous rose above the altar.
 mesh(parent,new THREE.BoxGeometry(87,11,1.7),limestone,[0,5,-48],'cathedral-sanctuary-end-wall');
 mesh(parent,new THREE.BoxGeometry(87,7,1.7),limestone,[0,40,-48],'cathedral-high-west-wall');
 for(const side of [-1,1])
  mesh(parent,new THREE.BoxGeometry(31,24,1.7),limestone,[side*28,23,-48],'cathedral-sanctuary-side-wall');
 coloredRose(parent,coarse,ivory,gold);
 chandelier(parent,-22,gold,ivory,coarse);chandelier(parent,14,gold,ivory,coarse);
 buildCrucifix(parent,ivory,marble,gold,coarse);
 for(const side of [-1,1])for(const z of [-21,21])angel(parent,side,z,ivory,gold,coarse);
 // Projected sunbeams are a few translucent wedges: no expensive full-screen
 // volumetric pass or extra shadow-casting lights on mobile.
 for(const side of [-1,1])for(const z of [-21,7,28])sunbeam(parent,side,z,lightShaftMaterial);
 const dustPositions=[],count=coarse?48:160;
 for(let i=0;i<count;i++){
  const seed=(Math.sin((i+1)*127.1)*43758.5453)%1;
  const r=4+((i*37)%300)/10,a=i*2.399963;
  dustPositions.push(Math.cos(a)*r,2+((i*17)%310)/10,Math.sin(a)*r*.95+seed);
 }
 const dustGeometry=new THREE.BufferGeometry();
 dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));
 const dustMaterial=new THREE.PointsMaterial({color:0xfff3d5,size:coarse?.095:.12,opacity:coarse?.21:.32,transparent:true,depthWrite:false});
 materials.push(dustMaterial);
 const dust=new THREE.Points(dustGeometry,dustMaterial);dust.name='cathedral-sunlit-dust';parent.add(dust);
 // Exactly one modest local light in high quality, none in coarse/mobile.
 const altarLight=coarse?null:new THREE.PointLight(0xffe8bf,coarse?0:18,30,2);
 if(altarLight){altarLight.position.set(0,16,-42);parent.add(altarLight);}
 function update(g,c,env={}){
  bloodSea.update(g);
  const shadow=clamp01(c?.darkness||0),phase=g?.boss?.phase||1;
  const light=clamp01(env.light??1);
  const strength=phase===2?.68:1;
  lightShaftMaterial.opacity=(coarse?.033:.056)*strength*(1-shadow*.65)*(Math.max(.4,light));
  dustMaterial.opacity=(coarse?.22:.31)*Math.max(.25,light)*(1-shadow*.7);
  if(altarLight)altarLight.intensity=17*(1-shadow*.75)*(phase===2?.72:1);
  // Stained glass remains saturated and visible when phase 2 reddens the room.
  glassMaterial.opacity=(phase===2?.9:.85)*(1-shadow*.3);
  if(!reduced)dust.rotation.y=(g?.time||0)*.002;
 }
 let disposed=false;
 function dispose(){
  if(disposed)return;disposed=true;
  bloodSea.dispose();
  const geometries=new Set(),mats=new Set();
  parent.traverse(o=>{if(o.geometry)geometries.add(o.geometry);
   if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});
  for(const g of geometries)g.dispose();
  for(const m of mats)m.dispose();
  parent.parent?.remove(parent);
 }
 return {root:parent,update,dispose,glassMaterial,occludables:[],
  stats:()=>({tiles:tiles.length,windows:bayZ.length*2,panes:glazes.length,pews:pewSeat.length,roofPanels:(stations.length-1)*2,hasAltar:true,bloodSea:bloodSea.stats()})};
}
