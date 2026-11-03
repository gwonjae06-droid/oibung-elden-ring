export function createDisposerScope(onError=error=>console.error('Cleanup failed',error)){
 let disposed=false;const entries=new Set();
 function run(fn){try{fn();}catch(error){try{onError(error);}catch{}}}
 return {get disposed(){return disposed;},add(fn){if(typeof fn!=='function')throw new TypeError('Cleanup must be a function');if(disposed){run(fn);return ()=>{};}const entry={fn};entries.add(entry);return ()=>entries.delete(entry);},dispose(){if(disposed)return;disposed=true;const pending=[...entries].reverse();for(const entry of pending)if(entries.delete(entry))run(entry.fn);}};
}
