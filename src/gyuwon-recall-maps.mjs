import * as THREE from 'three';
import {buildEnvironment} from './environment.mjs';
import {buildCircus} from './circus-environment.mjs';
import {buildDiceBoard} from './dice-actor.mjs';
import {createWhiteCathedral} from './blood-white-cathedral.mjs';
import {disposeScene} from './runtime/scene-resources.mjs';

export const RECALL_MAP_NAMES=Object.freeze({
 sword:'ruined-courtyard',circus:'clown-circus',
 gamble:'roulette-table-arena',tsunami:'blood-white-cathedral'
});
// Use real boss scenery, but prepare it once, upload GPU assets once, and
// switch just the active root. Never traverse and swap every scenery material
// on each render: that previously produced hundreds of shader variants during
// phase-three map changes and could visibly hitch.
export function createGyuwonRecallMaps(scene,{coarse=false,reduced=false}={}){
 const root=new THREE.Group();root.name='gyuwon-real-boss-maps';scene.add(root);
 const maps=new Map();let active=null,disposed=false,focus=null,switches=0,
   warmed=false,compiled=0,uploaded=0,preRendered=0,warmAudit={mode:null,totalMs:0,maxChunkMs:0,chunks:0};
 const gold=new THREE.Color(0xf1cb78);
 function prepare(id){
  if(maps.has(id))return maps.get(id);
  const isolated=new THREE.Scene();
  isolated.background=new THREE.Color(0xffffff);
  isolated.fog=new THREE.Fog(0xffffff,100,650);
  const group=new THREE.Group();group.name='recalled-map-'+id;
  root.add(group);let control=null;
  try{
   if(id==='sword'){
    const ground=new THREE.Mesh(new THREE.CircleGeometry(28,80).rotateX(-Math.PI/2),
      new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}));
    ground.name='kwon-recalled-paving';ground.position.y=-.04;
    isolated.add(ground);control=buildEnvironment(isolated,ground);
   }
   if(id==='circus')control=buildCircus(isolated,{mobile:coarse,reduced});
   if(id==='gamble'){control=buildDiceBoard(isolated);control.root.scale.setScalar(.3);}
   if(id==='tsunami')control=createWhiteCathedral(isolated,{coarse,reduced,radius:28});
   for(const child of [...isolated.children])group.add(child);
   const ghostMaterials=new Set(),materialClones=new Map();
   group.traverse(o=>{
    if(o.renderOrder<0&&o.material?.fog===false)o.visible=false;
    if(o.isLight)o.castShadow=false;
    if(!o.material)return;
    const convert=m=>{
     if(m?.isMeshStandardMaterial){
      // Each map is built once; colour grading must not clone per frame.
      m.color.lerp(gold,.12);m.emissive?.setHex(0x2b1c06);m.emissiveIntensity=.08;
     }
     // The cathedral's roof and walls obscure a wave coming from the horizon.
     // Stable alpha-hashed material variants expose the ocean behind the
     // church without duplicating transparent overdraw or changing collision.
     if(id==='tsunami'&&o.isMesh&&m?.isMeshStandardMaterial&&
       /cathedral-(?:vault|side-wall|sanctuary|high-west-wall|lancet-gothic-frame|arch-capital|column)/.test(o.name)){
      let transparent=materialClones.get(m);
      if(!transparent){
       transparent=m.clone();transparent.alphaHash=true;
       transparent.transparent=false;transparent.depthWrite=true;transparent.opacity=1;
       transparent.userData.ghostTarget=/vault|high-west/.test(o.name)?.19:.32;
       materialClones.set(m,transparent);ghostMaterials.add(transparent);
      }
      return transparent;
     }
     return m;
    };
    o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
   });
   group.visible=false;
   const entry={id,group,control,isolated,ghostMaterials};
   maps.set(id,entry);return entry;
  }catch(error){disposeScene(group);disposeScene(isolated);group.removeFromParent();throw error;}
 }
 for(const id of Object.keys(RECALL_MAP_NAMES))prepare(id);
 function prewarm(renderer,camera){
  if(disposed||warmed||!renderer?.compile||!camera)return;
  const measuredAt=globalThis.performance?.now?.()??Date.now();
  const prior=active;
  // Synchronous pre-compilation runs behind the battle's initial intro gate;
  // no first-encounter memory switch needs to compile a new PBR shader.
  const visibility=[...maps.values()].map(x=>[x,x.group.visible]);
  const textures=new Set(),canPreRender=typeof renderer.setRenderTarget==='function'&&
   typeof renderer.getRenderTarget==='function'&&typeof renderer.render==='function';
  const previousTarget=canPreRender?renderer.getRenderTarget():null;
  const target=canPreRender?new THREE.WebGLRenderTarget(16,16,{depthBuffer:true,stencilBuffer:false}):null;
  try{
   for(const entry of maps.values()){
    for(const item of maps.values())item.group.visible=item===entry;
    entry.group.traverse(o=>{
     if(!o.material)return;
     const mats=Array.isArray(o.material)?o.material:[o.material];
     for(const mat of mats)for(const slot of ['map','normalMap','roughnessMap','metalnessMap',
       'emissiveMap','alphaMap','bumpMap','envMap']){
      if(mat?.[slot]?.isTexture)textures.add(mat[slot]);
     }
    });
    renderer.compile(scene,camera);compiled++;
    // This offscreen, 16px pass also uploads mesh buffers and instancing
    // layouts. compile() alone warms shader programs but not vertex buffers.
    if(target){renderer.setRenderTarget(target);renderer.render(scene,camera);preRendered++;}
   }
   if(typeof renderer.initTexture==='function')
    for(const tex of textures){renderer.initTexture(tex);uploaded++;}
   warmed=true;warmAudit={mode:'synchronous',totalMs:(globalThis.performance?.now?.()??Date.now())-measuredAt,maxChunkMs:(globalThis.performance?.now?.()??Date.now())-measuredAt,chunks:1};
  }finally{
   if(target){renderer.setRenderTarget(previousTarget);target.dispose();}
   for(const [entry,visible]of visibility)entry.group.visible=visible;
   active=prior;
  }
 }

 let warming=null;
 function prewarmProgressive(renderer,camera,{yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
  if(warming)return warming;
  if(disposed||warmed||!renderer?.compile||!camera)return Promise.resolve();
  warming=(async()=>{
   const now=()=>globalThis.performance?.now?.()??Date.now(),started=now();
   const audit={mode:'progressive',totalMs:0,maxChunkMs:0,chunks:0};
   const target=typeof renderer.setRenderTarget==='function'?new THREE.WebGLRenderTarget(16,16):null;
   const textures=new Set();if(target)target.texture.colorSpace=renderer.outputColorSpace||THREE.SRGBColorSpace;
   function chunk(entry,work){
    if(disposed)return;
    const visibility=[...maps.values()].map(x=>[x,x.group.visible]);
    const sceneVisibility=scene.children.filter(o=>o!==root&&!o.isLight).map(o=>[o,o.visible]);
    const previousTarget=target?renderer.getRenderTarget():null,at=now();
    try{for(const item of maps.values())item.group.visible=item===entry;if(entry)for(const [o]of sceneVisibility)o.visible=false;return work();}
    finally{if(target)renderer.setRenderTarget(previousTarget);for(const [item,v]of visibility)item.group.visible=v;for(const [o,v]of sceneVisibility)o.visible=v;audit.chunks++;audit.maxChunkMs=Math.max(audit.maxChunkMs,now()-at);}
   }
   try{
    // Warm the starting actor/floor with the same output colour space as the canvas.
    if(target){chunk(null,()=>{renderer.setRenderTarget(target);renderer.compile(scene,camera);renderer.render(scene,camera);});await yieldFrame();}
    for(const entry of maps.values()){
     if(disposed)return;
     const objects=[];entry.group.traverse(o=>{
      if(o.geometry&&o.visible)objects.push(o);
      for(const m of [].concat(o.material||[]))for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap','bumpMap','envMap'])if(m[key]?.isTexture)textures.add(m[key]);
     });
     // Upload a bounded set of vertex buffers per turn, behind the intro gate.
     if(target)for(let offset=0;offset<objects.length;offset+=16){
      if(disposed)return;
      chunk(entry,()=>{
       objects.forEach((o,i)=>o.visible=i>=offset&&i<offset+16);
       try{renderer.setRenderTarget(target);renderer.compile(scene,camera);renderer.render(scene,camera);preRendered++;}
       finally{for(const o of objects)o.visible=true;}
      });
      await yieldFrame();
     }
     if(!target)chunk(entry,()=>renderer.compile(scene,camera));compiled++;
    }
    if(renderer.initTexture)for(const texture of textures){if(disposed)return;chunk(null,()=>renderer.initTexture(texture));uploaded++;await yieldFrame();}
    if(!disposed)warmed=true;
   }finally{target?.dispose();audit.totalMs=now()-started;warmAudit=audit;}
  })();return warming;
 }

 function update(g,dt=0){
  focus=g;
  const id=g.status==='playing'&&g.boss.phase===3?g.gyuwon.stageMemory:null;
  const next=maps.get(id)||null;
  if(next!==active){
   if(active)active.group.visible=false;
   active=next;if(active)active.group.visible=true;
   switches++;
  }
  const materials=maps.get('tsunami')?.ghostMaterials;
  if(materials?.size){
   const wave=Boolean(active?.id==='tsunami'&&g.gyuwon.hazards?.some(h=>h.shape==='wave'));
   const k=1-Math.exp(-Math.max(0,dt)*5);
   for(const material of materials){
    const target=wave?(material.userData.ghostTarget??.30):1;
    material.opacity+= (target-material.opacity)*k;
   }
  }
 }
 function clear(){
  focus=null;if(active)active.group.visible=false;active=null;
  for(const entry of maps.values()){
   entry.group.visible=false;
   for(const m of entry.ghostMaterials)m.opacity=1;
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;clear();
  for(const {group,control,isolated}of maps.values()){
   control?.hide?.();disposeScene(group);group.removeFromParent();isolated.clear();
  }
  maps.clear();root.removeFromParent();
 }
 return {root,update,prewarm,prewarmProgressive,clear,
  stats:()=>({active:active?.group.name||null,loaded:maps.size,builds:maps.size,
   originalRoot:active?.group.getObjectByName(RECALL_MAP_NAMES[active.id])?.name||null,
   switches,prewarmed:warmed,warmAudit,compiled,uploaded,preRendered,
   cathedralOpacity:[...(maps.get('tsunami')?.ghostMaterials||[])][0]?.opacity??1}),
  dispose};
}
