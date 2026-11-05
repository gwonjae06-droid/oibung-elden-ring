import * as THREE from 'three';

// A render-only cutaway. Never change collision, shared material opacity, or
// whole instanced batches when a single column gets between camera and actor.
export function createCameraVisibility(scene,{roots=()=>[],targets=null,margin=.85}={}){
 const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),direction=new THREE.Vector3(),end=new THREE.Vector3();
 const hidden=new Map(),instances=new Map(),zero=new THREE.Matrix4().makeScale(0,0,0),matrix=new THREE.Matrix4();
 const previousBefore=scene.onBeforeRender,previousAfter=scene.onAfterRender;
 let disposed=false,warned=false,last={meshes:0,instances:0};
 function restore(){
  for(const[obj,visible]of hidden)obj.visible=visible;hidden.clear();
  for(const[obj,entries]of instances){for(const[id,value]of entries)obj.setMatrixAt(id,value);obj.instanceMatrix.needsUpdate=true;}instances.clear();
 }
 function prepare(camera,explicitTargets){
  restore();last={meshes:0,instances:0};if(disposed||!camera)return;
  try{
   const list=typeof roots==='function'?roots():roots,objects=[],materials=new Map();
   for(const root of list||[]){if(!root?.visible)continue;root.traverseVisible(obj=>{
    if(!obj.isMesh||obj.userData.cameraOcclusion===false)return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    if(!mats.some(m=>m&&m.visible!==false&&!(m.transparent&&m.opacity<.35)))return;
    objects.push(obj);for(const m of mats)if(m&&!materials.has(m))materials.set(m,m.side);
   });}
   if(!objects.length)return;
   scene.updateMatrixWorld(true);camera.updateWorldMatrix(true,false);camera.getWorldPosition(origin);right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
   let points=explicitTargets??(typeof targets==='function'?targets():targets);
   if(!points?.length){const actor=scene.getObjectByName('player');points=[];if(actor){const v=new THREE.Vector3();actor.getWorldPosition(v);v.y+=1.4;points.push(v);}camera.getWorldDirection(direction);points.push(origin.clone().addScaledVector(direction,18));}
   const meshes=new Set(),hitsByInstance=new Map();
   function cast(from,to){direction.copy(to).sub(from);const distance=direction.length();if(distance<.1)return;ray.near=0;ray.far=Math.max(0,distance-.25);ray.set(from,direction.normalize());for(const hit of ray.intersectObjects(objects,false)){
    if(hit.object.isInstancedMesh&&Number.isInteger(hit.instanceId)){let ids=hitsByInstance.get(hit.object);if(!ids){ids=new Set();hitsByInstance.set(hit.object,ids);}ids.add(hit.instanceId);}
    else meshes.add(hit.object);
   }}
   // Double-sided ray tests also find the exit surface when the camera starts
   // inside a wall. Restore every original material side before drawing.
   for(const m of materials.keys())m.side=THREE.DoubleSide;
   try{
    for(const p of points.slice(0,3)){if(!p||![p.x,p.y,p.z].every(Number.isFinite))continue;const focus=new THREE.Vector3(p.x,p.y,p.z);
     for(const[x,y]of [[0,0],[-margin,0],[margin,0],[0,-margin],[0,margin]]){end.copy(focus).addScaledVector(right,x).addScaledVector(up,y);cast(origin,end);}
     for(const[x,y]of [[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]]){end.copy(origin).addScaledVector(right,x).addScaledVector(up,y);cast(end,focus);}
    }
   }finally{for(const[m,side]of materials)m.side=side;}
   for(const obj of meshes){hidden.set(obj,obj.visible);obj.visible=false;}
   for(const[obj,ids]of hitsByInstance){const originals=new Map();for(const id of ids){obj.getMatrixAt(id,matrix);originals.set(id,matrix.clone());obj.setMatrixAt(id,zero);}instances.set(obj,originals);obj.instanceMatrix.needsUpdate=true;}
   last={meshes:hidden.size,instances:[...instances.values()].reduce((n,entries)=>n+entries.size,0)};
  }catch(error){restore();if(!warned){warned=true;console.warn('Camera visibility check failed',error);}}
 }
 function before(...args){previousBefore?.apply(this,args);prepare(args[2]);}
 function after(...args){restore();previousAfter?.apply(this,args);}
 scene.onBeforeRender=before;scene.onAfterRender=after;
 return {prepare,restore,get stats(){return {...last};},dispose(){if(disposed)return;disposed=true;restore();if(scene.onBeforeRender===before)scene.onBeforeRender=previousBefore;if(scene.onAfterRender===after)scene.onAfterRender=previousAfter;}};
}
