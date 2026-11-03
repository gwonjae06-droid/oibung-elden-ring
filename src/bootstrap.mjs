const boots=new WeakMap();
export function bootstrapGame({doc=globalThis.document,win=globalThis.window,load=path=>import(path),signal,onWarning=(name,error)=>console.error(name+' unavailable',error)}={}){
 if(!doc||!win)return Promise.reject(new Error('Browser document and window are required'));
 if(boots.has(doc))return boots.get(doc);
 let arena=null,entry=null,transition=null,features=[],disposed=false;const released=new Set();
 function warn(name,error){try{onWarning(name,error);}catch{}}
 function release(control){if(!control||released.has(control))return;released.add(control);try{if(typeof control.dispose==='function')control.dispose();else if(typeof control.close==='function')control.close();}catch(error){warn('Feature cleanup',error);}}
 function disposeFeatures(){if(disposed)return;disposed=true;win.removeEventListener?.('pagehide',pagehide,true);signal?.removeEventListener?.('abort',disposeFeatures);for(const control of [...features.map(f=>f.control).reverse(),transition,entry,arena])release(control);}
 function pagehide(event){if(!event.persisted)disposeFeatures();}
 function check(){if(disposed){const error=new Error('Game startup cancelled');error.name='AbortError';throw error;}}
 const api={get arena(){return arena;},get entry(){return entry;},get transition(){return transition;},get features(){return features;},get unmanagedFeatures(){return features.filter(f=>f.ready&&typeof f.control?.dispose!=='function'&&typeof f.control?.close!=='function').map(f=>f.name);},dispose:disposeFeatures,disposeFeatures,get featuresDisposed(){return disposed;}};
 const promise=Promise.resolve().then(async()=>{
  try{
   check();const [entryModule,transitionModule]=await Promise.all([load('./clown-entry-controller.mjs'),load('./boss-transition.mjs')]);check();
   entry=entryModule.installClownEntry(doc,win);if(disposed)release(entry);check();
   const arenaModule=await load('./arena.mjs');arena=arenaModule.arenaRuntime||null;if(disposed)release(arena);check();
   transition=transitionModule.installBossTransition();if(disposed)release(transition);check();
   const descriptors=[['./game-ui.mjs','installGameUi','Game UI'],['./boss-music.mjs','installBossMusic','Boss music'],['./dice-chain.mjs','installDiceChain','Dice chain'],['./coop-menu.mjs','installCoopMenu','Coop menu']];
   features=descriptors.map(([, ,name])=>({name,ready:false}));
   await Promise.all(descriptors.map(async([path,method],i)=>{const feature=features[i];try{const module=await load(path);if(disposed){feature.cancelled=true;return;}const control=module[method](doc,win);if(disposed){release(control);feature.cancelled=true;return;}feature.control=control;feature.ready=true;}catch(error){feature.error=error;if(!disposed)warn(feature.name,error);}}));
   check();return api;
  }catch(error){disposeFeatures();throw error;}
 });
 boots.set(doc,promise);
 try{win.addEventListener?.('pagehide',pagehide,{capture:true});signal?.addEventListener?.('abort',disposeFeatures,{once:true});if(signal?.aborted)disposeFeatures();}catch(error){warn('Startup listeners',error);disposeFeatures();}
 return promise;
}
