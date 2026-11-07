// Keep the normal player-follow camera throughout the recalled Baeseojun
// tsunami. The wave comes through a translucent cathedral rather than
// cutting away to an off-axis cinematic shot.
export const GYUWON_MEMORY_CAMERA=Object.freeze({
 sword:Object.freeze({pitch:.60,distance:3.8,height:3.4}),
 circus:Object.freeze({pitch:.70,distance:6.2,height:6.0}),
 gamble:Object.freeze({pitch:.74,distance:7.0,height:6.6}),
 tsunami:Object.freeze({pitch:.63,distance:5.0,height:4.2}),
 chalk:Object.freeze({pitch:.68,distance:5.6,height:5.1}),
});
const smooth=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
export function gyuwonMemoryFraming(g){
 if(g?.boss?.phase!==3||g?.status!=='playing')return {pitch:0,distance:0,height:0};
 const spec=GYUWON_MEMORY_CAMERA[g?.gyuwon?.stageMemory]||GYUWON_MEMORY_CAMERA.chalk;
 // Both the angle and elevation ease in after a room change, preventing
 // camera jumps that could themselves feel like a frame hitch.
 const k=smooth((g.gyuwon.stageTime??0)/.65);
 return {pitch:spec.pitch,distance:spec.distance*k,height:spec.height*k};
}
export function gyuwonHorizonShot(g){
 const wave=g?.gyuwon?.hazards?.find(h=>h.shape==='wave');
 return {active:false,weight:0,incoming:Boolean(g?.boss?.phase===3&&wave),gap:wave?.gap??0};
}
export function poseGyuwonHorizonCamera(camera,target,g){
 // Retained for callers and old tests, deliberately does not mutate either.
 void camera;void target;
 return gyuwonHorizonShot(g);
}
