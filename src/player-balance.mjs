import {createSpringBank} from './secondary-physics.mjs';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:0));
// Visual-only balance controller. It never writes to game.player, collision
// shapes, action clocks, camera lock, or weapon transforms directly.
export function createPlayerBalance({reduced=false}={}){
 const springs=createSpringBank();
 let previousGrounded=true,previousSpeed=0,previousClock=null,landing=0;
 function reset(){springs.reset();previousGrounded=true;previousSpeed=0;previousClock=null;landing=0;}
 function apply(pose,{dt=0,clock=0,phase=0,speed=0,moveX=0,moveZ=1,action=null}={}){
  const t=Number.isFinite(clock)?clock:0;
  if(previousClock!==null&&(t<previousClock||t-previousClock>.4))reset();
  const h=clamp(dt,0,.05),grounded=pose.grounded!==false,run=clamp(speed/6,0,1);
  const side=clamp(moveX,-1,1),forward=clamp(moveZ,-1,1);
  if(h>0&&grounded&&!previousGrounded)landing=1;
  const acceleration=h>0?clamp((speed-previousSpeed)*.15,-1,1):0;
  const hurt=action?.kind==='hurt'?clamp(1-(action.t||0)/Math.max(.01,action.total||.4),0,1):0;
  const gait=grounded?Math.sin(phase):0,plant=grounded?Math.cos(phase):0;
  const ease=(key,goal,frequency)=>springs.step(key,goal,h,frequency);
  const compact=reduced?.6:1;
  // Pelvis shifts toward the supporting boot; shoulders lag the torso.
  pose.strideX+=ease('pelvis-x',compact*(side*.018*run+gait*.023*run),13);
  pose.strideZ+=ease('pelvis-z',compact*(-.025*acceleration-.015*run*forward),11);
  pose.lean+=ease('spine-pitch',compact*(-.034*run*forward+.028*acceleration+.042*hurt),14);
  pose.sway+=ease('spine-roll',compact*(-.035*side*run+.024*plant*run),12);
  pose.twist+=ease('chest-counter',compact*(-.023*gait*run),10);
  pose.headY+=ease('gaze-stabilize',compact*(.014*gait*run),17);
  if(grounded&&landing>0){
   // Cushion the roll-to-stance landing through existing knees, not hitboxes.
   const impact=landing*compact;
   pose.kneeL+=.075*impact;pose.kneeR+=.075*impact;
   pose.lean+=.025*impact;
  }
  if(h>0){
   landing*=Math.exp(-h*12);
   previousSpeed=speed;
   previousGrounded=grounded;
  }
  previousClock=t;
  return pose;
 }
 return {apply,reset,get landing(){return landing;},get springCount(){return springs.size;}};
}
