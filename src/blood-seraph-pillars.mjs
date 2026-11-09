import * as THREE from 'three';
// One instanced draw call for every visible blood spire. Each column is
// centred on the exact radius/clock of an authoritative circular hazard.
// The floor shader shows the continuous annulus between adjacent pillars.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};
export const SERAPH_COLUMNS_PER_RING=24;
export const SERAPH_COLUMN_RANKS=4;

export function createBloodSeraphPillars(scene,{coarse=false,reduced=false}={}){
 const geometry=new THREE.CylinderGeometry(.74,1,1,coarse?7:11,1);
 const material=new THREE.MeshStandardMaterial({
  color:0x7f0a2a,emissive:0x941d3b,emissiveIntensity:.48,
  metalness:.28,roughness:.28,flatShading:false});
 const mesh=new THREE.InstancedMesh(geometry,material,SERAPH_COLUMN_RANKS*SERAPH_COLUMNS_PER_RING);
 mesh.name='blood-seraph-concentric-3d-blood-pillars';
 mesh.frustumCulled=false;mesh.visible=false;mesh.count=0;
 scene.add(mesh);
 const dummy=new THREE.Object3D();
 function update(g){
  let count=0;
  const active=g?.status==='playing'&&g.boss?.phase===3&&
   g.boss.state==='pattern'&&g.blood?.pattern==='seraphInwardPillars';
  if(active)for(const h of g.blood.hazards){
   if(h.seraphCue!=='blood-pillar-ring'||h.age<h.warn-1.0||
     h.age>=h.warn+h.life)continue;
   const firing=h.age>=h.warn;
   const charge=ease((h.age-(h.warn-1.0)));
   const live=Math.max(0,h.age-h.warn);
   const height=firing?6+8*ease(live/.2):.25+1.65*charge;
   const n=SERAPH_COLUMNS_PER_RING;
   for(let i=0;i<n;i++){
    const a=i*Math.PI*2/n+(h.rank%2)*(Math.PI/n);
    dummy.position.set(h.x+Math.sin(a)*h.r,height*.5,h.z+Math.cos(a)*h.r);
    dummy.rotation.set(0,a+(reduced?0:Math.sin((g.time||0)*1.4+a)*.025),0);
    dummy.scale.set(h.width*.92,height,h.width*.92);
    dummy.updateMatrix();mesh.setMatrixAt(count++,dummy.matrix);
   }
  }
  mesh.count=count;mesh.visible=count>0;
  if(count)mesh.instanceMatrix.needsUpdate=true;
 }
 function clear(){mesh.visible=false;mesh.count=0;}
 function dispose(){clear();scene.remove(mesh);geometry.dispose();material.dispose();}
 return {update,clear,dispose,mesh,
  stats:()=>({visible:mesh.visible,columns:mesh.count,oneInstancedDrawCall:true})};
}
