import {createFrameLoop} from './frame-loop.mjs';
export function createArenaRuntime({win,scene,renderer,update,onStart=()=>{},onStop=()=>{},onDispose=()=>{},onError=error=>console.error('Arena lifecycle failed',error)}){
 let disposed=false;const listeners=new Set(),timers=new Set(),contexts=new Set(),captures=new Map(),extras=new Set();
 const safe=fn=>{try{fn();}catch(error){try{onError(error);}catch{}}};
 const loop=createFrameLoop({request:fn=>win.requestAnimationFrame(fn),cancel:id=>win.cancelAnimationFrame(id),update,onError:error=>{safe(onStop);safe(()=>onError(error));}});
 function stop(){loop.stop();safe(onStop);for(const [target,ids] of captures)for(const id of ids)safe(()=>{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id);});captures.clear();}
 function dispose(){
  if(disposed)return;disposed=true;stop();
  for(const remove of [...listeners])safe(remove);for(const id of timers)safe(()=>win.clearTimeout(id));timers.clear();
  safe(onDispose);
  const resources=new Set(extras),materials=new Set();
  safe(()=>scene.traverse(node=>{if(node.geometry)resources.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])if(material)materials.add(material);if(node.shadow?.map)resources.add(node.shadow.map);if(node.shadow?.mapPass)resources.add(node.shadow.mapPass);}));
  for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)resources.add(value);for(const uniform of Object.values(material.uniforms||{})){const values=Array.isArray(uniform?.value)?uniform.value:[uniform?.value];for(const value of values)if(value?.isTexture)resources.add(value);}resources.add(material);}
  for(const value of [scene.background,scene.environment])if(value?.isTexture)resources.add(value);
  for(const resource of resources)safe(()=>resource.dispose?.());extras.clear();
  for(const context of contexts)safe(()=>{context.close?.()?.catch?.(error=>safe(()=>onError(error)));});contexts.clear();
  safe(()=>scene.clear());safe(()=>renderer.renderLists?.dispose());safe(()=>renderer.dispose());
 }
 const pagehide=event=>{if(!event.persisted)dispose();};
 function listen(target,type,fn,options){if(disposed)return ()=>{};const guarded=(...args)=>{if(!disposed)return fn(...args);};target.addEventListener(type,guarded,options);let active=true;const remove=()=>{if(!active)return;active=false;listeners.delete(remove);target.removeEventListener(type,guarded,options);};listeners.add(remove);return remove;}
 const control={
  start(){if(disposed||loop.running)return false;onStart();loop.start();return true;},stop,dispose,
  listen,
  setTimeout(fn,delay){if(disposed)return null;const id=win.setTimeout(()=>{timers.delete(id);if(!disposed)fn();},delay);timers.add(id);return id;},
  clearTimeout(id){timers.delete(id);win.clearTimeout(id);},
  capture(target,id){if(disposed)return;target.setPointerCapture(id);if(!captures.has(target))captures.set(target,new Set());captures.get(target).add(id);},
  release(target,id){captures.get(target)?.delete(id);if(target.hasPointerCapture?.(id))target.releasePointerCapture(id);},
  own(resource){if(disposed)safe(()=>resource.dispose?.());else extras.add(resource);return resource;},
  makeAudioContext(){if(disposed)return null;const C=win.AudioContext||win.webkitAudioContext;if(!C)return null;const ctx=new C();contexts.add(ctx);return ctx;},
  load(loader,install){return Promise.resolve().then(()=>disposed?null:loader()).then(module=>{if(!disposed&&module)return install(module);}).catch(error=>{if(!disposed)safe(()=>onError(error));});},
  get disposed(){return disposed;},get running(){return loop.running;}
 };
 listen(win,'pagehide',pagehide);return control;
}
