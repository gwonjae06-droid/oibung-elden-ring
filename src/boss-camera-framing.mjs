// Render-only framing: Kwon's close over-the-shoulder view is canonical.
export const KWON_CAMERA_REFERENCE=Object.freeze({
 fov:58,distance:9.5,pitch:.4,eyeHeight:1.5,focusHeight:1.6,lockBlend:.45
});
export const BOSS_CAMERA_SCALE=Object.freeze({
 clown:1.25,dice:1.4,blood:1.1,gyuwon:1
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function matchedBossCamera(kind,{
 player,boss,yaw,pitch=KWON_CAMERA_REFERENCE.pitch,zoom=0,aspect=1,locked=true,
 headHeight=3,extraDistance=0
}){
 const r=KWON_CAMERA_REFERENCE,dx=boss.x-player.x,dz=boss.z-player.z,
  distanceToBoss=Math.hypot(dx,dz),scale=BOSS_CAMERA_SCALE[kind]||1;
 // Keep the same composition on mobile; reserve at most two extra units
 // for portrait rather than the old eight-to-ten metre zoom-out.
 const portrait=clamp(Math.max(0,1/Math.max(.45,aspect)-1)*2,0,2);
 const distance=clamp(r.distance*scale+zoom+portrait+extraDistance,6,32);
 const angle=clamp(pitch,.08,1.18);
 const horizontal=distance*Math.cos(angle),sin=Math.sin(yaw),cos=Math.cos(yaw);
 const k=locked?clamp(distanceToBoss*.12,0,r.lockBlend):0;
 const focusY=locked?r.focusHeight+(headHeight-r.focusHeight)*r.lockBlend:r.focusHeight;
 return {
  fov:r.fov,distance,
  position:{x:player.x-sin*horizontal,y:r.eyeHeight+Math.sin(angle)*distance,z:player.z-cos*horizontal},
  focus:{x:player.x+dx*k,y:focusY,z:player.z+dz*k}
 };
}
