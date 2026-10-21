export function createCircusOcclusion(scene,root,THREE){
 const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),direction=new THREE.Vector3(),focus=new THREE.Vector3(),playerTarget=new THREE.Vector3(),hidden=new Set(),previous=scene.onBeforeRender;let disposed=false,warned=false;
 function restore(){for(const o of hidden)o.visible=true;hidden.clear();}
 function before(renderer,renderScene,camera,...args){
  previous?.call(this,renderer,renderScene,camera,...args);restore();if(disposed||!root.visible||!camera)return;
  camera.getWorldPosition(origin);if(Math.hypot(origin.x,origin.z)<24.5&&origin.y<14)return;
  const objects=[];root.traverse(o=>{if(o.isMesh&&o.visible)objects.push(o);});if(!objects.length)return;
  const materials=new Map();for(const o of objects)for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m&&!materials.has(m)){materials.set(m,m.side);m.side=THREE.DoubleSide;}
  try{
   const targets=[],player=scene.getObjectByName('player');if(player){player.getWorldPosition(playerTarget);playerTarget.y+=1.4;targets.push(playerTarget);}
   camera.getWorldDirection(direction);focus.copy(origin).addScaledVector(direction,18);targets.push(focus);
   for(const target of targets){direction.copy(target).sub(origin);const distance=direction.length();if(distance<.1)continue;ray.near=0;ray.far=distance-.05;ray.set(origin,direction.normalize());for(const hit of ray.intersectObjects(objects,false))if(hit.distance>=0&&hit.distance<=ray.far)hidden.add(hit.object);}
  }catch(error){hidden.clear();if(!warned){warned=true;console.warn('Circus occlusion check failed',error);}}
  finally{for(const [m,side]of materials)m.side=side;}
  for(const o of hidden)o.visible=false;
 }
 scene.onBeforeRender=before;
 return {restore,dispose(){if(disposed)return;disposed=true;restore();if(scene.onBeforeRender===before)scene.onBeforeRender=previous;}};
}
