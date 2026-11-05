export function collectSceneResources(scene,extras=[]) {
  const resources=new Set(extras),visited=new Set();
  function textures(value){
    if(!value||typeof value!=='object'||visited.has(value))return;
    visited.add(value);
    if(value.isTexture){resources.add(value);return;}
    if(Array.isArray(value))for(const child of value)textures(child);
    else if(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null)for(const child of Object.values(value))textures(child);
  }
  scene.traverse(node=>{
    if(node.geometry)resources.add(node.geometry);
    // GPU skinning may allocate a bone texture; retire it with the scene.
    if(node.isSkinnedMesh&&node.skeleton)resources.add(node.skeleton);
    for(const material of node.material?Array.isArray(node.material)?node.material:[node.material]:[]){resources.add(material);for(const value of Object.values(material))textures(value);}
    if(node.shadow?.map)resources.add(node.shadow.map);
    if(node.shadow?.mapPass)resources.add(node.shadow.mapPass);
  });
  textures(scene.background);textures(scene.environment);
  return resources;
}
export function disposeScene(scene,{extras=[]}={}) {
  const errors=[];
  for(const resource of collectSceneResources(scene,extras))try{resource?.dispose?.();}catch(error){errors.push(error);}
  return {errors};
}
