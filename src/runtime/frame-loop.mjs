export function createFrameLoop({request,cancel,update,onError=error=>console.error(error)}={}){
 if(typeof request!=='function'||typeof cancel!=='function'||typeof update!=='function')throw new TypeError('Frame-loop callbacks are required');
 let running=false,handle=null,generation=0;
 function schedule(epoch){handle=request(time=>tick(time,epoch));}
 function tick(time,epoch){if(!running||epoch!==generation)return;handle=null;try{update(time);if(running&&epoch===generation)schedule(epoch);}catch(error){running=false;generation++;try{onError(error);}catch{}}}
 return {start(){if(running)return;running=true;const epoch=++generation;try{schedule(epoch);}catch(error){running=false;generation++;throw error;}},stop(){running=false;generation++;if(handle!==null){const old=handle;handle=null;cancel(old);}},get running(){return running;}};
}
