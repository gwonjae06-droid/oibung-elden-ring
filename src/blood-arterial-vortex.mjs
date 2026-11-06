import * as THREE from 'three';

// Torso-local, closed helical blood vessels. A few wet volumetric strands
// follow Baeseojun's existing casting/body rig; NOT a projectile or a hit zone.
const sat=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
const ease=n=>{const t=sat(n);return t*t*(3-2*t);};
export function bloodArterialPoint(progress,offset=0,{r=1.5,wind=2.1}={}){
 const t=sat(progress),a=t*Math.PI*2*wind+offset,
  radius=r*(.78+.2*Math.sin(t*Math.PI))+.13*Math.sin(t*Math.PI*4+offset);
 return [Math.cos(a)*radius,.55+3.55*t,Math.sin(a)*radius];
}
export function bloodArterialGeometry({segments=32,sides=8,offset=0,radius=1.5}={}){
 const n=Math.max(12,Math.min(72,segments|0)),k=Math.max(5,Math.min(12,sides|0));
 const positions=[],normals=[],uv=[],indices=[];
 for(let i=0;i<=n;i++){
  const u=i/n,[cx,cy,cz]=bloodArterialPoint(u,offset,{r:radius}),
    angle=u*Math.PI*4.2+offset,thick=.035+.19*Math.pow(Math.sin(Math.PI*u),.75);
  for(let j=0;j<=k;j++){
   const v=j/k*Math.PI*2,ny=Math.sin(v),nr=Math.cos(v);
   const nx=nr*Math.cos(angle),nz=nr*Math.sin(angle);
   positions.push(cx+thick*nx,cy+thick*ny,cz+thick*nz);
   normals.push(nx,ny,nz);uv.push(u,j/k);
  }
 }
 for(let i=0;i<n;i++)for(let j=0;j<k;j++){
  const a=i*(k+1)+j,b=a+k+1;
  indices.push(a,b,a+1,a+1,b,b+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeBoundingSphere();return geo;
}
export function createBloodArterialVortex(torso,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='blood-arterial-anatomical-vortex';root.userData.decorativeOnly=true;torso.add(root);
 const material=new THREE.MeshPhysicalMaterial({color:0x671023,metalness:.08,roughness:.21,
  clearcoat:.83,clearcoatRoughness:.16,emissive:0x2a030b,emissiveIntensity:.18});
 const count=coarse?2:5,meshes=[],geometries=[];
 for(let i=0;i<count;i++){
  const offset=i*Math.PI*2/count,geo=bloodArterialGeometry({segments:coarse?20:42,sides:coarse?6:9,offset,radius:1.32+i*.07});
  const strand=new THREE.Mesh(geo,material);
  strand.name='blood-spiralling-3d-vessel';strand.castShadow=false;strand.receiveShadow=false;
  strand.rotation.y=offset*.16;root.add(strand);meshes.push(strand);geometries.push(geo);
 }
 let owner=null,lastTime=-Infinity,opacity=0,disposed=false;
 function reset(){opacity=0;root.visible=false;root.rotation.set(0,0,0);}
 function update(g,dt=0,motion={},transformation={}){
  if(disposed||!g)return;
  const time=Number.isFinite(g.time)?g.time:0;
  if(owner!==g||time<lastTime-.05){owner=g;reset();}
  lastTime=time;
  const b=g.boss||{},s=g.blood||{},casting=b.state==='pattern'||b.state==='windup',
   phase2=b.phase===2,active=transformation.active||Boolean(s.siphon?.active);
  const spell=casting?Math.max(sat(motion.anticipation),sat(motion.release),sat(motion.impact),.22):0;
  const goal=g.status==='won'?0:phase2?.58+.28*spell+(active?.12:0):active?.65:.16*spell;
  const h=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
  opacity+=(goal-opacity)*(1-Math.exp(-h*(active?6:4)));
  if(Math.abs(opacity-goal)<.001)opacity=goal;
  root.visible=opacity>.012;
  if(!root.visible)return;
  root.rotation.y=reduced?.02:time*(phase2?.3:.12);
  const opening=ease(opacity/.68);
  root.scale.set(1+opening*.12,.92+opening*.1,1+opening*.12);
  for(let i=0;i<count;i++){
   const m=meshes[i];
   m.rotation.y=(reduced?0:Math.sin(time*(.6+i*.07)+i)*.09)*opening;
   const pulse=reduced?0:Math.sin(time*3.6+i*1.7)*.045*opening;
   m.scale.set(1+pulse,1,.98+pulse);
  }
  material.emissiveIntensity=.12+.21*opening;
 }
 function dispose(){
  if(disposed)return;disposed=true;root.parent?.remove(root);
  for(const geo of geometries)geo.dispose();material.dispose();
 }
 reset();
 return {root,update,reset,dispose,stats:()=>({strands:count,active:root.visible,
  collidable:false,decorativeOnly:true,geometryCount:geometries.length})};
}
