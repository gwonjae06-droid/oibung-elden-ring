// One-time reset of legacy, non-event ODEN RING player progress.
// Existing screenshots and server-side records cannot be erased by a web page.
// Do not call localStorage.clear(): the same GitHub Pages origin can host
// different games, and accessibility/audio preferences should be preserved.
export const LEGACY_SAVE_RESET_MARKER='oibung.odenring.legacy-save-reset.2026-11-10';
export const LEGACY_SAVE_KEYS=Object.freeze([
 'oibung.journey.v1',                 // boss progression, forge, records
 'oibung.gyuwon.ending-watched',      // post-credit home unlock
 'oibung.gyuwon.ensemble-photo'       // captured cast portrait
]);
export function resetLegacyOdenSavesOnce(storage){
 if(!storage)return {ok:false,changed:false,reason:'storage-unavailable'};
 try{
  if(storage.getItem(LEGACY_SAVE_RESET_MARKER)==='done')
   return {ok:true,changed:false,reason:'already-applied'};
  let removed=0;
  for(const key of LEGACY_SAVE_KEYS){
   if(storage.getItem(key)!==null)removed++;
   storage.removeItem(key);
  }
  // Only commit the marker once every save key has been removed.
  storage.setItem(LEGACY_SAVE_RESET_MARKER,'done');
  return {ok:true,changed:true,removed};
 }catch(error){
  // Failed storage access must not crash game startup; retry on next visit.
  return {ok:false,changed:false,reason:'storage-error'};
 }
}
