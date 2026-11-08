import * as THREE from 'three';

// A visible 2P -> 3P evolution bridge: shared blood threads, growing
// consecration rings and rising feather-light strands. This lives in the
// scene, not either model, so the old body never has to blink out.
const smooth=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);};
export function createBloodSeraphAscension(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='blood-seraph-2p-to-3p-evolution';
 scene.add(root);root.visible=false;
 const bright=new THREE.MeshBasicMaterial({color:0xffd6c3,transparent:true,
  opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
 const crimson=new THREE.MeshBasicMaterial({color:0xe83d67,transparent:true,
  opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
 const halos=[];
 for(let i=0;i<4;i++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9+i*.72,.075+i*.012,7,
   coarse?32:72),i%2?bright:crimson);
  ring.name='blood-seraph-transforming-sacred-ring-'+i;
  ring.rotation.x=Math.PI/2;root.add(ring);halos.push(ring);
 }
 const threads=[];
 for(let i=0;i<(coarse?8:14);i++){
  const a=i*2.3999632297,points=[];
  for(let j=0;j<=11;j++){
   const u=j/11,y=1+u*13.8,angle=a+u*4.7,
    radius=.55+Math.sin(Math.PI*u)*2.4;
   points.push(new THREE.Vector3(Math.sin(angle)*radius,y,Math.cos(angle)*radius));
  }
  const path=new THREE.CatmullRomCurve3(points);
  const line=new THREE.Mesh(new THREE.TubeGeometry(path,18,coarse ? .022 : .031,4,false),
   i%3?crimson:bright);
  line.name='blood-seraph-blood-to-feather-lifelines-'+i;
  root.add(line);threads.push(line);
 }
 const rayGeo=new THREE.ConeGeometry(.10,1,5),count=coarse?12:20;
 const rays=new THREE.InstancedMesh(rayGeo,bright,count);
 rays.name='blood-seraph-ascending-consecration-spires';rays.frustumCulled=false;
 root.add(rays);const dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count;
  dummy.position.set(Math.sin(a)*3.2,3.8+(i%4)*1.8,Math.cos(a)*3.2);
  dummy.rotation.set(0,a,0);
  dummy.scale.set(.45,.55+(i%4)*.35,.45);
  dummy.updateMatrix();rays.setMatrixAt(i,dummy.matrix);
 }
 rays.instanceMatrix.needsUpdate=true;
 let intensity=0;
 function update(g,c){
  const active=g.boss.phase===3&&g.boss.state==='transition'&&g.status==='playing';
  root.visible=active;
  if(!active){intensity=0;return;}
  root.position.set(g.boss.x,0,g.boss.z);
  const rise=smooth((c.t-.85)/4.85),fade=1-smooth((c.t-5.62)/.63);
  intensity=(.16+.84*rise)*fade;
  bright.opacity=.63*intensity;crimson.opacity=.48*intensity;
  halos.forEach((r,i)=>{
   r.position.y=1.8+i*2.55+rise*.6;
   r.scale.setScalar(.4+rise*(1.2+i*.22));
   r.rotation.z=(reduced?0:g.time*.33*(i%2?-1:1))+i*.4;
  });
  for(const t of threads){t.scale.y=.12+rise*.88;t.visible=rise>.04;}
  rays.visible=rise>.3;
 }
 function clear(){root.visible=false;intensity=0;}
 function dispose(){
  clear();scene.remove(root);
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);
   if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 }
 return {root,update,clear,dispose,stats:()=>({
  visible:root.visible,intensity,halos:halos.length,threads:threads.length})};
}
