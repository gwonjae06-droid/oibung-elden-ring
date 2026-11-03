import {createDisposerScope} from './disposer.mjs';

// Own browser callbacks for one battle; detached callbacks become inert immediately.
export function createEventScope(win) {
  const errors=[],timers=new Set();
  const scope=createDisposerScope(error=>errors.push(error));
  function clearTimeout(id) {
    timers.delete(id);
    win.clearTimeout(id);
  }
  function clearTimers(){for(const id of [...timers])try{clearTimeout(id);}catch(error){errors.push(error);}}
  return {
    get disposed(){return scope.disposed;},
    add:scope.add,
    listen(target,type,handler,options) {
      if(scope.disposed)return ()=>{};
      const guarded=(...args)=>{if(!scope.disposed)return handler(...args);};
      target.addEventListener(type,guarded,options);
      let active=true;
      const remove=()=>{if(!active)return;active=false;target.removeEventListener(type,guarded,options);untrack();};
      const untrack=scope.add(remove);
      return remove;
    },
    setTimeout(handler,delay) {
      if(scope.disposed)return null;
      const id=win.setTimeout(()=>{timers.delete(id);if(!scope.disposed)handler();},delay);
      timers.add(id);
      return id;
    },
    clearTimeout,
    clearTimers,
    ownHandlers(root) {
      for(const target of root.querySelectorAll('*')) {
        for(const property of ['onclick','onpointerdown','onpointermove','onpointerup','onpointercancel','oncontextmenu','onwheel','onload','onerror']) {
          const handler=target[property];
          if(typeof handler!=='function')continue;
          const guarded=function(...args){if(!scope.disposed)return handler.apply(this,args);};
          target[property]=guarded;
          scope.add(()=>{if(target[property]===guarded)target[property]=null;});
        }
      }
    },
    dispose() {
      scope.dispose();
      clearTimers();
      return {errors:[...errors]};
    }
  };
}
