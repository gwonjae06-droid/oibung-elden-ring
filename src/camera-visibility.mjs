import * as THREE from 'three';

// A local, screen-door transparency corridor. Work is proportional to scenery
// materials, never to their triangles or instance count. Alpha hashing keeps
// opaque depth ordering without another transparent draw of the whole map.
export function createCameraVisibility(scene,{roots=()=>[],targets=null,margin=2.2}={}){
 const origin={value:new THREE.Vector3()},points={value:Array.from({length:3},()=>new THREE.Vector4())},count={value:0};
 const originals=new Map(),materials=new Map();
 const previousBefore=scene.onBeforeRender,previousAfter=scene.onAfterRender;
 let disposed=false,last={meshes:0,instances:0,materials:0,raycasts:0};
 const uniforms={cutawayOrigin:origin,cutawayTargets:points,cutawayCount:count};
 function patch(shader,source,renderer){
  source.onBeforeCompile.call(source,shader,renderer);
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec3 vCutawayWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
   vec4 cutawayPosition=vec4(transformed,1.0);
   #ifdef USE_BATCHING
    cutawayPosition=batchingMatrix*cutawayPosition;
   #endif
   #ifdef USE_INSTANCING
    cutawayPosition=instanceMatrix*cutawayPosition;
   #endif
   vCutawayWorld=(modelMatrix*cutawayPosition).xyz;
   #include <project_vertex>`);
  shader.fragmentShader=`varying vec3 vCutawayWorld;
   uniform vec3 cutawayOrigin;
   uniform vec4 cutawayTargets[3];
   uniform float cutawayCount;\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphahash_fragment>',`
   float cutawayVisibility=1.0;
   for(int i=0;i<3;i++){
    if(float(i)>=cutawayCount)break;
    vec3 axis=cutawayTargets[i].xyz-cutawayOrigin;
    float lengthSquared=dot(axis,axis);
    float along=dot(vCutawayWorld-cutawayOrigin,axis)/max(lengthSquared,0.001);
    if(along>=0.0&&along<1.0-0.25/max(sqrt(lengthSquared),0.25)&&vCutawayWorld.y>cutawayTargets[i].y-1.3){
     float distanceToSight=length(vCutawayWorld-cutawayOrigin-axis*along);
     float edge=smoothstep(cutawayTargets[i].w,cutawayTargets[i].w+0.5,distanceToSight);
     cutawayVisibility=min(cutawayVisibility,mix(0.035,1.0,edge));
    }
   }
   diffuseColor.a*=cutawayVisibility;
   #include <alphahash_fragment>`);
 }
 function faded(source){
  if(!source||!source.visible||source.transparent&&source.opacity<.35||source.isShaderMaterial)return source;
  let entry=materials.get(source);
  if(!entry){entry={material:source.clone(),version:-1};materials.set(source,entry);}
  const m=entry.material;
  if(entry.version!==source.version){
   m.copy(source);m.alphaHash=true;
   m.onBeforeCompile=(shader,renderer)=>patch(shader,source,renderer);
   m.customProgramCacheKey=()=>source.customProgramCacheKey()+'|camera-corridor-v1';
   m.needsUpdate=true;entry.version=source.version;
  }
  // Keep live phase colours and flickers driven through the original material.
  if(m.color)m.color.copy(source.color);if(m.emissive)m.emissive.copy(source.emissive);
  for(const k of ['opacity','emissiveIntensity','roughness','metalness','envMapIntensity'])if(k in source)m[k]=source[k];
  return m;
 }
 function restore(){for(const[obj,material]of originals)obj.material=material;originals.clear();}
 function prepare(camera,explicitTargets){
  restore();last={meshes:0,instances:0,materials:0,raycasts:0};if(disposed||!camera)return;
  camera.getWorldPosition(origin.value);
  let focus=explicitTargets??(typeof targets==='function'?targets():targets);
  if(!focus?.length){const actor=scene.getObjectByName('player'),p=new THREE.Vector3();focus=[];if(actor){actor.getWorldPosition(p);p.y+=1.4;focus.push(p);}else{camera.getWorldDirection(p);p.multiplyScalar(18).add(origin.value);focus.push(p);}}
  const valid=focus.filter(p=>p&&[p.x,p.y,p.z].every(Number.isFinite)).slice(0,3);
  count.value=valid.length;valid.forEach((p,i)=>points.value[i].set(p.x,p.y,p.z,p.radius??margin));
  const list=typeof roots==='function'?roots():roots,visited=new Set();
  for(const root of list||[]){if(!root?.visible)continue;root.traverseVisible(obj=>{
   if(!obj.isMesh||obj.userData.cameraOcclusion===false||visited.has(obj))return;visited.add(obj);
   const source=obj.material,next=Array.isArray(source)?source.map(faded):faded(source);
   originals.set(obj,source);obj.material=next;last.meshes++;if(obj.isInstancedMesh)last.instances+=obj.count;
  });}
  last.materials=materials.size;
 }
 function before(...args){previousBefore?.apply(this,args);prepare(args[2]);}
 function after(...args){restore();previousAfter?.apply(this,args);}
 scene.onBeforeRender=before;scene.onAfterRender=after;
 return {prepare,restore,get stats(){return {...last};},dispose(){if(disposed)return;disposed=true;restore();for(const {material}of materials.values())material.dispose();materials.clear();if(scene.onBeforeRender===before)scene.onBeforeRender=previousBefore;if(scene.onAfterRender===after)scene.onAfterRender=previousAfter;}};
}
