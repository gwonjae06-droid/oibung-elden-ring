import * as THREE from 'three';
import {KWON_WAVE} from './kwon-wave-data.mjs';

// A single six-metre-high vertical slash: the bright falling blade, its red
// afterimage, and the floor impact all share the projectile's actual X/Z path.
export function createKwonVerticalWaveView(scene,{reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-overhead-sword-waves';scene.add(root);
 const meshes=new Map(),geometries=[],materials=[];
 const mat=(color,opacity)=>{const m=new THREE.MeshBasicMaterial({
  color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending
 });materials.push(m);return m;};
 const crimson=mat(0xe14257,reduced?.35:.4),ember=mat(0xffad67,reduced?.54:.68),
       white=mat(0xfff0d7,reduced?.78:.95),groundMat=mat(0xffb966,.55);
 function ribbon(width){
  const pos=[],idx=[],segments=24;
  for(let i=0;i<=segments;i++){
   const t=i/segments,y=.16+KWON_WAVE.height*(1-t);
   // Curve from high-left to low-right, like a sword falling in a single stroke.
   const center=-.64+1.28*t+.2*Math.sin(Math.PI*t);
   const half=width*(.1+.9*Math.pow(Math.sin(Math.PI*t),.65))*.5;
   pos.push(center-half,y,0,center+half,y,0);
   if(i<segments){const j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  geometries.push(g);return g;
 }
 const outer=ribbon(KWON_WAVE.width),mid=ribbon(KWON_WAVE.width*.62),core=ribbon(.5);
 const ringGeo=new THREE.RingGeometry(.62,1,32).rotateX(-Math.PI/2);geometries.push(ringGeo);
 const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
 function make(){
  const g=new THREE.Group();
  for(const [geo,material,z,ry] of [[outer,crimson,-.18,0],[outer,crimson,.12,.28],
      [mid,ember,.02,0],[core,white,.05,0]]){
   const m=new THREE.Mesh(geo,material);m.position.z=z;m.rotation.y=ry;m.frustumCulled=false;g.add(m);
  }
  const ring=new THREE.Mesh(ringGeo,groundMat);ring.position.y=.06;ring.scale.set(KWON_WAVE.radius,1,KWON_WAVE.radius*.55);g.add(ring);
  root.add(g);return g;
 }
 function update(shots){
  const live=new Set();
  for(const q of shots||[]){
   if(q.kind!==KWON_WAVE.kind)continue;
   live.add(q.id);
   let group=meshes.get(q.id);
   if(!group){group=make();meshes.set(q.id,group);}
   const fall=ease((q.age||0)/.19);
   group.position.set(q.x,1.8*(1-fall),q.z);
   group.rotation.y=q.yaw;
   // Entire cut falls onto the ground during the first travel frames.
   group.scale.setScalar(1);
   group.scale.y=.68+.32*fall;
   // End of flight retracts rather than abruptly popping out.
   if(q.life<.17)group.scale.multiplyScalar(.5+.5*Math.max(0,q.life/.17));
  }
  for(const [id,m] of meshes)if(!live.has(id)){root.remove(m);meshes.delete(id);}
 }
 function clear(){for(const m of meshes.values())root.remove(m);meshes.clear();}
 function dispose(){clear();root.parent?.remove(root);for(const geo of geometries)geo.dispose();for(const m of materials)m.dispose();}
 return {update,clear,dispose,get count(){return meshes.size;}};
}
