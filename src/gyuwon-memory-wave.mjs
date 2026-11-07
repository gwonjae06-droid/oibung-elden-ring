import * as THREE from 'three';

// Geometry and GPU material remain alive across every remembered tsunami.
// The real safe corridor is 3.2 world units to either side of the moving gap;
// it is a visible tunnel in the water, not an on-floor warning ring.
export const MEMORY_WAVE_HALF_OPENING=3.2;
export function createGyuwonMemoryWave({coarse=false}={}){
 const group=new THREE.Group();group.name='gyuwon-pooled-memory-tsunami';
 const nx=120,ny=35,vertices=[],indices=[],half=MEMORY_WAVE_HALF_OPENING;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const y=j/ny*95,x=(i/nx-.5)*360;
  vertices.push(x,y,Math.sin(j/ny*Math.PI)*14-j/ny*j/ny*30+
   Math.sin(x*.045+j*.22)*1.45);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const x=((i+.5)/nx-.5)*360,y=(j+.5)/ny*95;
  if(Math.abs(x)<half&&y<6)continue;
  const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);
 }
 const n=vertices.length/3,front=indices.slice(),edges=new Map();
 for(let i=0;i<front.length;i+=3)for(const [a,b] of [[front[i],front[i+1]],
  [front[i+1],front[i+2]],[front[i+2],front[i]]]){
  const key=Math.min(a,b)+':'+Math.max(a,b),record=edges.get(key);
  if(record)record.count++;else edges.set(key,{a,b,count:1});
 }
 for(let i=0;i<n;i++)vertices.push(vertices[i*3],vertices[i*3+1],vertices[i*3+2]-10);
 for(let i=0;i<front.length;i+=3)indices.push(front[i+2]+n,front[i+1]+n,front[i]+n);
 for(const {a,b,count}of edges.values())if(count===1)indices.push(a,b,a+n,b,b+n,a+n);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const waterMaterial=new THREE.MeshPhysicalMaterial({
  color:0x7f1728,metalness:.06,roughness:.27,clearcoat:.8,
  clearcoatRoughness:.18,side:THREE.DoubleSide,transparent:true,
  opacity:.87,depthWrite:true
 });
 let shader=null;
 waterMaterial.onBeforeCompile=program=>{
  shader=program;program.uniforms.memorySwell={value:0};
  program.vertexShader='uniform float memorySwell;\n'+program.vertexShader;
  program.vertexShader=program.vertexShader.replace('#include <begin_vertex>',
   '#include <begin_vertex>\n transformed.z+=sin(position.x*.052+position.y*.064+memorySwell)*1.18*min(1.0,position.y/14.0);');
 };
 waterMaterial.customProgramCacheKey=()=> 'gyuwon-memory-wave-swell-v1';
 const water=new THREE.Mesh(geometry,waterMaterial);
 water.name='gyuwon-gold-wave-surface';group.add(water);
 // Foam belongs on the actual crest and the two open tunnel edges, making
 // the route visible without a fabricated floating circle.
 const foamMaterial=new THREE.MeshStandardMaterial({color:0xf0bab8,
  emissive:0x4d1e24,emissiveIntensity:.24,metalness:0,roughness:.8,
  transparent:true,opacity:.74,depthWrite:false});
 const foamGeometries=[];
 const tube=(points,r)=>{const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),coarse?24:48,r,5,false);
  foamGeometries.push(geo);const mesh=new THREE.Mesh(geo,foamMaterial);group.add(mesh);return mesh;};
 const crest=[];
 for(let i=0;i<=60;i++){
  const x=(i/60-.5)*360;
  crest.push(new THREE.Vector3(x,88.5+Math.sin(x*.031)*2.3,
    Math.sin(88.5/95*Math.PI)*14-26.5+Math.sin(x*.045+7.2)*1.45+1.8));
 }
 tube(crest,.65);
 for(const side of [-1,1]){
  const edge=[];for(let j=0;j<=10;j++){
   const y=.4+j*.55;
   edge.push(new THREE.Vector3(side*(half+1.05),y,Math.sin(y/95*Math.PI)*14+
    Math.sin(side*half*.045+y*.12)*1.45+1.6));
  }
  tube(edge,.22);
 }
 group.visible=false;let disposed=false;
 function update(h,time=0){
  group.visible=true;
  // Shifting the complete prebuilt water mesh keeps the cutout exactly at
  // the current simulation opening, without rebuilding vertex buffers.
  group.position.x=h.gap||0;
  if(shader)shader.uniforms.memorySwell.value=time*.95;
 }
 function dispose(){
  if(disposed)return;disposed=true;group.removeFromParent();
  for(const geo of [geometry,...foamGeometries])geo.dispose();
  waterMaterial.dispose();foamMaterial.dispose();
 }
 return {group,update,dispose,geometry,
  stats:()=>({vertices:geometry.getAttribute('position').count,
   indices:geometry.index.count,openHalfWidth:half})};
}
