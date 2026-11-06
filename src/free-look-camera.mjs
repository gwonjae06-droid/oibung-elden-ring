// Unlocked camera mouse-look. Capture enables unlimited 360-degree rotation;
// if the browser denies Pointer Lock, moving across the canvas still works.
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function mouseLookAngles({yaw,pitch},dx,dy,{yawSensitivity=.005,pitchSensitivity=.004,minPitch=.08,maxPitch=1.18}={}){
 if(!Number.isFinite(dx)||!Number.isFinite(dy))return {yaw,pitch};
 return {yaw:yaw-clamp(dx,-500,500)*yawSensitivity,
  pitch:clamp(pitch+clamp(dy,-500,500)*pitchSensitivity,minPitch,maxPitch)};
}
export function createFreeLookCamera({canvas,enabled=()=>true,getAngles,setAngles,coarse=false,
 minPitch=.08,maxPitch=1.18}={}){
 const doc=canvas?.ownerDocument;
 let disposed=false,requesting=false;
 const captured=()=>doc?.pointerLockElement===canvas||canvas?.getRootNode?.()?.pointerLockElement===canvas;
 function move(event){
  if(disposed||coarse||!enabled())return;
  // Shadow DOM retargets document mouse events outside the boss dialog.
  const fromCanvas=event.target===canvas||event.composedPath?.().includes(canvas);
  if(!captured()&&!fromCanvas)return;
  const next=mouseLookAngles(getAngles(),event.movementX,event.movementY,{minPitch,maxPitch});
  setAngles(next);
 }
 doc?.addEventListener?.('mousemove',move);
 function release(){
  if(captured()&&typeof doc?.exitPointerLock==='function'){
   try{doc.exitPointerLock();}catch{}
  }
 }
 function capture(){
  if(disposed||coarse||requesting||captured()||!enabled()||typeof canvas?.requestPointerLock!=='function')return;
  requesting=true;
  try{
   Promise.resolve(canvas.requestPointerLock()).then(()=>{
    requesting=false;if(disposed||!enabled())release();
   },()=>{requesting=false;});
  }catch{requesting=false;}
 }
 function dispose(){if(disposed)return;disposed=true;doc?.removeEventListener?.('mousemove',move);release();}
 return {capture,release,dispose,get captured(){return captured();},get disposed(){return disposed;}};
}
