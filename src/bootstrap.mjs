const boots=new WeakMap();
export function bootstrapGame({doc=globalThis.document,win=globalThis.window,load=path=>import(path),onWarning=(name,error)=>console.error(name+' unavailable',error)}={}){
 if(!doc||!win)return Promise.reject(new Error('Browser document and window are required'));
 if(boots.has(doc))return boots.get(doc);
 const promise=Promise.resolve().then(async()=>{
  let arena=null,entry=null,transition=null,features=[],disposed=false;
  function warn(name,error){try{onWarning(name,error);}catch{}}
  function disposeFeatures(){
   if(disposed)return;disposed=true;win.removeEventListener?.('pagehide',pagehide,true);
   const controls=[...new Set([arena,entry,transition,...features.map(f=>f.control)].filter(Boolean))].reverse();
   for(const control of controls)try{if(typeof control.dispose==='function')control.dispose();else if(typeof control.close==='function')control.close();}catch(error){warn('Feature cleanup',error);}
  }
  function pagehide(event){if(!event.persisted)disposeFeatures();}
  try{
   const [entryModule,transitionModule]=await Promise.all([load('./clown-entry-controller.mjs'),load('./boss-transition.mjs')]);
   entry=entryModule.installClownEntry(doc,win);
   const arenaModule=await load('./arena.mjs');arena=arenaModule.arenaRuntime||null;
   transition=transitionModule.installBossTransition();
   features=await Promise.all([
    ['./game-ui.mjs','installGameUi','Game UI'],
    ['./boss-music.mjs','installBossMusic','Boss music'],
    ['./dice-chain.mjs','installDiceChain','Dice chain'],
    ['./coop-menu.mjs','installCoopMenu','Coop menu']
   ].map(async([path,method,name])=>{try{const module=await load(path);const control=module[method](doc,win);return {name,ready:true,control};}catch(error){warn(name,error);return {name,ready:false,error};}}));
   win.addEventListener?.('pagehide',pagehide,{capture:true});
   const unmanagedFeatures=features.filter(f=>f.ready&&typeof f.control?.dispose!=='function'&&typeof f.control?.close!=='function').map(f=>f.name);
   return {arena,entry,transition,features,unmanagedFeatures,dispose:disposeFeatures,disposeFeatures,get featuresDisposed(){return disposed;}};
  }catch(error){disposeFeatures();throw error;}
 });
 boots.set(doc,promise);return promise;
}
