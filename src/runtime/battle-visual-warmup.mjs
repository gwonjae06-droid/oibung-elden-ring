// Prepare shader programs and textures behind the loading veil, before the first
// gameplay frame. This does not change geometry, animation, hitboxes or texture detail.
const MAP_FIELDS=['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap',
 'alphaMap','bumpMap','displacementMap','lightMap','envMap','clearcoatMap',
 'clearcoatNormalMap','clearcoatRoughnessMap','transmissionMap','thicknessMap'];
export function collectBattleTextures(scene){
 const textures=new Set();
 const add=t=>{if(t?.isTexture)textures.add(t);};
 add(scene?.environment);
 scene?.traverse?.(object=>{
  const materials=Array.isArray(object.material)?object.material:[object.material];
  for(const material of materials)if(material)for(const key of MAP_FIELDS)add(material[key]);
 });
 return [...textures];
}
function bounded(promise,ms){
 let timer;
 return Promise.race([Promise.resolve(promise),new Promise(resolve=>{timer=setTimeout(resolve,ms);})])
  .finally(()=>clearTimeout(timer));
}
export function createBattleVisualWarmup({renderer,scene,camera,assets=[],container=null,
 timeoutMs=4500,chunkSize=8,yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 let ready=false,disposed=false,started=false,work=null;
 const overlay=container?.ownerDocument?.createElement?.('div');
 if(overlay){
  overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
  overlay.textContent='전장 그래픽을 준비하고 있습니다…';
  overlay.style.cssText='position:fixed;inset:0;z-index:11000;display:grid;place-items:center;background:#09090e;color:#eadfcd;font:600 16px/1.5 sans-serif;pointer-events:none;text-align:center';
  container.appendChild(overlay);
 }
 const finish=()=>{ready=true;overlay?.remove();};
 const start=()=>{
  if(started)return work;
  started=true;
  // Headless/test renderers without GPU methods should not block startup.
  if(!renderer?.compileAsync&&!renderer?.compile&&!renderer?.initTexture){
   finish();return work=Promise.resolve(true);
  }
  work=(async()=>{
   try{
    if(assets.length)await bounded(Promise.allSettled(assets.map(p=>Promise.resolve(p))),timeoutMs);
    if(disposed)return false;
    if(typeof renderer.compileAsync==='function')
     await bounded(Promise.resolve().then(()=>renderer.compileAsync(scene,camera)),timeoutMs);
    else if(typeof renderer.compile==='function')renderer.compile(scene,camera);
    if(disposed)return false;
    if(typeof renderer.initTexture==='function'){
     const textures=collectBattleTextures(scene);
     for(let i=0;i<textures.length&&!disposed;i++){
      const tex=textures[i];
      try{if(tex.image||tex.source?.data)renderer.initTexture(tex);}
      catch(error){console.warn('Optional texture prewarm failed',error);}
      if((i+1)%Math.max(1,chunkSize)===0&&i+1<textures.length)await yieldFrame();
     }
    }
    // First shadow/render-buffer allocation is performed behind the loading veil.
    if(!disposed&&typeof renderer.render==='function')renderer.render(scene,camera);
   }catch(error){console.warn('Optional battle graphics prewarm failed',error);}
   finally{if(!disposed)finish();}
   return !disposed;
  })();
  return work;
 };
 return {start,dispose(){disposed=true;overlay?.remove();},
  get ready(){return ready&&!disposed;},get started(){return started;},get disposed(){return disposed;}};
}
