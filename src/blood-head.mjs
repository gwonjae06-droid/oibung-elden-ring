import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gaussian=(x,y,rx,ry)=>Math.exp(-((x/rx)**2+(y/ry)**2));
const P=Math.PI*2;

// An anatomically contoured closed skull. Facial relief shares its UVs with the
// original uploaded portrait; there is no flat photograph mesh or floating card.
export function bloodHeadGeometry({coarse=false}={}){
 const geo=new THREE.SphereGeometry(1,coarse?40:80,coarse?32:64);
 const p=geo.attributes.position,uv=geo.attributes.uv;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=Math.max(0,z);
  const jaw=1-.17*Math.max(0,-y);
  const cheeks=.09*(gaussian(x-.35,y+.18,.22,.29)+gaussian(x+.35,y+.18,.22,.29));
  const brow=.046*(gaussian(x-.23,y-.19,.22,.1)+gaussian(x+.23,y-.19,.22,.1));
  const sockets=.036*(gaussian(x-.23,y+.025,.17,.11)+gaussian(x+.23,y+.025,.17,.11));
  const bridge=.11*gaussian(x,y+.17,.13,.39);
  const tip=.16*gaussian(x,y+.32,.15,.12);
  const lowerLip=.025*gaussian(x,y+.55,.25,.07);
  const chin=.045*gaussian(x,y+.75,.3,.17);
  const temple=1-.08*(gaussian(x-.7,y-.03,.2,.35)+gaussian(x+.7,y-.03,.2,.35));
  const asym=.008*Math.sin(11*x+3*y);
  p.setXYZ(i,x*.67*jaw*temple,y*.87,z*.56+front*(cheeks+brow-sockets+bridge+tip+lowerLip+chin+asym));
  const angle=Math.atan2(x,z);
  uv.setXY(i,clamp(.5+angle/P,0,1),clamp((y+1)/2,0,1));
 }
 p.needsUpdate=uv.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingSphere();
 return geo;
}
function mesh(parent,geometry,material,x=0,y=0,z=0){
 const obj=new THREE.Mesh(geometry,material);obj.position.set(x,y,z);parent.add(obj);return obj;
}
function stroke(parent,points,r,material){
 const curve=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));
 return mesh(parent,new THREE.TubeGeometry(curve,12,r,5,false),material);
}
function hairGeometry(coarse){
 const g=new THREE.SphereGeometry(1,coarse?24:40,coarse?12:20,0,P,0,Math.PI*.4);
 g.scale(.687,.91,.595);return g;
}
function skinTexture(THREE,coarse){
 if(!globalThis.document?.createElement)return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const img=ctx.createImageData(128,128);
 // Deterministic skin-grain bump: subtle relief instead of plastic shine.
 for(let i=0;i<128*128;i++){
  const x=i%128,y=Math.floor(i/128);
  const noise=(Math.sin(x*73.19+y*19.31)*43758.5453)%1;
  const v=clamp(125+noise*18+Math.sin(x*.25+y*.17)*3,0,255);
  const k=i*4;img.data[k]=img.data[k+1]=img.data[k+2]=v;img.data[k+3]=255;
 }
 ctx.putImageData(img,0,0);const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(3,3);return tex;
}
export function createBloodHead({coarse=false,reduced=false,seraph=false,portrait='baeseojun.png'}={}){
 // Explicitly allow only the two authored portrait assets, never arbitrary URL input.
 const portraitAsset=portrait==='3bae.png'?'3bae.png':'baeseojun.png';
 const group=new THREE.Group();
 const mat=new THREE.MeshPhysicalMaterial({color:0xc39b8c,roughness:seraph?.58:.8,metalness:0,
  emissive:seraph?0x541024:0x000000,emissiveIntensity:seraph?.36:0,
  clearcoat:seraph?.55:.09,clearcoatRoughness:seraph?.22:.68});
 const skull=mesh(group,bloodHeadGeometry({coarse}),mat);skull.name='baeseojun-sculpted-head';
 const throat=new THREE.MeshStandardMaterial({color:0x96736a,roughness:.89});
 const neck=mesh(group,new THREE.CylinderGeometry(.235,.31,.52,coarse?10:20),throat,0,-.84,-.06);
 const ear=new THREE.MeshStandardMaterial({color:0xb69084,roughness:.86});
 const inner=new THREE.MeshStandardMaterial({color:0x684940,roughness:.93});
 const hair=new THREE.MeshStandardMaterial({color:0x201b20,roughness:.94});
 const darkStrand=new THREE.MeshStandardMaterial({color:0x30262a,roughness:.9});
 const gild=new THREE.MeshStandardMaterial({color:0xb69a69,metalness:.74,roughness:.31});
 const blood=new THREE.MeshPhysicalMaterial({color:0x590b20,roughness:.3,clearcoat:.6,clearcoatRoughness:.23});
 // Ear, cartilage, short sideburns, and hair are embedded directly in the head's rig.
 for(const side of [-1,1]){
  const e=mesh(skull,new THREE.SphereGeometry(.21,12,10),ear,side*.65,-.07,-.025);
  e.scale.set(.65,1.22,.6);
  const cavity=mesh(skull,new THREE.SphereGeometry(.11,10,8),inner,side*.73,-.065,.04);
  cavity.scale.set(.52,.85,.38);
  const sideburn=mesh(skull,new THREE.SphereGeometry(.24,12,12),hair,side*.58,.38,-.07);
  sideburn.scale.set(.57,1.32,1.03);
  stroke(skull,[[side*.57,.38,.33],[side*.59,.07,.34],[side*.54,-.27,.2]],.027,darkStrand);
 }
 const cap=mesh(skull,hairGeometry(coarse),hair);cap.position.y=.017;
 const strands=coarse?9:17;
 for(let i=0;i<strands;i++){
  const t=i/(strands-1),x=(t-.5)*1.18;
  const seed=Math.sin(i*11.73)*.04;
  stroke(skull,[[x*.75,.86,.23],[x,.64,.44],[x+seed,.39+Math.abs(t-.5)*.12,.48]],.022+(i%3)*.004,i%2?hair:darkStrand);
 }
 // A fractured, fitted circlet; prongs are joined to the scalp, not hovering above it.
 const ring=mesh(skull,new THREE.TorusGeometry(.57,.035,7,coarse?24:48),gild,0,.59,0);
 ring.rotation.x=Math.PI/2;ring.scale.z=.91;
 for(let i=0;i<7;i++){
  const a=i*P/7,x=Math.sin(a)*.55,z=Math.cos(a)*.51;
  const prong=mesh(skull,new THREE.ConeGeometry(i===0?.13:.075,i%2?.38:.51,7),gild,x,.81+(i%2)*.035,z);
  prong.rotation.z=-Math.sin(a)*.22;prong.rotation.x=Math.cos(a)*.18;
  if(i%2===0)mesh(skull,new THREE.OctahedronGeometry(.065),blood,x,.59,z+.03);
 }
 const bump=coarse?null:skinTexture(THREE,coarse);if(bump){mat.bumpMap=bump;mat.bumpScale=.006;}
 let texture=null,disposed=false,hurt=0,lastHp=null;
 if(globalThis.document?.createElement&&globalThis.Image){
  const image=new globalThis.Image();
  image.onload=()=>{
   if(disposed)return;
   const size=coarse?512:1024;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
   const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
   const ctx=canvas.getContext('2d'),src=source.getContext('2d');
   if(!ctx||!src||!source.width||!source.height)return;
   src.drawImage(image,0,0);
   const photo=src.getImageData(0,0,source.width,source.height),out=ctx.createImageData(size,size);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const angle=(x/(size-1)-.5)*P;
    // Face projected across the forward hemisphere and smoothly wrapped onto
    // sculpted temples; crown and hair stay separately modelled in real 3D.
    const sy=Math.min(source.height-1,Math.round(y/(size-1)*(source.height-12)));
    const sx=clamp(Math.round((.5+Math.sin(angle)*.485)*(source.width-1)),0,source.width-1);
    const q=(sy*source.width+sx)*4,k=(y*size+x)*4;
    let blend=clamp((Math.cos(angle)-.06)/.29,0,1)*photo.data[q+3]/255;
    // A photograph may include a collar; keep it off the lower jaw and neck.
    if(y>size*.565)blend*=clamp((photo.data[q]-photo.data[q+2]-11)/22,0,1);
    const hairline=.46*size+Math.max(0,-Math.cos(angle))*.28*size;
    const hairRatio=y<hairline?1:clamp(1-(y-hairline)/(size*.09),0,1);
    const base=[189-144*hairRatio,148-105*hairRatio,131-83*hairRatio];
    for(let c=0;c<3;c++)out.data[k+c]=photo.data[q+c]*blend+base[c]*(1-blend);
    out.data[k+3]=255;
   }
   ctx.putImageData(out,0,0);
   if(disposed)return;
   texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   mat.map=texture;mat.color.setHex(0xffffff);mat.needsUpdate=true;
  };
  image.onerror=()=>{};image.src=new URL('../assets/'+portraitAsset,import.meta.url).href;
 }
 function update(g,c,dt,{cast=0,pose={}}={}){
  const t=Math.max(0,Number.isFinite(dt)?dt:0),b=g.boss;
  if(lastHp!=null&&b.hp<lastHp&&t>0)hurt=Math.min(.6,hurt+(lastHp-b.hp)/350);
  lastHp=b.hp;hurt*=Math.exp(-t*8);
  const clock=g.time||0,breath=reduced?0:Math.sin(clock*1.7)*.018;
  const prayer=c.prayer||0;
  group.rotation.x=breath-cast*.02-prayer*.12+hurt*.22+(pose.head?.pitch||0);
  group.rotation.y=(reduced?0:Math.sin(clock*.8)*.025)+(pose.head?.yaw||0);
  group.rotation.z=(reduced?0:Math.sin(clock*1.05)*.014)-hurt*.12+(pose.head?.roll||0);
 }
 function clear(){lastHp=null;hurt=0;group.rotation.set(0,0,0);}
 function dispose(){
  if(disposed)return;disposed=true;
  texture?.dispose();bump?.dispose();
  const geometries=new Set(),materials=new Set();
  group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return {group,update,clear,dispose,portraitAsset,get photoLoaded(){return !!mat.map;}};
}
