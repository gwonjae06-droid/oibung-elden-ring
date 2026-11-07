// Casino eight-ball physical paths. The running mesh and gameplay contact
// both sample these SAME deterministic positions; neither an AoE decal nor a
// decorative impact can cause surprise damage.
export const EIGHT_BALL=Object.freeze({edge:48,speed:44,radius:3.5,fallHeight:62,bounces:2});
export function eightBallPosition(h,t){
 const time=Math.max(0,Number.isFinite(t)?t:0),z=Number.isFinite(h?.z)?h.z:0;
 if(h?.skyfall){const duration=Math.max(.22,Number(h.active)||.6);
  const progress=Math.min(1,time/duration);
  const y=progress>=.45?3.35:3.35+EIGHT_BALL.fallHeight*Math.pow(1-progress/.45,2);
  return {x:h.x,z,y,bounces:0,embedded:progress>=.45};
 }
 // The ball starts at the left cushion. Three traversals guarantee two bounces
 // before a final sink / despawn after active time.
 const travelled=EIGHT_BALL.speed*time,crossing=2*EIGHT_BALL.edge;
 const bounces=Math.min(2,Math.floor(travelled/crossing));
 const local=travelled-bounces*crossing;
 const x=bounces%2===0?-EIGHT_BALL.edge+Math.min(local,crossing):EIGHT_BALL.edge-Math.min(local,crossing);
 return {x,z,y:3.35,bounces,embedded:false};
}
export function eightBallContact(h,age,p,pad=.42){
 if(!h||!p||age<h.warn||age>h.warn+h.active)return false;
 const a=eightBallPosition(h,age-h.warn);
 return Math.hypot(p.x-a.x,p.z-a.z)<=EIGHT_BALL.radius+pad;
}
