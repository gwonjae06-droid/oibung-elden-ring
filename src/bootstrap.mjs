import {checkCleanupTimeout,settleCleanup,combineCleanupReports} from './runtime/cleanup-completion.mjs';
const boots=new WeakMap();
export function bootstrapGame({doc=globalThis.document,win=globalThis.window,load=path=>import(path==='./arena.mjs'?path+'?visual=chapter-one-v3':path),signal,onWarning=(name,error)=>console.error(name+' unavailable',error),cleanupTimeoutMs=4000}={}){
 if(!doc||!win)return Promise.reject(new Error('Browser document and window are required'));
 if(boots.has(doc))return boots.get(doc);
 try{checkCleanupTimeout(cleanupTimeoutMs);}catch(error){return Promise.reject(error);}
 let arena=null,entry=null,transition=null,features=[],disposed=false,completion=null;const released=new Map();
 function warn(name,error){try{onWarning(name,error);}catch{}}
 function release(control){
  if(!control)return Promise.resolve({errors:[],timeouts:[]});if(released.has(control))return released.get(control);
  let finish;const promise=new Promise(resolve=>{finish=resolve;});released.set(control,promise);let warned=false;
  settleCleanup(()=>{try{if(typeof control.dispose==='function')return control.dispose();if(typeof control.close==='function')return control.close();}catch(error){warned=true;warn('Feature cleanup',error);throw error;}},'Feature cleanup',{timeoutMs:cleanupTimeoutMs}).then(report=>{if(!warned&&report.errors.length)warn('Feature cleanup',report.errors);if(report.timeouts.length)warn('Feature cleanup timeout',report.timeouts);finish(report);});return promise;
 }
 function disposeFeatures(){
  if(completion)return completion;let finish;completion=new Promise(resolve=>{finish=resolve;});disposed=true;
  const pending=[settleCleanup(()=>win.removeEventListener?.('pagehide',pagehide,true),'Remove pagehide listener',{timeoutMs:cleanupTimeoutMs}),settleCleanup(()=>signal?.removeEventListener?.('abort',disposeFeatures),'Remove abort listener',{timeoutMs:cleanupTimeoutMs})];
  for(const control of [...features.map(f=>f.control).reverse(),transition,entry,arena])pending.push(release(control));Promise.all(pending).then(reports=>finish(combineCleanupReports(reports)));return completion;
 }
 function pagehide(event){if(!event.persisted)disposeFeatures();}
 function check(){if(disposed){const error=new Error('Game startup cancelled');error.name='AbortError';throw error;}}
 const api={get arena(){return arena;},get entry(){return entry;},get transition(){return transition;},get features(){return features;},get unmanagedFeatures(){return features.filter(f=>f.ready&&typeof f.control?.dispose!=='function'&&typeof f.control?.close!=='function').map(f=>f.name);},dispose:disposeFeatures,disposeFeatures,get featuresDisposed(){return disposed;},get whenDisposed(){return completion;}};
 const promise=Promise.resolve().then(async()=>{
  try{
   check();const legacy=!doc.body?.dataset?.journey;let entryModule=null,transitionModule=null;
   // The journey owns progression: do not install the retired direct-boss flow.
   if(legacy){[entryModule,transitionModule]=await Promise.all([load('./clown-entry-controller.mjs'),load('./boss-transition.mjs')]);check();entry=entryModule.installClownEntry(doc,win);if(disposed)release(entry);check();}
   const arenaModule=await load('./arena.mjs');arena=arenaModule.arenaRuntime||null;if(disposed)release(arena);check();
   if(legacy){transition=transitionModule.installBossTransition();if(disposed)release(transition);check();}
   const descriptors=[['./game-ui.mjs','installGameUi','Game UI'],['./boss-music.mjs','installBossMusic','Boss music'],...(legacy?[['./dice-chain.mjs','installDiceChain','Dice chain'],['./coop-menu.mjs','installCoopMenu','Coop menu']]:[])];features=descriptors.map(([, ,name])=>({name,ready:false}));
   await Promise.all(descriptors.map(async([path,method],i)=>{const feature=features[i];try{const module=await load(path);if(disposed){feature.cancelled=true;return;}const control=module[method](doc,win);if(disposed){release(control);feature.cancelled=true;return;}feature.control=control;feature.ready=true;}catch(error){feature.error=error;if(!disposed)warn(feature.name,error);}}));check();if(doc.getElementById?.('journey')){const module=await load('./journey.mjs?art=chapter-one-v3');check();const control=module.installJourney(doc,win);features.push({name:'Journey',ready:true,control});if(disposed)release(control);check();}return api;
  }catch(error){disposeFeatures();throw error;}
 });
 boots.set(doc,promise);try{win.addEventListener?.('pagehide',pagehide,{capture:true});signal?.addEventListener?.('abort',disposeFeatures,{once:true});if(signal?.aborted)disposeFeatures();}catch(error){warn('Startup listeners',error);disposeFeatures();}return promise;
}
