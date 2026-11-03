const boots=new WeakMap();
export function bootstrapGame({doc=globalThis.document,win=globalThis.window,load=path=>import(path),onWarning=(name,error)=>console.error(name+' unavailable',error)}={}){
 if(!doc||!win)return Promise.reject(new Error('Browser document and window are required'));
 if(boots.has(doc))return boots.get(doc);
 const promise=Promise.resolve().then(async()=>{
  let entry=null,transition=null;
  try{
   const [entryModule,transitionModule]=await Promise.all([load('./clown-entry-controller.mjs'),load('./boss-transition.mjs')]);
   entry=entryModule.installClownEntry(doc,win);
   await load('./arena.mjs');
   transition=transitionModule.installBossTransition();
   const features=await Promise.all([
    ['./game-ui.mjs','installGameUi','Game UI'],
    ['./boss-music.mjs','installBossMusic','Boss music'],
    ['./dice-chain.mjs','installDiceChain','Dice chain'],
    ['./coop-menu.mjs','installCoopMenu','Coop menu']
   ].map(async([path,method,name])=>{try{const module=await load(path);const control=module[method](doc,win);return {name,ready:true,control};}catch(error){try{onWarning(name,error);}catch{}return {name,ready:false,error};}}));
   return {entry,transition,features};
  }catch(error){
   try{transition?.dispose?.();}catch{}try{entry?.dispose?.();}catch{}
   throw error;
  }
 });
 boots.set(doc,promise);return promise;
}
