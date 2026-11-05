import {clownLensCue} from './clown-lens-gag.mjs';
const near=(a,b)=>Math.abs(a-b)<1e-8;
export function createClownCameraRig(){
 let game=null,camera=null,baseFov=0,baseQuaternion=null,lastFov=null,lastQuaternion=null;
 function restore(){
  if(!camera)return;
  if(lastQuaternion&&camera.quaternion.equals(lastQuaternion))camera.quaternion.copy(baseQuaternion);
  if(lastFov!==null&&near(camera.fov,lastFov)){camera.fov=baseFov;camera.updateProjectionMatrix?.();}
  camera.updateMatrixWorld?.(true);camera=null;baseQuaternion=lastQuaternion=null;lastFov=null;
 }
 function observe(g){game=g;}
 function apply(next){
  const cue=clownLensCue(game);
  if(!next?.quaternion?.clone||typeof next.rotateZ!=='function'||!Number.isFinite(next.fov)){restore();return false;}
  if(!cue.active){restore();next.updateMatrixWorld?.(true);return false;}
  if(camera&&camera!==next)restore();
  if(!camera){camera=next;baseFov=next.fov;}
  else{if(lastQuaternion&&next.quaternion.equals(lastQuaternion))next.quaternion.copy(baseQuaternion);if(lastFov!==null&&!near(next.fov,lastFov))baseFov=next.fov;}
  baseQuaternion=next.quaternion.clone();next.rotateZ(cue.roll*Math.PI/180);
  next.fov=2*Math.atan(Math.tan(baseFov*Math.PI/360)/cue.scale)*180/Math.PI;
  lastFov=next.fov;lastQuaternion=next.quaternion.clone();next.updateProjectionMatrix?.();next.updateMatrixWorld?.(true);return true;
 }
 function reset(){restore();game=null;}
 return {observe,apply,reset,dispose:reset};
}
