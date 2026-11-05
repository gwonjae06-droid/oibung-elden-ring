// Small deterministic two-bone IK for the existing armour-piece hip/knee/ankle
// hierarchy. Y is down from the hip; Z points toward the camera-facing front.
// There is no runtime allocation of geometry, rigid bodies or collision shapes.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const PLAYER_LEG_BONES=Object.freeze({thigh:.47,shin:.42});
export function solvePlayerFoot(y,z,thigh=PLAYER_LEG_BONES.thigh,shin=PLAYER_LEG_BONES.shin){
 if(!Number.isFinite(y)||!Number.isFinite(z)||!(thigh>0)||!(shin>0))
  return {hip:0,knee:0,ankle:0,reach:0,clamped:true};
 const distance=Math.hypot(y,z);
 const min=Math.abs(thigh-shin)+.002,max=thigh+shin-.002;
 const reach=clamp(distance,min,max);
 const knee=Math.acos(clamp((reach*reach-thigh*thigh-shin*shin)/(2*thigh*shin),-1,1));
 const direction=Math.atan2(-z,-y);
 const hip=direction-Math.atan2(shin*Math.sin(knee),thigh+shin*Math.cos(knee));
 return {hip,knee,ankle:-hip-knee,reach,clamped:distance<min||distance>max};
}
export function playerFootTarget(p,side,speed=0){
 const walk=Math.max(0,Math.min(1,(Number.isFinite(speed)?speed:0)/4.7));
 const stride=Number.isFinite(p?.['leg'+side])?p['leg'+side]:0;
 const lift=Math.max(0,-stride)*.11*walk;
 // The grounded leg supports weight; the swinging leg flexes and clears ground.
 return {y:-.89+.055*walk+lift,z:-stride*.38,weight:Math.min(.94,walk*.94)};
}
