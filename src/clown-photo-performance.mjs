// The hero's visible face stays high resolution. Only the small thrown
// photo-capture head uses the low-cost geometry.
export const CLOWN_HEAD_MESH_DETAIL=Object.freeze({
 hero:Object.freeze({width:72,height:56}),
 projectile:Object.freeze({width:24,height:18}),
});
export const clownHeadMeshDetail=projectile=>projectile
 ?CLOWN_HEAD_MESH_DETAIL.projectile:CLOWN_HEAD_MESH_DETAIL.hero;

// Prepare projectile heads before combat and reuse their geometry/face textures.
// No new head needs to be constructed for the first shutter shot.
export function createClownHeadPool(factory,{prewarm=2}={}){
 if(typeof factory!=='function')throw new TypeError('Head factory required');
 const available=[],all=new Set(),borrowed=new Set();
 let disposed=false;
 const build=()=>{const obj=factory();all.add(obj);return obj;};
 for(let i=0;i<prewarm;i++)available.push(build());
 return {
  acquire(){
   if(disposed)throw new Error('Clown head pool disposed');
   const obj=available.pop()??build();
   borrowed.add(obj);return obj;
  },
  release(obj){
   if(disposed||!borrowed.delete(obj))return false;
   obj.group.visible=false;available.push(obj);return true;
  },
  dispose(){
   if(disposed)return;
   disposed=true;
   for(const obj of all){obj.group.parent?.remove(obj.group);obj.dispose?.();}
   all.clear();available.length=0;borrowed.clear();
  },
  stats(){return {total:all.size,available:available.length,active:borrowed.size};}
 };
}
