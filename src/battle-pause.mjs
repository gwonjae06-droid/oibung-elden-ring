// Pause commands are idempotent; rendering and presentation stay with the arena.
export function createBattlePause({isPlaying,isPaused,setPaused,clearInput,onPause=()=>{},onResume=()=>{}}) {
  return {
    pause(){
      if(!isPlaying())return false;
      clearInput();
      setPaused(true);
      onPause();
      return true;
    },
    resume(){
      if(!isPaused())return false;
      clearInput();
      setPaused(false);
      onResume();
      return true;
    },
    toggle(){return isPaused()?this.resume():this.pause();}
  };
}

export function clearMovement(keys,stick) {
  keys.clear();
  for(const axis of Object.keys(stick))stick[axis]=0;
}

export function releaseCapturedPointer(target,id) {
  if(id===null||id===undefined)return;
  try { if(target.hasPointerCapture(id))target.releasePointerCapture(id); }
  catch(error) { console.warn('Pointer release failed',error); }
}
