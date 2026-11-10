import * as T from 'three';
// Film scenery is static. Collapse it per material while leaving doors, cloud,
// cast and practical lights independent. No per-frame geometry construction.
export function batchLifeSet(root,{includeTransparent=false}={}){
 root.updateMatrixWorld(true);
 const inverse=new T.Matrix4().copy(root.matrixWorld).invert(),local=new T.Matrix4(),buckets=new Map(),owned=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.material?.transparent&&!includeTransparent||Array.isArray(o.material)||o.userData.animated)return;
  if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(o);
 });
 for(const [material,meshes]of buckets){
  if(meshes.length<3)continue;
  const all={position:[],normal:[],uv:[]};
  for(const o of meshes){
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();local.multiplyMatrices(inverse,o.matrixWorld);g.applyMatrix4(local);
   for(const key of Object.keys(all)){
    const attr=g.attributes[key],size=key==='uv'?2:3;
    if(attr){for(const v of attr.array)all[key].push(v);}else for(let i=0;i<g.attributes.position.count*size;i++)all[key].push(0);
   }
   g.dispose();o.removeFromParent();
  }
  const geometry=new T.BufferGeometry();
  for(const [key,values]of Object.entries(all))geometry.setAttribute(key,new T.Float32BufferAttribute(values,key==='uv'?2:3));
  geometry.computeBoundingSphere();owned.push(geometry);
  const mesh=new T.Mesh(geometry,material);mesh.name='gyuwon-life-batched-scenery';mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 }
 return {dispose(){for(const g of owned)g.dispose();},batches:owned.length};
}
