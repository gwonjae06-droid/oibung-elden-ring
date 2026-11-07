import * as THREE from 'three';
import {clownCuePalette} from './clown-danger-spotlight.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
// Actual stage-space geometry previews the SAME authored attack zone. No
// animation creates damage; no flash masks player movement or the floor.
export function clownTheatreCueKind(z){
 if(!z||z.state!=='warn'||!Number.isFinite(z.warn)||z.warn<=0)return null;
 const sound=String(z.sound||'');
 if(/choir|chorus/i.test(sound))return 'choir';
 if(/puppet|marionette/i.test(sound))return 'puppet';
 if(/falseRingmaster|wrongTwin|mirror/i.test(sound))return 'phantom';
 return null; // fire hoops are rendered by the existing hot metal hoop view
}
export function createClownTheatreCues(parent,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='nightmare-circus-performance-air-cues';
 parent.add(root);
 const cues=new Map();
 function create(z,kind){
  const group=new THREE.Group();group.name='performance-'+kind+'-synced-to-real-warning';root.add(group);
  const palette=clownCuePalette(z),color=new THREE.Color(palette.rim),
   material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,
    depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    toneMapped:false});
  const rings=[];
  if(kind==='choir'||kind==='phantom'){
   for(let i=0;i<(coarse?1:3);i++){
    const shape=new THREE.TorusGeometry(kind==='choir'?1.2:1.03,.034,5,coarse?18:36);
    const m=new THREE.Mesh(shape,material);
    m.name=kind==='choir'?'resonant-choir-air-ring':'false-ringmaster-halo';
    m.renderOrder=5;group.add(m);rings.push(m);
   }
  }else{
   // Suspended tension cords, visible exactly along the predicted puppet
   // lane. No cartoon arrows, floor text or unrelated fake hitboxes.
   const segments=coarse?3:6,positions=new Float32Array(segments*6),
    geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
   const strings=new THREE.LineSegments(geometry,material);
   strings.name='tensioned-strings-over-actual-puppet-lane';
   strings.frustumCulled=false;strings.renderOrder=5;group.add(strings);
   return {group,kind,material,rings,strings,positions};
  }
  return {group,kind,material,rings,strings:null};
 }
 function update(game,dt=0){
  const seen=new Set(),zones=game?.clown?.zones||[],
   h=clamp(dt,0,.05),time=game?.time||0;
  for(const z of zones){
   const kind=clownTheatreCueKind(z);
   if(!kind)continue;
   seen.add(z.id);
   let v=cues.get(z.id);if(!v){v=create(z,kind);cues.set(z.id,v);}
   const fraction=clamp(z.age/Math.max(.01,z.warn),0,1);
   const scale=Math.max(.35,Math.min(2,(z.shape==='circle'?z.r:Math.max(1.5,z.w))*.24));
   v.group.position.set(z.x,.015,z.z);
   v.group.rotation.y=z.yaw||0;
   v.material.opacity=(reduced?.15:.22)*(.6+.4*fraction);
   if(v.strings){
    const count=v.positions.length/6,travel=Math.max(1,Math.min(21,z.len||8));
    for(let i=0;i<count;i++){
     const u=(i+.6)/count,start=i*6;
     v.positions[start]=Math.sin(time*2+i)*.14;
     v.positions[start+1]=3.2+Math.sin(time*1.1+i*.8)*.28;
     v.positions[start+2]=0;
     v.positions[start+3]=(u-.5)*Math.max(1,z.w||2);
     v.positions[start+4]=.45+.20*fraction;
     v.positions[start+5]=travel*u;
    }
    v.strings.geometry.attributes.position.needsUpdate=true;
   }else for(let i=0;i<v.rings.length;i++){
    const m=v.rings[i];
    m.position.set(0,kind==='choir'?2.0:2.75,
      kind==='choir'?Math.max(.35,(z.len||4)*fraction*(i+1)/v.rings.length):0);
    m.rotation.z=Math.sin(time*.48+i)*.07;
    m.rotation.y=kind==='phantom'?time*.23:0;
    m.scale.setScalar(scale*(.67+i*.12)*(1+.14*fraction));
   }
  }
  for(const [id,v] of cues)if(!seen.has(id)){
   root.remove(v.group);disposeScene(v.group);cues.delete(id);
  }
 }
 function dispose(){
  for(const v of cues.values()){root.remove(v.group);disposeScene(v.group);}
  cues.clear();root.parent?.remove(root);disposeScene(root);
 }
 return {root,update,dispose,stats:()=>({active:cues.size})};
}
