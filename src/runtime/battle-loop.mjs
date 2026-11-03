import {createFrameLoop} from './frame-loop.mjs';

// Shared frame ownership and clock for main and modal battle sessions.
export function createBattleLoop({request,cancel,update,now=()=>performance.now(),onError}={}) {
  let previous=null,disposed=false;
  const loop=createFrameLoop({request,cancel,onError,update:timestamp=>{
    const dt=Math.min(.05,Math.max(0,(timestamp-previous)/1000));
    previous=timestamp;
    update(timestamp,dt);
  }});
  return {
    start(){
      if(disposed||loop.running)return false;
      previous=now();
      loop.start();
      return true;
    },
    stop(){loop.stop();previous=null;},
    dispose(){if(disposed)return;disposed=true;loop.stop();previous=null;},
    get running(){return loop.running;},
    get disposed(){return disposed;}
  };
}
