const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
// At least one full second remains to punish an attack after the faster cast.
export const BLOOD_COUNTER_WINDOW=1.05;
const STEP=.38,CLOSE=.14;

// A locked destination and finite footsteps replace continuous homing during
// the player's counterattack window. Feet and root read this SAME plan.
export function createBloodWalk(boss,player,recovery){
 const dx=player.x-boss.x,dz=player.z-boss.z,d=Math.hypot(dx,dz),yaw=d>.001?Math.atan2(dx,dz):boss.yaw;
 const turn=.12+Math.abs(angle(yaw-boss.yaw))*.10,budget=Math.max(0,recovery-BLOOD_COUNTER_WINDOW);
 const steps=d>4.15?Math.max(0,Math.min(2,Math.floor((budget-turn-CLOSE+1e-7)/STEP))):0;
 return {x:boss.x,z:boss.z,yawFrom:boss.yaw,yaw,dx:d?dx/d:0,dz:d?dz/d:1,
  steps,stride:steps?Math.min(.85,(d-4)/steps):0,turn:steps?turn:0,stepTime:STEP,close:CLOSE,t:0};
}
// After the protected counter window, Seojun deliberately repositions
// instead of instantly chaining another static spell. The existing IK uses
// the same finite-step plan as the world-position collider.
export function createBloodManeuver(boss,player,duration,ordinal=0,phase=1){
 const vx=player.x-boss.x,vz=player.z-boss.z,d=Math.hypot(vx,vz);
 const forwardX=d>.001?vx/d:Math.sin(boss.yaw),forwardZ=d>.001?vz/d:Math.cos(boss.yaw);
 const side=(ordinal+phase)%4<2?1:-1;
 const desired=phase===2?7.2:6.3,radial=Math.max(-.72,Math.min(1,(d-desired)*.33))*1.65;
 const dx=forwardX*radial+forwardZ*side*1.35,dz=forwardZ*radial-forwardX*side*1.35;
 const n=Math.hypot(dx,dz)||1;
 const nx=dx/n,nz=dz/n,turn=.12+Math.abs(angle(Math.atan2(vx,vz)-boss.yaw))*.055;
 const steps=Math.max(1,Math.min(3,Math.floor((duration-turn-CLOSE+.00001)/STEP)));
 const bound=25.5,forwardGap=bound-Math.hypot(boss.x,boss.z);
 const stride=Math.max(0,Math.min(.87,Math.max(0,forwardGap+.3)/steps));
 return {x:boss.x,z:boss.z,yawFrom:boss.yaw,
   yaw:d>.001?Math.atan2(vx,vz):boss.yaw,dx:nx,dz:nz,
   steps,stride,turn,stepTime:STEP,close:CLOSE,t:0};
}
export function sampleBloodWalk(w){
 if(!w||!w.steps)return {x:w?.x??0,z:w?.z??0,yaw:w?.yawFrom??0,feet:[0,0],lift:[0,0],moving:false,bob:0};
 const t=Math.max(0,w.t-w.turn),i=Math.min(w.steps-1,Math.floor(t/w.stepTime)),u=clamp((t-i*w.stepTime)/w.stepTime),k=ease(u);
 const progress=w.t<w.turn?0:w.t>=w.turn+w.steps*w.stepTime?w.steps:i+k;
 const feet=[0,0],lift=[0,0];
 for(let step=0;step<i;step++)feet[step%2]=Math.min(step+2,w.steps)*w.stride;
 if(w.t>=w.turn){const side=i%2;feet[side]+=(Math.min(i+2,w.steps)*w.stride-feet[side])*k;lift[side]=Math.sin(Math.PI*u)**2*.24;}
 if(t>=w.steps*w.stepTime){
  feet[(w.steps-1)%2]=w.steps*w.stride;
  const other=w.steps%2,c=ease((t-w.steps*w.stepTime)/w.close);
  feet[other]+=(w.steps*w.stride-feet[other])*c;lift[other]=Math.sin(Math.PI*clamp((t-w.steps*w.stepTime)/w.close))**2*.16;
 }
 const distance=progress*w.stride;
 return {x:w.x+w.dx*distance,z:w.z+w.dz*distance,yaw:w.yawFrom+angle(w.yaw-w.yawFrom)*ease(w.t/w.turn),
  feet:feet.map(f=>f-distance),lift,moving:w.t>0&&w.t<w.turn+w.steps*w.stepTime+w.close,bob:-(Math.sin(Math.PI*u)**2)*.025};
}
export function bloodFootTargets(g,scale=1.25){
 const b=g.boss,s=g.blood,w=['recovery','maneuver'].includes(b.state)?s.walk:null,walk=w?sampleBloodWalk(w):null;
 const yaw=w?.steps?w.yaw:b.yaw,dx=Math.sin(yaw),dz=Math.cos(yaw),sideX=Math.cos(b.yaw),sideZ=-Math.sin(b.yaw);
 return [-1,1].map((side,i)=>({x:b.x+sideX*side*.46*scale+dx*(walk?.feet[i]||0)+Math.sin(b.yaw)*.10*scale,
  y:s.elevation+(.22+(walk?.lift[i]||0))*scale,z:b.z+sideZ*side*.46*scale+dz*(walk?.feet[i]||0)+Math.cos(b.yaw)*.10*scale,
  lift:walk?.lift[i]||0}));
}
export function bloodFlightHeight(id,t,duration,strikeAt){
 const rise=ease(t/.7),land=id==='dive'?strikeAt:duration;
 return 8*rise*(1-ease((t-(land-.6))/.6));
}
export function bloodFlightPosition(id,t,origin,target,strikeAt){
 const u=id==='dive'?ease((t-.55)/Math.max(.1,strikeAt-.55)):id==='pursuit'?ease((t-strikeAt)/.75):0;
 return {x:origin.x+(target.x-origin.x)*u,z:origin.z+(target.z-origin.z)*u};
}
