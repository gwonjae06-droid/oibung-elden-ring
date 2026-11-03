export function createDisposerScope(onError=error=>console.error('Cleanup failed',error)){
 let disposed=false;const stack=[];
 function run(fn){try{fn();}catch(error){try{onError(error);}catch{}}}
 return {
  get disposed(){return disposed;},
  add(fn){if(typeof fn!=='function')throw new TypeError('Cleanup must be a function');if(disposed){run(fn);return ()=>{};}const entry={fn,active:true};stack.push(entry);return ()=>{if(!entry.active)return;entry.active=false;};},
  dispose(){if(disposed)return;disposed=true;for(let i=stack.length-1;i>=0;i--){const e=stack[i];if(e.active){e.active=false;run(e.fn);}}stack.length=0;}
 };
}
