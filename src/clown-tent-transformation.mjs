import * as THREE from 'three';

// Presentation only: keep the exact arena circle and combat rules untouched.
// The canopy and curtains are far outside the playable volume.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
const TENT_NAMES=new Set(['circus-vaulted-ivory-velvet-canopy','circus-scalloped-velvet-curtain']);
export function createClownEncoreTent(root,{coarse=false,reduced=false}={}){
 const fabrics=[],palette=[];
 root.traverse(o=>{
  if(!o.isMesh||!TENT_NAMES.has(o.name))return;
  const pos=o.geometry?.getAttribute('position');
  if(!pos||!pos.isBufferAttribute)return;
  const col=o.geometry?.getAttribute('color');
  fabrics.push({mesh:o,pos,original:new Float32Array(pos.array),colors:col,
    originalColors:col?new Float32Array(col.array):null,canopy:o.name.includes('canopy')});
  const m=o.material;
  if(!palette.some(entry=>entry.material===m))palette.push({material:m,base:m.color.clone()});
 });
 const shadow=new THREE.Group();shadow.name='circus-encore-canopy-grinning-shadow';
 shadow.position.set(0,29,-34.4);root.add(shadow);
 const ink=new THREE.MeshBasicMaterial({color:0x240c31,transparent:true,opacity:0,depthWrite:false,
  side:THREE.DoubleSide});
 const eyeGeo=new THREE.SphereGeometry(1,12,8);
 for(const sign of [-1,1]){
  const eye=new THREE.Mesh(eyeGeo,ink);eye.name='circus-encore-shadow-eye';
  eye.scale.set(2.2,.9,.12);eye.rotation.z=sign*.19;eye.position.set(sign*4.1,1,0);shadow.add(eye);
 }
 const points=[];
 for(let i=0;i<=20;i++){
  const a=Math.PI+(i/20)*Math.PI;
  points.push(new THREE.Vector3(Math.cos(a)*5.3,-1.5+Math.sin(a)*1.8,0));
 }
 const grin=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.24,7,false),ink);
 grin.name='circus-encore-shadow-grin';shadow.add(grin);
 let mix=0,phase=1,clock=0,lastStep=-1,disposed=false;
 const pink=new THREE.Color(0xf1bad5),violet=new THREE.Color(0x8a366e);
 const color=new THREE.Color();
 function reset(){
  mix=0;phase=1;clock=0;lastStep=-1;ink.opacity=0;shadow.visible=false;
  for(const item of fabrics){
   item.pos.array.set(item.original);item.pos.needsUpdate=true;
   if(item.colors){item.colors.array.set(item.originalColors);item.colors.needsUpdate=true;}
   item.mesh.geometry.computeVertexNormals();
  }
  for(const item of palette)item.material.color.copy(item.base);
 }
 function update(game,dt=0){
  if(disposed)return;
  const target=game?.boss?.phase===2?1:0,h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  clock+=h;
  // Smooth crossfade: the entire tent breathes and twists when phase two arrives.
  if(target!==phase-1)phase=target?2:1;
  mix+=((target-mix)*(1-Math.exp(-h*(reduced?4:1.9))));
  if(Math.abs(target-mix)<.001)mix=target;
  const transformed=smooth(mix),step=Math.round(transformed*60);
  // Phase one must retain the exact original buffer values (no trig rounding).
  if(transformed===0){
   if(lastStep!==0){
    for(const item of fabrics){
     item.pos.array.set(item.original);item.pos.needsUpdate=true;
     if(item.colors){item.colors.array.set(item.originalColors);item.colors.needsUpdate=true;}
    }
    for(const item of palette)item.material.color.copy(item.base);
   }
   lastStep=0;shadow.visible=false;ink.opacity=0;
   return {phase,transformed};
  }
  const animated=!reduced&&transformed>.005&&game?.status==='playing';
  if(step===lastStep&&!animated)return {phase,transformed};
  if(animated&&clock-lastStepTime<1/28)return {phase,transformed};
  lastStep=step;lastStepTime=clock;
  for(const item of fabrics){
   const original=item.original,arr=item.pos.array,amount=transformed;
   for(let i=0;i<arr.length;i+=3){
    const x=original[i],y=original[i+1],z=original[i+2],a=Math.atan2(x,z),radius=Math.hypot(x,z);
    const warp=item.canopy?1.35:1.85;
    const breath=animated?Math.sin(clock*1.5+a*5+y*.12)*.36:0;
    const ribbon= Math.sin(a*7+y*.09+1.3)*warp*amount;
    const ring=radius+(ribbon+breath*amount)*Math.min(1,(y-10)/14);
    const turn=amount*.045*Math.sin(a*3+y*.08);
    arr[i]=Math.sin(a+turn)*ring;arr[i+2]=Math.cos(a+turn)*ring;
    arr[i+1]=y+(item.canopy?-amount*1.15:-amount*.25)+(animated?Math.sin(a*6+clock*2.1)*amount*.28:0);
   }
   item.pos.needsUpdate=true;
   if(!coarse&&item.mesh.geometry.getAttribute('normal'))item.mesh.geometry.computeVertexNormals();
   if(item.colors){
    const base=item.originalColors,cols=item.colors.array;
    for(let i=0;i<cols.length;i+=3){
     const r=base[i],g=base[i+1],b=base[i+2],isRed=r>g*1.1;
     const goal=isRed?violet:pink;
     cols[i]=r+(goal.r-r)*transformed*.62;
     cols[i+1]=g+(goal.g-g)*transformed*.62;
     cols[i+2]=b+(goal.b-b)*transformed*.62;
    }
    item.colors.needsUpdate=true;
   }
  }
  for(const {material,base}of palette)material.color.copy(base).lerp(violet,transformed*.5);
  shadow.visible=transformed>.05;
  ink.opacity=transformed*.48;
  shadow.rotation.z=animated?Math.sin(clock*.9)*.07:0;
  return {phase,transformed};
 }
 let lastStepTime=-1;
 function dispose(){if(disposed)return;disposed=true;shadow.parent?.remove(shadow);
  eyeGeo.dispose();grin.geometry.dispose();ink.dispose();
  for(const item of palette)item.material.color.copy(item.base);
 }
 reset();
 return {update,reset,dispose,shadow,fabrics,stats:()=>({phase,morph:mix,panels:fabrics.length,collidable:false})};
}
