import * as THREE from 'three';
import {clownCuePalette} from './clown-danger-spotlight.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:0));
// A one-to-one contract with real simulation warnings. Nothing here is a
// damaging projectile, and nothing teleports the actual combat hitbox.
export function clownTheatreCueKind(z){
 if(!z||z.state!=='warn'||!Number.isFinite(z.warn)||z.warn<=0)return null;
 const s=String(z.sound||'');
 if(/directorBaton|directorVerdict|directorCurtainBlade/i.test(s))return 'director-blade';
 if(/directorStrings/i.test(s))return 'puppet';
 if(/directorCackle/i.test(s))return 'choir';
 if(/directorFireRing/i.test(s))return 'director-hoop';
 if(/directorFinalStomp/i.test(s))return 'director-impact';
 if(/knifeJuggler/i.test(s))return 'knife';
 if(/drumLine/i.test(s))return 'drum';
 if(/trapezeWire/i.test(s))return 'trapeze';
 if(/trapdoorRevue/i.test(s))return 'trapdoor';
 if(/maskedCannon/i.test(s))return 'cannon';
 if(/curtainEcho/i.test(s))return 'curtain';
 if(/choir|chorus|requiemChoir|spotlightChoir/i.test(s))return 'choir';
 if(/puppet|marionette|requiemStrings|corpseReprise/i.test(s))return 'puppet';
 if(/falseRingmaster|wrongTwin|mirror|unisonSmile/i.test(s))return 'phantom';
 return null; // infernalHoops already renders sculptural, instanced fire
}
const ropeKind=new Set(['puppet','trapeze','curtain']);
const ringKind=new Set(['choir','phantom','drum','trapdoor','director-hoop','director-impact']);
const ringLabel=Object.freeze({
 choir:'resonant-choir-air-ring',phantom:'false-ringmaster-halo',
 drum:'bass-drum-concussive-wave',trapdoor:'opening-theatre-trapdoor-rim',
 'director-hoop':'director-owned-burning-iron-ring','director-impact':'ringmasters-physical-palm-impact'
});
export function createClownTheatreCues(parent,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='nightmare-circus-performance-air-cues';parent.add(root);
 const cues=new Map();
 function create(z,kind){
  const group=new THREE.Group();group.name='performance-'+kind+'-synced-to-real-warning';root.add(group);
  const tone=new THREE.Color(clownCuePalette(z).rim),mat=new THREE.MeshBasicMaterial({
   color:tone,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,
   blending:THREE.AdditiveBlending,toneMapped:false});
  const rings=[],props=[];
  let strings=null,positions=null;
  if(ringKind.has(kind)){
   const qty=kind==='trapdoor'?1:coarse?1:3;
   for(let i=0;i<qty;i++){
    const r=kind==='trapdoor'?1.03:kind==='drum'?1.2:kind==='choir'?1.2:1.03;
    const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,.035,5,coarse?18:36),mat);
    mesh.name=ringLabel[kind];mesh.renderOrder=5;group.add(mesh);rings.push(mesh);
   }
   if(kind==='trapdoor'){
    const floor=new THREE.Mesh(new THREE.CircleGeometry(1,coarse?16:36),
      new THREE.MeshBasicMaterial({color:0x100c17,transparent:true,opacity:.42,depthWrite:false,
       side:THREE.DoubleSide}));
    floor.name='recessed-theatre-trapdoor-floor';floor.rotation.x=-Math.PI/2;floor.renderOrder=4;
    group.add(floor);props.push(floor);
   }
  }else if(ropeKind.has(kind)){
   const segments=kind==='curtain'?(coarse?4:8):(coarse?3:6),
    data=new Float32Array(segments*6),geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.BufferAttribute(data,3));
   strings=new THREE.LineSegments(geo,mat);
   strings.name=kind==='puppet'?'tensioned-strings-over-actual-puppet-lane':
    kind==='trapeze'?'high-wire-aerial-acrobat-lines':'heavy-circus-velvet-silhouette-strings';
   strings.frustumCulled=false;strings.renderOrder=5;group.add(strings);positions=data;
  }else if(kind==='director-blade'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(.09,.12,1),
     new THREE.MeshStandardMaterial({color:0xd5c8bb,roughness:.38,metalness:.76,
      emissive:0x42323b,emissiveIntensity:.48,transparent:true,opacity:.62,depthWrite:false}));
    body.name='director-baton-slashing-over-real-lane';group.add(body);props.push(body);
   }else if(kind==='knife'){
   const steel=new THREE.MeshStandardMaterial({color:0xbac8ce,metalness:.75,
    roughness:.26,emissive:0x182b35,emissiveIntensity:.55});
   for(let i=0;i<(coarse?2:4);i++){
    const blade=new THREE.Mesh(new THREE.ConeGeometry(.11,.57,coarse?5:8),steel);
    blade.name='rotating-circus-juggler-knife';blade.rotation.z=Math.PI/2;
    blade.renderOrder=4;group.add(blade);props.push(blade);
   }
  }else if(kind==='cannon'){
   const lead=new THREE.Mesh(new THREE.SphereGeometry(.36,coarse?9:15,coarse?7:11),
    new THREE.MeshStandardMaterial({color:0x634d5e,metalness:.67,roughness:.32,
     emissive:0x643149,emissiveIntensity:.48}));
   lead.name='masked-cannonball-descends-on-warning';lead.renderOrder=4;group.add(lead);props.push(lead);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(.85,.09,6,coarse?20:42),mat);
   rim.name='masked-cannon-muzzle-ring';rim.renderOrder=5;group.add(rim);rings.push(rim);
  }
  return {group,kind,material:mat,rings,strings,positions,props};
 }
 function update(game,dt=0){
  const seen=new Set(),zones=game?.clown?.zones||[],time=game?.time||0;
  for(const z of zones){
   const kind=clownTheatreCueKind(z);if(!kind)continue;
   seen.add(z.id);
   let v=cues.get(z.id);if(!v){v=create(z,kind);cues.set(z.id,v);}
   const fraction=clamp(z.age/Math.max(.01,z.warn)),
    radius=z.shape==='circle'?z.r:Math.max(1.5,z.w),
    scale=clamp(radius*.24,.35,2.5);
   v.group.position.set(z.x,.018,z.z);v.group.rotation.y=z.yaw||0;
   v.material.opacity=(reduced?.15:.23)*(.6+.4*fraction);
   if(v.strings){
    const count=v.positions.length/6,travel=clamp(z.len||8,1,22);
    for(let i=0;i<count;i++){
     const u=(i+.6)/count,j=i*6;
     const width=(u-.5)*Math.max(1,z.w||2);
     const top=v.kind==='trapeze'?7.0:v.kind==='curtain'?5.5:3.2;
     v.positions[j]=width*.8+Math.sin(time*1.4+i)*.05;
     v.positions[j+1]=top+Math.sin(time+i)*.16;
     v.positions[j+2]=travel*u;
     v.positions[j+3]=width*.92;
     v.positions[j+4]=v.kind==='trapeze'?2.5+1.1*fraction:.42+.15*fraction;
     v.positions[j+5]=travel*u;
    }
    v.strings.geometry.attributes.position.needsUpdate=true;
   }
   for(let i=0;i<v.rings.length;i++){
    const mesh=v.rings[i];
    if(kind==='trapdoor'){
     mesh.position.set(0,.06,0);mesh.rotation.set(Math.PI/2,0,0);
     mesh.scale.setScalar(Math.max(.4,z.r||2)*.89*(.55+.45*fraction));
    }else if(kind==='director-hoop'||kind==='director-impact'){
      mesh.position.set(0,kind==='director-hoop'?2.12:.22,0);
      mesh.rotation.set(kind==='director-hoop'?0:Math.PI/2,0,Math.sin(time*.9)*.12);
      mesh.scale.setScalar(Math.max(1,z.r||2)*(.72+.24*fraction));
    }else if(kind==='cannon'){
     mesh.position.set(0,1.1+3.2*(1-fraction),0);
     mesh.scale.setScalar(.6+fraction*.9);
    }else{
     mesh.position.set(0,kind==='choir'||kind==='drum'?2.0:2.75,
       kind==='choir'||kind==='drum'?Math.max(.35,(z.len||4)*fraction*(i+1)/v.rings.length):0);
     mesh.rotation.z=Math.sin(time*.48+i)*.07;
     mesh.rotation.y=kind==='phantom'?time*.23:0;
     mesh.scale.setScalar(scale*(.67+i*.12)*(1+.14*fraction));
    }
   }
   if(kind==='director-blade'&&v.props[0]){
    const blade=v.props[0],len=clamp(z.len||8,3,23);
    blade.position.set(0,1.04+Math.sin(fraction*Math.PI)*.16,len*.5);
    blade.scale.set(1,1,len);
    blade.material.opacity=(reduced?.29:.56)*(.45+.55*fraction);
   }
   if(kind==='knife')for(let i=0;i<v.props.length;i++){
    const blade=v.props[i],lag=i/v.props.length*.18,travel=clamp((fraction-lag)/(1-lag));
    blade.position.set((i-(v.props.length-1)/2)*.4,2.5+Math.sin(travel*Math.PI*2+i)*.2,
      travel*clamp(z.len||10,2,20));
    blade.rotation.z=time*7+i*1.2;
    blade.rotation.x=Math.sin(time*5+i)*.22;
   }
   if(kind==='trapdoor'&&v.props[0]){
    v.props[0].scale.setScalar(Math.max(.3,z.r||2)*(.55+.45*fraction));
    v.props[0].material.opacity=(reduced?.20:.37)*fraction;
   }
   if(kind==='cannon'&&v.props[0]){
    const ball=v.props[0];ball.position.set(0,.9+4.5*(1-fraction),0);
    ball.scale.setScalar(.7+.5*fraction);
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
