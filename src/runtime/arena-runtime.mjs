import {createBattleLoop} from './battle-loop.mjs';
import {checkCleanupTimeout,settleCleanup,combineCleanupReports} from './cleanup-completion.mjs';
export function createArenaRuntime({win,scene,renderer,update,onStart=()=>{},onStop=()=>{},onDispose=()=>{},onError=error=>console.error('Arena lifecycle failed',error),cleanupTimeoutMs=2000}){
 checkCleanupTimeout(cleanupTimeoutMs);
 let disposed=false,stopped=true,completion=null,cleanupErrors=null;const listeners=new Set(),timers=new Set(),contexts=new Set(),captures=new Map(),extras=new Set();
 const safe=fn=>{try{fn();}catch(error){cleanupErrors?.push({label:'Arena cleanup',error});try{onError(error);}catch{}}};
 function releaseCaptures(){const pending=[...captures];captures.clear();for(const [target,ids] of pending)for(const id of ids)safe(()=>{if(target.hasPointerCapture?.(id))target.releasePointerCapture(id);});}
 const loop=createBattleLoop({now:()=>win.performance?.now?.()??performance.now(),request:fn=>win.requestAnimationFrame(fn),cancel:id=>win.cancelAnimationFrame(id),update,onError:error=>{stop();safe(()=>onError(error));}});
 function stop(){safe(()=>loop.stop());releaseCaptures();if(stopped)return;stopped=true;safe(onStop);}
 function disposeResources(initial){
  const resources=new Set(initial),visited=new Set();
  function texture(value){if(!value||typeof value!=='object'||visited.has(value))return;visited.add(value);if(value.isTexture){resources.add(value);return;}if(Array.isArray(value))for(const item of value)texture(item);else if(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null)for(const item of Object.values(value))texture(item);}
  for(const resource of [...resources])if(resource?.isMaterial||resource?.map?.isTexture||resource?.uniforms)safe(()=>{for(const value of Object.values(resource))texture(value);});
  for(const resource of resources)safe(()=>resource?.dispose?.());
 }
 function dispose(){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;cleanupErrors=[];stop();for(const remove of [...listeners])safe(remove);for(const id of timers)safe(()=>win.clearTimeout(id));timers.clear();
  const pending=[settleCleanup(onDispose,'Arena onDispose',{timeoutMs:cleanupTimeoutMs})],resources=new Set(extras);
  safe(()=>scene.traverse(node=>{if(node.geometry)resources.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:[node.material])if(material)resources.add(material);if(node.shadow?.map)resources.add(node.shadow.map);if(node.shadow?.mapPass)resources.add(node.shadow.mapPass);}));
  for(const value of [scene.background,scene.environment])if(value?.isTexture)resources.add(value);disposeResources(resources);extras.clear();
  for(const context of contexts)pending.push(settleCleanup(()=>context.close?.(),'Arena AudioContext.close',{timeoutMs:cleanupTimeoutMs}));contexts.clear();safe(()=>scene.clear());safe(()=>renderer.renderLists?.dispose());safe(()=>renderer.dispose());
  const synchronousErrors=cleanupErrors;cleanupErrors=null;
  Promise.all(pending).then(reports=>finish(combineCleanupReports([{errors:synchronousErrors,timeouts:[]},...reports])));return completion;
 }
 function listen(target,type,fn,options){if(disposed)return ()=>{};const guarded=(...args)=>{if(!disposed)return fn(...args);};target.addEventListener(type,guarded,options);let active=true;const remove=()=>{if(!active)return;active=false;listeners.delete(remove);target.removeEventListener(type,guarded,options);};listeners.add(remove);return remove;}
 const control={start(){if(disposed||loop.running)return false;stopped=false;try{onStart();if(disposed||stopped)return false;loop.start();return true;}catch(error){stop();throw error;}},stop,dispose,listen,
  setTimeout(fn,delay){if(disposed)return null;const id=win.setTimeout(()=>{timers.delete(id);if(!disposed)fn();},delay);timers.add(id);return id;},clearTimeout(id){timers.delete(id);win.clearTimeout(id);},
  capture(target,id){if(disposed)return;target.setPointerCapture(id);if(!captures.has(target))captures.set(target,new Set());captures.get(target).add(id);},release(target,id){const ids=captures.get(target);ids?.delete(id);if(ids?.size===0)captures.delete(target);if(target.hasPointerCapture?.(id))target.releasePointerCapture(id);},
  own(resource){if(disposed)disposeResources([resource]);else extras.add(resource);return resource;},makeAudioContext(){if(disposed)return null;const C=win.AudioContext||win.webkitAudioContext;if(!C)return null;const ctx=new C();contexts.add(ctx);return ctx;},
  load(loader,install){return Promise.resolve().then(()=>disposed?null:loader()).then(module=>{if(!disposed&&module)return install(module);}).catch(error=>{if(!disposed)safe(()=>onError(error));});},get disposed(){return disposed;},get running(){return loop.running;},get whenDisposed(){return completion;}};
 const pagehide=event=>{if(!event.persisted)dispose();};listen(win,'pagehide',pagehide);return control;
}
