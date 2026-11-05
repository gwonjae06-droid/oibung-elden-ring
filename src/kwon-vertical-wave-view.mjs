import * as THREE from 'three';
import {KWON_WAVE} from './kwon-wave-data.mjs';

// Each cast contains ONE projectile but two crossing blades in the same plane.
// + and X read differently, yet both have one collision width and one damage event.
export function createKwonVerticalWaveView(scene,{reduced=false}={}){
 const root=new THREE.Group();root.name='kwon-overhead-sword-waves';scene.add(root);
 const meshes=new Map(),materials=[],geometries=[];
 const mat=(color,opacity)=>{const m=new THREE.MeshBasicMaterial({
  color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending
 });materials.push(m);return m;};
 const glow=mat(0xb92542,reduced?.24:.42),ember=mat(0xff9d65,reduced?.39:.74),
   core=mat(0xfff5d4,reduced?.68:.96),ground=mat(0xffb966,.42);
 const outline=new THREE.Shape();
 outline.moveTo(0,.5);outline.lineTo(-.35,.36);outline.lineTo(-.5,-.18);
 outline.lineTo(0,-.5);outline.lineTo(.5,-.18);outline.lineTo(.35,.36);outline.closePath();
 const slashGeo=new THREE.ShapeGeometry(outline);geometries.push(slashGeo);
 const ringGeo=new THREE.RingGeometry(.7,1,36).rotateX(-Math.PI/2);geometries.push(ringGeo);
 function make(variant,withGround=true){
  const g=new THREE.Group();g.name='kwon-wave-'+variant;g.userData.variant=variant;
  // One vertical plus one horizontal, OR two crossing diagonal sword cuts.
  const angles=variant==='x'?[-Math.PI/4,Math.PI/4]:[0,Math.PI/2];
  for(const angle of angles){
   const length=variant==='x'?KWON_WAVE.width*Math.SQRT2:
     Math.abs(angle)<.01?KWON_WAVE.height:KWON_WAVE.width;
   for(const [m,width,depth] of [[glow,1.32,-.13],[ember,.68,0],[core,.18,.1]]){
    const blade=new THREE.Mesh(slashGeo,m);
    blade.scale.set(width,length,1);blade.rotation.z=angle;
    blade.position.set(0,KWON_WAVE.height*.5,depth);blade.frustumCulled=false;g.add(blade);
   }
  }
  if(withGround){
   const ring=new THREE.Mesh(ringGeo,ground);ring.position.y=.05;
   ring.scale.set(KWON_WAVE.radius,1,KWON_WAVE.radius*.55);g.add(ring);
  }
  root.add(g);return g;
 }
 // A faint preview near the raised sword tells players which shape is coming.
 const previews={plus:make('plus',false),x:make('x',false)};
 previews.plus.visible=previews.x.visible=false;
 const ease=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
 function update(shots,boss){
  const live=new Set();
  for(const q of shots||[]){
   if(q.kind!==KWON_WAVE.kind)continue;
   live.add(q.id);
   let group=meshes.get(q.id);
   if(!group){group=make(q.variant==='x'?'x':'plus');meshes.set(q.id,group);}
   const falling=ease((q.age||0)/.2);
   group.position.set(q.x,1.8*(1-falling),q.z);
   group.rotation.y=q.yaw;group.scale.set(1,.74+.26*falling,1);
   if(q.life<.17)group.scale.multiplyScalar(.5+.5*Math.max(0,q.life/.17));
  }
  for(const [id,m] of meshes)if(!live.has(id)){root.remove(m);meshes.delete(id);}
  previews.plus.visible=previews.x.visible=false;
  if(boss?.pattern==='wave'&&boss.state==='windup'&&boss.waveVariant){
   const v=previews[boss.waveVariant];
   if(v){
    const t=Math.min(1,boss.t/(boss.phase===2?1.12:1.05));
    v.visible=t>.16;v.position.set(boss.x+Math.sin(boss.yaw)*2.6,4.4,boss.z+Math.cos(boss.yaw)*2.6);
    v.rotation.y=boss.yaw;v.scale.setScalar((.1+.24*ease(t))*(reduced?.8:1));
   }
  }
 }
 function clear(){
  for(const m of meshes.values())root.remove(m);meshes.clear();
  previews.plus.visible=previews.x.visible=false;
 }
 function dispose(){
  clear();root.parent?.remove(root);
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
 }
 return {update,clear,dispose,root,get count(){return meshes.size;}};
}
