import * as THREE from 'three';

// Decorative-only, finite morph. No per-frame normal rebuild or endless cloth warp.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
const TENT_NAMES=new Set(['circus-vaulted-ivory-velvet-canopy','circus-scalloped-velvet-curtain']);
export function createClownEncoreTent(root,{coarse=false,reduced=false}={}){
 const fabrics=[],palette=[];
 root.traverse(o=>{
  if(!o.isMesh||!TENT_NAMES.has(o.name))return;
  const pos=o.geometry?.getAttribute('position');
  if(!pos||!pos.isBufferAttribute)return;
  const col=o.geometry.getAttribute('color'),normal=o.geometry.getAttribute('normal');
  fabrics.push({mesh:o,pos,original:new Float32Array(pos.array),colors:col,originalColors:col?new Float32Array(col.array):null,normal,originalNormals:normal?new Float32Array(normal.array):null,canopy:o.name.includes('canopy'),target:null,targetColors:null});
  const m=o.material;
  if(!palette.some(entry=>entry.material===m))palette.push({material:m,base:m.color.clone()});
  // Conservative bound covers the bounded decorative displacement during morph.
  o.geometry.computeBoundingSphere();
  if(o.geometry.boundingSphere)o.geometry.boundingSphere.radius+=4;
 });
 const shadow=new THREE.Group();shadow.name='circus-encore-canopy-grinning-shadow';shadow.position.set(0,29,-34.4);root.add(shadow);
 const ink=new THREE.MeshBasicMaterial({color:0x240c31,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 const eyeGeo=new THREE.SphereGeometry(1,12,8);
 for(const sign of [-1,1]){
  const eye=new THREE.Mesh(eyeGeo,ink);eye.name='circus-encore-shadow-eye';eye.scale.set(2.2,.9,.12);eye.rotation.z=sign*.19;eye.position.set(sign*4.1,1,0);shadow.add(eye);
 }
 const points=[];
 for(let i=0;i<=20;i++){const a=Math.PI+(i/20)*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*5.3,-1.5+Math.sin(a)*1.8,0));}
 const grin=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.24,7,false),ink);grin.name='circus-encore-shadow-grin';shadow.add(grin);
 const pink=new THREE.Color(0xf1bad5),violet=new THREE.Color(0x8a366e);
 let mix=0,phase=1,clock=0,lastStep=0,lastStepTime=-Infinity,disposed=false,bufferUpdates=0;
 function prepare(item){
  if(item.target)return;
  const a=item.original,out=new Float32Array(a.length);
  for(let i=0;i<a.length;i+=3){
   const x=a[i],y=a[i+1],z=a[i+2],angle=Math.atan2(x,z),radius=Math.hypot(x,z),warp=item.canopy?1.35:1.85;
   const ring=radius+Math.sin(angle*7+y*.09+1.3)*warp*Math.min(1,(y-10)/14),turn=.045*Math.sin(angle*3+y*.08);
   out[i]=Math.sin(angle+turn)*ring;out[i+1]=y-(item.canopy?1.15:.25);out[i+2]=Math.cos(angle+turn)*ring;
  }
  item.target=out;
  if(item.colors){
   const a=item.originalColors,out=new Float32Array(a.length);
   for(let i=0;i<a.length;i+=3){const goal=a[i]>a[i+1]*1.1?violet:pink;out[i]=a[i]+(goal.r-a[i])*.62;out[i+1]=a[i+1]+(goal.g-a[i+1])*.62;out[i+2]=a[i+2]+(goal.b-a[i+2])*.62;}
   item.targetColors=out;
  }
 }
 function restore(){
  for(const item of fabrics){
   item.pos.array.set(item.original);item.pos.needsUpdate=true;
   if(item.colors){item.colors.array.set(item.originalColors);item.colors.needsUpdate=true;}
   if(item.normal){item.normal.array.set(item.originalNormals);item.normal.needsUpdate=true;}
  }
  for(const item of palette)item.material.color.copy(item.base);
 }
 function reset(){
  if(lastStep!==0)restore();
  mix=0;phase=1;clock=0;lastStep=0;lastStepTime=-Infinity;bufferUpdates=0;ink.opacity=0;shadow.visible=false;shadow.rotation.z=0;
 }
 function update(game,dt=0){
  if(disposed)return;
  const target=game?.boss?.phase===2?1:0,h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  if(h===0)return {phase,transformed:lastStep/40};
  clock+=h;phase=target?2:1;
  mix+=(target-mix)*(1-Math.exp(-h*(reduced?4:1.9)));
  if(Math.abs(target-mix)<.001)mix=target;
  const step=Math.round(smooth(mix)*40),amount=step/40;
  if(step===lastStep)return {phase,transformed:amount};
  if(step!==0&&step!==40&&clock-lastStepTime<1/20)return {phase,transformed:lastStep/40};
  lastStepTime=clock;
  if(step===0){restore();shadow.visible=false;ink.opacity=0;}
  else{
   for(const item of fabrics){
    prepare(item);
    const arr=item.pos.array,base=item.original,dest=item.target;
    for(let i=0;i<arr.length;i++)arr[i]=base[i]+(dest[i]-base[i])*amount;
    item.pos.needsUpdate=true;
    if(item.colors){const arr=item.colors.array,base=item.originalColors,dest=item.targetColors;for(let i=0;i<arr.length;i++)arr[i]=base[i]+(dest[i]-base[i])*amount;item.colors.needsUpdate=true;}
    // Rebuild lighting normals only once at the settled endpoint.
    if(step===40&&!coarse&&item.normal)item.mesh.geometry.computeVertexNormals();
   }
   for(const {material,base}of palette)material.color.copy(base).lerp(violet,amount*.5);
   shadow.visible=amount>.05;ink.opacity=amount*.48;shadow.rotation.z=0;
  }
  lastStep=step;bufferUpdates++;
  return {phase,transformed:amount};
 }
 function dispose(){
  if(disposed)return;disposed=true;shadow.parent?.remove(shadow);eyeGeo.dispose();grin.geometry.dispose();ink.dispose();
  for(const item of palette)item.material.color.copy(item.base);
 }
 reset();
 return {update,reset,dispose,shadow,fabrics,stats:()=>({phase,morph:mix,panels:fabrics.length,collidable:false,bufferUpdates,continuousWarp:false})};
}
